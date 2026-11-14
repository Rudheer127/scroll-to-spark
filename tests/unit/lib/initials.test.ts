import { describe, expect, it } from "vitest";
import { getInitials } from "@/lib/initials";

describe("getInitials", () => {
  it("uses the first letter of the first two words", () => {
    expect(getInitials("tiny acts club")).toBe("TA");
  });

  it("works for a single word", () => {
    expect(getInitials("Spark")).toBe("S");
  });

  it("returns a question mark for an empty name", () => {
    expect(getInitials("   ")).toBe("?");
  });
});
