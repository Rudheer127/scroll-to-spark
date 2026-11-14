import { describe, expect, it } from "vitest";
import { updateUsernameSchema } from "@/features/profile/schemas";

describe("updateUsernameSchema", () => {
  it("accepts lowercase letters, numbers and underscores", () => {
    expect(updateUsernameSchema.safeParse({ username: "maya_r2" }).success).toBe(true);
  });

  it("lowercases and trims what was typed", () => {
    const result = updateUsernameSchema.safeParse({ username: "  Maya_R  " });
    expect(result.success && result.data.username).toBe("maya_r");
  });

  it("rejects spaces and symbols", () => {
    expect(updateUsernameSchema.safeParse({ username: "maya r!" }).success).toBe(false);
  });

  it("rejects a name that is too short or too long", () => {
    expect(updateUsernameSchema.safeParse({ username: "ab" }).success).toBe(false);
    expect(updateUsernameSchema.safeParse({ username: "a".repeat(31) }).success).toBe(false);
  });
});
