import { z } from "zod";
import { INTENTS, MAX_CARDS, MAX_MESSAGE_CHARS } from "./constants";

/** Strict structured output: every field required, optional values use nullable. */
export const guideResponseSchema = z.object({
  intent: z.enum(INTENTS),
  message: z.string().max(MAX_MESSAGE_CHARS),
  cards: z
    .array(
      z.object({
        kind: z.enum(["opportunity", "evidence", "contribution"]),
        id: z.string(),
      }),
    )
    .max(MAX_CARDS),
  proposed_contribution: z
    .object({
      title: z.string(),
      minutes: z.number().int().min(1).max(600),
      occurred_on: z.string(),
      description: z.string(),
    })
    .nullable(),
  verdict: z
    .enum(["supported", "partly_supported", "unsupported", "not_enough_evidence"])
    .nullable(),
  next_step: z.string().nullable(),
});

export type GuideResponse = z.infer<typeof guideResponseSchema>;

/** Router output. Strict-compatible: both fields required, no optional values. */
export const routerOutputSchema = z.object({
  intent: z.enum(INTENTS),
  safety: z.enum(["ok", "crisis"]),
});

export type RouterOutput = z.infer<typeof routerOutputSchema>;
