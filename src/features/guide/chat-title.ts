/** Longest title, counted in Unicode code points like Postgres char_length. */
export const MAX_TITLE_CHARS = 60;
export const FALLBACK_TITLE = "New chat";
/** Used when the first message is only an image. */
export const IMAGE_ONLY_TITLE = "Shared an image";

const ELLIPSIS = "…";
// Control and format characters (including zero width ones) never belong in a title.
const INVISIBLE = /[\p{Cc}\p{Cf}]/gu;
// Trailing commas, colons, dashes, open brackets and quotes look broken at the end of a title.
const TRAILING_CLUTTER = /[\s,;:.\-([{"'`]+$/u;

const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

function codePoints(text: string): number {
  return Array.from(text).length;
}

/** Cuts to at most `limit` code points without splitting an emoji or other grapheme. */
function cutGraphemes(text: string, limit: number): string {
  let out = "";
  let used = 0;
  for (const { segment } of segmenter.segment(text)) {
    const size = codePoints(segment);
    if (used + size > limit) break;
    out += segment;
    used += size;
  }
  return out;
}

function tidyEnd(text: string): string {
  return text.replace(TRAILING_CLUTTER, "");
}

/**
 * The chat title, built from the first message with no model call: invisible characters removed,
 * whitespace collapsed, and cut at a word boundary to at most 60 characters.
 */
export function buildChatTitle(firstMessage: string): string {
  const clean = firstMessage.replace(INVISIBLE, " ").replace(/\s+/g, " ").trim();
  if (codePoints(clean) <= MAX_TITLE_CHARS) return tidyEnd(clean) || FALLBACK_TITLE;

  const cut = cutGraphemes(clean, MAX_TITLE_CHARS - 1);
  const lastSpace = cut.lastIndexOf(" ");
  // Keep whole words unless that would throw away most of the title.
  const words = lastSpace >= MAX_TITLE_CHARS / 2 ? cut.slice(0, lastSpace) : cut;
  const body = tidyEnd(words);
  return body ? `${body}${ELLIPSIS}` : FALLBACK_TITLE;
}

/** The title for a new chat, from the person's own words, or a plain note for an image. */
export function chatTitleFor(ownText: string, hasImage: boolean): string {
  if (ownText.trim().length === 0 && hasImage) return IMAGE_ONLY_TITLE;
  return buildChatTitle(ownText);
}
