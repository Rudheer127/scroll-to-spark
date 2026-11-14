"use client";

import { useRouter } from "next/navigation";
import { SquarePen } from "lucide-react";
import { useGuide } from "../guide-provider";

/** Clears the guide chat and opens a fresh one on the guide page. Saved chats stay in the list. */
export function NewChatLink() {
  const { startNewChat } = useGuide();
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        startNewChat();
        router.push("/guide");
      }}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink hover:bg-chip active:opacity-75"
    >
      <SquarePen aria-hidden className="size-4" />
      New chat
    </button>
  );
}
