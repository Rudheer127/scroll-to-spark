import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const blankToUndefined = (v: unknown) => (v === "" ? undefined : v);

const serverSchema = publicSchema
  .extend({
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    LLM_PROVIDER: z.preprocess(blankToUndefined, z.enum(["cerebras", "groq"]).default("cerebras")),
    CEREBRAS_API_KEY: z.preprocess(blankToUndefined, z.string().min(1).optional()),
    GROQ_API_KEY: z.preprocess(blankToUndefined, z.string().min(1).optional()),
    GIF_API_KEY: z.string().min(1).optional(),
  })
  .refine((env) => env.CEREBRAS_API_KEY !== undefined || env.GROQ_API_KEY !== undefined, {
    message: "Set CEREBRAS_API_KEY or GROQ_API_KEY",
    path: ["CEREBRAS_API_KEY"],
  });

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
export function getServerEnv() {
  return serverSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    LLM_PROVIDER: process.env.LLM_PROVIDER,
    CEREBRAS_API_KEY: process.env.CEREBRAS_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GIF_API_KEY: process.env.GIF_API_KEY,
  });
}
