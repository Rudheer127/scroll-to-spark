import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  /**
   * Google Maps Embed API key for the map preview on Events. Optional: without it the preview uses
   * Google's keyless embed. The key ships to the browser by design, so restrict it in Google Cloud
   * to the Maps Embed API and to this site's address.
   */
  NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().min(1).optional(),
  ),
});

const blankToUndefined = (v: unknown) => (v === "" ? undefined : v);
const optionalText = z.preprocess(blankToUndefined, z.string().min(1).optional());
const provider = z.enum(["openrouter", "cerebras", "groq"]);

/**
 * OpenRouter model defaults: free models, checked against OpenRouter's public model list on
 * 2026-11-14. Each one supports structured outputs; the main one also reads images. Free models
 * are rate limited and their providers may log prompts. Paid ids such as
 * anthropic/claude-sonnet-5.5 can be set through the env names below instead.
 */
export const OPENROUTER_DEFAULTS = {
  main: "nvidia/nemotron-3.5-super-vl:free",
  fast: "inclusionai/ling-3.2-flash:free",
  fallback: "openrouter/free",
  vision: "nvidia/nemotron-3.5-super-vl:free",
} as const;
const modelId = (fallback: string) =>
  z.preprocess(blankToUndefined, z.string().min(1).default(fallback));

/** The guide's AI settings. Parsed on their own so a missing database key never hides them. */
const llmShape = {
  // Unset means openrouter when an OpenRouter key exists, otherwise cerebras.
  LLM_PROVIDER: z.preprocess(blankToUndefined, provider.optional()),
  OPENROUTER_API_KEY: optionalText,
  OPENROUTER_MODEL_MAIN: modelId(OPENROUTER_DEFAULTS.main),
  OPENROUTER_MODEL_FAST: modelId(OPENROUTER_DEFAULTS.fast),
  OPENROUTER_MODEL_FALLBACK: modelId(OPENROUTER_DEFAULTS.fallback),
  CEREBRAS_API_KEY: optionalText,
  GROQ_API_KEY: optionalText,
  // Image reading. On OpenRouter it defaults to a free vision model; elsewhere it is off unless set.
  GUIDE_VISION_MODEL: optionalText,
  GUIDE_VISION_PROVIDER: z.preprocess(blankToUndefined, provider.optional()),
};

type KeyFields = { OPENROUTER_API_KEY?: string; CEREBRAS_API_KEY?: string; GROQ_API_KEY?: string };
const hasAnyKey = (env: KeyFields) =>
  env.OPENROUTER_API_KEY !== undefined ||
  env.CEREBRAS_API_KEY !== undefined ||
  env.GROQ_API_KEY !== undefined;
const KEY_RULE = {
  message: "Set OPENROUTER_API_KEY, CEREBRAS_API_KEY or GROQ_API_KEY",
  path: ["OPENROUTER_API_KEY"],
};

const llmSchema = z.object(llmShape).refine(hasAnyKey, KEY_RULE);

const serverSchema = publicSchema
  .extend({
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    ...llmShape,
    GIF_API_KEY: z.string().min(1).optional(),
    OPEN_STATES_API_KEY: optionalText,
    FEC_API_KEY: optionalText,
  })
  .refine(hasAnyKey, KEY_RULE);

/**
 * Variables that are safe to expose to the browser.
 * Each one is named in full so the bundler can inline it.
 */
export function getPublicEnv() {
  return publicSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY,
  });
}

function llmValues() {
  return {
    LLM_PROVIDER: process.env.LLM_PROVIDER,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_MODEL_MAIN: process.env.OPENROUTER_MODEL_MAIN,
    OPENROUTER_MODEL_FAST: process.env.OPENROUTER_MODEL_FAST,
    OPENROUTER_MODEL_FALLBACK: process.env.OPENROUTER_MODEL_FALLBACK,
    CEREBRAS_API_KEY: process.env.CEREBRAS_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GUIDE_VISION_MODEL: process.env.GUIDE_VISION_MODEL,
    GUIDE_VISION_PROVIDER: process.env.GUIDE_VISION_PROVIDER,
  };
}

export type ServerEnv = z.infer<typeof serverSchema>;
export type LlmServerEnv = z.infer<typeof llmSchema>;

/** All variables. Call this only in server code. This is the only file that reads process.env. */
export function getServerEnv(): ServerEnv {
  return serverSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ...llmValues(),
    GIF_API_KEY: process.env.GIF_API_KEY,
    OPEN_STATES_API_KEY: process.env.OPEN_STATES_API_KEY,
    FEC_API_KEY: process.env.FEC_API_KEY,
  });
}

/**
 * Keys for "Your officials". Both are optional: without OPEN_STATES_API_KEY the state legislators
 * section is hidden, and without FEC_API_KEY funding uses FEC's rate-limited DEMO_KEY. Server code only.
 */
export function getOfficialsEnv() {
  return z.object({ OPEN_STATES_API_KEY: optionalText, FEC_API_KEY: optionalText }).parse({
    OPEN_STATES_API_KEY: process.env.OPEN_STATES_API_KEY,
    FEC_API_KEY: process.env.FEC_API_KEY,
  });
}

/** Only the guide's AI settings. Server code only. */
export function getLlmEnv(): LlmServerEnv {
  return llmSchema.parse(llmValues());
}
