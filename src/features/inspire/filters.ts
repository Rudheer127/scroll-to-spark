import { EFFORTS, isEffort, type Effort } from "@/features/steps/constants";

export const SORTS = ["newest", "inspiring"] as const;
export type InspireSort = (typeof SORTS)[number];
export const SORT_LABELS: Record<InspireSort, string> = {
  newest: "Newest",
  inspiring: "Most inspiring",
};

export const TABS = ["all", "saved"] as const;
export type InspireTab = (typeof TABS)[number];

/** "Up to N minutes" choices. */
export const MINUTES_OPTIONS = [5, 15, 30, 60] as const;

export const PAGE_SIZE = 12;

export type FeedFilters = {
  q: string;
  effort: Effort | null;
  group: string | null;
  minutes: number | null;
  thanks: boolean;
  sort: InspireSort;
  tab: InspireTab;
};

export const DEFAULT_FILTERS: FeedFilters = {
  q: "",
  effort: null,
  group: null,
  minutes: null,
  thanks: false,
  sort: "newest",
  tab: "all",
};

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Reads the page's URL into filters. Anything unknown falls back to the default. */
export function parseFilters(params: RawParams): FeedFilters {
  const effort = first(params.effort);
  const minutes = Number(first(params.minutes));
  const sort = first(params.sort);
  const group = first(params.group);
  return {
    q: (first(params.q) ?? "").replace(/\s+/g, " ").trim().slice(0, 80),
    effort: isEffort(effort) ? effort : null,
    group: group && /^[a-z0-9-]{1,80}$/.test(group) ? group : null,
    minutes: (MINUTES_OPTIONS as readonly number[]).includes(minutes) ? minutes : null,
    thanks: first(params.thanks) === "1",
    sort: (SORTS as readonly string[]).includes(sort ?? "") ? (sort as InspireSort) : "newest",
    tab: first(params.tab) === "saved" ? "saved" : "all",
  };
}

/** The URL's query string for some filters. Defaults are left out so the plain page has a plain URL. */
export function filtersToParams(filters: FeedFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.effort) params.set("effort", filters.effort);
  if (filters.group) params.set("group", filters.group);
  if (filters.minutes) params.set("minutes", String(filters.minutes));
  if (filters.thanks) params.set("thanks", "1");
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.tab === "saved") params.set("tab", "saved");
  return params;
}

/** True when something other than the tab narrows the feed. */
export function hasActiveFilters(filters: FeedFilters): boolean {
  return Boolean(
    filters.q ||
    filters.effort ||
    filters.group ||
    filters.minutes ||
    filters.thanks ||
    filters.sort !== "newest",
  );
}

/**
 * Turns what someone typed into a Postgres prefix query: "vote reg" becomes "vote:* & reg:*".
 * Only letters and numbers survive, so nothing typed can change the query's meaning.
 */
export function toTsQuery(text: string): string | null {
  const words = (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).slice(0, 6);
  return words.length > 0 ? words.map((word) => `${word}:*`).join(" & ") : null;
}

export type Cursor = { created: string; id: string; inspired?: number };

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeCursor(value: string | null | undefined): Cursor | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Cursor;
    const ok =
      typeof parsed.created === "string" &&
      !Number.isNaN(Date.parse(parsed.created)) &&
      typeof parsed.id === "string" &&
      /^[0-9a-f-]{36}$/.test(parsed.id) &&
      (parsed.inspired === undefined || Number.isInteger(parsed.inspired));
    return ok ? parsed : null;
  } catch {
    return null;
  }
}

/** PostgREST `or` expression that continues a keyset-ordered list after the cursor. */
export function cursorFilter(cursor: Cursor, sort: InspireSort): string {
  const t = `"${cursor.created}"`;
  if (sort === "inspiring" && cursor.inspired !== undefined) {
    const n = cursor.inspired;
    return `inspired_count.lt.${n},and(inspired_count.eq.${n},created_at.lt.${t}),and(inspired_count.eq.${n},created_at.eq.${t},id.lt.${cursor.id})`;
  }
  return `created_at.lt.${t},and(created_at.eq.${t},id.lt.${cursor.id})`;
}

export { EFFORTS };
