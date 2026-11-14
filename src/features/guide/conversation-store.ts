import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Returns the chat this turn belongs to. A requested id is never trusted: it is read back through
 * the user session client (RLS) and used only when it exists and is the caller's. Otherwise a new
 * chat is created through the same client. Returns null when nothing could be saved, so the caller
 * can fail closed.
 */
export async function resolveConversation(
  db: SupabaseClient<Database>,
  userId: string,
  requestedId: string | undefined,
  title: string,
): Promise<string | null> {
  try {
    if (requestedId !== undefined) {
      const { data, error } = await db
        .from("guide_conversations")
        .select("id")
        .eq("id", requestedId)
        .eq("user_id", userId)
        .maybeSingle();
      if (!error && data) return data.id;
    }
    const { data, error } = await db
      .from("guide_conversations")
      .insert({ user_id: userId, title })
      .select("id")
      .single();
    return error || !data ? null : data.id;
  } catch {
    return null;
  }
}

/** Moves the chat to the top of the list. Service client, since clients have no update grant. */
export async function touchConversation(
  admin: SupabaseClient<Database>,
  conversationId: string,
): Promise<void> {
  try {
    await admin
      .from("guide_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  } catch {
    // Intentionally ignored: the list order is a convenience, the answer still goes out.
  }
}
