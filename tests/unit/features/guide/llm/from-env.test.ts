import { describe, expect, it } from "vitest";
import { buildLlmConfig, hasVision } from "@/features/guide/llm/from-env";

const OR_MODELS = {
  OPENROUTER_MODEL_MAIN: "nvidia/nemotron-3.5-super-vl:free",
  OPENROUTER_MODEL_FAST: "inclusionai/ling-3.2-flash:free",
  OPENROUTER_MODEL_FALLBACK: "openrouter/free",
};

describe("buildLlmConfig", () => {
  it("maps the primary provider and the keys", () => {
    const config = buildLlmConfig({
      LLM_PROVIDER: "groq",
      CEREBRAS_API_KEY: "c",
      GROQ_API_KEY: "g",
    });
    expect(config.primary).toBe("groq");
    expect(config.keys).toEqual({ openrouter: undefined, cerebras: "c", groq: "g" });
  });

  it("leaves a missing key undefined so the client skips that provider", () => {
    const config = buildLlmConfig({ LLM_PROVIDER: "cerebras", CEREBRAS_API_KEY: "c" });
    expect(config.primary).toBe("cerebras");
    expect(config.keys.groq).toBeUndefined();
  });

  it("makes openrouter the primary when LLM_PROVIDER is unset and an OpenRouter key exists", () => {
    expect(
      buildLlmConfig({ OPENROUTER_API_KEY: "o", GROQ_API_KEY: "g", ...OR_MODELS }).primary,
    ).toBe("openrouter");
    expect(buildLlmConfig({ GROQ_API_KEY: "g" }).primary).toBe("cerebras");
    expect(
      buildLlmConfig({ LLM_PROVIDER: "groq", OPENROUTER_API_KEY: "o", ...OR_MODELS }).primary,
    ).toBe("groq");
  });

  it("uses the fast model for the router, the vision default for images, and keeps the fallback", () => {
    const config = buildLlmConfig({ OPENROUTER_API_KEY: "o", ...OR_MODELS });
    expect(config.models?.openrouter).toEqual({
      main: "nvidia/nemotron-3.5-super-vl:free",
      router: "inclusionai/ling-3.2-flash:free",
      vision: "nvidia/nemotron-3.5-super-vl:free",
      fallback: "openrouter/free",
    });
  });
});

describe("hasVision", () => {
  it("is on with an OpenRouter key and the default models", () => {
    expect(hasVision(buildLlmConfig({ OPENROUTER_API_KEY: "o", ...OR_MODELS }))).toBe(true);
  });

  it("is off for cerebras or groq only, unless GUIDE_VISION_MODEL is set", () => {
    expect(
      hasVision(buildLlmConfig({ CEREBRAS_API_KEY: "c", GROQ_API_KEY: "g", ...OR_MODELS })),
    ).toBe(false);
    const config = buildLlmConfig({
      GROQ_API_KEY: "g",
      LLM_PROVIDER: "groq",
      GUIDE_VISION_MODEL: "some/vision-model",
    });
    expect(hasVision(config)).toBe(true);
    expect(config.models?.groq?.vision).toBe("some/vision-model");
  });

  it("GUIDE_VISION_MODEL replaces the OpenRouter default and is placed on one provider only", () => {
    const config = buildLlmConfig({
      OPENROUTER_API_KEY: "o",
      CEREBRAS_API_KEY: "c",
      GUIDE_VISION_MODEL: "x/eyes",
      ...OR_MODELS,
    });
    expect(config.models?.openrouter?.vision).toBe("x/eyes");
    expect(config.models?.cerebras?.vision).toBeUndefined();
  });

  it("is off when the vision provider has no key", () => {
    const config = buildLlmConfig({
      CEREBRAS_API_KEY: "c",
      GUIDE_VISION_MODEL: "x/eyes",
      GUIDE_VISION_PROVIDER: "groq",
    });
    expect(hasVision(config)).toBe(false);
  });
});
