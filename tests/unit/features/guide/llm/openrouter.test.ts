import { describe, expect, it, vi } from "vitest";
import { createLlmClient } from "@/features/guide/llm/client";
import type { LlmConfig, LlmRequest } from "@/features/guide/llm/types";

const KEY = "sk-or-secret-123";

const config: LlmConfig = {
  primary: "openrouter",
  keys: { openrouter: KEY, cerebras: "csk-secret-1" },
  models: {
    openrouter: { main: "a/main", router: "a/fast", vision: "a/fast", fallback: "g/back" },
  },
};

const req: LlmRequest = {
  messages: [
    { role: "system", content: "sys" },
    { role: "user", content: "hi" },
  ],
  schemaName: "reply",
  jsonSchema: { type: "object", properties: {}, additionalProperties: false },
  reasoningEffort: "low",
  maxTokens: 100,
  timeoutMs: 1000,
  tier: "main",
};

const okResponse = (text: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content: text } }] }), { status: 200 });

function sent(fetchImpl: ReturnType<typeof vi.fn>, index = 0) {
  const [url, init] = fetchImpl.mock.calls[index] as [string, RequestInit];
  return {
    url,
    headers: init.headers as Record<string, string>,
    body: JSON.parse(String(init.body)),
  };
}

describe("openrouter provider", () => {
  it("sends the OpenRouter request shape", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse("{}"));
    const res = await createLlmClient(config, fetchImpl).complete(req);
    expect(res).toEqual({ ok: true, text: "{}", provider: "openrouter", model: "a/main" });
    const { url, headers, body } = sent(fetchImpl);
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(headers.Authorization).toBe(`Bearer ${KEY}`);
    expect(headers["X-Title"]).toBe("Scroll to Spark");
    expect(body.model).toBe("a/main");
    expect(body.models).toEqual(["a/main", "g/back"]);
    expect(body.provider).toEqual({ require_parameters: true });
    expect(body.max_tokens).toBe(100);
    expect(body).not.toHaveProperty("reasoning_effort");
    expect(body).not.toHaveProperty("max_completion_tokens");
    expect(body.response_format).toEqual({
      type: "json_schema",
      json_schema: { name: "reply", strict: true, schema: req.jsonSchema },
    });
    expect(JSON.stringify(res)).not.toContain(KEY);
  });

  it("uses the fast model for the router tier", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse("{}"));
    await createLlmClient(config, fetchImpl).complete({ ...req, tier: "router" });
    expect(sent(fetchImpl).body.models).toEqual(["a/fast", "g/back"]);
  });

  it("maps 402 to payment_required and never echoes the key", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response(`{"error":"no credits for ${KEY}"}`, { status: 402 }));
    const client = createLlmClient({ ...config, keys: { openrouter: KEY } }, fetchImpl);
    const res = await client.complete(req);
    expect(res).toEqual({ ok: false, reason: "payment_required" });
    expect(JSON.stringify(res)).not.toContain(KEY);
  });

  it("maps 401 and 403 to auth_failed", async () => {
    for (const status of [401, 403]) {
      const fetchImpl = vi.fn().mockResolvedValue(new Response("", { status }));
      const client = createLlmClient({ ...config, keys: { openrouter: KEY } }, fetchImpl);
      expect(await client.complete(req)).toEqual({ ok: false, reason: "auth_failed" });
    }
  });

  it("fails over to cerebras after openrouter, and keeps payment_required visible", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 402 }))
      .mockResolvedValueOnce(okResponse("{}"));
    const res = await createLlmClient(config, fetchImpl).complete(req);
    expect(res).toMatchObject({ ok: true, provider: "cerebras" });
    expect(sent(fetchImpl, 0).url).toContain("openrouter.ai");
    expect(sent(fetchImpl, 1).url).toContain("cerebras.ai");

    const both = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 402 }))
      .mockResolvedValueOnce(new Response("", { status: 500 }));
    expect(await createLlmClient(config, both).complete(req)).toEqual({
      ok: false,
      reason: "payment_required",
    });
  });

  it("tries the primary, then openrouter, then groq", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("", { status: 500 }));
    const all: LlmConfig = { ...config, primary: "cerebras", keys: { ...config.keys, groq: "g" } };
    await createLlmClient(all, fetchImpl).complete(req);
    const urls = fetchImpl.mock.calls.map((call) => String(call[0]));
    expect(urls[0]).toContain("cerebras.ai");
    expect(urls[1]).toContain("openrouter.ai");
    expect(urls[2]).toContain("groq.com");
  });

  it("sends an image part and plain text on a vision call, skipping providers with no vision model", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse("A sign."));
    const res = await createLlmClient({ ...config, primary: "cerebras" }, fetchImpl).complete({
      ...req,
      tier: "vision",
      plainText: true,
      imageUrl: "data:image/jpeg;base64,AAAA",
    });
    expect(res).toMatchObject({ ok: true, provider: "openrouter", model: "a/fast" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const { body } = sent(fetchImpl);
    expect(body).not.toHaveProperty("response_format");
    expect(body.messages[0]).toEqual({ role: "system", content: "sys" });
    expect(body.messages[1].content).toEqual([
      { type: "text", text: "hi" },
      { type: "image_url", image_url: { url: "data:image/jpeg;base64,AAAA" } },
    ]);
  });
});
