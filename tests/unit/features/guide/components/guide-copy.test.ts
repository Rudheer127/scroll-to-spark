import { describe, expect, it } from "vitest";
import { chatLayoutMode } from "@/features/guide/components/chat-layout-mode";
import { STARTER_PROMPTS } from "@/features/guide/components/chat-input-state";
import * as copy from "@/features/guide/components/guide-copy";
import { MOODS } from "@/features/guide/moods";

const EM_DASH = String.fromCharCode(8212);
const EN_DASH = String.fromCharCode(8211);

describe("guide copy", () => {
  it("uses the agreed words", () => {
    expect(copy.GUIDE_HEADLINE).toBe("What small thing can we do for your community today?");
    expect(copy.GUIDE_HEADLINE_COMPACT).toBe("What can we do today?");
    expect(copy.COMPOSER_PLACEHOLDER).toBe(
      "Tell me how you feel, what you did, or a claim to check",
    );
    expect(copy.MOOD_LEAD).toBe("Or start from how you feel");
  });

  it("still says the guide is an AI that can be wrong", () => {
    expect(copy.AI_DISCLOSURE).toContain("is an AI");
    expect(copy.AI_DISCLOSURE).toContain("can be wrong");
    expect(copy.AI_DISCLOSURE).toContain("real person");
  });

  it("has no em or en dashes, no empty text and never overclaims", () => {
    const words = [
      ...Object.values(copy),
      ...STARTER_PROMPTS.map((s) => s.label),
      ...MOODS.map((m) => m.label),
    ];
    for (const text of words) {
      expect(text.trim().length).toBeGreaterThan(0);
      expect(text).not.toContain(EM_DASH);
      expect(text).not.toContain(EN_DASH);
      expect(text.toLowerCase()).not.toContain("verified");
      expect(text.toLowerCase()).not.toContain("guarantee");
    }
  });

  it("keeps four task pills and five moods, with no overlap between them", () => {
    expect(STARTER_PROMPTS).toHaveLength(4);
    expect(MOODS).toHaveLength(5);
    const moodLabels = MOODS.map((m) => m.label.toLowerCase());
    for (const starter of STARTER_PROMPTS) {
      expect(moodLabels.some((mood) => starter.label.toLowerCase().includes(mood))).toBe(false);
    }
  });
});

describe("chatLayoutMode", () => {
  it("is empty only when nothing has happened yet", () => {
    expect(chatLayoutMode({ itemCount: 0, sending: false, hasError: false })).toBe("empty");
  });

  it("switches to the conversation on a message, a pending answer or an error", () => {
    expect(chatLayoutMode({ itemCount: 1, sending: false, hasError: false })).toBe("conversation");
    expect(chatLayoutMode({ itemCount: 0, sending: true, hasError: false })).toBe("conversation");
    expect(chatLayoutMode({ itemCount: 0, sending: false, hasError: true })).toBe("conversation");
  });
});
