import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/queries";
import { buildCommentTree, type CommentNode, type FlatComment } from "@/features/comments/tree";

type CommentRow = {
  id: string;
  parent_id: string | null;
  author_id: string;
  body: string | null;
  created_at: string;
  profiles: { username: string };
  comment_reactions: { emoji: string; user_id: string }[];
};

/** All comments on a thread, nested under the comment they reply to. */
export async function getCommentTree(threadId: string): Promise<CommentNode[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select(
      "id, parent_id, author_id, body, created_at, profiles!comments_author_id_fkey(username), comment_reactions(emoji, user_id)",
    )
    .eq("thread_id", threadId);
  if (error) throw new Error(`Could not load comments: ${error.message}`);

  const flat: FlatComment[] = (data as unknown as CommentRow[]).map((row) => ({
    id: row.id,
    parentId: row.parent_id,
    authorId: row.author_id,
    authorName: row.profiles.username,
    body: row.body,
    createdAt: row.created_at,
    reactions: row.comment_reactions.map((r) => ({ emoji: r.emoji, userId: r.user_id })),
  }));
  return buildCommentTree(flat, user.id);
}
