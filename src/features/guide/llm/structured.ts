import { z } from "zod";
import type { LlmClient, LlmFailure, LlmRequest } from "./types";

export type StructuredResult<T> =
  { ok: true; data: T } | { ok: false; reason: LlmFailure | "invalid_json" };

/** Constraint keywords that provider strict modes reject. The local Zod schema still enforces them. */
const UNSUPPORTED_KEYWORDS = new Set([
  "maxLength",
  "minLength",
  "maxItems",
  "minItems",
  "minimum",
  "maximum",
  "pattern",
  "format",
]);

/** Recursively drops unsupported keywords. Keys inside `properties` are field names, so they stay. */
export function stripUnsupportedKeywords(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(stripUnsupportedKeywords);
  if (typeof node !== "object" || node === null) return node;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === "properties" && typeof value === "object" && value !== null) {
      out[key] = Object.fromEntries(
        Object.entries(value).map(([name, sub]) => [name, stripUnsupportedKeywords(sub)]),
      );
    } else if (!UNSUPPORTED_KEYWORDS.has(key)) {
      out[key] = stripUnsupportedKeywords(value);
    }
  }
  return out;
}

/** Response schemas must use .nullable(), never .optional(), because strict mode needs every key. */
export async function callStructured<T>(
  client: LlmClient,
  schema: z.ZodType<T>,
  req: Omit<LlmRequest, "jsonSchema">,
): Promise<StructuredResult<T>> {
  const jsonSchema = stripUnsupportedKeywords(z.toJSONSchema(schema)) as Record<string, unknown>;
  delete jsonSchema.$schema;
  const result = await client.complete({ ...req, jsonSchema });
  if (!result.ok) return { ok: false, reason: result.reason };
  let raw: unknown;
  try {
    raw = JSON.parse(result.text);
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
  const parsed = schema.safeParse(raw);
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, reason: "invalid_json" };
}
