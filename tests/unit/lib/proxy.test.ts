import { describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const state = { user: null as { id: string } | null };
vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: async () => ({ response: NextResponse.next(), user: state.user }),
}));

import { proxy } from "@/proxy";

const call = (path: string) => proxy(new NextRequest(`http://localhost${path}`));

describe("proxy", () => {
  it("signed-out API request gets 401 JSON, not a redirect", async () => {
    state.user = null;
    const res = await call("/api/guide");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Please sign in." });
  });

  it("signed-out page request still redirects to /login", async () => {
    state.user = null;
    const res = await call("/steps");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/login");
  });

  it("signed-in API request passes through", async () => {
    state.user = { id: "u1" };
    expect((await call("/api/guide")).status).toBe(200);
  });
});
