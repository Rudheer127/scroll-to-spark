import { describe, expect, it } from "vitest";
import { buildCommentTree, type FlatComment } from "@/features/comments/tree";

function comment(overrides: Partial<FlatComment> & { id: string }): FlatComment {
  return {
    parentId: null,
    authorName: "maya_r",
    body: "Hello",
    createdAt: "2026-11-14T10:00:00Z",
    reactions: [],
    ...overrides,
  };
}

describe("buildCommentTree", () => {
  it("nests replies under their parent and keeps the oldest first", () => {
    const tree = buildCommentTree(
      [
        comment({ id: "c", parentId: "a", createdAt: "2026-11-14T10:05:00Z" }),
        comment({ id: "b", createdAt: "2026-11-14T10:01:00Z" }),
        comment({ id: "a", createdAt: "2026-11-14T10:00:00Z" }),
        comment({ id: "d", parentId: "c", createdAt: "2026-11-14T10:06:00Z" }),
      ],
      "me",
    );
    expect(tree.map((node) => node.id)).toEqual(["a", "b"]);
    expect(tree[0].children.map((node) => node.id)).toEqual(["c"]);
    expect(tree[0].children[0].children.map((node) => node.id)).toEqual(["d"]);
  });

  it("counts reactions and marks the ones you gave", () => {
    const [node] = buildCommentTree(
      [
        comment({
          id: "a",
          reactions: [
            { emoji: "❤️", userId: "me" },
            { emoji: "❤️", userId: "you" },
            { emoji: "🙌", userId: "you" },
          ],
        }),
      ],
      "me",
    );
    expect(node.reactions).toEqual([
      { emoji: "❤️", count: 2, mine: true },
      { emoji: "🙌", count: 1, mine: false },
    ]);
  });

  it("treats a reply whose parent is missing as a top level comment", () => {
    const tree = buildCommentTree([comment({ id: "a", parentId: "gone" })], "me");
    expect(tree).toHaveLength(1);
  });
});
