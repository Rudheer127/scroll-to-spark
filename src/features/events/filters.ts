import type { Coords, CivicEvent } from "@/features/events/types";

export const EVENT_MODES = ["all", "near", "online", "inperson"] as const;
export type EventMode = (typeof EVENT_MODES)[number];

export const RADIUS_OPTIONS = [10, 25, 50] as const;

export type EventFilters = {
  mode: EventMode;
  query: string;
  /** Centre of the chosen ZIP code. Null until the person shares a place. */
  center: Coords | null;
  radiusMiles: number;
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

/**
 * Applies the mode, the search words and the distance limit.
 * "near" needs a centre: with none it returns nothing, and the page asks for a place instead.
 * Online events never count as near, because they have no place.
 */
export function filterEvents(events: CivicEvent[], filters: EventFilters): CivicEvent[] {
  return events.filter((event) => {
    if (!matchesQuery(event, filters.query)) return false;
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
