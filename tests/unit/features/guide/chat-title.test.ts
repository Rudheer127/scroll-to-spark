import { describe, expect, it } from "vitest";
import {
  buildChatTitle,
  chatTitleFor,
  FALLBACK_TITLE,
  IMAGE_ONLY_TITLE,
  MAX_TITLE_CHARS,
} from "@/features/guide/chat-title";

const length = (text: string) => Array.from(text).length;

describe("buildChatTitle", () => {
  it("keeps a short message as it is", () => {
    expect(buildChatTitle("Find something small to do")).toBe("Find something small to do");
  });

  it("falls back to New chat for empty or whitespace only text", () => {
    expect(buildChatTitle("")).toBe(FALLBACK_TITLE);
    expect(buildChatTitle("   \n\t  ")).toBe(FALLBACK_TITLE);
    expect(buildChatTitle("...")).toBe(FALLBACK_TITLE);
  });

  it("collapses whitespace and removes invisible characters", () => {
    expect(buildChatTitle("  hello\n\n  there​ friend  ")).toBe("hello there friend");
  });

  it("cuts a long message at a word boundary with an ellipsis, at most 60 characters", () => {
    const long =
      "I would really like to find a small way to help the food bank near my school this week please";
    const title = buildChatTitle(long);
    expect(length(title)).toBeLessThanOrEqual(MAX_TITLE_CHARS);
    expect(title.endsWith("…")).toBe(true);
    expect(long.startsWith(title.slice(0, -1))).toBe(true);
    expect(title.slice(0, -1)).not.toMatch(/\s$/);
  });

  it("drops trailing punctuation clutter but keeps a question mark", () => {
    expect(buildChatTitle("Help me with this:")).toBe("Help me with this");
    expect(buildChatTitle("What have I done so far?")).toBe("What have I done so far?");
    const cutAtComma = buildChatTitle(`${"word ".repeat(9)}stop, ${"more ".repeat(10)}`);
    expect(cutAtComma).not.toMatch(/,…$/);
  });

  it("never splits an emoji", () => {
    const title = buildChatTitle("\u{1F44B}".repeat(80));
    expect(length(title)).toBeLessThanOrEqual(MAX_TITLE_CHARS);
    expect(title).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
    expect(buildChatTitle("Hi \u{1F44B} there")).toBe("Hi \u{1F44B} there");
  });

  it("cuts a single very long word without needing a space", () => {
    const title = buildChatTitle("a".repeat(200));
    expect(length(title)).toBe(MAX_TITLE_CHARS);
  });
});

describe("chatTitleFor", () => {
  it("names an image only first message", () => {
    expect(chatTitleFor("", true)).toBe(IMAGE_ONLY_TITLE);
    expect(chatTitleFor("What is this", true)).toBe("What is this");
  });
});
