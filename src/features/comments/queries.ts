import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/queries";
import { getBlockedIds } from "@/features/threads/blocks";
import { signImagePaths } from "@/features/threads/images";
import { loose } from "@/features/threads/loose-db";
import { isGiphyMediaUrl } from "@/features/comments/gifs";
import { buildCommentTree, type CommentNode, type FlatComment } from "@/features/comments/tree";

type CommentRow = {
  id: string;
  parent_id: string | null;
  author_id: string;
  body: string | null;
  created_at: string;
  profiles: { username: string };
  comment_reactions: { emoji: string; user_id: string }[];
  comment_votes: { user_id: string; value: number }[];
  attachment_kind: string | null;
  attachment_url: string | null;
  image_alt: string | null;
  hidden: boolean;
};

/** All comments on a thread, nested under the comment they reply to. */
export async function getCommentTree(threadId: string): Promise<CommentNode[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await loose(supabase)
    .from("comments")
    .select(
      "id, parent_id, author_id, body, created_at, profiles!comments_author_id_fkey(username), comment_reactions(emoji, user_id), comment_votes(user_id, value), attachment_kind, attachment_url, image_alt, hidden",
    )
    .eq("thread_id", threadId);
  if (error) throw new Error(`Could not load comments: ${error.message}`);

  const rows = data as unknown as CommentRow[];
  const [blockedIds, imageUrls] = await Promise.all([
    getBlockedIds(user.id),
    signImagePaths(
      supabase,
      rows.map((row) => (row.attachment_kind === "image" ? row.attachment_url : null)),
    ),
  ]);

  // Hidden and blocked comments stay in the tree so their replies keep their place,
  // but their words and pictures are never sent to the reader.
  const flat: FlatComment[] = rows.map((row) => {
    const blocked = blockedIds.has(row.author_id);
    const concealed = blocked || (row.hidden && row.author_id !== user.id);
    return {
      id: row.id,
      parentId: row.parent_id,
      authorId: row.author_id,
      authorName: row.profiles.username,
      body: concealed ? null : row.body,
      createdAt: row.created_at,
      reactions: concealed
        ? []
        : row.comment_reactions.map((r) => ({ emoji: r.emoji, userId: r.user_id })),
      votes: concealed ? [] : row.comment_votes.map((v) => ({ userId: v.user_id, value: v.value })),
      imageUrl:
        concealed || !row.attachment_url
          ? null
          : row.attachment_kind === "gif"
            ? isGiphyMediaUrl(row.attachment_url)
              ? row.attachment_url
              : null
            : (imageUrls.get(row.attachment_url) ?? null),
      imageAlt: concealed ? null : row.image_alt,
      hidden: row.hidden,
      blocked,
    };
  });
  return buildCommentTree(flat, user.id);
}
