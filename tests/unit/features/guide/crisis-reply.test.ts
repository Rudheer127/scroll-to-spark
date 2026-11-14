import { describe, expect, it } from "vitest";
import { INTENTS } from "@/features/guide/constants";
import { CRISIS_MESSAGE } from "@/features/guide/fallbacks";
import { fixedResponse } from "@/features/guide/fixed-response";
import { promptEcho } from "@/features/guide/guard/rules/text-rules";
import { buildSystemPrompt } from "@/features/guide/prompts/system";
import { guideReply, routerReply } from "./helpers/fake-llm";
import { setup } from "./helpers/setup";

describe("system prompt crisis line", () => {
  it("tells the model to reply only with the 988 and 911 message", () => {
    for (const intent of INTENTS) {
      const p = buildSystemPrompt({ intent, canary: "c", nonce: "n", today: "2026-11-14" });
      expect(p).toMatch(/may hurt themselves, reply only with this message and nothing else/);
      expect(p).toContain(CRISIS_MESSAGE);
    }
  });

  it("the crisis message is not treated as a prompt leak", () => {
    expect(promptEcho(fixedResponse(CRISIS_MESSAGE))).toBeNull();
  });
});

describe("a model-written crisis reply", () => {
  it("is shown as the crisis answer, not blocked", async () => {
    const t = setup({
      router_output: [routerReply("chitchat")],
      guide_response: [guideReply({ intent: "chitchat", message: CRISIS_MESSAGE })],
    });
    const res = await t.run("everything is heavy lately");
    expect(res.response.message).toBe(CRISIS_MESSAGE);
    expect(res.outcome).toBe("crisis");
    expect(t.llm.callsFor("guide_response")).toHaveLength(1);
    expect(t.events()).toContain("crisis");
    expect(t.events()).not.toContain("output_blocked");
  });

  it("a paraphrase that names 988 and 911 still passes the number guard", async () => {
    const message = "I'm an AI. Please call or text 988, or 911 if you are in danger.";
    const t = setup({
      router_output: [routerReply("chitchat")],
      guide_response: [guideReply({ intent: "chitchat", message })],
    });
    const res = await t.run("everything is heavy lately");
    expect(res.response.message).toBe(message);
    expect(t.llm.callsFor("guide_response")).toHaveLength(1);
  });
});
