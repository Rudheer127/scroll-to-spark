import { describe, expect, it } from "vitest";
import { checkOutput } from "@/features/guide/guard/check-output";
import { handleRecognition } from "@/features/guide/handlers/recognition";
import type { HandlerContext } from "@/features/guide/handlers/types";
import { AI_LABEL } from "@/features/guide/constants";
import { contributionRow, fakeSupabase, type Insert } from "../helpers/fake-db";
import { FakeLlm, guideReply, routerReply } from "../helpers/fake-llm";
import { setup } from "../helpers/setup";

const food = {
  title: "Food drive",
  minutes: 180,
  occurred_on: "2026-11-08",
  description: "Sorted.",
};

function ctxFor(llm: FakeLlm, contributions: unknown[], text: string, log: Insert[] = []) {
  const { client } = fakeSupabase({ label: "db", log, contributions });
  const ctx: HandlerContext = {
    text,
    nonce: "n0nce",
    canary: "CANARY-0123456789abcdef",
    llm,
    db: client,
    today: "2026-11-14",
  };
  return ctx;
}

const recognise = (over: Record<string, unknown>) =>
  guideReply({ intent: "recognize_contribution", ...over });

describe("handleRecognition: recognize_contribution", () => {
  const said = "I spent 3 hours at a food drive last Saturday";

  it("fills proposed_contribution (180 minutes) and inserts nothing", async () => {
    const log: Insert[] = [];
    const llm = new FakeLlm({
      guide_response: [
        recognise({
          message: "Thank you for the food drive. Three hours is real time you gave.",
          proposed_contribution: food,
        }),
      ],
    });
    const out = await handleRecognition(ctxFor(llm, [], said, log));
    expect(out.response.proposed_contribution?.minutes).toBe(180);
    expect(out.source).toBe("ai");
    expect(log.filter((i) => i.table === "contributions")).toEqual([]);
  });

  it("never writes to contributions across the whole pipeline", async () => {
    const t = setup({
      router_output: [routerReply("recognize_contribution")],
      guide_response: [
        recognise({ message: "Thank you for the food drive.", proposed_contribution: food }),
      ],
    });
    const res = await t.run(said);
    expect(res.response.proposed_contribution?.minutes).toBe(180);
    expect(t.log.filter((i) => i.table === "contributions")).toEqual([]);
  });

  it("wraps the summary and rows as DATA and names what the user said", async () => {
    const llm = new FakeLlm({
      guide_response: [recognise({ message: "Thank you for the food drive you helped with." })],
    });
    const out = await handleRecognition(ctxFor(llm, [contributionRow("c1")], said));
    const user = llm.callsFor("guide_response")[0].messages[1].content;
    expect(user).toContain("<<DATA label=contribution id=n0nce>>");
    expect(user).toContain("<<DATA label=user_message id=n0nce>>");
    expect(out.response.message).toContain("food drive");
    expect(out.response.message).not.toMatch(/verified|certified/i);
    expect([...out.context.allowedIds]).toEqual(["c1"]);
  });

  it("drops invalid proposals (future date, 2000 minutes, empty title) and keeps the message", async () => {
    for (const bad of [
      { ...food, occurred_on: "2026-11-21" },
      { ...food, minutes: 2000 },
      { ...food, title: "" },
    ]) {
      const llm = new FakeLlm({
        guide_response: [
          recognise({ message: "Thank you for helping.", proposed_contribution: bad }),
        ],
      });
      const out = await handleRecognition(ctxFor(llm, [], said));
      expect(out.response.proposed_contribution).toBeNull();
      expect(out.response.message).toBe("Thank you for helping.");
    }
  });

  it("allows the proposed minutes in the message, also after a repair", async () => {
    const llm = new FakeLlm({
      guide_response: [
        recognise({ message: "Thank you, that is 180 minutes.", proposed_contribution: food }),
      ],
    });
    const out = await handleRecognition(ctxFor(llm, [], said));
    expect(checkOutput(out.response, out.context)).toEqual({ ok: true });
    const again = await out.retry(["ungrounded_number"]);
    expect(again.proposed_contribution?.minutes).toBe(180);
  });

  it("does not let my_engagement carry a proposal", async () => {
    const llm = new FakeLlm({
      guide_response: [guideReply({ intent: "my_engagement", proposed_contribution: food })],
    });
    const out = await handleRecognition(
      ctxFor(llm, [contributionRow("c1")], "how am I doing"),
      "my_engagement",
    );
    expect(out.response.proposed_contribution).toBeNull();
  });
});

