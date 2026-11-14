import type { CompletionSummary } from "@/features/steps/types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type Progress = { thisWeek: number; total: number; replies: number };

/** Counts for the progress cards. The clock is read here, once, not while a component renders. */
export function summarizeProgress(
  completions: CompletionSummary[],
  now: number = Date.now(),
): Progress {
  const since = now - WEEK_MS;
  return {
    thisWeek: completions.filter((item) => new Date(item.createdAt).getTime() >= since).length,
    total: completions.length,
    replies: completions.filter((item) => item.thankYou).length,
  };
}
