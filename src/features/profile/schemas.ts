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
