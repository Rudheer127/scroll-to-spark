import { describe, expect, it } from "vitest";
import { onboardingSchema } from "@/features/onboarding/schemas";

const valid = { firstName: "Maya", lastName: "Rios", displayName: "Maya", ageConfirmed: true };

describe("onboardingSchema", () => {
  it("accepts the three names and the 18+ box, and trims them", () => {
    const parsed = onboardingSchema.parse({ ...valid, firstName: "  Maya  " });
    expect(parsed.firstName).toBe("Maya");
  });

  it("needs every field", () => {
    for (const key of ["firstName", "lastName", "displayName"] as const) {
      expect(onboardingSchema.safeParse({ ...valid, [key]: "   " }).success).toBe(false);
    }
    expect(onboardingSchema.safeParse({ ...valid, ageConfirmed: false }).success).toBe(false);
  });

  it("limits the length of names", () => {
    expect(onboardingSchema.safeParse({ ...valid, firstName: "a".repeat(41) }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...valid, displayName: "a".repeat(61) }).success).toBe(
      false,
    );
  });

  it("collects nothing beyond the names and the age box", () => {
    expect(Object.keys(onboardingSchema.shape).sort()).toEqual([
      "ageConfirmed",
      "displayName",
      "firstName",
      "lastName",
    ]);
  });
});
