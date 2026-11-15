import { cacheLife, cacheTag } from "next/cache";
import { normalizeMobilizeEvents } from "@/features/events/normalize";
import { sampleEvents } from "@/features/events/samples";
import type { CivicEvent, EventFeed } from "@/features/events/types";

/**
 * Mobilize (mobilize.us) publishes its public events through a documented, key-free API that is
 * meant for listing events elsewhere, so this app uses it as its live source. It hosts many kinds
 * of organizers, including political and advocacy groups, and the app does not endorse any of them.
 * Other sources were checked on 2026-11-15 and left out: VolunteerMatch, Idealist and Meetup need
 * keys or paid access, Eventbrite closed its public search, and AmeriCorps has no events feed.
 */
const MOBILIZE_URL = "https://api.mobilize.us/v1/events";
const NEARBY_MAX_MILES = 50;
const TIMEOUT_MS = 8000;

async function fetchMobilizeRows(params: Record<string, string>): Promise<unknown[]> {
  const url = new URL(MOBILIZE_URL);
  url.search = new URLSearchParams({ timeslot_start: "gte_now", ...params }).toString();
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "ScrollToSpark/1.0" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Mobilize answered ${response.status}`);
  const body: unknown = await response.json();
  const data = (body as { data?: unknown }).data;
  if (!Array.isArray(data)) throw new Error("Mobilize sent an unexpected answer");
  return data;
}

/**
 * The cached fetch. It is keyed by ZIP only (or null for no place), holds no personal data, and is
 * reused for ten minutes. A failure throws, and a thrown call is never cached, so one bad moment
 * at the source does not stick.
 */
async function loadMobilizeEvents(zip: string | null): Promise<CivicEvent[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 600, expire: 3600 });
  cacheTag("events");

  const requests = [fetchMobilizeRows({ is_virtual: "true", per_page: "60" })];
  if (zip) {
    requests.push(
      fetchMobilizeRows({ zipcode: zip, max_dist: String(NEARBY_MAX_MILES), per_page: "100" }),
    );
  }
  const results = await Promise.all(requests);
  return normalizeMobilizeEvents(results.flat());
}

/**
 * Live events for a ZIP code (or online ones only, with no ZIP). If the source cannot be reached,
 * returns clearly marked sample events instead. An empty live answer stays "live" with no events.
 */
export async function getEvents(zip: string | null): Promise<EventFeed> {
  try {
    return { kind: "live", events: await loadMobilizeEvents(zip) };
  } catch {
    return { kind: "sample", events: sampleEvents() };
  }
}
