import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { GuideResponse } from "./schemas";

/**
 * Saves the user turn through the user session client (RLS forces role 'user'). Called right
 * after the rate limit passes and before any model call, so the turn counts against the limit.
 * Returns false on any failure so the caller can fail closed.
 */
export async function insertUserTurn(
  db: SupabaseClient<Database>,
  userId: string,
  userText: string,
): Promise<boolean> {
  try {
    const { error } = await db
      .from("guide_messages")
      .insert({ user_id: userId, role: "user", content: userText });
    return !error;
  } catch {
    return false;
  }
}

/** Saves the assistant turn through the service client. Never throws into the reply. */
export async function persistAssistantTurn(
  admin: SupabaseClient<Database>,
  userId: string,
  response: GuideResponse,
): Promise<void> {
  try {
    await admin.from("guide_messages").insert({
      user_id: userId,
      role: "assistant",
      content: response.message,
      intent: response.intent,
    });
  } catch {
    // Intentionally ignored: a failed save must not hide the answer.
  }
}
