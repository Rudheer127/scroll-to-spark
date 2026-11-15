import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/queries";
import type { Rsvp, RsvpStatus } from "@/features/events/types";

type RsvpRow = {
  event_key: string;
  status: string;
  title: string;
  starts_at: string;
  timezone: string;
};

export function toRsvp(row: RsvpRow): Rsvp {
  return {
    eventKey: row.event_key,
    status: row.status === "attended" ? "attended" : ("going" satisfies RsvpStatus),
    title: row.title,
    startsAt: row.starts_at,
    timezone: row.timezone,
  };
}

/** The signed-in person's own RSVPs. Row-level security means nobody else's can come back. */
export async function getMyRsvps(): Promise<Rsvp[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_rsvps")
    .select("event_key, status, title, starts_at, timezone")
    .eq("user_id", user.id)
    .order("starts_at", { ascending: true });
  return (data ?? []).map(toRsvp);
}
