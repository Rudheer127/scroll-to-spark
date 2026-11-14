import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { GuideResponse } from "./schemas";

/**
 * Saves both turns after an answer. The user row goes through the user session client (RLS forces
 * role 'user'); the assistant row goes through the service client. Never throws into the reply.
 */
export async function persistTurns(
  db: SupabaseClient<Database>,
  admin: SupabaseClient<Database>,
  userId: string,
  userText: string,
  response: GuideResponse,
): Promise<void> {
  try {
    await db.from("guide_messages").insert({ user_id: userId, role: "user", content: userText });
  } catch {
    // Intentionally ignored: a failed save must not hide the answer.
  }
  try {
    await admin.from("guide_messages").insert({
      user_id: userId,
      role: "assistant",
      content: response.message,
      intent: response.intent,
    });
  } catch {
    // Intentionally ignored.
  }
}
