import { describe, expect, it, vi } from "vitest";
import { createLlmClient } from "@/features/guide/llm/client";
import type { LlmConfig, LlmRequest } from "@/features/guide/llm/types";

const config: LlmConfig = {
  primary: "cerebras",
  keys: { cerebras: "csk-secret-1", groq: "gsk-secret-2" },
};

const req: LlmRequest = {
  messages: [{ role: "user", content: "hi" }],
  schemaName: "reply",
  jsonSchema: { type: "object", properties: {}, additionalProperties: false },
  reasoningEffort: "low",
  maxTokens: 100,
  timeoutMs: 1000,
  tier: "main",
};

function okResponse(text: string) {
  return new Response(JSON.stringify({ choices: [{ message: { content: text } }] }), {
    status: 200,
  });
}

describe("createLlmClient", () => {
  it("returns text from the primary provider", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse("{}"));
    const res = await createLlmClient(config, fetchImpl).complete(req);
    expect(res).toMatchObject({ ok: true, text: "{}", provider: "cerebras" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("falls back to groq on 429", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 429 }))
      .mockResolvedValueOnce(okResponse("{}"));
    const res = await createLlmClient(config, fetchImpl).complete(req);
    expect(res).toMatchObject({ ok: true, provider: "groq" });
  });

  it("falls back to groq on 5xx and on timeout", async () => {
    const f1 = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(okResponse("{}"));
    expect(await createLlmClient(config, f1).complete(req)).toMatchObject({ provider: "groq" });
    const f2 = vi
      .fn()
      .mockRejectedValueOnce(new DOMException("timed out", "TimeoutError"))
      .mockResolvedValueOnce(okResponse("{}"));
    expect(await createLlmClient(config, f2).complete(req)).toMatchObject({ provider: "groq" });
  });

  it("returns reason rate_limited when both providers 429", async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => new Response("", { status: 429 }));
    const res = await createLlmClient(config, fetchImpl).complete(req);
    expect(res).toEqual({ ok: false, reason: "rate_limited" });
  });

  it("returns timeout when both providers time out", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new DOMException("t", "TimeoutError"));
    const res = await createLlmClient(config, fetchImpl).complete(req);
    expect(res).toEqual({ ok: false, reason: "timeout" });
  });

  it("returns empty when the model sends no text", async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => okResponse(""));
    const res = await createLlmClient(config, fetchImpl).complete(req);
    expect(res).toEqual({ ok: false, reason: "empty" });
  });

  it("does not try a provider with no key", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("", { status: 500 }));
    const client = createLlmClient({ primary: "cerebras", keys: { cerebras: "k" } }, fetchImpl);
    expect(await client.complete(req)).toEqual({ ok: false, reason: "provider_error" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("never includes the api key in a returned error", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("boom csk-secret-1 gsk-secret-2"));
    const res = await createLlmClient(config, fetchImpl).complete(req);
    expect(res.ok).toBe(false);
    const text = JSON.stringify(res);
    expect(text).not.toContain("csk-secret-1");
    expect(text).not.toContain("gsk-secret-2");
  });

  it("sends strict json_schema response_format and reasoning_effort", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse("{}"));
    await createLlmClient(config, fetchImpl).complete(req);
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.cerebras.ai/v1/chat/completions");
    const body = JSON.parse(String(init.body));
    expect(body.reasoning_effort).toBe("low");
    expect(body.model).toBe("gpt-oss-120b");
    expect(body.max_completion_tokens).toBe(100);
    expect(body.response_format).toEqual({
      type: "json_schema",
      json_schema: { name: "reply", strict: true, schema: req.jsonSchema },
    });
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer csk-secret-1");
  });

  it("uses the groq router model for the router tier", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse("{}"));
    await createLlmClient({ ...config, primary: "groq" }, fetchImpl).complete({
      ...req,
      tier: "router",
    });
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(JSON.parse(String(init.body)).model).toBe("openai/gpt-oss-20b");
  });
});
