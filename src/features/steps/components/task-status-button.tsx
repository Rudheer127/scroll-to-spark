"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setTaskOpen } from "@/features/steps/actions";

/** Close a task so nobody new sees it, or open it again. */
export function TaskStatusButton({ taskId, isOpen }: { taskId: string; isOpen: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    setError(null);
    startTransition(async () => {
      const result = await setTaskOpen(taskId, !isOpen);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant="outline" onClick={toggle} disabled={pending}>
        {pending ? "Saving" : isOpen ? "Close task" : "Open again"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
