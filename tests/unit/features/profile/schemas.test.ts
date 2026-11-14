import { describe, expect, it } from "vitest";
import {
  updateDisplayNameSchema,
  updateEmailSchema,
  updatePasswordSchema,
  updateUsernameSchema,
} from "@/features/profile/schemas";

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

describe("updateDisplayNameSchema", () => {
  it("trims, and turns an empty name into null", () => {
    const named = updateDisplayNameSchema.safeParse({ displayName: "  Maya Reddy " });
    expect(named.success && named.data.displayName).toBe("Maya Reddy");
    const empty = updateDisplayNameSchema.safeParse({ displayName: "   " });
    expect(empty.success && empty.data.displayName).toBeNull();
  });

  it("rejects a name over 60 characters", () => {
    expect(updateDisplayNameSchema.safeParse({ displayName: "a".repeat(61) }).success).toBe(false);
  });
});

describe("updateEmailSchema", () => {
  it("lowercases and trims a valid address", () => {
    const result = updateEmailSchema.safeParse({ email: "  Maya@Example.COM " });
    expect(result.success && result.data.email).toBe("maya@example.com");
  });

  it("rejects something that is not an email", () => {
    expect(updateEmailSchema.safeParse({ email: "maya" }).success).toBe(false);
  });
});

describe("updatePasswordSchema", () => {
  const good = {
    currentPassword: "old",
    newPassword: "longenough1",
    confirmPassword: "longenough1",
  };

  it("accepts matching passwords of at least 8 characters", () => {
    expect(updatePasswordSchema.safeParse(good).success).toBe(true);
  });

  it("rejects a short new password", () => {
    expect(
      updatePasswordSchema.safeParse({ ...good, newPassword: "short", confirmPassword: "short" })
        .success,
    ).toBe(false);
  });

  it("rejects passwords that do not match, on the confirm field", () => {
    const result = updatePasswordSchema.safeParse({ ...good, confirmPassword: "different1" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
  });
});
