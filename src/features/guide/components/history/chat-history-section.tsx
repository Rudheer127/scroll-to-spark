import { NewChatLink } from "./new-chat-link";

/**
 * The Chats part of the sidebar: a heading with New chat, the list (passed in, so the page can
 * stream it inside Suspense).
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
    </section>
  );
}
