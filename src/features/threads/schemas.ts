import { z } from "zod";

export const THREAD_TITLE_MAX = 300;
export const THREAD_BODY_MAX = 10000;

export const createThreadSchema = z.object({
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
});

export const voteSchema = z.object({
  threadId: z.uuid(),
  value: z.union([z.literal(1), z.literal(-1)]),
});
