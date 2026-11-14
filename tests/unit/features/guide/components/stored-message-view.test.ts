import { describe, expect, it } from "vitest";
import {
  storedAssistantView,
  storedToItems,
} from "@/features/guide/components/stored-message-view";
import { AI_LABEL } from "@/features/guide/constants";
import { CRISIS_MESSAGE } from "@/features/guide/fallbacks";

describe("storedToItems", () => {
  it("maps saved rows in order to user bubbles and plain assistant answers", () => {
    const items = storedToItems([
      { role: "user", content: "Find something small", createdAt: "t1" },
      { role: "assistant", content: "Try sorting cans.", createdAt: "t2" },
    ]);
    expect(items[0]).toEqual({ role: "user", text: "Find something small" });
    expect(items[1]).toMatchObject({
      role: "assistant",
      view: { kind: "normal", text: "Try sorting cans.", label: AI_LABEL },
    });
  });

  it("returns an empty list for an empty chat", () => {
    expect(storedToItems([])).toEqual([]);
  });
});

describe("storedAssistantView", () => {
  it("is text only: no cards, proposal, verdict, next step or retry", () => {
    expect(storedAssistantView("Hello")).toEqual({
      kind: "normal",
      text: "Hello",
      label: AI_LABEL,
      cards: [],
      proposal: null,
      nextStep: null,
      verdict: null,
      verdictLabel: null,
      waitNote: null,
      canRetry: false,
    });
  });

  it("shows the fixed crisis answer with its help card again", () => {
    expect(storedAssistantView(CRISIS_MESSAGE).kind).toBe("crisis");
  });
});
