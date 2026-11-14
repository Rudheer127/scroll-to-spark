import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "@/features/auth/schemas";

describe("signupSchema", () => {
  it("accepts a valid email and a password of 8 characters", () => {
    expect(signupSchema.safeParse({ email: "a@b.co", password: "12345678" }).success).toBe(true);
  });

  it("rejects a short password", () => {
    expect(signupSchema.safeParse({ email: "a@b.co", password: "1234567" }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(signupSchema.safeParse({ email: "nope", password: "12345678" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});
