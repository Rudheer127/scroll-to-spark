import { describe, expect, it } from "vitest";
import {
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
  it("has the three starters, each within the limit and free of em dashes", () => {
    expect(STARTER_PROMPTS.map((s) => s.label)).toEqual([
      "Find something small to do",
      "I did something and want to log it",
      "Check a claim",
    ]);
    for (const s of STARTER_PROMPTS) {
      expect(s.message.length).toBeLessThanOrEqual(MAX_INPUT_CHARS);
      expect(s.message).not.toContain("—");
    }
  });
});
