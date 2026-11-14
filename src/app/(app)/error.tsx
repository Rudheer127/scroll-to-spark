"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** Shown when something fails while loading a signed-in screen. It always offers a way to retry. */
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="text-muted">
        We could not load this page. Your changes are safe. Try again, and if it keeps happening,
        come back in a few minutes.
      </p>
      <div>
        <Button onClick={() => retry()}>Try again</Button>
      </div>
    </div>
  );
}
