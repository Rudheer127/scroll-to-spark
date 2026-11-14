import { createClient } from "@/lib/supabase/server";
import { getConversationMessages, listConversations } from "./queries";
import { parseConversationId } from "./schemas";
import type { ConversationSummary, LoadedChat } from "./types";

/**
 * A saved chat of the signed-in person, for the /guide page and the load Server Action.
 * Null for a malformed id, a chat that does not exist, or one that is not theirs (RLS hides it),
 * so nothing tells them apart.
 */
export async function loadChatForCaller(rawId: unknown): Promise<LoadedChat | null> {
  const id = parseConversationId(rawId);
  if (id === undefined) return null;
  const messages = await getConversationMessages(await createClient(), id);
  return messages === null ? null : { id, messages };
}

/** The signed-in person's recent chats for the sidebar, or null when they could not be read. */
export async function listChatsForCaller(): Promise<ConversationSummary[] | null> {
  return listConversations(await createClient());
}
