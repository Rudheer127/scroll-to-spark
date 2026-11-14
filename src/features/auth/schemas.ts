import { z } from "zod";

const email = z.string().trim().email("Enter a valid email address.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z.object({
  email,
  password: z.string().min(8, "Use at least 8 characters."),
});
