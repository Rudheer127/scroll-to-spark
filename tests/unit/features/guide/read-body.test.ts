import { describe, expect, it } from "vitest";
import { readBodyWithLimit } from "@/features/guide/read-body";

const enc = new TextEncoder();

/** A request whose body is a stream of chunks; pulled counts how many were read. */
function streamed(chunks: Uint8Array[], headers: Record<string, string> = {}) {
  const state = { pulled: 0, cancelled: false };
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      const chunk = chunks[state.pulled];
      if (!chunk) return controller.close();
      state.pulled += 1;
      controller.enqueue(chunk);
    },
    cancel() {
      state.cancelled = true;
    },
  });
  const request = new Request("http://localhost/x", {
    method: "POST",
    body,
    headers,
    duplex: "half",
  } as RequestInit);
  return { request, state };
}

describe("readBodyWithLimit", () => {
  it("accepts exactly the limit", async () => {
    const { request } = streamed([enc.encode("a".repeat(4000))]);
    const res = await readBodyWithLimit(request, 4000);
    expect(res).toEqual({ ok: true, text: "a".repeat(4000) });
  });

  it("rejects an oversized declared Content-Length without reading", async () => {
    const { request, state } = streamed([enc.encode("a")], { "content-length": "9999" });
    expect(await readBodyWithLimit(request, 4000)).toEqual({ ok: false });
    expect(state.pulled).toBeLessThanOrEqual(1);
  });

  it("without Content-Length, stops and cancels shortly after the limit", async () => {
    const chunks = Array.from({ length: 100 }, () => enc.encode("a".repeat(1000)));
    const { request, state } = streamed(chunks);
    expect(await readBodyWithLimit(request, 4000)).toEqual({ ok: false });
    expect(state.pulled).toBeLessThan(10);
    expect(state.cancelled).toBe(true);
  });

  it("counts bytes, not characters", async () => {
    const { request } = streamed([enc.encode("€".repeat(1400))]);
    expect(await readBodyWithLimit(request, 4000)).toEqual({ ok: false });
  });

  it("treats a null body as empty and decodes split multibyte chars", async () => {
    const empty = new Request("http://localhost/x", { method: "POST" });
    expect(await readBodyWithLimit(empty, 4000)).toEqual({ ok: true, text: "" });
    const bytes = enc.encode("€");
    const { request } = streamed([bytes.slice(0, 1), bytes.slice(1)]);
    expect(await readBodyWithLimit(request, 4000)).toEqual({ ok: true, text: "€" });
  });
});
