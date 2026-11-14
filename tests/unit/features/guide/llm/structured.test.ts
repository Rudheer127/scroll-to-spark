import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { callStructured, stripUnsupportedKeywords } from "@/features/guide/llm/structured";
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

describe("schema keyword stripping (R15)", () => {
  const constrained = z.object({
    message: z.string().max(10).min(1),
    list: z.array(z.object({ id: z.string() })).max(3),
    count: z.number().int().min(1).max(600),
    when: z.string().regex(/^\d+$/),
    kind: z.enum(["a", "b"]),
    maybe: z.string().max(5).nullable(),
    format: z.string(),
  });

  it("removes unsupported constraint keywords at every depth", () => {
    const stripped = JSON.stringify(stripUnsupportedKeywords(z.toJSONSchema(constrained)));
    for (const key of ["maxLength", "minLength", "maxItems", "minimum", "maximum", "pattern"]) {
      expect(stripped).not.toContain(`"${key}"`);
    }
  });

  it("keeps structure, enums, nullability and a field that is itself named format", () => {
    const stripped = stripUnsupportedKeywords(z.toJSONSchema(constrained)) as {
      required: string[];
      additionalProperties: boolean;
      properties: Record<string, unknown>;
    };
    expect(stripped.additionalProperties).toBe(false);
    expect(stripped.required).toContain("format");
    expect(Object.keys(stripped.properties)).toContain("format");
    expect(JSON.stringify(stripped.properties.kind)).toContain('"enum":["a","b"]');
    expect(JSON.stringify(stripped.properties.maybe)).toContain("anyOf");
  });

  it("sends the stripped schema but still enforces limits locally", async () => {
    const client = clientReturning(text('{"message":"far too long for the limit"}'));
    const local = z.object({ message: z.string().max(10) });
    const res = await callStructured(client, local, base);
    expect(res).toEqual({ ok: false, reason: "invalid_json" });
    const sent = vi.mocked(client.complete).mock.calls[0][0];
    expect(JSON.stringify(sent.jsonSchema)).not.toContain("maxLength");
  });
});
