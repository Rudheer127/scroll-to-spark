import { listChatsForCaller } from "../../load-chat";
import { ChatHistoryError } from "./chat-history-error";
import { ChatHistoryList } from "./chat-history-list";

/** The signed-in person's recent chats. One small indexed query. Render inside Suspense. */
export async function ChatHistory() {
  const chats = await listChatsForCaller();
  if (chats === null) return <ChatHistoryError />;
  return <ChatHistoryList chats={chats} />;
}
