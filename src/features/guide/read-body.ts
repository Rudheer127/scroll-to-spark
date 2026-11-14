export type BodyRead = { ok: true; text: string } | { ok: false };

/**
 * Reads a request body without ever holding more than maxBytes. Rejects early on a numeric
 * Content-Length over the limit, otherwise streams and cancels as soon as the limit is passed.
 */
export async function readBodyWithLimit(request: Request, maxBytes: number): Promise<BodyRead> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false };
  if (!request.body) return { ok: true, text: "" };

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return { ok: false };
    }
    text += decoder.decode(value, { stream: true });
  }
  return { ok: true, text: text + decoder.decode() };
}
