import { buildRouterPrompt } from "./prompts/router";
import { wrapUntrusted } from "./guard/untrusted";
import { callStructured } from "./llm/structured";
import type { LlmClient } from "./llm/types";
import { routerOutputSchema } from "./schemas";
import type { Intent } from "./types";

const SAFE_DEFAULT: { intent: Intent; safety: "ok" | "crisis" } = {
  intent: "out_of_scope",
  safety: "ok",
};

/** Classifies one message. Any failure, including a thrown error, means out_of_scope and ok. */
export async function routeIntent(
  llm: LlmClient,
  text: string,
  nonce: string,
): Promise<{ intent: Intent; safety: "ok" | "crisis" }> {
  try {
    const result = await callStructured(llm, routerOutputSchema, {
      messages: [
        { role: "system", content: buildRouterPrompt({ nonce }) },
        { role: "user", content: wrapUntrusted("user_message", text, nonce) },
      ],
      schemaName: "router_output",
      reasoningEffort: "low",
      maxTokens: 300,
      timeoutMs: 8000,
      tier: "router",
    });
    return result.ok ? result.data : SAFE_DEFAULT;
  } catch {
    return SAFE_DEFAULT;
  }
}
