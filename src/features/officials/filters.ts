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

/** "Term ends Jan 3, 2031", or null when the source has no date. */
export function termEndLabel(termEnd: string | null): string | null {
  if (!termEnd) return null;
  const date = new Date(`${termEnd}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return `Term ends ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}`;
}

export function districtLabel(o: Official): string | null {
  if (o.district === null) return o.level === "federal" ? o.state : null;
  if (o.district === 0) return `${o.state} at large`;
  return `${o.state}-${o.district}`;
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: Math.abs(value) >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(value) >= 1_000_000 ? 1 : 0,
  }).format(value);
}
