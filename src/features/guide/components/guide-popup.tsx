"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useGuide } from "./guide-provider";
import { POPUP_INPUT_ID, PopupChat } from "./popup-chat";

/**
 * The one Spark Guide entry outside the guide page: a floating button that opens the mini chat.
 * It is not shown on the guide page, which has the full chat, so there is never a second
 * composer on screen.
 */
export function GuidePopup() {
  const pathname = usePathname();
  const { popupOpen, openPopup, launcherRef } = useGuide();
  const wasOpen = useRef(popupOpen);

  useEffect(() => {
    if (popupOpen) document.getElementById(POPUP_INPUT_ID)?.focus();
    else if (wasOpen.current) launcherRef.current?.focus();
    wasOpen.current = popupOpen;
  }, [popupOpen, launcherRef]);

  if (pathname.startsWith("/guide")) return null;

  return (
    <div className="fixed right-4 bottom-20 z-40 flex flex-col items-end gap-3 sm:right-6 lg:bottom-6">
      {popupOpen ? (
        <PopupChat />
      ) : (
        <button
          ref={launcherRef}
          type="button"
          aria-expanded={false}
          onClick={openPopup}
          className="flex min-h-12 items-center gap-2 rounded-full bg-ink px-5 font-semibold text-on-ink shadow-pop hover:opacity-90 active:opacity-75"
        >
          <Sparkles aria-hidden className="size-5" />
          Spark Guide
        </button>
      )}
    </div>
  );
}
