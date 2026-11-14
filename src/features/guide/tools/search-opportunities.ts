import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { isEffort, PLACES, type Place } from "@/features/steps/constants";
import type { OpportunityFilters, OpportunityRow } from "@/features/guide/types";

const MAX_ROWS = 5;
const KEYWORD_MAX = 100;
const COLUMNS =
  "id, title, description, effort, minutes, place, reply_within_hours, groups(name, is_demo)";

type Raw = {
  id: string;
  title: string;
  description: string | null;
  effort: string;
  minutes: number;
  place: string;
  reply_within_hours: number;
  groups: { name: string; is_demo?: boolean | null } | null;
};

/** Escape LIKE wildcards and drop characters that would break the PostgREST or filter. */
function ilikePattern(keyword: string | null): string | null {
  const trimmed = keyword?.trim() ?? "";
  if (trimmed === "" || trimmed.length > KEYWORD_MAX) return null;
  const cleaned = trimmed.replace(/[,()"]/g, " ").replace(/[\\%_]/g, (c) => `\\${c}`);
  return `%${cleaned}%`;
}

function toRow(raw: Raw): OpportunityRow {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    org_name: raw.groups?.name ?? "",
    effort: isEffort(raw.effort) ? raw.effort : "tiny",
    minutes: raw.minutes,
    place: (PLACES as readonly string[]).includes(raw.place) ? (raw.place as Place) : "either",
    reply_within_hours: raw.reply_within_hours,
    is_demo: raw.groups?.is_demo === true,
  };
}

/**
 * Open tasks the signed-in person can see, at most 5, newest first.
 * `db` is the user session client, so RLS and the demo-group hiding already apply.
 * We deliberately do not filter on is_demo here.
 */
export async function searchOpportunities(
  db: SupabaseClient<Database>,
  f: OpportunityFilters,
): Promise<OpportunityRow[]> {
  let query = db.from("tasks").select(COLUMNS).eq("is_open", true);
  if (f.effort) query = query.eq("effort", f.effort);
  if (f.remoteOnly) query = query.in("place", ["home", "either"]);
  const pattern = ilikePattern(f.keyword);
  if (pattern) query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`);

  const { data, error } = await query.order("created_at", { ascending: false }).limit(MAX_ROWS);
  if (error) throw new Error(`Could not search opportunities: ${error.message}`);
  return (data as unknown as Raw[]).slice(0, MAX_ROWS).map(toRow);
}
