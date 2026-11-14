import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { EvidenceRow } from "@/features/guide/types";
import { evidenceKeywords } from "./evidence-keywords";

const MAX_ROWS = 4;
const COLUMNS =
  "id, claim, source_name, source_url, year, population, strength, verified_at, caveat";

/**
 * Full text search over the curated evidence table. The claim is reduced to keywords joined with
 * "or", so any shared content word can match. No keywords means [] with no query.
 */
export async function lookupEvidence(
  db: SupabaseClient<Database>,
  query: string,
): Promise<EvidenceRow[]> {
  const keywords = evidenceKeywords(query);
  if (keywords.length === 0) return [];
  const { data, error } = await db
    .from("evidence_claims")
    .select(COLUMNS)
    .textSearch("fts", keywords.join(" or "), { type: "websearch", config: "english" })
    .limit(MAX_ROWS);
  if (error) throw new Error(`Could not look up evidence: ${error.message}`);
  return data;
}
