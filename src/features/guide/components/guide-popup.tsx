"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { GuideChat } from "./guide-chat";

/**
 * A floating button that opens the guide beside the page. The panel stays mounted while closed,
 * so a conversation survives closing it. It is not shown on the full guide page.
 */
export function GuidePopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const inputId = useId();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) document.getElementById(inputId)?.focus();
    else if (wasOpen.current) launcherRef.current?.focus();
    wasOpen.current = open;
  }, [open, inputId]);

  if (pathname.startsWith("/guide")) return null;

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      <section
        aria-label="Spark Guide"
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        className={cn(
          "h-[min(40rem,calc(100dvh-7rem))] w-[min(26rem,calc(100vw-2rem))] flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-lg",
          open ? "flex" : "hidden",
        )}
      >
        <header className="flex items-center gap-2">
          <h2 className="flex-1 text-base font-bold">Spark Guide</h2>
          <Link
            href="/guide"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-action hover:underline md:min-h-0"
          >
            Open full page
          </Link>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            <X aria-hidden className="size-4" />
            Close
          </Button>
        </header>
        <div className="min-h-0 flex-1">
          <GuideChat variant="popup" inputId={inputId} />
        </div>
      </section>
      {open ? null : (
        <Button ref={launcherRef} variant="brand" onClick={() => setOpen(true)}>
          <Sparkles aria-hidden className="size-4" />
          Ask the guide
        </Button>
      )}
    </div>
  );
}
