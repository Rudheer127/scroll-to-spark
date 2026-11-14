import { z } from "zod";
import { EFFORTS } from "@/features/steps/constants";
import { INTENTS } from "./constants";

/**
 * Strict structured output: every field required, optional values use nullable. There is no
 * length cap on message and no count cap on cards here on purpose: the output guard enforces
 * MAX_MESSAGE_CHARS (too_long) and MAX_CARDS (too_many_cards), which earns one repair instead
 * of a parse failure.
 */
export const guideResponseSchema = z.object({
  intent: z.enum(INTENTS),
  message: z.string(),
  cards: z.array(
    z.object({
      kind: z.enum(["opportunity", "evidence", "contribution"]),
      id: z.string(),
    }),
  ),
  proposed_contribution: z
    .object({
      title: z.string(),
      // The handler validates the range with contributionInputSchemaFor and drops a bad proposal.
      minutes: z.number().int(),
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

/** Filters the opportunity handler asks the model to pull out of the message. Strict-compatible. */
export const opportunityFiltersSchema = z.object({
  effort: z.enum(EFFORTS).nullable(),
  remoteOnly: z.boolean(),
  keyword: z.string().max(100).nullable(),
});

export type OpportunityFiltersOutput = z.infer<typeof opportunityFiltersSchema>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string): boolean {
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/**
 * What a person may save as a contribution. Pure: pass today's ISO date (YYYY-MM-DD) so the
 * "not in the future" rule is testable. The guide handler and the save Server Action both use it.
 */
export function contributionInputSchemaFor(today: string) {
  return z.object({
    // Matches the contributions.title database check (3 to 120 characters).
    title: z.string().min(3).max(120),
    description: z.string().max(500),
    minutes: z.number().int().min(1).max(1440),
    occurred_on: z
      .string()
      .regex(ISO_DATE)
      .refine(isRealDate, "not a real date")
      .refine((d) => d <= today, "date is in the future"),
  });
}

export type ContributionInput = z.infer<ReturnType<typeof contributionInputSchemaFor>>;
