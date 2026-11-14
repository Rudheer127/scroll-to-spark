import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { EvidenceRow } from "@/features/guide/types";

const MAX_ROWS = 4;
const QUERY_MAX = 200;
const COLUMNS =
  "id, claim, source_name, source_url, year, population, strength, verified_at, caveat";

/** Full text search over the curated evidence table. Blank or oversized queries return []. */
export async function lookupEvidence(
  db: SupabaseClient<Database>,
  query: string,
): Promise<EvidenceRow[]> {
  const q = query.trim();
  if (q === "" || q.length > QUERY_MAX) return [];
  const { data, error } = await db
    .from("evidence_claims")
    .select(COLUMNS)
    .textSearch("fts", q, { type: "websearch", config: "english" })
    .limit(MAX_ROWS);
  if (error) throw new Error(`Could not look up evidence: ${error.message}`);
  return data;
}
