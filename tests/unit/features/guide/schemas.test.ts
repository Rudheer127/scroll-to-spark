import { describe, expect, it } from "vitest";
import { contributionInputSchemaFor, opportunityFiltersSchema } from "@/features/guide/schemas";

describe("opportunityFiltersSchema", () => {
  it("accepts a full filters object", () => {
    expect(
      opportunityFiltersSchema.safeParse({ effort: "tiny", remoteOnly: true, keyword: "food" })
        .success,
    ).toBe(true);
  });

  it("allows null effort and keyword but requires every key", () => {
    expect(
      opportunityFiltersSchema.safeParse({ effort: null, remoteOnly: false, keyword: null })
        .success,
    ).toBe(true);
    expect(opportunityFiltersSchema.safeParse({ effort: null, remoteOnly: false }).success).toBe(
      false,
    );
  });

  it("rejects an unknown effort", () => {
    expect(
      opportunityFiltersSchema.safeParse({ effort: "huge", remoteOnly: false, keyword: null })
        .success,
    ).toBe(false);
  });
});

describe("contributionInputSchemaFor", () => {
  const ok = { title: "Food drive", description: "", minutes: 180, occurred_on: "2026-11-08" };
  const schema = contributionInputSchemaFor("2026-11-14");

  it("accepts a valid contribution, including today", () => {
    expect(schema.safeParse(ok).success).toBe(true);
    expect(schema.safeParse({ ...ok, occurred_on: "2026-11-14" }).success).toBe(true);
  });

  it.each([
    ["future date", { occurred_on: "2026-11-15" }],
    ["impossible date", { occurred_on: "2026-02-31" }],
    ["bad format", { occurred_on: "11/08/2026" }],
    ["2000 minutes", { minutes: 2000 }],
    ["zero minutes", { minutes: 0 }],
    ["fractional minutes", { minutes: 1.5 }],
    ["empty title", { title: "" }],
    ["two character title (DB check is 3 to 120)", { title: "ab" }],
    ["long title", { title: "x".repeat(121) }],
    ["long description", { description: "x".repeat(501) }],
  ])("rejects %s", (_name, over) => {
    expect(schema.safeParse({ ...ok, ...over }).success).toBe(false);
  });

  it("allows a 3 character title, the database minimum", () => {
    expect(schema.safeParse({ ...ok, title: "abc" }).success).toBe(true);
  });

  it("allows 1440 minutes and a 120 char title", () => {
    expect(schema.safeParse({ ...ok, minutes: 1440, title: "x".repeat(120) }).success).toBe(true);
  });
});
