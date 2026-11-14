import { MODELS, PROVIDER_URLS } from "../constants";
import type { LlmFailure, LlmRequest, ProviderName } from "./types";

export function providerOrder(primary: ProviderName): ProviderName[] {
  return primary === "cerebras" ? ["cerebras", "groq"] : ["groq", "cerebras"];
}

export function buildBody(provider: ProviderName, req: LlmRequest) {
  return {
    model: MODELS[provider][req.tier],
    messages: req.messages,
    max_completion_tokens: req.maxTokens,
    reasoning_effort: req.reasoningEffort,
    response_format: {
      type: "json_schema",
      json_schema: { name: req.schemaName, strict: true, schema: req.jsonSchema },
    },
  };
}

export function endpoint(provider: ProviderName): string {
  return PROVIDER_URLS[provider];
}

export function failureFromStatus(status: number): LlmFailure {
  return status === 429 ? "rate_limited" : "provider_error";
}

export function failureFromError(error: unknown): LlmFailure {
  const name = error instanceof Error || error instanceof DOMException ? error.name : "";
  return name === "TimeoutError" || name === "AbortError" ? "timeout" : "provider_error";
}

export function extractText(payload: unknown): string {
  if (typeof payload !== "object" || payload === null) return "";
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return "";
  const message = (choices[0] as { message?: { content?: unknown } } | null)?.message;
  return typeof message?.content === "string" ? message.content : "";
}
