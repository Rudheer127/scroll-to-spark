import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUser = vi.fn();
vi.mock("@/features/auth/queries", () => ({ getCurrentUser: () => getCurrentUser() }));
// connection() only works inside a real request, so stand in for it here.
vi.mock("next/server", () => ({ connection: async () => undefined }));

import { AuthSwitch } from "@/features/landing/components/landing-actions";

describe("AuthSwitch", () => {
  beforeEach(() => getCurrentUser.mockReset());

  it("shows the signed-out version when nobody is signed in", async () => {
    getCurrentUser.mockResolvedValue(null);
    expect(await AuthSwitch({ signedOut: "sign in", signedIn: "open app" })).toBe("sign in");
  });

  it("shows the signed-in version when a user has a session", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    expect(await AuthSwitch({ signedOut: "sign in", signedIn: "open app" })).toBe("open app");
  });
});
