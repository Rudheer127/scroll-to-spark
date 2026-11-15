export const GIF_RESULT_LIMIT = 12;
export const GIF_QUERY_MAX = 50;
export const GIF_RATE_LIMIT = { max: 30, windowMs: 60_000 } as const;

export type GifResult = { id: string; title: string; previewUrl: string; url: string };

const GIPHY_API = "https://api.giphy.com/v1/gifs";

/** Only Giphy's own media hosts are accepted, for results and for what a comment stores. */
export function isGiphyMediaUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 500) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /^(media\d*|i)\.giphy\.com$/.test(url.hostname);
  } catch {
    return false;
  }
}

/** Trims the search and caps its length. Empty means show what is trending. */
export function cleanGifQuery(raw: string | null): string {
  return (raw ?? "").replace(/\s+/g, " ").trim().slice(0, GIF_QUERY_MAX);
}

export function buildGiphyUrl(query: string, apiKey: string): string {
  const params = new URLSearchParams({
    api_key: apiKey,
    limit: String(GIF_RESULT_LIMIT),
    rating: "g",
    bundle: "messaging_non_clips",
  });
  if (query) params.set("q", query);
  return `${GIPHY_API}/${query ? "search" : "trending"}?${params}`;
}

type Rendition = { url?: unknown };
type RawGif = { id?: unknown; title?: unknown; images?: Record<string, Rendition | undefined> };

/** Keeps only the four fields the page needs, drops anything malformed, and caps the list. */
export function shapeGiphyResponse(json: unknown): GifResult[] {
  const data = (json as { data?: unknown } | null)?.data;
  if (!Array.isArray(data)) return [];
  const results: GifResult[] = [];
  for (const item of data as RawGif[]) {
    const url = item?.images?.downsized?.url ?? item?.images?.fixed_height?.url;
    const previewUrl = item?.images?.fixed_width_small?.url ?? item?.images?.fixed_width?.url;
    if (typeof item?.id !== "string" || !isGiphyMediaUrl(url) || !isGiphyMediaUrl(previewUrl)) {
      continue;
    }
    const title = typeof item.title === "string" ? item.title.trim().slice(0, 200) : "";
    results.push({ id: item.id, title, previewUrl, url });
    if (results.length === GIF_RESULT_LIMIT) break;
  }
  return results;
}

/** A starting description for the alt text, which the person can edit. */
export function altFromTitle(title: string): string {
  const cleaned = title.replace(/\s*GIF(\s+by\s+.*)?$/i, "").trim();
  return cleaned || "";
}

/** A small in-memory limiter: at most `max` calls per user per window. */
export function createRateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return function allow(key: string, now = Date.now()): boolean {
    const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    return true;
  };
}
