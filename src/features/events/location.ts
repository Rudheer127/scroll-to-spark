import { cacheLife } from "next/cache";
import { z } from "zod";
import type { EventLocation } from "@/features/events/types";

const TIMEOUT_MS = 6000;

const zipSchema = z.object({
  "post code": z.string(),
  places: z
    .array(
      z.object({
        "place name": z.string(),
        "state abbreviation": z.string(),
        latitude: z.string(),
        longitude: z.string(),
      }),
    )
    .min(1),
});

/**
 * Looks up a ZIP code's city and centre point with zippopotam.us (free, no key). Only the ZIP is
 * sent. Returns null for an unknown ZIP or when the lookup is down.
 */
export async function lookupZip(zip: string): Promise<EventLocation | null> {
  "use cache";
  cacheLife("days");
  try {
    const response = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const parsed = zipSchema.safeParse(await response.json());
    if (!parsed.success) return null;
    const place = parsed.data.places[0];
    const lat = Number(place.latitude);
    const lng = Number(place.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return {
      zip: parsed.data["post code"],
      city: place["place name"],
      region: place["state abbreviation"],
      lat,
      lng,
    };
  } catch {
    return null;
  }
}

const censusSchema = z.object({
  result: z.object({
    geographies: z.record(z.string(), z.array(z.object({ ZCTA5: z.string().optional() }))),
  }),
});

/** Coordinates are rounded to two decimals (about a kilometre) before they leave the server. */
export function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Turns a rounded browser location into a ZIP code with the US Census geocoder. This call is never
 * cached, never logged by this app, and the coordinates are dropped as soon as it returns.
 */
export async function zipFromCoords(lat: number, lng: number): Promise<string | null> {
  const url = new URL("https://geocoding.geo.census.gov/geocoder/geographies/coordinates");
  url.search = new URLSearchParams({
    x: String(roundCoord(lng)),
    y: String(roundCoord(lat)),
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    layers: "2020 Census ZIP Code Tabulation Areas",
    format: "json",
  }).toString();
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const parsed = censusSchema.safeParse(await response.json());
    if (!parsed.success) return null;
    for (const layer of Object.values(parsed.data.result.geographies)) {
      const zip = layer[0]?.ZCTA5;
      if (zip && /^\d{5}$/.test(zip)) return zip;
    }
    return null;
  } catch {
    return null;
  }
}
