import type { GuideResponse } from "./schemas";
import type { Intent } from "./types";

/** Wraps fixed copy in the same shape the model returns. Fixed copy is not model output. */
export function fixedResponse(message: string, intent: Intent = "out_of_scope"): GuideResponse {
  return {
    intent,
    message,
    cards: [],
    proposed_contribution: null,
    verdict: null,
    next_step: null,
  };
}
