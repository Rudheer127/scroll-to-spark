import { describe, expect, it } from "vitest";
import { bioguideSchema, lookupSchema, zipSchema } from "@/features/officials/schemas";

describe("schemas", () => {
  it("accepts five-digit ZIPs, trimmed", () => {
    expect(zipSchema.parse(" 85281 ")).toBe("85281");
    for (const bad of ["8528", "852811", "abcde", "85 281", ""]) {
      expect(zipSchema.safeParse(bad).success).toBe(false);
    }
  });
  it("accepts a ZIP or coordinates, not nonsense", () => {
    expect(lookupSchema.safeParse({ zip: "85281" }).success).toBe(true);
    expect(lookupSchema.safeParse({ lat: 33.4, lng: -111.9 }).success).toBe(true);
    expect(lookupSchema.safeParse({ lat: 100, lng: 0 }).success).toBe(false);
    expect(lookupSchema.safeParse({}).success).toBe(false);
  });
  it("accepts only Bioguide-shaped ids", () => {
    expect(bioguideSchema.safeParse("C000127").success).toBe(true);
    expect(bioguideSchema.safeParse("../etc").success).toBe(false);
  });
});
