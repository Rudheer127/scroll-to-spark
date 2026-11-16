import { describe, expect, it } from "vitest";
import {
  feedRequestSchema,
  searchTermSchema,
  setSharingSchema,
  toggleSchema,
} from "@/features/inspire/schemas";
import { DEFAULT_FILTERS } from "@/features/inspire/filters";

const ID = "11111111-2222-4333-8444-555555555555";

describe("inspire schemas", () => {
  it("accepts a valid sharing change and rejects a bad id", () => {
    expect(
      setSharingSchema.safeParse({ completionId: ID, sharePublicly: true, shareThankYou: false })
        .success,
    ).toBe(true);
    expect(
      setSharingSchema.safeParse({
        completionId: "nope",
        sharePublicly: true,
        shareThankYou: false,
      }).success,
    ).toBe(false);
  });

  it("requires a real boolean for react and save", () => {
    expect(toggleSchema.safeParse({ completionId: ID, on: "yes" }).success).toBe(false);
    expect(toggleSchema.safeParse({ completionId: ID, on: false }).success).toBe(true);
  });

  it("validates a feed request's filters", () => {
    expect(feedRequestSchema.safeParse({ filters: DEFAULT_FILTERS, cursor: null }).success).toBe(
      true,
    );
    expect(
      feedRequestSchema.safeParse({ filters: { ...DEFAULT_FILTERS, minutes: 7 }, cursor: null })
        .success,
    ).toBe(false);
  });

  it("tidies a search term and rejects very short ones", () => {
    expect(searchTermSchema.parse("  vote   early ")).toBe("vote early");
    expect(searchTermSchema.safeParse("a").success).toBe(false);
  });
});
