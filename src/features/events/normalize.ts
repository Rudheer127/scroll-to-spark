import { z } from "zod";
import type { CivicEvent } from "@/features/events/types";

const timeslotSchema = z.object({
  id: z.number(),
  start_date: z.number(),
  end_date: z.number().nullish(),
});

const rawEventSchema = z.object({
  id: z.number(),
  title: z.string(),
  summary: z.string().nullish(),
  description: z.string().nullish(),
  event_type: z.string().nullish(),
  is_virtual: z.boolean().nullish(),
  browser_url: z.string().nullish(),
  timezone: z.string().nullish(),
  visibility: z.string().nullish(),
  sponsor: z.object({ name: z.string().nullish() }).nullish(),
  timeslots: z.array(timeslotSchema).default([]),
  location: z
    .object({
      venue: z.string().nullish(),
      locality: z.string().nullish(),
      region: z.string().nullish(),
      location: z.object({ latitude: z.number(), longitude: z.number() }).nullish(),
    })
    .nullish(),
});

/** Fundraisers are asks for money, not ways to take part, so they are left out. */
const SKIPPED_TYPES = new Set(["FUNDRAISER"]);

const KIND_LABELS: Record<string, string> = {
  COMMUNITY: "Community event",
  MEETING: "Meeting",
  RALLY: "Rally",
  MEET_GREET: "Meet and greet",
  TRAINING: "Training",
  WORKSHOP: "Workshop",
  CANVASS: "Door knocking",
  COMMUNITY_CANVASS: "Door knocking",
  PHONE_BANK: "Phone bank",
  TEXT_BANK: "Text bank",
  LETTER_WRITING: "Letter writing",
  VOTER_REG: "Voter registration",
  TOWN_HALL: "Town hall",
  ADVOCACY_CALL: "Advocacy call",
  SOLIDARITY_EVENT: "Solidarity event",
  VISIBILITY_EVENT: "Visibility event",
};

export function kindLabel(type: string | null | undefined): string {
  if (!type) return "Event";
  return KIND_LABELS[type] ?? type.charAt(0) + type.slice(1).toLowerCase().replaceAll("_", " ");
}

const SUMMARY_MAX = 240;

/** Plain text, one paragraph, cut at a word and ended with an ellipsis if it was long. */
export function toSummary(text: string | null | undefined): string {
  const plain = (text ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= SUMMARY_MAX) return plain;
  const cut = plain.slice(0, SUMMARY_MAX);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 1)).trimEnd()}…`;
}

/** Only https links on mobilize.us are kept, so nothing else can be linked from an event. */
export function safeMobilizeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:") return null;
    if (host !== "mobilize.us" && !host.endsWith(".mobilize.us")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function validZone(zone: string | null | undefined): string {
  if (!zone) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return zone;
  } catch {
    return "UTC";
  }
}

/**
 * Turns one Mobilize event into a CivicEvent for its next time slot that has not ended.
 * Returns null for anything we cannot show honestly: no link, no upcoming slot, hidden, or a fundraiser.
 */
export function normalizeMobilizeEvent(raw: unknown, now: Date = new Date()): CivicEvent | null {
  const parsed = rawEventSchema.safeParse(raw);
  if (!parsed.success) return null;
  const event = parsed.data;

  if (event.visibility && event.visibility !== "PUBLIC") return null;
  if (event.event_type && SKIPPED_TYPES.has(event.event_type)) return null;

  const url = safeMobilizeUrl(event.browser_url);
  if (!url) return null;

  const nowSeconds = now.getTime() / 1000;
  const slot = event.timeslots
    .filter((s) => (s.end_date ?? s.start_date) >= nowSeconds)
    .sort((a, b) => a.start_date - b.start_date)[0];
  if (!slot) return null;

  const isVirtual = event.is_virtual === true;
  const place = event.location;
  const coords = !isVirtual ? (place?.location ?? null) : null;

  return {
    key: `mobilize:${event.id}:${slot.id}`,
    source: "mobilize",
    title: event.title.trim(),
    summary: toSummary(event.summary || event.description),
    organizer: event.sponsor?.name?.trim() || "Organizer not listed",
    kind: kindLabel(event.event_type),
    startsAt: new Date(slot.start_date * 1000).toISOString(),
    endsAt: slot.end_date ? new Date(slot.end_date * 1000).toISOString() : null,
    timezone: validZone(event.timezone),
    isVirtual,
    venue: !isVirtual ? place?.venue?.trim() || null : null,
    city: !isVirtual ? place?.locality?.trim() || null : null,
    region: !isVirtual ? place?.region?.trim() || null : null,
    lat: coords?.latitude ?? null,
    lng: coords?.longitude ?? null,
    url,
    isSample: false,
  };
}

/** Normalizes a page of results, drops what cannot be shown, removes repeats and sorts by start time. */
export function normalizeMobilizeEvents(rows: unknown, now: Date = new Date()): CivicEvent[] {
  if (!Array.isArray(rows)) return [];
  const seen = new Set<string>();
  const events: CivicEvent[] = [];
  for (const row of rows) {
    const event = normalizeMobilizeEvent(row, now);
    if (event && !seen.has(event.key)) {
      seen.add(event.key);
      events.push(event);
    }
  }
  return events.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