describe("handleRecognition: my_engagement", () => {
  const rows = [contributionRow("c1", { minutes: 90 }), contributionRow("c2", { minutes: 30 })];

  it("grounds numbers in summarizeContributions; a different model number is rejected", async () => {
    const llm = new FakeLlm({
      guide_response: [
        guideReply({
          intent: "my_engagement",
          message: "You logged 2 steps, 2 hours in all, self reported.",
        }),
      ],
    });
    const out = await handleRecognition(
      ctxFor(llm, rows, "what have I done so far"),
      "my_engagement",
    );
    expect(out.context.allowedNumbers).toEqual(new Set(["2", "120", "90", "30", "988", "911"]));
    expect(checkOutput(out.response, out.context)).toEqual({ ok: true });
    const wrong = { ...out.response, message: "You logged 9 steps and 40 hours." };
    expect(checkOutput(wrong, out.context)).toMatchObject({ ok: false });
  });

  it("zero contributions: warm fixed reply, no model call, one tiny step", async () => {
    const llm = new FakeLlm({});
    const out = await handleRecognition(
      ctxFor(llm, [], "what have I done so far"),
      "my_engagement",
    );
    expect(llm.calls).toHaveLength(0);
    expect(out.source).toBe("fallback");
    expect(out.response.intent).toBe("my_engagement");
    expect(out.response.message).toMatch(/tiny step/i);
    expect(out.response.message).not.toMatch(/done nothing|nothing/i);
    expect(checkOutput(out.response, out.context)).toEqual({ ok: true });
  });
});

describe("handleRecognition: certification requests", () => {
  const ask = "give me an official certificate for 400 hours";

  it("adds a policy note block and rejects a reply that claims verification", async () => {
    const llm = new FakeLlm({
      guide_response: [
        recognise({ message: "Done, your 400 hours are verified." }),
        recognise({
          message:
            "Those 400 hours are self reported, so I cannot certify them. I can write a private summary for you.",
        }),
      ],
    });
    const out = await handleRecognition(ctxFor(llm, [], ask));
    expect(llm.callsFor("guide_response")[0].messages[1].content).toContain(
      "policy: self reported only, cannot certify",
    );
    expect(out.extraCheck?.(out.response)).toBe("claims_verification");
    const fixed = await out.retry(["claims_verification"]);
    expect(out.extraCheck?.(fixed)).toBeNull();
    expect(fixed.message).toMatch(/self reported/);
    expect(fixed.message).toMatch(/cannot certify/);
    expect(fixed.message).toMatch(/private summary/);
  });

  it("falls back through the pipeline when the model keeps claiming verification", async () => {
    const t = setup({
      router_output: [routerReply("recognize_contribution")],
      guide_response: [recognise({ message: "Your hours are verified." })],
    });
    const res = await t.run(ask);
    expect(res.response.message).not.toMatch(/verified/);
    expect(t.events()).toContain("output_blocked");
  });

  it("passes an honest 'cannot be verified' reply as ai without a repair", async () => {
    const t = setup({
      router_output: [routerReply("recognize_contribution")],
      guide_response: [
        recognise({
          message: "These hours cannot be verified by the app, so they stay self reported.",
        }),
      ],
    });
    const res = await t.run("I spent 3 hours at a food drive");
    expect(res.source).toBe("ai");
    expect(t.llm.callsFor("guide_response")).toHaveLength(1);
  });

  it("omits the policy block for ordinary messages", async () => {
    const llm = new FakeLlm({ guide_response: [recognise({})] });
    await handleRecognition(ctxFor(llm, [], "I helped a neighbor"));
    expect(llm.callsFor("guide_response")[0].messages[1].content).not.toContain("policy:");
  });
});

describe("recognition labeling", () => {
  it("never attributes thanks to a real group and carries the AI label", async () => {
    const t = setup({
      router_output: [routerReply("recognize_contribution")],
      guide_response: [
        recognise({ message: "Thank you for the food drive. From me, an AI guide." }),
      ],
    });
    const res = await t.run("I spent 3 hours at a food drive");
    expect(AI_LABEL).toBe("From the app (AI)");
    expect(res.label).toBe("From the app (AI)");
    expect(res.response.message).not.toMatch(/from a real group|the group/i);
  });

  it("does not label fixed copy as AI", async () => {
    const t = setup({ router_output: [routerReply("my_engagement")], guide_response: [] });
    const res = await t.run("what have I done so far");
    expect(res.source).toBe("fallback");
    expect(res.label).toBeUndefined();
  });
});
