import { describe, expect, it } from "vitest";
import { AI_LABEL } from "@/features/guide/constants";
import { fixedResponse } from "@/features/guide/fixed-response";
import type { GuideTurnResult, HydratedCard } from "@/features/guide/types";
import { toMessageView, waitNote } from "@/features/guide/components/to-message-view";

const base = (over: Partial<GuideTurnResult> = {}): GuideTurnResult => ({
  response: fixedResponse("Hello."),
  cards: [],
  source: "ai",
  label: AI_LABEL,
  ...over,
});

const opportunity: HydratedCard = {
  kind: "opportunity",
  id: "t1",
  title: "Write a card",
  description: null,
  org_name: "Library Friends",
  effort: "tiny",
  minutes: 10,
  place: "home",
  reply_within_hours: 48,
  is_demo: false,
};

describe("toMessageView", () => {
  it("a normal AI answer keeps its text and the label", () => {
    const v = toMessageView(base());
    expect(v).toMatchObject({ kind: "normal", text: "Hello.", label: AI_LABEL, canRetry: false });
    expect(v.cards).toEqual([]);
    expect(v.proposal).toBeNull();
  });

  it("a fallback answer has no source label but is still an assistant message", () => {
    const v = toMessageView(base({ source: "fallback", label: undefined }));
    expect(v.kind).toBe("fallback");
    expect(v.label).toBeNull();
  });

  it("crisis is detected by outcome, not by the words", () => {
    const v = toMessageView(base({ source: "fallback", label: undefined, outcome: "crisis" }));
    expect(v.kind).toBe("crisis");
    expect(toMessageView(base({ response: fixedResponse("I'm really sorry") })).kind).toBe(
      "normal",
    );
  });

  it("rate limited carries a wait note and no retry button", () => {
    const v = toMessageView(base({ outcome: "rate_limited", retryAfterSec: 45, label: undefined }));
    expect(v.kind).toBe("rate_limited");
    expect(v.canRetry).toBe(false);
    expect(v.waitNote).toBe("You can try again in about 45 seconds.");
  });

  it("unavailable can be retried", () => {
    const v = toMessageView(base({ outcome: "unavailable", source: "fallback", label: undefined }));
    expect(v.kind).toBe("unavailable");
    expect(v.canRetry).toBe(true);
  });

  it("passes server hydrated cards through on a normal answer", () => {
    expect(toMessageView(base({ cards: [opportunity] })).cards).toEqual([opportunity]);
  });

  it("drops cards and proposals on fixed paths", () => {
    const response = {
      ...fixedResponse("x"),
      proposed_contribution: { title: "t", minutes: 5, occurred_on: "2026-11-01", description: "" },
    };
    for (const outcome of ["crisis", "rate_limited", "unavailable"] as const) {
      const v = toMessageView(base({ outcome, response, cards: [opportunity] }));
      expect(v.cards).toEqual([]);
      expect(v.proposal).toBeNull();
    }
  });

  it("exposes a proposed contribution", () => {
    const proposed = {
      title: "Wrote to council",
      minutes: 20,
      occurred_on: "2026-11-10",
      description: "A letter",
    };
    const v = toMessageView(
      base({ response: { ...fixedResponse("Nice."), proposed_contribution: proposed } }),
    );
    expect(v.proposal).toEqual(proposed);
  });

  it("keeps message text as plain text without changing it", () => {
    const text = "**bold** [link](https://x.test) <b>hi</b>";
    expect(toMessageView(base({ response: fixedResponse(text) })).text).toBe(text);
  });
});

describe("waitNote", () => {
  it("handles seconds, minutes and missing values", () => {
    expect(waitNote(1)).toBe("You can try again in about 1 second.");
    expect(waitNote(60)).toBe("You can try again in about 1 minute.");
    expect(waitNote(150)).toBe("You can try again in about 3 minutes.");
    expect(waitNote(undefined)).toBe("You can try again in a minute.");
  });
});

describe("toMessageView next step and verdict (I4)", () => {
  const withFields = (over: Partial<GuideTurnResult["response"]>) =>
    base({ response: { ...fixedResponse("Here is what I found.", "fact_check"), ...over } });

  it("exposes next_step and a fixed label per verdict", () => {
    const v = toMessageView(withFields({ next_step: "Read the source.", verdict: "supported" }));
    expect(v.nextStep).toBe("Read the source.");
    expect(v.verdict).toBe("supported");
    expect(v.verdictLabel).toBe("Supported by our evidence");
    expect(toMessageView(withFields({ verdict: "partly_supported" })).verdictLabel).toBe(
      "Partly supported",
    );
    expect(toMessageView(withFields({ verdict: "unsupported" })).verdictLabel).toBe(
      "Not supported",
    );
    expect(toMessageView(withFields({ verdict: "not_enough_evidence" })).verdictLabel).toBe(
      "Not enough evidence on file",
    );
  });

  it("is null when absent and on fixed crisis, rate limited and unavailable answers", () => {
    const none = toMessageView(withFields({}));
    expect(none.nextStep).toBeNull();
    expect(none.verdictLabel).toBeNull();
    const fixed = toMessageView(
      base({
        outcome: "unavailable",
        response: { ...fixedResponse("x"), next_step: "y", verdict: "supported" },
      }),
    );
    expect(fixed.nextStep).toBeNull();
    expect(fixed.verdictLabel).toBeNull();
  });
});
