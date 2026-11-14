import { z } from "zod";
import type { LlmClient, LlmFailure, LlmRequest } from "./types";

export type StructuredResult<T> =
  { ok: true; data: T } | { ok: false; reason: LlmFailure | "invalid_json" };

/** Response schemas must use .nullable(), never .optional(), because strict mode needs every key. */
export async function callStructured<T>(
  client: LlmClient,
  schema: z.ZodType<T>,
  req: Omit<LlmRequest, "jsonSchema">,
): Promise<StructuredResult<T>> {
  const jsonSchema = { ...z.toJSONSchema(schema) } as Record<string, unknown>;
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
