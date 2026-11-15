import { z } from "zod";
import { IMAGE_ALT_MAX } from "@/features/threads/image-rules";

export const THREAD_TITLE_MAX = 300;
export const THREAD_BODY_MAX = 10000;

export const createThreadSchema = z
  .object({
    groupId: z.uuid(),
    title: z
      .string()
      .trim()
      .min(1, "Give your thread a title.")
      .max(THREAD_TITLE_MAX, `Use ${THREAD_TITLE_MAX} characters or fewer.`),
    body: z
      .string()
      .trim()
      .max(THREAD_BODY_MAX, `Use ${THREAD_BODY_MAX} characters or fewer.`)
      .transform((value) => (value === "" ? null : value)),
    imagePath: z.string().max(200).nullable(),
    imageAlt: z.string().trim().max(IMAGE_ALT_MAX).nullable(),
  })
  .refine((value) => !value.imagePath || (value.imageAlt && value.imageAlt.length > 0), {
    path: ["imageAlt"],
    message: "Describe the image so people using screen readers can follow along.",
  });

export const REPORT_REASONS = [
  { value: "harassment", label: "Harassment or bullying" },
  { value: "personal_info", label: "Shares someone's personal information" },
  { value: "spam", label: "Spam or scam" },
  { value: "unsafe", label: "Unsafe or threatening" },
  { value: "other", label: "Something else" },
] as const;

export const reportSchema = z.object({
  targetType: z.enum(["thread", "comment", "group"]),
  targetId: z.uuid(),
  reason: z.enum(["harassment", "personal_info", "spam", "unsafe", "other"], "Pick a reason."),
  details: z
    .string()
    .trim()
    .max(500, "Use 500 characters or fewer.")
    .transform((value) => (value === "" ? null : value)),
});

export const blockSchema = z.object({ userId: z.uuid() });

export const voteSchema = z.object({
  threadId: z.uuid(),
  value: z.union([z.literal(1), z.literal(-1)]),
});
