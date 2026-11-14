import { MODELS, OPENROUTER_APP_TITLE, PROVIDER_URLS } from "../constants";
import type {
  LlmConfig,
  LlmFailure,
  LlmRequest,
  ProviderModels,
  ProviderName,
  WireMessage,
} from "./types";

const FAILOVER_ORDER: ProviderName[] = ["openrouter", "cerebras", "groq"];

/** The primary first, then every other provider in a fixed order. Providers without a key are skipped later. */
export function providerOrder(primary: ProviderName): ProviderName[] {
  return [primary, ...FAILOVER_ORDER.filter((name) => name !== primary)];
}

function modelsFor(config: LlmConfig, provider: ProviderName): ProviderModels | null {
  const override = config.models?.[provider];
  if (override) return override;
  return provider === "openrouter" ? null : MODELS[provider];
}

/** The model for a tier, or null when the provider has none (for example no vision model). */
export function modelFor(
  config: LlmConfig,
  provider: ProviderName,
  tier: LlmRequest["tier"],
): string | null {
  const models = modelsFor(config, provider);
  if (!models) return null;
  return models[tier] ?? null;
}

/** The messages as sent, with the image attached to the last user message on a vision call. */
export function wireMessages(req: LlmRequest): WireMessage[] {
  const messages: WireMessage[] = req.messages.map((m) => ({ role: m.role, content: m.content }));
  if (!req.imageUrl) return messages;
  const lastUser = messages.map((m) => m.role).lastIndexOf("user");
  if (lastUser < 0) return messages;
  const text = req.messages[lastUser].content;
  messages[lastUser] = {
    role: "user",
    content: [
      { type: "text", text },
      { type: "image_url", image_url: { url: req.imageUrl } },
    ],
  };
  return messages;
}

function responseFormat(req: LlmRequest) {
  if (req.plainText) return undefined;
  return {
    type: "json_schema",
    json_schema: { name: req.schemaName, strict: true, schema: req.jsonSchema },
  };
}

export function buildBody(
  provider: ProviderName,
  req: LlmRequest,
  model: string,
  fallback?: string,
): Record<string, unknown> {
  const response_format = responseFormat(req);
  const messages = wireMessages(req);
  if (provider === "openrouter") {
    // require_parameters keeps requests on upstreams that honor json_schema. No reasoning_effort.
    const models = fallback && fallback !== model ? [model, fallback] : [model];
    return {
      model,
      models,
      messages,
      max_tokens: req.maxTokens,
      ...(response_format ? { response_format } : {}),
      provider: { require_parameters: true },
    };
  }
  return {
    model,
    messages,
    max_completion_tokens: req.maxTokens,
    // Vision models on these providers do not take a reasoning setting.
    ...(req.tier === "vision" ? {} : { reasoning_effort: req.reasoningEffort }),
    ...(response_format ? { response_format } : {}),
  };
}

export function endpoint(provider: ProviderName): string {
  return PROVIDER_URLS[provider];
}

/** Headers for one call. The key goes only here and is never copied into a result. */
export function headersFor(provider: ProviderName, key: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  };
  if (provider === "openrouter") headers["X-Title"] = OPENROUTER_APP_TITLE;
  return headers;
}

export function failureFromStatus(status: number): LlmFailure {
  if (status === 429) return "rate_limited";
  if (status === 402) return "payment_required";
  if (status === 401 || status === 403) return "auth_failed";
  return "provider_error";
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
