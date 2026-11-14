"use client";

import { createContext, useContext, useRef, useState } from "react";
import { useGuideConversation, type GuideConversation } from "./use-guide-conversation";
import { useImageAttachment, type ImageAttachment } from "./use-image-attachment";

type GuideView = "closed" | "popup" | "window";

export type GuideContextValue = GuideConversation & {
  /** The text being written. Shared, so expanding or minimizing keeps the draft. */
  draft: string;
  setDraft: (value: string) => void;
  attachment: ImageAttachment;
  /** True only when the server has image reading turned on. */
  imageInputEnabled: boolean;
  view: GuideView;
  openPopup: () => void;
  maximise: () => void;
  close: () => void;
  launcherRef: React.RefObject<HTMLButtonElement | null>;
};

const GuideContext = createContext<GuideContextValue | null>(null);

/**
 * Holds the Spark Guide conversation for the whole signed-in app, so the popup, the maximised
 * window and the full page share one thread.
 */
export function GuideProvider({
  imageInputEnabled,
  children,
}: {
  imageInputEnabled: boolean;
  children?: React.ReactNode;
}) {
  const conversation = useGuideConversation();
  const attachment = useImageAttachment();
  const [draft, setDraft] = useState("");
  const [view, setView] = useState<GuideView>("closed");
  const launcherRef = useRef<HTMLButtonElement>(null);

  const value: GuideContextValue = {
    ...conversation,
    draft,
    setDraft,
    attachment,
    imageInputEnabled,
    view,
    openPopup: () => setView("popup"),
    maximise: () => setView("window"),
    close: () => setView("closed"),
    launcherRef,
  };

  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>;
}

export function useGuide(): GuideContextValue {
  const value = useContext(GuideContext);
  if (!value) throw new Error("useGuide must be used inside GuideProvider");
  return value;
}
