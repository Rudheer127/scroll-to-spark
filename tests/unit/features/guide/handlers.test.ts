import { describe, expect, it } from "vitest";
import { handleOpportunities } from "@/features/guide/handlers/opportunities";
import { handleGeneral } from "@/features/guide/handlers/general";
import { ProviderFailure } from "@/features/guide/handlers/shared";
import type { HandlerContext } from "@/features/guide/handlers/types";
import { fakeSupabase, taskRow } from "./helpers/fake-db";
import { fail, filtersReply, FakeLlm, guideReply } from "./helpers/fake-llm";

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
      opportunity_filters: [filtersReply({ effort: "tiny" })],
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
    expect(llm.callsFor("opportunity_filters")[0].tier).toBe("router");
  });

  it("still searches when filter extraction fails", async () => {
    const llm = new FakeLlm({
      opportunity_filters: [fail()],
      guide_response: [guideReply({ intent: "find_opportunity" })],
    });
    const out = await handleOpportunities(ctxFor(llm, [taskRow("t1")]));
    expect(out.rows).toHaveLength(1);
  });

  it("throws ProviderFailure with a reason code when the main call fails", async () => {
    const llm = new FakeLlm({ opportunity_filters: [filtersReply()], guide_response: [fail()] });
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
