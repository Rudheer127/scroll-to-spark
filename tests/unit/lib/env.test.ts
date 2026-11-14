import { afterEach, describe, expect, it, vi } from "vitest";
import { getServerEnv } from "@/lib/env";

function baseEnv() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
  vi.stubEnv("CEREBRAS_API_KEY", "");
  vi.stubEnv("GROQ_API_KEY", "");
  vi.stubEnv("LLM_PROVIDER", "");
}

afterEach(() => vi.unstubAllEnvs());

describe("getServerEnv", () => {
  it("requires at least one of CEREBRAS_API_KEY or GROQ_API_KEY", () => {
    baseEnv();
    expect(() => getServerEnv()).toThrow();
  });

  it("accepts a single key and defaults the provider to cerebras", () => {
    baseEnv();
    vi.stubEnv("GROQ_API_KEY", "g");
    const env = getServerEnv();
    expect(env.LLM_PROVIDER).toBe("cerebras");
    expect(env.GROQ_API_KEY).toBe("g");
    expect(env.CEREBRAS_API_KEY).toBeUndefined();
  });

  it("rejects an unknown provider", () => {
    baseEnv();
    vi.stubEnv("CEREBRAS_API_KEY", "c");
    vi.stubEnv("LLM_PROVIDER", "other");
    expect(() => getServerEnv()).toThrow();
  });
});
