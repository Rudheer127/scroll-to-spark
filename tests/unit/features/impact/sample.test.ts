import { describe, expect, it } from "vitest";
import { SAMPLE_IMPACT } from "@/features/impact/sample";

describe("sample impact", () => {
  it("is flagged as sample data", () => {
    expect(SAMPLE_IMPACT.isSample).toBe(true);
  });

  it("stays nonpartisan", () => {
    const text = JSON.stringify(SAMPLE_IMPACT).toLowerCase();
    for (const word of ["democrat", "republican", "gop", "trump", "biden", "party"]) {
      expect(text).not.toContain(word);
    }
  });

  it("names every sample person as a sample, so nobody reads them as real", () => {
    for (const person of SAMPLE_IMPACT.people)
      expect(person.role.toLowerCase()).toContain("sample");
  });

  it("has a timeline, changes and a next step", () => {
    expect(SAMPLE_IMPACT.timeline.length).toBeGreaterThanOrEqual(3);
    expect(SAMPLE_IMPACT.changes.length).toBeGreaterThanOrEqual(2);
    expect(SAMPLE_IMPACT.next.href).toBe("/");
  });
});
