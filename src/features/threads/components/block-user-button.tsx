"use client";

import { useState, useTransition } from "react";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blockUser, unblockUser } from "@/features/threads/reports";

/** Block someone in two clicks. Their posts are hidden from you, and nobody else is told. */
export function BlockUserButton({ userId, name }: { userId: string; name: string }) {
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await blockUser(userId);
      if (!result.ok) setError(result.error);
      else setAsking(false);
    });
  }

  if (!asking) {
    return (
      <Button variant="ghost" onClick={() => setAsking(true)} className="px-2">
        <Ban aria-hidden className="size-4" />
        Block<span className="sr-only"> {name}</span>
      </Button>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-label={`Block ${name}`}
      className="flex flex-wrap items-center gap-2 text-sm"
    >
      <span className="text-muted [overflow-wrap:anywhere]">
        Hide everything from {name}? They are not told. You can undo this.
      </span>
      <Button variant="danger" onClick={confirm} disabled={pending}>
        {pending ? "Blocking" : "Yes, block"}
      </Button>
      <Button variant="ghost" onClick={() => setAsking(false)} disabled={pending}>
        Cancel
      </Button>
      {error ? (
        <span role="alert" className="text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/** The list of people you blocked, each with an Unblock button. */
export function BlockedList({ users }: { users: { id: string; username: string }[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (users.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 rounded-(--radius-card) border border-border bg-surface p-5 shadow-card">
      <h2 className="text-base font-semibold">People you blocked</h2>
      <ul className="flex flex-col gap-2">
        {users.map((user) => (
          <li key={user.id} className="flex min-w-0 items-center justify-between gap-3 text-sm">
            <span className="min-w-0 font-semibold [overflow-wrap:anywhere]">{user.username}</span>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const result = await unblockUser(user.id);
                  if (!result.ok) setError(result.error);
                })
              }
            >
              Unblock<span className="sr-only"> {user.username}</span>
            </Button>
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}
