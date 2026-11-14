import { describe, expect, it } from "vitest";
import { buildLlmConfig } from "@/features/guide/llm/from-env";

describe("buildLlmConfig", () => {
  it("maps the primary provider and both keys", () => {
    expect(
      buildLlmConfig({ LLM_PROVIDER: "groq", CEREBRAS_API_KEY: "c", GROQ_API_KEY: "g" }),
    ).toEqual({ primary: "groq", keys: { cerebras: "c", groq: "g" } });
  });

  it("leaves a missing key undefined so the client skips that provider", () => {
    const config = buildLlmConfig({ LLM_PROVIDER: "cerebras", CEREBRAS_API_KEY: "c" });
    expect(config.primary).toBe("cerebras");
    expect(config.keys.groq).toBeUndefined();
  });
});
