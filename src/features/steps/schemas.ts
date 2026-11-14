import { z } from "zod";
import {
  DESCRIPTION_MAX,
  EFFORTS,
  NOTE_MAX,
  PLACES,
  TITLE_MAX,
  TITLE_MIN,
} from "@/features/steps/constants";

export const completeTaskSchema = z.object({
  taskId: z.uuid(),
  note: z
    .string()
    .trim()
    .min(1, "Write a line or two so the group knows what you did.")
    .max(NOTE_MAX, `Use ${NOTE_MAX} characters or fewer.`),
});

export const createTaskSchema = z.object({
  groupId: z.uuid("Pick one of your groups."),
  title: z
    .string()
    .trim()
    .min(TITLE_MIN, `Use at least ${TITLE_MIN} characters.`)
    .max(TITLE_MAX, `Use ${TITLE_MAX} characters or fewer.`),
  description: z
    .string()
    .trim()
    .max(DESCRIPTION_MAX, `Use ${DESCRIPTION_MAX} characters or fewer.`)
    .transform((value) => (value === "" ? null : value)),
  minutes: z.coerce
    .number()
    .int()
    .min(1, "Enter at least 1 minute.")
    .max(600, "Use 600 minutes or fewer."),
  effort: z.enum(EFFORTS, "Pick how big it is."),
  place: z.enum(PLACES, "Pick where it happens."),
});

export const thankYouSchema = z.object({
  completionId: z.uuid(),
  kind: z.enum(["tap", "written"]),
  body: z.string().trim().max(NOTE_MAX).optional(),
});
