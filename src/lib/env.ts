import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
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

const serverSchema = publicSchema
  .extend({
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    // Unset means openrouter when an OpenRouter key exists, otherwise cerebras.
    LLM_PROVIDER: z.preprocess(blankToUndefined, provider.optional()),
    OPENROUTER_API_KEY: optionalText,
    OPENROUTER_MODEL_MAIN: modelId(OPENROUTER_DEFAULTS.main),
    OPENROUTER_MODEL_FAST: modelId(OPENROUTER_DEFAULTS.fast),
    OPENROUTER_MODEL_FALLBACK: modelId(OPENROUTER_DEFAULTS.fallback),
    CEREBRAS_API_KEY: optionalText,
    GROQ_API_KEY: optionalText,
    // Image reading. On OpenRouter it defaults to the fast model; elsewhere it is off unless set.
    GUIDE_VISION_MODEL: optionalText,
    GUIDE_VISION_PROVIDER: z.preprocess(blankToUndefined, provider.optional()),
    GIF_API_KEY: z.string().min(1).optional(),
  })
  .refine(
    (env) =>
      env.OPENROUTER_API_KEY !== undefined ||
      env.CEREBRAS_API_KEY !== undefined ||
      env.GROQ_API_KEY !== undefined,
    {
      message: "Set OPENROUTER_API_KEY, CEREBRAS_API_KEY or GROQ_API_KEY",
      path: ["OPENROUTER_API_KEY"],
    },
  );

/**
 * Variables that are safe to expose to the browser.
 * Each one is named in full so the bundler can inline it.
 */
export function getPublicEnv() {
  return publicSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

/** All variables. Call this only in server code. This is the only file that reads process.env. */
export type ServerEnv = z.infer<typeof serverSchema>;

export function getServerEnv(): ServerEnv {
  return serverSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    LLM_PROVIDER: process.env.LLM_PROVIDER,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_MODEL_MAIN: process.env.OPENROUTER_MODEL_MAIN,
    OPENROUTER_MODEL_FAST: process.env.OPENROUTER_MODEL_FAST,
    OPENROUTER_MODEL_FALLBACK: process.env.OPENROUTER_MODEL_FALLBACK,
    CEREBRAS_API_KEY: process.env.CEREBRAS_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GUIDE_VISION_MODEL: process.env.GUIDE_VISION_MODEL,
    GUIDE_VISION_PROVIDER: process.env.GUIDE_VISION_PROVIDER,
    GIF_API_KEY: process.env.GIF_API_KEY,
  });
}
