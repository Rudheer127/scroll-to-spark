import { describe, expect, it } from "vitest";
import { evidenceKeywords, KEYWORD_INPUT_MAX } from "@/features/guide/tools/evidence-keywords";

describe("evidenceKeywords", () => {
  it("keeps content words and numbers like 54 from a question", () => {
    expect(evidenceKeywords("Is it true that 54% of Americans helped neighbors?")).toEqual([
      "54",
      "americans",
      "helped",
      "neighbors",
    ]);
  });

  it("returns nothing for the bare starter prompt", () => {
    expect(evidenceKeywords("Check a claim")).toEqual([]);
    expect(evidenceKeywords("Is that really true?")).toEqual([]);
    expect(evidenceKeywords("   ")).toEqual([]);
  });

  it("drops stopwords and single letters, lowercases and dedupes", () => {
    expect(evidenceKeywords("A study shows Gen Z VOLUNTEER, volunteer, volunteer weekly")).toEqual([
      "gen",
      "volunteer",
      "weekly",
    ]);
  });

  it("keeps at most 8 keywords", () => {
    const words = "alpha bravo charlie delta echo foxtrot golf hotel india juliet";
    expect(evidenceKeywords(words)).toHaveLength(8);
    expect(evidenceKeywords(words)[7]).toBe("hotel");
  });

  it("never emits websearch operators or punctuation", () => {
    const out = evidenceKeywords('"quoted" -minus or OR (paren) and AND neighbors');
    expect(out).toEqual(["quoted", "minus", "paren", "neighbors"]);
  });

  it(`reads only the first ${KEYWORD_INPUT_MAX} characters`, () => {
    expect(KEYWORD_INPUT_MAX).toBe(400);
    const long = `${"x ".repeat(200)}loneliness`;
    expect(long.length).toBeGreaterThan(KEYWORD_INPUT_MAX);
    expect(evidenceKeywords(long)).toEqual([]);
    expect(evidenceKeywords(`loneliness ${"x ".repeat(300)}`)).toEqual(["loneliness"]);
  });
});
