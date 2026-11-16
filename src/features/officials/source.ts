import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { getOfficialsEnv } from "@/lib/env";
import {
  normalizeFederal,
  normalizeFunding,
  normalizeOpenStates,
} from "@/features/officials/normalize";
import type { FundingSummary, Official } from "@/features/officials/types";

const TIMEOUT_MS = 8000;
const CONGRESS_BASE = "https://unitedstates.github.io/congress-legislators";
const FEC_BASE = "https://api.open.fec.gov/v1";
const OPEN_STATES_BASE = "https://v3.openstates.org";

async function getJson(url: string | URL, headers?: Record<string, string>): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "ScrollToSpark/1.0", ...headers },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Source answered ${response.status}`);
  return response.json();
}

/**
 * Every sitting member of Congress, from the open unitedstates/congress-legislators data, with
 * their social accounts joined in. Public data, so it is cached for a day. A failure throws, and a
 * thrown call is never cached.
 */
async function loadFederal(): Promise<Official[]> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 86_400, expire: 172_800 });
  cacheTag("officials-federal");
  const [current, social] = await Promise.all([
    getJson(`${CONGRESS_BASE}/legislators-current.json`),
    getJson(`${CONGRESS_BASE}/legislators-social-media.json`).catch(() => []),
  ]);
  const officials = normalizeFederal(current, social);
  if (officials.length < 400) throw new Error("Congress data looked incomplete");
  return officials;
}

export type FederalForPlace = { officials: Official[]; districtCount: number };

/** The two senators for a state, plus either one House member (a known district) or all of them. */
export async function getFederalForState(
  state: string,
  district: number | null,
): Promise<FederalForPlace> {
  const all = (await loadFederal()).filter((o) => o.state === state);
  const house = all.filter((o) => !o.isSenator);
  const districtCount = house.length;
  const senators = all.filter((o) => o.isSenator);
  const reps = district === null ? house : house.filter((o) => o.district === district);
  return {
    officials: [...senators, ...reps].sort(
      (a, b) => Number(b.isSenator) - Number(a.isSenator) || a.name.localeCompare(b.name),
    ),
    districtCount,
  };
}

export async function findFederalByBioguide(bioguide: string): Promise<Official | null> {
  return (await loadFederal()).find((o) => o.bioguide === bioguide) ?? null;
}

const censusSchema = z.object({
  result: z.object({
    geographies: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
  }),
});

/**
 * The congressional district at a point, from the US Census geocoder. Never cached or logged, and
 * the coordinates are dropped as soon as it returns. 0 means a single at-large seat.
 */
export async function districtFromCoords(lat: number, lng: number): Promise<number | null> {
  const url = new URL("https://geocoding.geo.census.gov/geocoder/geographies/coordinates");
  url.search = new URLSearchParams({
    x: String(Math.round(lng * 100) / 100),
    y: String(Math.round(lat * 100) / 100),
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    layers: "all",
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
    for (const [layer, rows] of Object.entries(parsed.data.result.geographies)) {
      if (!/Congressional Districts/i.test(layer)) continue;
      const row = rows[0];
      const code = Object.entries(row ?? {}).find(([key]) => /^CD\d+$/.test(key))?.[1];
      if (typeof code === "string" && /^\d{1,2}$/.test(code)) {
        const n = Number(code);
        return n === 98 ? 0 : n; // 98 is a non-voting delegate district
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function hasOpenStatesKey(): boolean {
  return getOfficialsEnv().OPEN_STATES_API_KEY !== undefined;
}

async function fetchStateLegislators(lat: number, lng: number, state: string): Promise<Official[]> {
  const key = getOfficialsEnv().OPEN_STATES_API_KEY;
  if (!key) return [];
  const url = new URL(`${OPEN_STATES_BASE}/people.geo`);
  url.search = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    include: "offices",
  }).toString();
  // The key goes in a header, never in the URL, so it cannot end up in a log line.
  return normalizeOpenStates(await getJson(url, { "X-API-KEY": key }), state);
}

/** Cached by the ZIP's public centre point (never a person's location). Used for typed ZIPs only. */
async function loadStateLegislatorsForZip(
  lat: number,
  lng: number,
  state: string,
): Promise<Official[]> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 86_400, expire: 172_800 });
  cacheTag("officials-state");
  return fetchStateLegislators(lat, lng, state);
}

/** State legislators at a point. `cacheable` is true only for a ZIP's centre, never a person's spot. */
export async function getStateLegislators(
  lat: number,
  lng: number,
  state: string,
  cacheable: boolean,
): Promise<Official[]> {
  return cacheable
    ? loadStateLegislatorsForZip(Math.round(lat * 100) / 100, Math.round(lng * 100) / 100, state)
    : fetchStateLegislators(lat, lng, state);
}

/** True when no real FEC key is set, so funding runs on FEC's tiny shared DEMO_KEY allowance. */
export function usesDemoFecKey(): boolean {
  return getOfficialsEnv().FEC_API_KEY === undefined;
}

function fecKey(): string {
  return getOfficialsEnv().FEC_API_KEY ?? "DEMO_KEY";
}

async function fecGet(path: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(`${FEC_BASE}${path}`);
  url.search = new URLSearchParams(params).toString();
  // Header, not query string, so the key is never part of a logged URL.
  return getJson(url, { "X-Api-Key": fecKey() });
}

/**
 * Campaign totals for one federal candidate from OpenFEC, for the latest cycle with data. Public
 * data, cached a day because DEMO_KEY allows only a handful of calls an hour. Throws on failure.
 */
export async function loadFunding(fecId: string, name: string): Promise<FundingSummary | null> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 86_400, expire: 172_800 });
  cacheTag("officials-funding");
  const totals = await fecGet(`/candidate/${encodeURIComponent(fecId)}/totals/`, {
    sort: "-cycle",
    per_page: "1",
    election_full: "false",
  });
  const cycle = (totals as { results?: { cycle?: number }[] }).results?.[0]?.cycle;
  let employers: unknown = null;
  try {
    const committees = (await fecGet(`/candidate/${encodeURIComponent(fecId)}/committees/`, {
      designation: "P",
    })) as { results?: { committee_id?: string }[] };
    const committeeId = committees.results?.[0]?.committee_id;
    if (committeeId && cycle) {
      employers = await fecGet("/schedules/schedule_a/by_employer/", {
        committee_id: committeeId,
        cycle: String(cycle),
        sort: "-total",
        per_page: "12",
      });
    }
  } catch {
    // Employer detail is a bonus. The totals are still worth showing without it.
  }
  return normalizeFunding(fecId, name, totals, employers);
}

// The newest good answer per candidate, kept in this server's memory. If the FEC stops answering
// (or the shared demo key runs out) a person still sees the last figures we got, marked as such.
const lastGoodFunding = new Map<string, FundingSummary | null>();

export type FundingOutcome = {
  funding: FundingSummary | null;
  /** The FEC did not answer this time. `funding` may then be an older answer. */
  unavailable: boolean;
  /** `funding` is an older answer kept from an earlier success. */
  stale: boolean;
};

/** Like `loadFunding`, but a failure becomes an outcome instead of a throw. */
export async function getFundingWithFallback(fecId: string, name: string): Promise<FundingOutcome> {
  try {
    const funding = await loadFunding(fecId, name);
    lastGoodFunding.set(fecId, funding);
    return { funding, unavailable: false, stale: false };
  } catch {
    const kept = lastGoodFunding.get(fecId) ?? null;
    return { funding: kept, unavailable: true, stale: kept !== null };
  }
}
