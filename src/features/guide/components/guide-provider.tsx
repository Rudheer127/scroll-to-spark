"use client";

import { createContext, useContext, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useGuideConversation, type GuideConversation } from "./use-guide-conversation";
import { useImageAttachment, type ImageAttachment } from "./use-image-attachment";

export type GuideContextValue = GuideConversation & {
  /** The text being written. Shared, so moving between the popup and the page keeps the draft. */
  draft: string;
  setDraft: (value: string) => void;
  attachment: ImageAttachment;
  /** True only when the server has image reading turned on. */
  imageInputEnabled: boolean;
  /** Whether the mini chat popup is open. */
  popupOpen: boolean;
  openPopup: () => void;
  closePopup: () => void;
  launcherRef: React.RefObject<HTMLButtonElement | null>;
  /** Clears the thread, the draft and any attached image, even while an answer is on its way. */
  startNewChat: () => void;
};

const GuideContext = createContext<GuideContextValue | null>(null);

/**
 * Holds the Spark Guide conversation for the whole signed-in app, so the popup and the full page
 * share one thread. It lives in the app layout, so moving between pages never resets it. When a
 * turn creates a new saved chat, the page data is refreshed so the sidebar lists it.
 */
export function GuideProvider({
  imageInputEnabled,
  children,
}: {
  imageInputEnabled: boolean;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const conversation = useGuideConversation({ onConversationCreated: () => router.refresh() });
  const attachment = useImageAttachment();
  const [draft, setDraft] = useState("");
  const [popupOpen, setPopupOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);

  const value: GuideContextValue = {
    ...conversation,
    draft,
    setDraft,
    attachment,
    imageInputEnabled,
    popupOpen,
    openPopup: () => setPopupOpen(true),
    closePopup: () => setPopupOpen(false),
    launcherRef,
    startNewChat: () => {
      conversation.loadConversation([], null);
      setDraft("");
      attachment.clear();
    },
  };

  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>;
}

export function useGuide(): GuideContextValue {
  const value = useContext(GuideContext);
  if (!value) throw new Error("useGuide must be used inside GuideProvider");
  return value;
}
