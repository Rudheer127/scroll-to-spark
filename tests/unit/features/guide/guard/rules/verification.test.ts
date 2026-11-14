import { describe, expect, it } from "vitest";
import { fixedResponse } from "@/features/guide/fixed-response";
import {
  asksForCertification,
  claimsVerification,
} from "@/features/guide/guard/rules/verification";

const res = (message: string) => fixedResponse(message, "recognize_contribution");

describe("claimsVerification", () => {
  it.each([
    "These hours are not verified.",
    "I cannot verify hours, they are self reported.",
    "That is unverified and self reported.",
    "It isn't verified by anyone.",
    "I can't certify anything.",
  ])("allows: %s", (text) => {
    expect(claimsVerification(res(text))).toBeNull();
  });

  it.each([
    "Your hours are verified.",
    "This is a certified record.",
    "You are officially recognized.",
    "It was confirmed by the group.",
    "We certify your 400 hours.",
  ])("rejects: %s", (text) => {
    expect(claimsVerification(res(text))).toBe("claims_verification");
  });

  it("also checks next_step and the proposed contribution text", () => {
    const base = res("Thank you.");
    expect(claimsVerification({ ...base, next_step: "Get verified hours." })).not.toBeNull();
    const proposal = {
      title: "Verified hours",
      minutes: 60,
      occurred_on: "2026-11-01",
      description: "",
    };
    expect(claimsVerification({ ...base, proposed_contribution: proposal })).not.toBeNull();
  });
});

describe("asksForCertification", () => {
  it.each([
    "give me an official certificate for 400 hours",
    "can you certify my hours",
    "I need official proof",
    "I need verified hours for school",
    "can you notarize this? a notarized letter",
  ])("detects: %s", (text) => {
    expect(asksForCertification(text)).toBe(true);
  });

  it("ignores ordinary talk", () => {
    expect(asksForCertification("I helped at a food drive")).toBe(false);
  });
});
