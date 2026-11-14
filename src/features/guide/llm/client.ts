import {
  buildBody,
  endpoint,
  extractText,
  failureFromError,
  failureFromStatus,
  headersFor,
  modelFor,
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

type Call = { provider: ProviderName; key: string; model: string; fallback?: string };

async function callProvider(
  call: Call,
  req: LlmRequest,
  fetchImpl: typeof fetch,
): Promise<LlmResult> {
  try {
    const res = await fetchImpl(endpoint(call.provider), {
      method: "POST",
      headers: headersFor(call.provider, call.key),
      body: JSON.stringify(buildBody(call.provider, req, call.model, call.fallback)),
      signal: AbortSignal.timeout(req.timeoutMs),
    });
    if (!res.ok) return { ok: false, reason: failureFromStatus(res.status) };
    const text = extractText(await res.json());
    if (text.trim() === "") return { ok: false, reason: "empty" };
    return { ok: true, text, provider: call.provider, model: call.model };
  } catch (error) {
    // Only a reason code leaves this function, never the error text, so keys cannot leak.
    return { ok: false, reason: failureFromError(error) };
  }
}

/** Account problems are what the team needs to see, so they outrank a later generic failure. */
const ACCOUNT_FAILURES: LlmFailure[] = ["payment_required", "auth_failed"];

function pickFailure(previous: LlmFailure | null, next: LlmFailure): LlmFailure {
  if (previous && ACCOUNT_FAILURES.includes(previous) && !ACCOUNT_FAILURES.includes(next)) {
    return previous;
  }
  return next;
}

/**
 * Tries the primary provider, then every other provider that has a key and a model for the
 * tier. OpenRouter also falls back natively between its own models.
 */
export function createLlmClient(config: LlmConfig, fetchImpl: typeof fetch = fetch): LlmClient {
  return {
    async complete(req) {
      let last: LlmFailure | null = null;
      for (const provider of providerOrder(config.primary)) {
        const key = config.keys[provider];
        const model = modelFor(config, provider, req.tier);
        if (!key || !model) continue;
        const fallback = config.models?.[provider]?.fallback;
        const result = await callProvider({ provider, key, model, fallback }, req, fetchImpl);
        if (result.ok) return result;
        last = pickFailure(last, result.reason);
      }
      return { ok: false, reason: last ?? "provider_error" };
    },
  };
}
