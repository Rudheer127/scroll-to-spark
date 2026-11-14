import { buildRouterPrompt } from "./prompts/router";
import { wrapUntrusted } from "./guard/untrusted";
import { callStructured } from "./llm/structured";
import type { LlmClient } from "./llm/types";
import { routerOutputSchema } from "./schemas";
import type { Intent, ReportStageFailure } from "./types";

const SAFE_DEFAULT: { intent: Intent; safety: "ok" | "crisis" } = {
  intent: "out_of_scope",
  safety: "ok",
};

/**
 * Classifies one message. Any failure, including a thrown error, means out_of_scope and ok, and
 * is reported through onFailure so it is not silent.
 */
export async function routeIntent(
  llm: LlmClient,
  text: string,
  nonce: string,
  onFailure: ReportStageFailure = async () => undefined,
): Promise<{ intent: Intent; safety: "ok" | "crisis" }> {
  try {
    const result = await callStructured(llm, routerOutputSchema, {
      messages: [
        { role: "system", content: buildRouterPrompt({ nonce }) },
        { role: "user", content: wrapUntrusted("user_message", text, nonce) },
      ],
      schemaName: "router_output",
      reasoningEffort: "low",
      // Reasoning tokens count toward this budget, so it must be roomy.
      maxTokens: 1000,
      // Free OpenRouter models answered in up to about 10 seconds in a live check.
      timeoutMs: 15000,
      tier: "router",
    });
    if (result.ok) return result.data;
  } catch {
    // Falls through to the safe default below.
  }
  await onFailure("router");
  return SAFE_DEFAULT;
}
