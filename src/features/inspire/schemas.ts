import { z } from "zod";
import { EFFORTS } from "@/features/steps/constants";
import { MINUTES_OPTIONS, SORTS } from "@/features/inspire/filters";

export const completionIdSchema = z.uuid();

export const setSharingSchema = z.object({
  completionId: z.uuid(),
  sharePublicly: z.boolean(),
  shareThankYou: z.boolean(),
});

export const toggleSchema = z.object({ completionId: z.uuid(), on: z.boolean() });

export const feedRequestSchema = z.object({
  filters: z.object({
    q: z.string().max(80),
    effort: z.enum(EFFORTS).nullable(),
    group: z
      .string()
      .regex(/^[a-z0-9-]{1,80}$/)
      .nullable(),
    minutes: z
      .number()
      .refine((n) => (MINUTES_OPTIONS as readonly number[]).includes(n))
      .nullable(),
    thanks: z.boolean(),
    sort: z.enum(SORTS),
    tab: z.enum(["all", "saved"]),
  }),
  cursor: z.string().max(300).nullable(),
});

export const searchTermSchema = z
  .string()
  .transform((value) => value.trim().replace(/\s+/g, " "))
  .pipe(z.string().min(2, "Type at least two letters.").max(80));
