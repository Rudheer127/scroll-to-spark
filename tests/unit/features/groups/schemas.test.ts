import { describe, expect, it } from "vitest";
import { createGroupSchema } from "@/features/groups/schemas";

const valid = { name: "Tiny Acts", description: "", isPrivate: false, color: "pink" };

describe("createGroupSchema", () => {
  it("accepts a valid group and turns an empty description into null", () => {
    const result = createGroupSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.description).toBeNull();
  });

  it("rejects a name that is too short", () => {
    expect(createGroupSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
  });

  it("rejects a name that is too long", () => {
    expect(createGroupSchema.safeParse({ ...valid, name: "a".repeat(61) }).success).toBe(false);
  });

  it("rejects a color that is not on the list", () => {
    expect(createGroupSchema.safeParse({ ...valid, color: "teal" }).success).toBe(false);
  });
});
