export type ProviderName = "openrouter" | "cerebras" | "groq";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/** OpenAI compatible content parts. Image parts only ever go out on a vision call. */
export type ContentPart =
  { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

/** A message as it is sent to a provider. */
export type WireMessage = { role: ChatMessage["role"]; content: string | ContentPart[] };

/** main: the answer. router: small helper calls. vision: the one image description call. */
export type ModelTier = "main" | "router" | "vision";

export type LlmRequest = {
  messages: ChatMessage[];
  /** Attached to the last user message as an image part. Only set on a vision call. */
  imageUrl?: string;
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  /** True asks for plain text: no response_format is sent and jsonSchema is ignored. */
  plainText?: boolean;
  reasoningEffort: "low" | "medium";
  maxTokens: number;
  timeoutMs: number;
  tier: ModelTier;
};

export type LlmFailure =
  "timeout" | "rate_limited" | "provider_error" | "empty" | "payment_required" | "auth_failed";

export type LlmResult =
  | { ok: true; text: string; provider: ProviderName; model: string }
  | { ok: false; reason: LlmFailure };

export interface LlmClient {
  complete(req: LlmRequest): Promise<LlmResult>;
}

/** Model ids for one provider. A provider without a vision id is skipped for vision calls. */
export type ProviderModels = { main: string; router: string; vision?: string; fallback?: string };

export type LlmConfig = {
  primary: ProviderName;
  keys: Partial<Record<ProviderName, string>>;
  /** Overrides the built-in model ids per provider. OpenRouter ids always come from here. */
  models?: Partial<Record<ProviderName, ProviderModels>>;
};
