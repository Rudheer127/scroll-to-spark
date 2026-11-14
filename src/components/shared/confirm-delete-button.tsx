"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/result";

type ConfirmDeleteButtonProps = {
  label: string;
  /** What is lost, said in plain words, shown after the first click. */
  warning: string;
  onConfirm: () => Promise<ActionResult | void>;
};

/** Two clicks to delete: the first asks, the second does it. No pop-up needed. */
export function ConfirmDeleteButton({ label, warning, onConfirm }: ConfirmDeleteButtonProps) {
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await onConfirm();
      if (result && !result.ok) {
        setError(result.error);
        return;
      }
      setAsking(false);
    });
  }

  if (!asking) {
    return (
      <Button variant="ghost" onClick={() => setAsking(true)} className="px-2 text-danger">
        <Trash2 aria-hidden className="size-4" />
        {label}
      </Button>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-label={label}
      className="flex flex-wrap items-center gap-2 text-sm"
    >
      <span className="text-muted">{warning}</span>
      <Button variant="danger" onClick={handleConfirm} disabled={pending}>
        {pending ? "Deleting" : "Yes, delete"}
      </Button>
      <Button variant="ghost" onClick={() => setAsking(false)} disabled={pending}>
        Keep it
      </Button>
      {error ? (
        <span role="alert" className="text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}
