"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
};

/** A modal dialog built on the native dialog element. It sits above the page, so it is centered. */
export function Dialog({ open, onClose, title, description, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-0 backdrop:bg-black/50"
    >
      <div className="flex flex-col gap-5 p-7">
        <header className="flex items-start gap-4">
          <div className="flex flex-1 flex-col gap-1">
            <h2 id={titleId} className="text-xl font-bold">
              {title}
            </h2>
            {description ? <p className="text-sm text-muted">{description}</p> : null}
          </div>
          <Button variant="ghost" aria-label="Close" onClick={onClose} className="p-2">
            <X aria-hidden className="size-5" />
          </Button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
