export type ProviderName = "cerebras" | "groq";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type LlmRequest = {
  messages: ChatMessage[];
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  reasoningEffort: "low" | "medium";
  maxTokens: number;
  timeoutMs: number;
  tier: "main" | "router";
};

export type LlmFailure = "timeout" | "rate_limited" | "provider_error" | "empty";

export type LlmResult =
  | { ok: true; text: string; provider: ProviderName; model: string }
  | { ok: false; reason: LlmFailure };

export interface LlmClient {
  complete(req: LlmRequest): Promise<LlmResult>;
}

export type LlmConfig = {
  primary: ProviderName;
  keys: Partial<Record<ProviderName, string>>;
};
