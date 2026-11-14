import type { LoadedChat } from "../types";
import { GuideChat } from "./guide-chat";
import { GuideChatLoader } from "./guide-chat-loader";
import { NewChatButton } from "./new-chat-button";

type GuidePageProps = {
  /** The chat id in the address, if any. */
  requested: string | null;
  /** That chat when it is the signed-in person's, read on the server. */
  chat: LoadedChat | null;
};

/**
 * The full page view: a small, quiet title row, then the chat filling the rest of the height.
 * It shows the same conversation as the popup, and opens a saved chat from the address.
 */
export function GuidePage({ requested, chat }: GuidePageProps) {
  return (
    <div className="flex h-[calc(100dvh-8rem)] min-h-[28rem] flex-col gap-2">
      <GuideChatLoader requested={requested} chat={chat} />
      <header className="flex items-center gap-4">
        <h1 className="min-w-0 flex-1 text-lg font-bold">Spark Guide</h1>
        <div className="shrink-0">
          <NewChatButton />
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <GuideChat inputId="guide-input-page" />
      </div>
    </div>
  );
}
