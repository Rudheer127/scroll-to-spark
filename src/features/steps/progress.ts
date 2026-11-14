import type { CompletionSummary } from "@/features/steps/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_DAYS = 7;
const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

export type DayBar = { letter: string; minutes: number };

export type Progress = {
  thisWeek: number;
  total: number;
  replies: number;
  minutesThisWeek: number;
  activeDays: number;
  /** The last seven days, oldest first, ending today. */
  days: DayBar[];
};

/** Numbers for the progress cards. The clock is read here, once, not while a component renders. */
export function summarizeProgress(
  completions: CompletionSummary[],
  now: number = Date.now(),
): Progress {
  const today = Math.floor(now / DAY_MS);
  const days: DayBar[] = Array.from({ length: WEEK_DAYS }, (_, index) => {
    const day = today - (WEEK_DAYS - 1 - index);
    return { letter: WEEKDAY_LETTERS[new Date(day * DAY_MS).getUTCDay()], minutes: 0 };
  });

  let thisWeek = 0;
  let minutesThisWeek = 0;
  for (const item of completions) {
    const offset = today - Math.floor(new Date(item.createdAt).getTime() / DAY_MS);
    if (offset < 0 || offset >= WEEK_DAYS) continue;
    thisWeek += 1;
    minutesThisWeek += item.minutes;
    days[WEEK_DAYS - 1 - offset].minutes += item.minutes;
  }

  return {
    thisWeek,
    total: completions.length,
    replies: completions.filter((item) => item.thankYou).length,
    minutesThisWeek,
    activeDays: days.filter((day) => day.minutes > 0).length,
    days,
  };
}
