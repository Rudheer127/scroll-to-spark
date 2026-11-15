import { z } from "zod";
import {
  GROUP_COLOR_VALUES,
  GROUP_DESCRIPTION_MAX,
  GROUP_NAME_MAX,
  GROUP_NAME_MIN,
  GROUP_RULES_MAX,
} from "@/features/groups/constants";

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(GROUP_NAME_MIN, `Use at least ${GROUP_NAME_MIN} characters.`)
    .max(GROUP_NAME_MAX, `Use ${GROUP_NAME_MAX} characters or fewer.`),
  description: z
    .string()
    .trim()
    .max(GROUP_DESCRIPTION_MAX, `Use ${GROUP_DESCRIPTION_MAX} characters or fewer.`)
    .transform((value) => (value === "" ? null : value)),
  rules: z
    .string()
    .trim()
    .max(GROUP_RULES_MAX, `Use ${GROUP_RULES_MAX} characters or fewer.`)
    .optional()
    .transform((value) => (value ? value : null)),
  isPrivate: z.boolean(),
  color: z.enum(GROUP_COLOR_VALUES, "Pick a color."),
});

export const deleteGroupSchema = z.object({
  groupId: z.uuid(),
  confirmName: z.string(),
});
