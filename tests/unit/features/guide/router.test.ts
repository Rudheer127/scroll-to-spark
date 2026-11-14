import { describe, expect, it } from "vitest";
import { routeIntent } from "@/features/guide/router";
import type { LlmClient } from "@/features/guide/llm/types";
import { fail, FakeLlm, ok, routerReply } from "./helpers/fake-llm";

describe("routeIntent", () => {
  it("returns the model's intent and safety, using the router tier with a wrapped message", async () => {
    const llm = new FakeLlm({ router_output: [routerReply("fact_check")] });
    expect(await routeIntent(llm, "is it true?", "abc123")).toEqual({
      intent: "fact_check",
      safety: "ok",
    });
    const req = llm.calls[0];
    expect(req.tier).toBe("router");
    expect(req.reasoningEffort).toBe("low");
    expect(req.messages[1].content).toContain("<<DATA label=user_message id=abc123>>");
  });

  it("passes a crisis flag through", async () => {
    const llm = new FakeLlm({ router_output: [routerReply("chitchat", "crisis")] });
    expect((await routeIntent(llm, "x", "n")).safety).toBe("crisis");
  });

  it("falls back to out_of_scope on provider failure, bad JSON or a thrown error", async () => {
    const expected = { intent: "out_of_scope", safety: "ok" };
    expect(await routeIntent(new FakeLlm({ router_output: [fail()] }), "x", "n")).toEqual(expected);
    expect(await routeIntent(new FakeLlm({ router_output: [ok({ nope: 1 })] }), "x", "n")).toEqual(
      expected,
    );
    const throwing: LlmClient = {
      complete: () => {
        throw new Error("boom");
      },
    };
    expect(await routeIntent(throwing, "x", "n")).toEqual(expected);
  });
});
