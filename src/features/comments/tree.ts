export type FlatComment = {
  id: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  body: string | null;
  createdAt: string;
  reactions: { emoji: string; userId: string }[];
};

export type ReactionCount = { emoji: string; count: number; mine: boolean };

export type CommentNode = {
  id: string;
  authorId: string;
  authorName: string;
  body: string | null;
  createdAt: string;
  reactions: ReactionCount[];
  children: CommentNode[];
};

function countReactions(reactions: FlatComment["reactions"], userId: string): ReactionCount[] {
  const byEmoji = new Map<string, ReactionCount>();
  for (const { emoji, userId: reactor } of reactions) {
    const entry = byEmoji.get(emoji) ?? { emoji, count: 0, mine: false };
    entry.count += 1;
    if (reactor === userId) entry.mine = true;
    byEmoji.set(emoji, entry);
  }
  return [...byEmoji.values()];
}

/** Turn a flat list into replies nested under their parent, oldest first at every level. */
export function buildCommentTree(items: FlatComment[], userId: string): CommentNode[] {
  const sorted = [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const nodes = new Map<string, CommentNode>(
    sorted.map((item) => [
      item.id,
      {
        id: item.id,
        authorId: item.authorId,
        authorName: item.authorName,
        body: item.body,
        createdAt: item.createdAt,
        reactions: countReactions(item.reactions, userId),
        children: [],
      },
    ]),
  );

  const roots: CommentNode[] = [];
  for (const item of sorted) {
    const node = nodes.get(item.id);
    if (!node) continue;
    const parent = item.parentId ? nodes.get(item.parentId) : undefined;
    (parent ? parent.children : roots).push(node);
  }
  return roots;
}
