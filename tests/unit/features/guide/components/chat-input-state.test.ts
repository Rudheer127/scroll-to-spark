import { describe, expect, it } from "vitest";
import {
  COUNTER_THRESHOLD,
  shouldShowCount,
  characterCount,
  sendBlockReason,
  STARTER_PROMPTS,
} from "@/features/guide/components/chat-input-state";
import { MAX_INPUT_CHARS } from "@/features/guide/constants";

describe("sendBlockReason", () => {
  it("says why when empty, blank or sending", () => {
    expect(sendBlockReason("", false)).toBe("Write a message to send it.");
    expect(sendBlockReason("   \n", false)).toBe("Write a message to send it.");
    expect(sendBlockReason("hi", true)).toBe("Waiting for the guide to answer.");
  });
  it("allows a real message", () => {
    expect(sendBlockReason("hi", false)).toBeNull();
  });
});

describe("characterCount", () => {
  it("shows the limit before sending", () => {
    expect(characterCount("abc")).toBe(`3 of ${MAX_INPUT_CHARS} characters`);
    expect(characterCount("")).toBe(`0 of ${MAX_INPUT_CHARS} characters`);
  });
});

describe("STARTER_PROMPTS", () => {
  it("has the four task starters, each within the limit and free of em dashes", () => {
    expect(STARTER_PROMPTS.map((s) => s.label)).toEqual([
      "Find something small to do",
      "Log something I did",
      "What have I done so far?",
      "Check a claim",
    ]);
    for (const s of STARTER_PROMPTS) {
      expect(s.message.length).toBeLessThanOrEqual(MAX_INPUT_CHARS);
      expect(s.message).not.toContain(String.fromCharCode(8212));
      expect(s.label.trim().length).toBeGreaterThan(0);
      // Each pill sends exactly its own words, like the person typed them.
      expect(s.message).toBe(s.label);
    }
    expect(new Set(STARTER_PROMPTS.map((s) => s.id)).size).toBe(STARTER_PROMPTS.length);
  });
});

describe("composer draft rules", () => {
  it("allows an image with no text, and blocks while the image is being prepared", () => {
    expect(sendBlockReason("", false, { hasImage: true })).toBeNull();
    expect(sendBlockReason("hi", false, { imageBusy: true })).toBe("Getting your image ready.");
    expect(sendBlockReason("", true, { hasImage: true })).toBe("Waiting for the guide to answer.");
  });

  it("shows the counter only near the limit", () => {
    expect(shouldShowCount("a".repeat(COUNTER_THRESHOLD - 1))).toBe(false);
    expect(shouldShowCount("a".repeat(COUNTER_THRESHOLD))).toBe(true);
    expect(COUNTER_THRESHOLD).toBeLessThan(MAX_INPUT_CHARS);
  });
});
