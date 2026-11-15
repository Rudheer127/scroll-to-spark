import { z } from "zod";
import { IMAGE_ALT_MAX } from "@/features/threads/image-rules";
import { isGiphyMediaUrl } from "@/features/comments/gifs";
import { COMMENT_MAX, REACTION_CHOICES } from "@/features/comments/constants";

export const addCommentSchema = z
  .object({
    threadId: z.uuid(),
    parentId: z.uuid().nullable(),
    body: z.string().trim().max(COMMENT_MAX, `Use ${COMMENT_MAX} characters or fewer.`),
    imagePath: z.string().max(200).nullable(),
    gifUrl: z.string().nullable(),
    imageAlt: z.string().trim().max(IMAGE_ALT_MAX).nullable(),
  })
  .refine((value) => value.body.length > 0 || value.imagePath || value.gifUrl, {
    path: ["body"],
    message: "Write something or add an image before you post.",
  })
  .refine((value) => !(value.imagePath && value.gifUrl), {
    path: ["body"],
    message: "Add an image or a GIF, not both.",
  })
  .refine((value) => !value.gifUrl || isGiphyMediaUrl(value.gifUrl), {
    path: ["body"],
    message: "That GIF is not available. Pick another.",
  })
  .refine(
    (value) => !(value.imagePath || value.gifUrl) || (value.imageAlt && value.imageAlt.length > 0),
    {
      path: ["imageAlt"],
      message: "Describe the image so people using screen readers can follow along.",
    },
  );

export const commentVoteSchema = z.object({
  commentId: z.uuid(),
  value: z.union([z.literal(1), z.literal(-1)]),
});

export const reactionSchema = z.object({
  commentId: z.uuid(),
  emoji: z.enum(REACTION_CHOICES),
});
