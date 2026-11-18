import { describe, expect, it } from "vitest";
import { prefillNames, splitName } from "@/features/onboarding/steps";

describe("splitName", () => {
  it("splits the first word from the rest", () => {
    expect(splitName("Maya R. Santos")).toEqual({ firstName: "Maya", lastName: "R. Santos" });
  });

  it("treats one word as a first name and handles nothing", () => {
    expect(splitName("Maya")).toEqual({ firstName: "Maya", lastName: "" });
    expect(splitName("   ")).toEqual({ firstName: "", lastName: "" });
    expect(splitName(null)).toEqual({ firstName: "", lastName: "" });
  });
});

describe("prefillNames", () => {
  it("prefers the saved names", () => {
    expect(
      prefillNames(
        { first_name: "Maya", last_name: "Rios", display_name: "Mayo" },
        { full_name: "Someone Else" },
      ),
    ).toEqual({ firstName: "Maya", lastName: "Rios", displayName: "Mayo" });
  });

  it("falls back to the Google name, and the display name follows the first name", () => {
    expect(
      prefillNames({ first_name: null, last_name: null, display_name: null }, { name: "Jo Park" }),
    ).toEqual({ firstName: "Jo", lastName: "Park", displayName: "Jo" });
  });

  it("works with no profile and no metadata", () => {
    expect(prefillNames(null, undefined)).toEqual({ firstName: "", lastName: "", displayName: "" });
  });
});
