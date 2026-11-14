import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateSession = vi.fn();
vi.mock("@/lib/supabase/middleware", () => ({ updateSession: () => updateSession() }));

import { proxy } from "@/proxy";

function signedOut() {
  updateSession.mockResolvedValue({ response: NextResponse.next(), user: null });
}
function signedIn() {
  updateSession.mockResolvedValue({ response: NextResponse.next(), user: { id: "u1" } });
}
const request = (path: string) => new NextRequest(`http://localhost:3000${path}`);
const rewriteTarget = (res: Response) => res.headers.get("x-middleware-rewrite");

describe("proxy", () => {
  beforeEach(() => updateSession.mockReset());

  it("shows the landing page at / to a signed-out visitor without changing the address", async () => {
    signedOut();
    const res = await proxy(request("/"));
    expect(rewriteTarget(res)).toBe("http://localhost:3000/welcome");
    expect(res.status).toBe(200);
  });

  it("lets a signed-in person reach the app at /", async () => {
    signedIn();
    const res = await proxy(request("/"));
    expect(rewriteTarget(res)).toBeNull();
    expect(res.headers.get("location")).toBeNull();
  });

  it("keeps the landing page public for both signed-out and signed-in people", async () => {
    signedOut();
    expect((await proxy(request("/welcome"))).headers.get("location")).toBeNull();
    signedIn();
    expect((await proxy(request("/welcome"))).headers.get("location")).toBeNull();
  });

  it("sends a signed-out visitor to login for private pages", async () => {
    signedOut();
    const res = await proxy(request("/steps"));
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("sends a signed-in person away from login and signup", async () => {
    signedIn();
    for (const path of ["/login", "/signup"]) {
      const res = await proxy(request(path));
      expect(res.headers.get("location")).toBe("http://localhost:3000/");
    }
  });

  it("keeps the sign-in pages public for a signed-out visitor", async () => {
    signedOut();
    for (const path of ["/login", "/signup", "/forgot-password"]) {
      expect((await proxy(request(path))).headers.get("location")).toBeNull();
    }
  });
});
