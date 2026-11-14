import { describe, expect, it } from "vitest";
import { opportunityFiltersSchema } from "@/features/guide/schemas";

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
