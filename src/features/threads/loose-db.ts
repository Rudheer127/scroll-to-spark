import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The discussion tables gained columns (hidden, image_alt, rules) and tables (reports, user_blocks)
 * in 20261115010000_discussions_safety.sql. Until `src/types/database.ts` is regenerated, the
 * discussion code talks to Supabase through this untyped view of the client.
 */
export function loose(client: unknown): SupabaseClient {
  return client as SupabaseClient;
}
