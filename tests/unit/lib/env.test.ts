import { afterEach, describe, expect, it, vi } from "vitest";
import { getLlmEnv, getServerEnv } from "@/lib/env";

function baseEnv() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
  vi.stubEnv("CEREBRAS_API_KEY", "");
  vi.stubEnv("GROQ_API_KEY", "");
  vi.stubEnv("LLM_PROVIDER", "");
  vi.stubEnv("OPENROUTER_API_KEY", "");
  vi.stubEnv("OPENROUTER_MODEL_MAIN", "");
  vi.stubEnv("OPENROUTER_MODEL_FAST", "");
  vi.stubEnv("OPENROUTER_MODEL_FALLBACK", "");
  vi.stubEnv("GUIDE_VISION_MODEL", "");
  vi.stubEnv("GUIDE_VISION_PROVIDER", "");
}

afterEach(() => vi.unstubAllEnvs());

describe("getServerEnv", () => {
  it("requires at least one of OPENROUTER_API_KEY, CEREBRAS_API_KEY or GROQ_API_KEY", () => {
    baseEnv();
    expect(() => getServerEnv()).toThrow();
  });

  it("accepts a single key and leaves the provider unset for buildLlmConfig to resolve", () => {
    baseEnv();
    vi.stubEnv("GROQ_API_KEY", "g");
    const env = getServerEnv();
    expect(env.LLM_PROVIDER).toBeUndefined();
    expect(env.GROQ_API_KEY).toBe("g");
    expect(env.CEREBRAS_API_KEY).toBeUndefined();
  });

  it("rejects an unknown provider", () => {
    baseEnv();
    vi.stubEnv("CEREBRAS_API_KEY", "c");
    vi.stubEnv("LLM_PROVIDER", "other");
    expect(() => getServerEnv()).toThrow();
  });

  it("accepts an OpenRouter key alone and fills the default OpenRouter models", () => {
    baseEnv();
    vi.stubEnv("OPENROUTER_API_KEY", "or-test");
    const env = getServerEnv();
    expect(env.OPENROUTER_MODEL_MAIN).toBe("nvidia/nemotron-3.5-super-vl:free");
    expect(env.OPENROUTER_MODEL_FAST).toBe("inclusionai/ling-3.2-flash:free");
    expect(env.OPENROUTER_MODEL_FALLBACK).toBe("openrouter/free");
    expect(env.GUIDE_VISION_MODEL).toBeUndefined();
  });

  it("lets env override every OpenRouter model and the vision model", () => {
    baseEnv();
    vi.stubEnv("OPENROUTER_API_KEY", "or-test");
    vi.stubEnv("LLM_PROVIDER", "openrouter");
    vi.stubEnv("OPENROUTER_MODEL_MAIN", "a/main");
    vi.stubEnv("OPENROUTER_MODEL_FAST", "a/fast");
    vi.stubEnv("OPENROUTER_MODEL_FALLBACK", "a/back");
    vi.stubEnv("GUIDE_VISION_MODEL", "a/eyes");
    vi.stubEnv("GUIDE_VISION_PROVIDER", "openrouter");
    const env = getServerEnv();
    expect(env).toMatchObject({
      LLM_PROVIDER: "openrouter",
      OPENROUTER_MODEL_MAIN: "a/main",
      OPENROUTER_MODEL_FAST: "a/fast",
      OPENROUTER_MODEL_FALLBACK: "a/back",
      GUIDE_VISION_MODEL: "a/eyes",
      GUIDE_VISION_PROVIDER: "openrouter",
    });
  });
});

describe("getLlmEnv", () => {
  it("reads the AI settings even when the database key is missing", () => {
    baseEnv();
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("OPENROUTER_API_KEY", "or-test");
    expect(() => getServerEnv()).toThrow();
    expect(getLlmEnv().OPENROUTER_MODEL_MAIN).toBe("nvidia/nemotron-3.5-super-vl:free");
  });

  it("still requires one AI key", () => {
    baseEnv();
    expect(() => getLlmEnv()).toThrow();
  });
});
