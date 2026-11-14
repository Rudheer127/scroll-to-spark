import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { RATE_PER_DAY, RATE_PER_MINUTE } from "./constants";

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
/** Conservative waits: the full minute window, or one hour once the daily cap is hit. */
const RETRY_AFTER_MINUTE_SEC = 60;
const RETRY_AFTER_DAY_SEC = 3600;

async function countUserMessages(
  db: SupabaseClient<Database>,
  userId: string,
  windowMs: number,
): Promise<number> {
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count, error } = await db
    .from("guide_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "user")
    .gte("created_at", since);
  if (error) throw new Error(`Could not read the rate limit: ${error.message}`);
  return count ?? 0;
}

/** Counts this person's own messages in the last minute and day, using the user session client. */
export async function checkRateLimit(
  db: SupabaseClient<Database>,
  userId: string,
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const [perMinute, perDay] = await Promise.all([
    countUserMessages(db, userId, MINUTE_MS),
    countUserMessages(db, userId, DAY_MS),
  ]);
  if (perDay >= RATE_PER_DAY) return { allowed: false, retryAfterSec: RETRY_AFTER_DAY_SEC };
  if (perMinute >= RATE_PER_MINUTE)
    return { allowed: false, retryAfterSec: RETRY_AFTER_MINUTE_SEC };
  return { allowed: true, retryAfterSec: 0 };
}
