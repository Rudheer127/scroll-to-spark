import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ConversationSummary, StoredMessage } from "./types";

/** How many chats the sidebar lists. */
export const CHAT_LIST_LIMIT = 30;
/** How many messages of one chat are loaded back. */
export const CHAT_MESSAGE_LIMIT = 200;

/**
 * The caller's chats, newest first. Uses the user session client, so RLS returns only their own.
 * One small query on the (user_id, updated_at desc) index. Returns null when it fails.
 */
export async function listConversations(
  db: SupabaseClient<Database>,
  limit = CHAT_LIST_LIMIT,
): Promise<ConversationSummary[] | null> {
  try {
    const { data, error } = await db
      .from("guide_conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error || !data) return null;
    return data.map((row) => ({ id: row.id, title: row.title, updatedAt: row.updated_at }));
  } catch {
    return null;
  }
}

const isRole = (role: string): role is StoredMessage["role"] =>
  role === "user" || role === "assistant";

/**
 * The latest messages of one chat, oldest first, or null when the chat does not exist, is not the
 * caller's (RLS hides it) or could not be read.
 */
export async function getConversationMessages(
  db: SupabaseClient<Database>,
  conversationId: string,
  limit = CHAT_MESSAGE_LIMIT,
): Promise<StoredMessage[] | null> {
  try {
    const [chat, messages] = await Promise.all([
      db.from("guide_conversations").select("id").eq("id", conversationId).maybeSingle(),
      db
        .from("guide_messages")
        .select("role, content, created_at")
        .eq("conversation_id", conversationId)
        // Newest first so a very long chat keeps its latest messages, then put back in order.
        .order("created_at", { ascending: false })
        .limit(limit),
    ]);
    if (chat.error || !chat.data || messages.error || !messages.data) return null;
    return messages.data
      .flatMap((row) =>
        isRole(row.role)
          ? [{ role: row.role, content: row.content, createdAt: row.created_at }]
          : [],
      )
      .reverse();
  } catch {
    return null;
  }
}
