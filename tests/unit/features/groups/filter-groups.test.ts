import { describe, expect, it } from "vitest";
import { filterGroups } from "@/features/groups/filter-groups";
import type { GroupSummary } from "@/features/groups/types";

function group(overrides: Partial<GroupSummary>): GroupSummary {
  return {
    id: "1",
    slug: "tiny-acts",
    name: "Tiny Acts",
    description: "Small things we do for our neighbors",
    color: "pink",
    isPrivate: false,
    memberCount: 3,
    isMember: false,
    isOwner: false,
    ...overrides,
  };
}

describe("filterGroups", () => {
  const groups = [
    group({ id: "1", name: "Tiny Acts" }),
    group({ id: "2", name: "Campus Cleanup", description: null }),
  ];

  it("returns everything for an empty search", () => {
    expect(filterGroups(groups, "  ")).toHaveLength(2);
  });

  it("matches the name and ignores case", () => {
    expect(filterGroups(groups, "cleanup").map((g) => g.id)).toEqual(["2"]);
  });

  it("matches the description", () => {
    expect(filterGroups(groups, "neighbors").map((g) => g.id)).toEqual(["1"]);
  });

  it("returns nothing when no group matches", () => {
    expect(filterGroups(groups, "zzz")).toEqual([]);
  });
});
