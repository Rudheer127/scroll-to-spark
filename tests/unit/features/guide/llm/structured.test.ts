import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { callStructured } from "@/features/guide/llm/structured";
import type { LlmClient, LlmResult } from "@/features/guide/llm/types";

const schema = z.object({ answer: z.string(), note: z.string().nullable() });
const base = {
  messages: [{ role: "user" as const, content: "x" }],
  schemaName: "t",
  reasoningEffort: "low" as const,
  maxTokens: 50,
  timeoutMs: 1000,
  tier: "main" as const,
};

function clientReturning(result: LlmResult): LlmClient {
  return { complete: vi.fn().mockResolvedValue(result) };
}
const text = (t: string): LlmResult => ({ ok: true, text: t, provider: "cerebras", model: "m" });

describe("callStructured", () => {
  it("returns parsed data and sends a strict schema", async () => {
    const client = clientReturning(text('{"answer":"a","note":null}'));
    const res = await callStructured(client, schema, base);
    expect(res).toEqual({ ok: true, data: { answer: "a", note: null } });
    const sent = vi.mocked(client.complete).mock.calls[0][0];
    expect(sent.jsonSchema.additionalProperties).toBe(false);
    expect(sent.jsonSchema.required).toEqual(["answer", "note"]);
  });

  it("rejects JSON that fails the zod schema", async () => {
    const res = await callStructured(clientReturning(text('{"answer":5}')), schema, base);
    expect(res).toEqual({ ok: false, reason: "invalid_json" });
  });

  it("rejects truncated JSON without throwing", async () => {
    const res = await callStructured(clientReturning(text('{"answer":"a","no')), schema, base);
    expect(res).toEqual({ ok: false, reason: "invalid_json" });
  });

  it("passes provider failures through", async () => {
    const res = await callStructured(
      clientReturning({ ok: false, reason: "rate_limited" }),
      schema,
      base,
    );
    expect(res).toEqual({ ok: false, reason: "rate_limited" });
  });
});
