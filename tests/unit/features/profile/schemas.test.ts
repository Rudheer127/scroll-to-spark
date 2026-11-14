import { describe, expect, it } from "vitest";
import { updateUsernameSchema } from "@/features/profile/schemas";

describe("updateUsernameSchema", () => {
  it("accepts letters, numbers, underscores, dots and hyphens", () => {
    expect(updateUsernameSchema.safeParse({ username: "Maya_R2.k-1" }).success).toBe(true);
  });

  it("keeps capitals and trims what was typed", () => {
    const result = updateUsernameSchema.safeParse({ username: "  Maya_R  " });
    expect(result.success && result.data.username).toBe("Maya_R");
  });

  it("rejects spaces and symbols", () => {
    expect(updateUsernameSchema.safeParse({ username: "maya r!" }).success).toBe(false);
  });

  it("rejects a name that is too short or too long", () => {
    expect(updateUsernameSchema.safeParse({ username: "ab" }).success).toBe(false);
    expect(updateUsernameSchema.safeParse({ username: "a".repeat(31) }).success).toBe(false);
  });
});
