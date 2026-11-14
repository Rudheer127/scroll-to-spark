import type { ProviderName } from "./llm/types";

/** Model IDs per provider and tier. Run scripts/check-models.mjs with keys set to confirm they exist. */
export const MODELS: Record<ProviderName, { main: string; router: string }> = {
  cerebras: { main: "gpt-oss-120b", router: "gpt-oss-120b" },
  groq: { main: "openai/gpt-oss-120b", router: "openai/gpt-oss-20b" },
};

export const PROVIDER_URLS: Record<ProviderName, string> = {
  cerebras: "https://api.cerebras.ai/v1/chat/completions",
  groq: "https://api.groq.com/openai/v1/chat/completions",
};

/** Longest user message the guide accepts, in characters, after sanitizing. */
export const MAX_INPUT_CHARS = 1000;

/** Longest message the guide may send back, in characters. */
export const MAX_MESSAGE_CHARS = 600;

/** Most cards a single guide response may carry. */
export const MAX_CARDS = 5;

/** Shown next to every AI answer. The app never speaks as a real person or group. */
export const AI_LABEL = "From the app (AI)";

/** Every intent the router and the guide can produce. */
export const INTENTS = [
  "find_opportunity",
  "recognize_contribution",
  "my_engagement",
  "fact_check",
  "chitchat",
  "out_of_scope",
] as const;

/** Phrases that must never appear in model output (matched case-insensitively). */
export const BANNED_PHRASES = [
  "streak",
  "points",
  "leaderboard",
  "you must",
  "don't let people down",
  "you should feel guilty",
  "you owe",
  "last chance",
  "hurry",
] as const;

/** Most user messages one person may send to the guide per minute and per day. */
export const RATE_PER_MINUTE = 6;
export const RATE_PER_DAY = 60;

/**
 * Where a person can look for a primary source on their own. Homepages only. Exact report links
 * must be re-checked by a person before they are cited. Messages may name these, never link them.
 */
export const KNOWN_PRIMARY_SOURCES: { name: string; url: string }[] = [
  { name: "U.S. Census Bureau", url: "https://www.census.gov" },
  { name: "AmeriCorps", url: "https://americorps.gov" },
  { name: "Gallup", url: "https://www.gallup.com" },
  { name: "Pew Research Center", url: "https://www.pewresearch.org" },
];
