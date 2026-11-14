import { getServerEnv } from "@/lib/env";
import { createLlmClient } from "./client";
import type { LlmClient, LlmConfig, ProviderName } from "./types";

type LlmEnv = {
  LLM_PROVIDER: ProviderName;
  CEREBRAS_API_KEY?: string;
  GROQ_API_KEY?: string;
};

/** Pure mapping from validated env values to the client config. */
export function buildLlmConfig(env: LlmEnv): LlmConfig {
  return {
    primary: env.LLM_PROVIDER,
    keys: { cerebras: env.CEREBRAS_API_KEY, groq: env.GROQ_API_KEY },
  };
}

/** Builds the real client from server env. Call only in server code. */
export function createGuideLlm(): LlmClient {
  return createLlmClient(buildLlmConfig(getServerEnv()));
}
