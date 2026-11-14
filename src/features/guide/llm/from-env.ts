import { getServerEnv, OPENROUTER_DEFAULTS } from "@/lib/env";
import { MODELS } from "../constants";
import { createLlmClient } from "./client";
import type { LlmClient, LlmConfig, ProviderModels, ProviderName } from "./types";

export type LlmEnv = {
  LLM_PROVIDER?: ProviderName;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL_MAIN?: string;
  OPENROUTER_MODEL_FAST?: string;
  OPENROUTER_MODEL_FALLBACK?: string;
  CEREBRAS_API_KEY?: string;
  GROQ_API_KEY?: string;
  GUIDE_VISION_MODEL?: string;
  GUIDE_VISION_PROVIDER?: ProviderName;
};

function primaryOf(env: LlmEnv): ProviderName {
  if (env.LLM_PROVIDER) return env.LLM_PROVIDER;
  return env.OPENROUTER_API_KEY ? "openrouter" : "cerebras";
}

function openRouterModels(env: LlmEnv): ProviderModels | null {
  const { OPENROUTER_MODEL_MAIN: main, OPENROUTER_MODEL_FAST: fast } = env;
  if (!main || !fast) return null;
  return {
    main,
    router: fast,
    vision: OPENROUTER_DEFAULTS.vision,
    fallback: env.OPENROUTER_MODEL_FALLBACK,
  };
}

/** Model ids per provider, with the vision model placed on exactly one provider when set. */
function modelsOf(env: LlmEnv, primary: ProviderName): LlmConfig["models"] {
  const models: NonNullable<LlmConfig["models"]> = {
    cerebras: { ...MODELS.cerebras },
    groq: { ...MODELS.groq },
  };
  const openrouter = openRouterModels(env);
  if (openrouter) models.openrouter = openrouter;
  if (env.GUIDE_VISION_MODEL) {
    const target = env.GUIDE_VISION_PROVIDER ?? primary;
    for (const entry of Object.values(models)) delete entry.vision;
    const base = models[target];
    if (base) models[target] = { ...base, vision: env.GUIDE_VISION_MODEL };
  }
  return models;
}

/** Pure mapping from validated env values to the client config. */
export function buildLlmConfig(env: LlmEnv): LlmConfig {
  const primary = primaryOf(env);
  return {
    primary,
    keys: {
      openrouter: env.OPENROUTER_API_KEY,
      cerebras: env.CEREBRAS_API_KEY,
      groq: env.GROQ_API_KEY,
    },
    models: modelsOf(env, primary),
  };
}

/** True when some provider has both a key and a vision model, so image input can work. */
export function hasVision(config: LlmConfig): boolean {
  const providers: ProviderName[] = ["openrouter", "cerebras", "groq"];
  return providers.some(
    (name) => config.models?.[name]?.vision !== undefined && config.keys[name] !== undefined,
  );
}

/** Builds the real client from server env. Call only in server code. */
export function createGuideLlm(): LlmClient {
  return createLlmClient(buildLlmConfig(getServerEnv()));
}
