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
