import { describe, expect, it } from "vitest";
import { handleOpportunities } from "@/features/guide/handlers/opportunities";
import { checkOutput } from "@/features/guide/guard/check-output";
import { handleGeneral } from "@/features/guide/handlers/general";
import { ProviderFailure } from "@/features/guide/handlers/shared";
import type { HandlerContext } from "@/features/guide/handlers/types";
import { fakeSupabase, taskRow } from "./helpers/fake-db";
import { fail, FakeLlm, guideReply } from "./helpers/fake-llm";

function ctxFor(llm: FakeLlm, tasks: unknown[], text = "I have 20 minutes") {
  const { client } = fakeSupabase({ label: "db", log: [], tasks });
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

describe("handleOpportunities", () => {
  it("wraps each row, grounds ids and numbers, and keeps the user's own numbers", async () => {
    const llm = new FakeLlm({
      guide_response: [guideReply({ intent: "find_opportunity" })],
    });
    const out = await handleOpportunities(
      ctxFor(llm, [taskRow("t1", { minutes: 15, reply_within_hours: 72 })]),
    );
    expect([...out.context.allowedIds]).toEqual(["t1"]);
    expect(out.context.allowedNumbers).toEqual(new Set(["15", "72", "20", "988", "911"]));
    const user = llm.callsFor("guide_response")[0].messages[1].content;
    expect(user).toContain("<<DATA label=opportunity id=n0nce>>");
    expect(user).toContain("<<DATA label=user_message id=n0nce>>");
    expect(llm.calls.map((c) => c.schemaName)).toEqual(["guide_response"]);
  });

  it("marks a demo row as a sample in its DATA block, and only that row (I3)", async () => {
    const llm = new FakeLlm({
      guide_response: [guideReply({ intent: "find_opportunity" })],
    });
    await handleOpportunities(
      ctxFor(llm, [
        taskRow("demo1", { groups: { name: "Demo Org", is_demo: true } }),
        taskRow("real1"),
      ]),
    );
    const user = llm.callsFor("guide_response")[0].messages[1].content;
    const blocks = user.split("<<DATA label=opportunity").slice(1);
    expect(blocks[0]).toContain("sample: true. Say that this is a sample task");
    expect(blocks[1]).not.toContain("sample: true");
  });

  it("reads filters with rules, so the only model call is the answer", async () => {
    const llm = new FakeLlm({ guide_response: [guideReply({ intent: "find_opportunity" })] });
    const out = await handleOpportunities(
      ctxFor(llm, [taskRow("t1")], "something quick from home"),
    );
    expect(out.rows).toHaveLength(1);
    expect(llm.calls).toHaveLength(1);
  });

  it("throws ProviderFailure with a reason code when the main call fails", async () => {
    const llm = new FakeLlm({ guide_response: [fail()] });
    await expect(handleOpportunities(ctxFor(llm, [taskRow("t1")]))).rejects.toBeInstanceOf(
      ProviderFailure,
    );
  });
});

describe("handleGeneral", () => {
  it("sends system plus one wrapped user message and no rows", async () => {
    const llm = new FakeLlm({ guide_response: [guideReply({ intent: "chitchat" })] });
    const out = await handleGeneral(ctxFor(llm, []), "chitchat");
    expect(out.rows).toEqual([]);
    expect(out.context.allowedIds.size).toBe(0);
    expect(llm.calls[0].messages.map((m) => m.role)).toEqual(["system", "user"]);
  });
});

describe("user statistics are not grounding (I5)", () => {
  const stat = "83% of Gen Z volunteer weekly, so what can I do?";
  const adopt = "Since 83% of Gen Z volunteer weekly, try this.";

  it("find_opportunity cannot adopt the user's 83%", async () => {
    const llm = new FakeLlm({
      guide_response: [guideReply({ intent: "find_opportunity", message: adopt })],
    });
    const out = await handleOpportunities(ctxFor(llm, [taskRow("t1")], stat));
    expect(out.context.allowedNumbers.has("83")).toBe(false);
    expect(checkOutput(out.response, out.context)).toMatchObject({ ok: false });
  });

  it("chitchat cannot adopt the user's 83%", async () => {
    const llm = new FakeLlm({
      guide_response: [guideReply({ intent: "chitchat", message: adopt })],
    });
    const out = await handleGeneral(ctxFor(llm, [], stat), "chitchat");
    expect(out.context.allowedNumbers.has("83")).toBe(false);
    expect(checkOutput(out.response, out.context)).toMatchObject({ ok: false });
  });

  it("find_opportunity keeps the minutes the person said they have", async () => {
    const llm = new FakeLlm({
      guide_response: [
        guideReply({ intent: "find_opportunity", message: "Here is a 20 minute idea." }),
      ],
    });
    const out = await handleOpportunities(ctxFor(llm, [taskRow("t1")], "I have 20 minutes"));
    expect(checkOutput(out.response, out.context)).toEqual({ ok: true });
  });
});
