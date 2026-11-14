import { describe, expect, it, vi } from "vitest";
import { fail, guideReply, routerReply } from "./helpers/fake-llm";
import { arrange, mocks } from "./helpers/route-setup";

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => mocks.db }));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => {
    mocks.serviceCreated += 1;
    if (mocks.throwOnService) throw new Error("SECRET stack detail");
    return mocks.admin;
  },
}));
vi.mock("@/features/guide/llm/from-env", () => ({ createGuideLlm: () => mocks.llm }));

import { POST } from "@/app/api/guide/route";

const req = (body: string, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/guide", { method: "POST", body, headers });
const json = (message: string) => req(JSON.stringify({ message }));
const chat = {
  router_output: [routerReply("chitchat")],
  guide_response: [guideReply({ message: "Hello there." })],
};

describe("POST /api/guide", () => {
  it("creates no service client at import time", () => {
    expect(mocks.serviceCreated).toBe(0);
  });

  it("signed out returns 401 and makes no llm call", async () => {
    const t = arrange({ user: null, script: chat });
    const res = await POST(json("hi"));
    expect(res.status).toBe(401);
    expect(t.llm.calls).toHaveLength(0);
    expect(mocks.serviceCreated).toBe(0);
  });

  it("body over 4000 bytes returns 413 before any processing", async () => {
    const t = arrange({ user: { id: "u1" }, script: chat });
    const res = await POST(json("a".repeat(4001)));
    expect(res.status).toBe(413);
    const declared = await POST(req("{}", { "content-length": "99999" }));
    expect(declared.status).toBe(413);
    expect(t.getUser).not.toHaveBeenCalled();
    expect(t.llm.calls).toHaveLength(0);
  });

  it("oversized body with no Content-Length (stream) returns 413, zero llm calls", async () => {
    const t = arrange({ user: { id: "u1" }, script: chat });
    const chunk = new TextEncoder().encode("a".repeat(1000));
    let pulled = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(c) {
        pulled += 1;
        c.enqueue(chunk);
      },
    });
    const streamedReq = new Request("http://localhost/api/guide", {
      method: "POST",
      body,
      duplex: "half",
    } as RequestInit);
    expect((await POST(streamedReq)).status).toBe(413);
    expect(pulled).toBeLessThan(10);
    expect(t.llm.calls).toHaveLength(0);
  });

  it("multibyte body over 4000 bytes returns 413", async () => {
    arrange({ user: { id: "u1" }, script: chat });
    expect((await POST(json("€".repeat(1400)))).status).toBe(413);
  });

  it("returns 400 for invalid JSON and for a wrong shape", async () => {
    const t = arrange({ user: { id: "u1" }, script: chat });
    expect((await POST(req("{not json"))).status).toBe(400);
    expect((await POST(req(JSON.stringify({ message: 5 })))).status).toBe(400);
    expect(t.llm.calls).toHaveLength(0);
  });

  it("success returns 200 with Cache-Control: no-store and no key-like field", async () => {
    arrange({ user: { id: "u1" }, script: chat });
    const res = await POST(json("hello"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const text = await res.text();
    expect(text).not.toMatch(/api[_-]?key|secret|service_role|token/i);
    expect(JSON.parse(text).source).toBe("ai");
    expect(mocks.serviceCreated).toBe(1);
  });

  it("429 carries Retry-After", async () => {
    arrange({ user: { id: "u1" }, script: chat, db: { minuteCount: 6 } });
    const res = await POST(json("hello"));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("503 when the model providers fail, with no raw model text", async () => {
    arrange({
      user: { id: "u1" },
      script: { router_output: [fail("rate_limited")], guide_response: [fail()] },
    });
    const res = await POST(json("hello"));
    expect(res.status).toBe(503);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("an unexpected throw returns a generic 500 with no stack or message", async () => {
    arrange({ user: { id: "u1" }, script: chat });
    mocks.throwOnService = true;
    const res = await POST(json("hello"));
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).not.toMatch(/SECRET|stack|at \w+ \(/);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});
