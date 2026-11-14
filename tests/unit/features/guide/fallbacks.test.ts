import { describe, expect, it } from "vitest";
import * as fallbacks from "@/features/guide/fallbacks";
import { checkOutput } from "@/features/guide/guard/check-output";
import { fixedResponse } from "@/features/guide/fixed-response";

const messages = Object.entries(fallbacks).filter(([, v]) => typeof v === "string");

describe("fixed messages", () => {
  it("covers every fixed message", () => {
    expect(messages.map(([k]) => k).sort()).toEqual([
      "CRISIS_MESSAGE",
      "EMPTY_MESSAGE",
      "NO_MATCH_MESSAGE",
      "RATE_LIMIT_MESSAGE",
      "REDIRECT_MESSAGE",
      "UNAVAILABLE_MESSAGE",
    ]);
  });

  it.each(messages)("%s passes the output text rules", (_name, message) => {
    const res = fixedResponse(String(message));
    const ctx = {
      allowedIds: new Set<string>(),
      allowedNumbers: new Set(["988", "911"]),
      canary: "",
    };
    expect(checkOutput(res, ctx)).toEqual({ ok: true });
  });

  it("fixedResponse is a valid out_of_scope GuideResponse", () => {
    expect(fixedResponse("hi")).toEqual({
      intent: "out_of_scope",
      message: "hi",
      cards: [],
      proposed_contribution: null,
      verdict: null,
      next_step: null,
    });
  });
});
