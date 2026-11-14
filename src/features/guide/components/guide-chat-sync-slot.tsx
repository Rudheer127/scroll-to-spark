import { getCurrentUser } from "@/features/auth/queries";
import { GuideChatSync } from "./guide-chat-sync";

/** Reads who is signed in, so the remembered chat is kept per person. Render inside Suspense. */
export async function GuideChatSyncSlot() {
  const user = await getCurrentUser();
  return user ? <GuideChatSync userId={user.id} /> : null;
}
