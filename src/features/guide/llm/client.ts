import { MODELS } from "../constants";
import {
  buildBody,
  endpoint,
  extractText,
  failureFromError,
  failureFromStatus,
  providerOrder,
} from "./providers";
import type {
  LlmClient,
  LlmConfig,
  LlmFailure,
  LlmRequest,
  LlmResult,
  ProviderName,
} from "./types";

async function callProvider(
  provider: ProviderName,
  key: string,
  req: LlmRequest,
  fetchImpl: typeof fetch,
): Promise<LlmResult> {
  try {
    const res = await fetchImpl(endpoint(provider), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(buildBody(provider, req)),
      signal: AbortSignal.timeout(req.timeoutMs),
    });
    if (!res.ok) return { ok: false, reason: failureFromStatus(res.status) };
    const text = extractText(await res.json());
    if (text.trim() === "") return { ok: false, reason: "empty" };
    return { ok: true, text, provider, model: MODELS[provider][req.tier] };
  } catch (error) {
    // Only a reason code leaves this function, never the error text, so keys cannot leak.
    return { ok: false, reason: failureFromError(error) };
  }
}

export function createLlmClient(config: LlmConfig, fetchImpl: typeof fetch = fetch): LlmClient {
  return {
    async complete(req) {
      let last: LlmFailure = "provider_error";
      for (const provider of providerOrder(config.primary)) {
        const key = config.keys[provider];
        if (!key) continue;
        const result = await callProvider(provider, key, req, fetchImpl);
        if (result.ok) return result;
        last = result.reason;
      }
      return { ok: false, reason: last };
    },
  };
}
