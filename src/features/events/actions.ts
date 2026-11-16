"use server";

import { revalidatePath } from "next/cache";
import { fail, type ActionResult } from "@/lib/result";
import { createClient } from "@/lib/supabase/server";
import { loose } from "@/features/threads/loose-db";
import { getEvents } from "@/features/events/source";
import { lookupZip, zipFromCoords } from "@/features/events/location";
import {
  findNearbySchema,
  logContributionSchema,
  searchTermSchema,
  setRsvpSchema,
} from "@/features/events/schemas";
import type { EventFeed, EventLocation, RsvpStatus } from "@/features/events/types";

const UNIQUE_VIOLATION = "23505";
const SIGN_IN = "Please sign in to do that.";

async function currentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

export type NearbyResult = { location: EventLocation; feed: EventFeed };

/**
 * Finds events for a typed ZIP code, or for a browser location that is turned into a ZIP right here
 * and then forgotten. Nothing about the place is saved by the server.
 */
export async function findNearby(input: unknown): Promise<ActionResult<NearbyResult>> {
  const { userId } = await currentUserId();
  if (!userId) return fail(SIGN_IN);

  const parsed = findNearbySchema.safeParse(input);
  if (!parsed.success) return fail("Enter a five-digit ZIP code.");

  let zip: string | null;
  if ("zip" in parsed.data) {
    zip = parsed.data.zip;
  } else {
    zip = await zipFromCoords(parsed.data.lat, parsed.data.lng);
    if (!zip)
      return fail("We could not turn your location into a ZIP code. Type your ZIP instead.");
  }

  const location = await lookupZip(zip);
  if (!location) return fail("We could not find that ZIP code. Check it and try again.");

  return { ok: true, data: { location, feed: await getEvents(location.zip) } };
}

/**
 * Saves "I'm going" in this app only. It does not sign anyone up with the organizer. If the event
 * is already saved, only its status changes. Marking "attended" is allowed after the start time and
 * is the person's own word: nothing here checks it.
 */
export async function setRsvp(input: unknown): Promise<ActionResult<{ status: RsvpStatus }>> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return fail(SIGN_IN);

  const parsed = setRsvpSchema.safeParse(input);
  if (!parsed.success) return fail("That event cannot be saved.");
  const { event, status } = parsed.data;

  if (status === "attended" && new Date(event.startsAt).getTime() > Date.now()) {
    return fail("You can mark an event as attended after it has started.");
  }

  const { error } = await supabase.from("event_rsvps").insert({
    user_id: userId,
    event_key: event.eventKey,
    source: "mobilize",
    title: event.title,
    organizer: event.organizer,
    url: event.url,
    starts_at: event.startsAt,
    timezone: event.timezone,
    is_virtual: event.isVirtual,
    city: event.city,
    status,
  });

  if (error) {
    if (error.code !== UNIQUE_VIOLATION) return fail("We could not save that. Try again.");
    const { error: updateError } = await supabase
      .from("event_rsvps")
      .update({ status })
      .eq("user_id", userId)
      .eq("event_key", event.eventKey);
    if (updateError) return fail("We could not save that. Try again.");
  }

  revalidatePath("/events");
  return { ok: true, data: { status } };
}

/** Removes the person's own RSVP. Safe to repeat. */
export async function removeRsvp(eventKey: unknown): Promise<ActionResult> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return fail(SIGN_IN);
  if (typeof eventKey !== "string" || !/^mobilize:\d+:\d+$/.test(eventKey)) {
    return fail("That event cannot be changed.");
  }

  const { error } = await supabase
    .from("event_rsvps")
    .delete()
    .eq("user_id", userId)
    .eq("event_key", eventKey);
  if (error) return fail("We could not remove that. Try again.");

  revalidatePath("/events");
  return { ok: true, data: undefined };
}

/**
 * Adds an event the person said they attended to their contributions, as self-reported. It needs
 * their own saved "attended" RSVP, and logging the same event twice does nothing the second time.
 * The database default keeps verification at self_reported, since that column is never sent.
 */
export async function logAttendedContribution(input: unknown): Promise<ActionResult> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return fail(SIGN_IN);

  const parsed = logContributionSchema.safeParse(input);
  if (!parsed.success) return fail("Pick a number of minutes between 1 and 1440.");
  const { eventKey, minutes } = parsed.data;

  const { data: rsvp } = await supabase
    .from("event_rsvps")
    .select("title, starts_at, status")
    .eq("user_id", userId)
    .eq("event_key", eventKey)
    .maybeSingle();
  if (!rsvp || rsvp.status !== "attended") return fail("Mark the event as attended first.");

  const note = `Self-reported from the Events page (${eventKey}).`;
  const { data: existing } = await supabase
    .from("contributions")
    .select("id")
    .eq("user_id", userId)
    .eq("description", note)
    .limit(1);
  if (existing && existing.length > 0)
    return { ok: true, data: undefined, message: "Already added." };

  const { error } = await supabase.from("contributions").insert({
    user_id: userId,
    title: `Went to ${rsvp.title}`.slice(0, 120),
    description: note,
    minutes,
    occurred_on: rsvp.starts_at.slice(0, 10),
  });
  if (error) return fail("We could not add that. Try again.");

  revalidatePath("/", "layout");
  return { ok: true, data: undefined, message: "Added to your contributions." };
}

const SEARCH_KEEP = 6;

/** Remembers a search so it shows up as a chip next time. Searching the same words again moves them to the top. */
export async function rememberSearch(input: unknown): Promise<ActionResult<{ terms: string[] }>> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return fail(SIGN_IN);
  const parsed = searchTermSchema.safeParse(input);
  if (!parsed.success) return fail("That search cannot be saved.");

  const db = loose(supabase);
  const { error } = await db
    .from("search_history")
    .insert({ user_id: userId, scope: "events", term: parsed.data });
  if (error) {
    if (error.code !== UNIQUE_VIOLATION) return fail("We could not save that search.");
    await db
      .from("search_history")
      .update({ created_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("scope", "events")
      .eq("term", parsed.data);
  }
  return { ok: true, data: { terms: await trimSearches(db, userId) } };
}

async function trimSearches(db: ReturnType<typeof loose>, userId: string): Promise<string[]> {
  const { data } = await db
    .from("search_history")
    .select("term")
    .eq("user_id", userId)
    .eq("scope", "events")
    .order("created_at", { ascending: false });
  const terms = ((data ?? []) as { term: string }[]).map((row) => row.term);
  const extra = terms.slice(SEARCH_KEEP);
  if (extra.length > 0) {
    await db
      .from("search_history")
      .delete()
      .eq("user_id", userId)
      .eq("scope", "events")
      .in("term", extra);
  }
  return terms.slice(0, SEARCH_KEEP);
}

/** Forgets one remembered search, or all of them when no term is given. Safe to repeat. */
export async function forgetSearches(term?: unknown): Promise<ActionResult> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return fail(SIGN_IN);
  const db = loose(supabase);
  let query = db.from("search_history").delete().eq("user_id", userId).eq("scope", "events");
  if (term !== undefined) {
    const parsed = searchTermSchema.safeParse(term);
    if (!parsed.success) return fail("That search cannot be changed.");
    query = query.eq("term", parsed.data);
  }
  const { error } = await query;
  if (error) return fail("We could not forget that. Try again.");
  return { ok: true, data: undefined };
}
