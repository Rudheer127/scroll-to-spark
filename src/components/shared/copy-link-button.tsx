"use client";

import { useEffect, useState } from "react";
import { Check, Share2 } from "lucide-react";

/** Copies the address of a page to the clipboard and says so in a short toast. */
export function CopyLinkButton({ path }: { path: string }) {
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setToast({ text: "Link copied", ok: true });
    } catch {
      setToast({ text: "Could not copy. Copy the address from your browser bar.", ok: false });
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-chip px-4 text-sm font-extrabold active:opacity-75 md:min-h-9"
      >
        {toast?.ok ? (
          <Check aria-hidden className="size-4" />
        ) : (
          <Share2 aria-hidden className="size-4" />
        )}
        Share
      </button>
      {toast ? (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-50 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-center text-sm font-semibold text-on-ink shadow-card md:bottom-8"
        >
          {toast.text}
        </div>
      ) : null}
    </>
  );
}
