import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ContributionRow, ContributionSummary } from "@/features/guide/types";

const MAX_ROWS = 200;
const MAX_TITLES = 5;

/** The signed-in person's contributions. RLS scopes rows to them, so no user id is taken. */
export async function getMyContributions(db: SupabaseClient<Database>): Promise<ContributionRow[]> {
  const { data, error } = await db
    .from("contributions")
    .select("*")
    .order("occurred_on", { ascending: false })
    .limit(MAX_ROWS);
  if (error) throw new Error(`Could not load contributions: ${error.message}`);
  return data;
}

/** Pure totals for the guide. `titles` holds up to 5 most recent distinct titles. */
export function summarizeContributions(rows: ContributionRow[]): ContributionSummary {
  const totalMinutes = rows.reduce((sum, r) => sum + r.minutes, 0);
  const newestFirst = [...rows].sort((a, b) => b.occurred_on.localeCompare(a.occurred_on));
  const titles = [...new Set(newestFirst.map((r) => r.title))].slice(0, MAX_TITLES);
  const firstDate = rows.reduce<string | null>(
    (min, r) => (min === null || r.occurred_on < min ? r.occurred_on : min),
    null,
  );
  return {
    count: rows.length,
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    firstDate,
    titles,
  };
}
