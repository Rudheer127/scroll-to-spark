import { z } from "zod";

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;

export const updateUsernameSchema = z.object({
  username: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_.-]+$/, "Use only letters, numbers, underscores, dots and hyphens.")
    .min(USERNAME_MIN, `Use at least ${USERNAME_MIN} characters.`)
    .max(USERNAME_MAX, `Use ${USERNAME_MAX} characters or fewer.`),
});

export const DISPLAY_NAME_MAX = 60;

export const updateDisplayNameSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(DISPLAY_NAME_MAX, `Use ${DISPLAY_NAME_MAX} characters or fewer.`)
    .transform((value) => (value === "" ? null : value)),
});

export const updateEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
});

export const PASSWORD_MIN = 8;

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`),
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "The two passwords do not match.",
  });
