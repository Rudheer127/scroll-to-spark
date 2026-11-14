"use client";

import { useRouter } from "next/navigation";

/** Shown when the chat list could not be read, with a way to try again. */
export function ChatHistoryError() {
  const router = useRouter();
  return (
    <div role="alert" className="flex flex-col items-start gap-1 px-3.5 py-2">
      <p className="text-sm text-muted">Your chats could not be loaded.</p>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="text-sm font-semibold text-action hover:underline"
      >
        Try again
      </button>
    </div>
  );
}
