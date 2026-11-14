import { CHATS_SAVED_NOTE } from "../guide-copy";
import { NewChatLink } from "./new-chat-link";

/**
 * The Chats part of the sidebar: a heading with New chat, the list (passed in, so the page can
 * stream it inside Suspense), and one honest line that chats are saved.
 */
export function ChatHistorySection({ children }: { children: React.ReactNode }) {
  return (
    <section aria-labelledby="sidebar-chats-heading" className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex items-center justify-between gap-2 pl-3.5">
        <h2 id="sidebar-chats-heading" className="text-sm font-semibold text-muted">
          Chats
        </h2>
        <NewChatLink />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      <p className="border-t border-border px-3.5 pt-2 text-xs leading-snug text-muted">
        {CHATS_SAVED_NOTE}
      </p>
    </section>
  );
}
