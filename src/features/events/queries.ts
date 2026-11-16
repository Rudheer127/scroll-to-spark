import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/queries";
import { loose } from "@/features/threads/loose-db";
import type { Rsvp, RsvpStatus } from "@/features/events/types";

type RsvpRow = {
  event_key: string;
  status: string;
  title: string;
  starts_at: string;
  timezone: string;
  url?: string | null;
};

export function toRsvp(row: RsvpRow): Rsvp {
  return {
    eventKey: row.event_key,
    status: row.status === "attended" ? "attended" : ("going" satisfies RsvpStatus),
    title: row.title,
    startsAt: row.starts_at,
    timezone: row.timezone,
    url: row.url ?? null,
  };
}

/** The signed-in person's own RSVPs. Row-level security means nobody else's can come back. */
export async function getMyRsvps(): Promise<Rsvp[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_rsvps")
    .select("event_key, status, title, starts_at, timezone, url")
    .eq("user_id", user.id)
    .order("starts_at", { ascending: true });
  return (data ?? []).map(toRsvp);
}

const SEARCH_LIMIT = 6;

/** The person's most recent event searches, newest first. */
export async function getRecentSearches(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = loose(await createClient());
  const { data } = await supabase
    .from("search_history")
    .select("term")
    .eq("user_id", user.id)
    .eq("scope", "events")
    .order("created_at", { ascending: false })
    .limit(SEARCH_LIMIT);
  return ((data ?? []) as { term: string }[]).map((row) => row.term);
}
