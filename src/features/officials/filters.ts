import type { Level, Official } from "@/features/officials/types";

export type OfficialFilters = {
  /** null means every level. */
  level: Level | null;
  query: string;
  /** In "choose" mode: the House district the person picked, or null to show them all. */
  district: number | null;
};

/** Narrows a lookup by level, a name/office search and (optionally) one House district. */
export function filterOfficials(
  officials: Official[],
  { level, query, district }: OfficialFilters,
): Official[] {
  const needle = query.trim().toLowerCase();
  return officials.filter((o) => {
    if (level && o.level !== level) return false;
    if (district !== null && o.level === "federal" && !o.isSenator && o.district !== district)
      return false;
    if (!needle) return true;
    return `${o.name} ${o.office} ${o.party} ${o.state}`.toLowerCase().includes(needle);
  });
}

export function levelsPresent(officials: Official[]): Level[] {
  return (["federal", "state", "local"] as const).filter((l) =>
    officials.some((o) => o.level === l),
  );
}

/**
 * "Term ends Jan 3, 2031" while the term is still running, "Term ended Jan 3, 2027" once it is
 * over, or null when the source has no date. Elections move terms on, so the wording follows `now`.
 */
export function termEndLabel(termEnd: string | null, now: Date = new Date()): string | null {
  if (!termEnd) return null;
  const date = new Date(`${termEnd}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  const text = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  // The term runs through its end date.
  return date.getTime() + 86_400_000 > now.getTime() ? `Term ends ${text}` : `Term ended ${text}`;
}

/**
 * The order people read them in: senators, then the House member for the likely district, then the
 * other House members by district number, then state legislators (senate before house, by name).
 */
export function orderOfficials(officials: Official[], likelyDistrict: number | null): Official[] {
  const rank = (o: Official): number => {
    if (o.level === "federal" && o.isSenator) return 0;
    if (o.level === "federal")
      return likelyDistrict !== null && o.district === likelyDistrict ? 1 : 2;
    if (o.level === "state") return o.isSenator ? 3 : 4;
    return 5;
  };
  const num = (o: Official) =>
    typeof o.district === "number" ? o.district : Number.MAX_SAFE_INTEGER;
  return [...officials].sort(
    (a, b) => rank(a) - rank(b) || num(a) - num(b) || a.name.localeCompare(b.name),
  );
}

/**
 * Hides House members outside the likely district behind a button. Returns what to show and how
 * many other districts are folded away. Nothing is hidden when the likely district is unknown,
 * when the person asked to see all of them, or when it is not a "choose" lookup.
 */
export function collapseHouse(
  officials: Official[],
  { likelyDistrict, collapse }: { likelyDistrict: number | null; collapse: boolean },
): { shown: Official[]; hidden: number } {
  if (!collapse || likelyDistrict === null) return { shown: officials, hidden: 0 };
  const isOther = (o: Official) =>
    o.level === "federal" && !o.isSenator && o.district !== likelyDistrict;
  const hidden = officials.filter(isOther).length;
  return hidden === 0
    ? { shown: officials, hidden: 0 }
    : { shown: officials.filter((o) => !isOther(o)), hidden };
}

export function districtLabel(o: Official): string | null {
  if (o.district === null) return o.level === "federal" ? o.state : null;
  if (o.district === 0) return `${o.state} at large`;
  return `${o.state}-${o.district}`;
}

export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "Not reported";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: Math.abs(value) >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(value) >= 1_000_000 ? 1 : 0,
  }).format(value);
}
