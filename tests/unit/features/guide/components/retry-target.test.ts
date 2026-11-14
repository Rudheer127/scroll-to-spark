import { describe, expect, it } from "vitest";
import { retryTarget } from "@/features/guide/components/retry-target";

const items = [
  { id: 0, role: "user", text: "first" },
  { id: 1, role: "assistant" },
  { id: 2, role: "user", text: "second" },
  { id: 3, role: "assistant" },
] as const;

describe("retryTarget", () => {
  it("returns the nearest earlier user text and the bubble to replace", () => {
    expect(retryTarget(items, 3)).toEqual({ text: "second", replaceId: 3 });
    expect(retryTarget(items, 1)).toEqual({ text: "first", replaceId: 1 });
  });
  it("returns null for an unknown id, a user bubble, or no earlier user message", () => {
    expect(retryTarget(items, 99)).toBeNull();
    expect(retryTarget(items, 2)).toBeNull();
    expect(retryTarget([{ id: 5, role: "assistant" }], 5)).toBeNull();
  });
});
