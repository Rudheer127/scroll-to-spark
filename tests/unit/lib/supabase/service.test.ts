import { afterEach, describe, expect, it, vi } from "vitest";
import { createServiceClient } from "@/lib/supabase/service";

describe("createServiceClient", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("builds a client from server env without throwing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    vi.stubEnv("CEREBRAS_API_KEY", "c");
    expect(typeof createServiceClient().from).toBe("function");
  });

  it("throws when the service role key is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("CEREBRAS_API_KEY", "c");
    expect(() => createServiceClient()).toThrow();
  });
});
