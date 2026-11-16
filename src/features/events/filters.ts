import type { Coords, CivicEvent } from "@/features/events/types";

export const EVENT_MODES = ["all", "near", "online", "inperson"] as const;
export type EventMode = (typeof EVENT_MODES)[number];

export const WHEN_OPTIONS = [
  { value: "any", label: "Any date" },
  { value: "today", label: "Today" },
  { value: "week", label: "Next 7 days" },
  { value: "month", label: "Next 30 days" },
] as const;
export type EventWhen = (typeof WHEN_OPTIONS)[number]["value"];

/**
 * Kinds that are campaign work (asking people for votes, calls, doors or money) rather than civic
 * life. They are hidden unless the person turns them on. Fundraisers never reach the list at all.
 */
export const CAMPAIGN_KINDS: readonly string[] = [
  "Door knocking",
  "Phone bank",
  "Text bank",
  "Rally",
  "Visibility event",
  "Canvass",
  "Fundraiser",
  "Advocacy call",
  "Poll watching",
];

export function isCampaignEvent(event: CivicEvent): boolean {
  return CAMPAIGN_KINDS.includes(event.kind);
}

export const RADIUS_OPTIONS = [10, 25, 50] as const;

export const SORT_OPTIONS = [
  { value: "soonest", label: "Soonest first" },
  { value: "nearest", label: "Nearest first" },
] as const;
export type EventSort = (typeof SORT_OPTIONS)[number]["value"];

/** Every kind of event in the list, once each and in alphabetical order, for the type filter. */
export function eventKinds(events: CivicEvent[]): string[] {
  return [...new Set(events.map((event) => event.kind).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export type EventFilters = {
  mode: EventMode;
  query: string;
  /** Centre of the chosen ZIP code. Null until the person shares a place. */
  center: Coords | null;
  radiusMiles: number;
  /** Optional date window, counted from `now`. Leave out for any date. */
  when?: EventWhen;
  /** Only events of this kind (an exact label from `eventKinds`). Leave out for every kind. */
  kind?: string;
  /** Show campaign-work events too. Off unless set to true. */
  includeCampaign?: boolean;
  now?: Date;
};

const EARTH_RADIUS_MILES = 3958.8;

export function distanceMiles(a: Coords, b: Coords): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

/** Miles from the centre to an in-person event, or null when either place is unknown. */
export function eventDistance(event: CivicEvent, center: Coords | null): number | null {
  if (!center || event.isVirtual || event.lat === null || event.lng === null) return null;
  return distanceMiles(center, { lat: event.lat, lng: event.lng });
}

export function isEventMode(value: unknown): value is EventMode {
  return typeof value === "string" && (EVENT_MODES as readonly string[]).includes(value);
}

function matchesQuery(event: CivicEvent, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = [
    event.title,
    event.organizer,
    event.kind,
    event.city,
    event.region,
    event.summary,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return words.every((word) => haystack.includes(word));
}

const DAY_MS = 86_400_000;

function withinWhen(event: CivicEvent, when: EventWhen, now: Date): boolean {
  if (when === "any") return true;
  const days = when === "today" ? 1 : when === "week" ? 7 : 30;
  return new Date(event.startsAt).getTime() <= now.getTime() + days * DAY_MS;
}

/**
 * Applies the mode, the search words and the distance limit.
 * "near" needs a centre: with none it returns nothing, and the page asks for a place instead.
 * Online events never count as near, because they have no place.
 */
export function filterEvents(events: CivicEvent[], filters: EventFilters): CivicEvent[] {
  return events.filter((event) => {
    if (!matchesQuery(event, filters.query)) return false;
    if (filters.kind && event.kind !== filters.kind) return false;
    if (!filters.includeCampaign && isCampaignEvent(event)) return false;
    if (!withinWhen(event, filters.when ?? "any", filters.now ?? new Date())) return false;
    switch (filters.mode) {
      case "online":
        return event.isVirtual;
      case "inperson":
        return !event.isVirtual;
      case "near": {
        const miles = eventDistance(event, filters.center);
        return miles !== null && miles <= filters.radiusMiles;
      }
      default:
        return true;
    }
  });
}

/**
 * A sorted copy. "soonest" orders by start time. "nearest" puts the closest in-person events first
 * and online or unplaced ones after them, each group still soonest first.
 */
export function sortEvents(
  events: CivicEvent[],
  sort: EventSort,
  center: Coords | null,
): CivicEvent[] {
  const byTime = (a: CivicEvent, b: CivicEvent) => a.startsAt.localeCompare(b.startsAt);
  if (sort === "soonest" || !center) return [...events].sort(byTime);
  return [...events].sort((a, b) => {
    const da = eventDistance(a, center);
    const db = eventDistance(b, center);
    if (da === null && db === null) return byTime(a, b);
    if (da === null) return 1;
    if (db === null) return -1;
    return da - db || byTime(a, b);
  });
}
