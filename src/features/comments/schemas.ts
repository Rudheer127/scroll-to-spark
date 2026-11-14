import { z } from "zod";
import { COMMENT_MAX, REACTION_CHOICES } from "@/features/comments/constants";

export const addCommentSchema = z.object({
  threadId: z.uuid(),
  parentId: z.uuid().nullable(),
  body: z
    .string()
    .trim()
    .min(1, "Write something before you post.")
    .max(COMMENT_MAX, `Use ${COMMENT_MAX} characters or fewer.`),
});

export const reactionSchema = z.object({
  commentId: z.uuid(),
  emoji: z.enum(REACTION_CHOICES),
});
