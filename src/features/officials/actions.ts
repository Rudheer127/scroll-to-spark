"use server";

import { fail, type ActionResult } from "@/lib/result";
import { createClient } from "@/lib/supabase/server";
import { loose } from "@/features/threads/loose-db";
import { lookupZip, zipFromCoords } from "@/features/events/location";
import {
  districtFromCoords,
  findFederalByBioguide,
  getFederalForState,
  getFundingWithFallback,
  getStateLegislators,
  hasOpenStatesKey,
  usesDemoFecKey,
} from "@/features/officials/source";
import { LOOKUPS_KEEP } from "@/features/officials/queries";
import { bioguideSchema, lookupSchema, zipSchema } from "@/features/officials/schemas";
import type {
  FundingSummary,
  LookupResult,
  Official,
  RecentLookup,
  StateStatus,
} from "@/features/officials/types";

const UNIQUE_VIOLATION = "23505";
const SIGN_IN = "Please sign in to do that.";

async function currentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

/**
 * Finds who represents a typed ZIP, or a browser location that is turned into a ZIP here and then
 * forgotten. A typed ZIP can span districts, so the House member is "choose" mode there; a browser
 * location is exact. The ZIP (never the location) is saved to the person's history.
 */
export async function lookupOfficials(input: unknown): Promise<ActionResult<LookupResult>> {
  const { userId } = await currentUserId();
  if (!userId) return fail(SIGN_IN);

  const parsed = lookupSchema.safeParse(input);
  if (!parsed.success)
    return fail("Enter a five-digit ZIP code.", { zip: "Enter a five-digit ZIP code." });

  const exactPoint = "lat" in parsed.data ? { lat: parsed.data.lat, lng: parsed.data.lng } : null;
  let zip: string | null;
  if (exactPoint) {
    zip = await zipFromCoords(exactPoint.lat, exactPoint.lng);
    if (!zip)
      return fail("We could not turn your location into a ZIP code. Type your ZIP instead.");
  } else {
    zip = (parsed.data as { zip: string }).zip;
  }

  const place = await lookupZip(zip);
  if (!place) return fail("We could not find that ZIP code. Check it and try again.");

  const point = exactPoint ?? { lat: place.lat, lng: place.lng };
  const district = await districtFromCoords(point.lat, point.lng);

  let federal;
  try {
    federal = await getFederalForState(
      place.region,
      exactPoint && district !== null ? district : null,
    );
  } catch {
    return fail(
      "We could not reach the list of members of Congress right now. Try again in a few minutes.",
    );
  }
  if (federal.officials.length === 0) {
    return fail("We found no members of Congress for that ZIP code.");
  }

  let stateOfficials: Official[] = [];
  let stateStatus: StateStatus = "ok";
  if (!hasOpenStatesKey()) {
    stateStatus = "missing-key";
  } else {
    try {
      stateOfficials = await getStateLegislators(point.lat, point.lng, place.region, !exactPoint);
    } catch {
      stateStatus = "down";
    }
  }

  const exact = exactPoint !== null && district !== null;
  const data: LookupResult = {
    location: { zip: place.zip, city: place.city, state: place.region },
    officials: [...federal.officials, ...stateOfficials],
    houseMode: exact || federal.districtCount <= 1 ? "exact" : "choose",
    districtCount: federal.districtCount,
    likelyDistrict: district,
    stateStatus,
    stateApproximate: !exactPoint,
  };

  await saveLookup(data.location);
  return { ok: true, data };
}

/** Remembers a lookup so it shows up as a chip next time, and keeps only the newest few. */
export async function saveLookup(
  location: RecentLookup,
): Promise<ActionResult<{ lookups: RecentLookup[] }>> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return fail(SIGN_IN);
  const zip = zipSchema.safeParse(location.zip);
  if (!zip.success) return fail("That ZIP code cannot be saved.");

  const db = loose(supabase);
  const { error } = await db.from("officials_lookups").insert({
    user_id: userId,
    zip: zip.data,
    city: location.city.slice(0, 100),
    state: location.state,
  });
  if (error) {
    if (error.code !== UNIQUE_VIOLATION) return fail("We could not save that lookup.");
    await db
      .from("officials_lookups")
      .update({ created_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("zip", zip.data);
  }

  const { data } = await db
    .from("officials_lookups")
    .select("zip, city, state")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as RecentLookup[];
  const extra = rows.slice(LOOKUPS_KEEP).map((row) => row.zip);
  if (extra.length > 0) {
    await db.from("officials_lookups").delete().eq("user_id", userId).in("zip", extra);
  }
  return { ok: true, data: { lookups: rows.slice(0, LOOKUPS_KEEP) } };
}

/** Forgets one remembered ZIP. Safe to repeat. */
export async function removeLookup(zip: unknown): Promise<ActionResult> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return fail(SIGN_IN);
  const parsed = zipSchema.safeParse(zip);
  if (!parsed.success) return fail("That ZIP code cannot be changed.");
  const { error } = await loose(supabase)
    .from("officials_lookups")
    .delete()
    .eq("user_id", userId)
    .eq("zip", parsed.data);
  if (error) return fail("We could not forget that. Try again.");
  return { ok: true, data: undefined };
}

/** Forgets every remembered ZIP. Safe to repeat. */
export async function clearLookupHistory(): Promise<ActionResult> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return fail(SIGN_IN);
  const { error } = await loose(supabase).from("officials_lookups").delete().eq("user_id", userId);
  if (error) return fail("We could not clear your history. Try again.");
  return { ok: true, data: undefined };
}

/** Campaign money for a member of Congress, looked up by Bioguide id so no free-form id reaches OpenFEC. */
export type FundingAnswer = {
  funding: FundingSummary | null;
  /** The FEC did not answer. `funding` may be an older answer when `stale` is true. */
  unavailable?: true;
  stale?: true;
  /** No real FEC key is configured, so the shared demo allowance is what ran out. */
  needsKey?: true;
};

export async function getFunding(bioguide: unknown): Promise<ActionResult<FundingAnswer>> {
  const { userId } = await currentUserId();
  if (!userId) return fail(SIGN_IN);
  const parsed = bioguideSchema.safeParse(bioguide);
  if (!parsed.success) return fail("We cannot look up funding for that person.");

  const official = await findFederalByBioguide(parsed.data).catch(() => null);
  if (!official?.fecId) return { ok: true, data: { funding: null } };
  const outcome = await getFundingWithFallback(official.fecId, official.name);
  if (!outcome.unavailable) return { ok: true, data: { funding: outcome.funding } };
  return {
    ok: true,
    data: {
      funding: outcome.funding,
      unavailable: true,
      ...(outcome.stale ? { stale: true as const } : {}),
      ...(usesDemoFecKey() ? { needsKey: true as const } : {}),
    },
  };
}
