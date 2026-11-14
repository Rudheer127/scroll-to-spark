import { describe, expect, it } from "vitest";
import { buildSlug, slugify } from "@/lib/slugify";

describe("slugify", () => {
  it("lowercases and joins words with single hyphens", () => {
    expect(slugify("Tiny Acts!")).toBe("tiny-acts");
  });

  it("removes accents", () => {
    expect(slugify("Café Club")).toBe("cafe-club");
  });

  it("falls back to a safe slug when nothing usable is left", () => {
    expect(slugify("!!!")).toBe("group");
  });

  it("never ends with a hyphen after cutting to the length limit", () => {
    const slug = slugify("a".repeat(39) + " b");
    expect(slug.length).toBeLessThanOrEqual(40);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("buildSlug", () => {
  it("uses the plain slug on the first attempt", () => {
    expect(buildSlug("Tiny Acts", 0)).toBe("tiny-acts");
  });

  it("adds a short ending on later attempts and stays within the database rule", () => {
    const slug = buildSlug("Tiny Acts", 1);
    expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(slug.startsWith("tiny-acts-")).toBe(true);
    expect(slug.length).toBeLessThanOrEqual(40);
  });
});
