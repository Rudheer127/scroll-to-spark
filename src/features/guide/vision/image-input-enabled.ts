import { getLlmEnv } from "@/lib/env";
import { buildLlmConfig, hasVision } from "../llm/from-env";

/**
 * The one place that decides whether image input is on: a provider has a key and a vision
 * model. The attach button and the server check both use it. Never throws.
 */
export function isImageInputEnabled(): boolean {
  try {
    return hasVision(buildLlmConfig(getLlmEnv()));
  } catch {
    return false;
  }
}
