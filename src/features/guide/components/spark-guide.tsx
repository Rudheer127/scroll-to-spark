"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { formatMinutes } from "@/lib/format-time";
import { suggestForMood, type GuideSuggestion } from "@/features/guide/actions";
import { MOODS } from "@/features/guide/moods";

type Turn = { mood: string; suggestion: GuideSuggestion };

/** A small helper that turns "how do you feel" into one real step. It picks from open tasks. */
export function SparkGuide() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, startTransition] = useTransition();

  function pick(id: string, label: string) {
    startTransition(async () => {
      const suggestion = await suggestForMood(id);
      setTurns((previous) => [...previous, { mood: label, suggestion }]);
    });
  }

  return (
    <div className="fixed right-4 bottom-4 z-20 flex flex-col items-end gap-3">
      {open ? (
        <section
          aria-label="Spark Guide"
          className="flex max-h-[32rem] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-(--radius-card) border border-border bg-surface shadow-pop"
        >
          <header className="flex items-center gap-2 border-b border-border bg-surface px-4 py-3">
            <Sparkles aria-hidden className="size-5 text-lavender-ink" />
            <h2 className="flex-1 text-lg font-bold">Spark Guide</h2>
            <button
              type="button"
              aria-label="Close Spark Guide"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 hover:bg-surface"
            >
              <X aria-hidden className="size-5" />
            </button>
          </header>
          <div className="flex flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
            <p className="rounded-2xl bg-chip px-3.5 py-2.5 text-sm">
              Hi, I am a simple guide, not a person. How are you feeling right now?
            </p>
            {turns.map((turn, index) => (
              <div key={index} className="flex flex-col gap-2">
                <p className="self-end rounded-2xl bg-ink px-3.5 py-2 text-sm font-semibold text-on-ink">
                  {turn.mood}
                </p>
                <p className="rounded-2xl bg-chip px-3.5 py-2.5 text-sm">{turn.suggestion.reply}</p>
                {turn.suggestion.task ? (
                  <Link
                    href={`/steps/${turn.suggestion.task.id}`}
                    onClick={() => setOpen(false)}
                    className="flex flex-col gap-0.5 rounded-2xl border border-border bg-background px-3.5 py-3 hover:border-action"
                  >
                    <span className="font-bold">{turn.suggestion.task.title}</span>
                    <span className="text-sm text-muted">
                      {turn.suggestion.task.groupName},{" "}
                      {formatMinutes(turn.suggestion.task.minutes)}
                    </span>
                    <span className="text-sm font-bold text-action">Let us do it</span>
                  </Link>
                ) : null}
              </div>
            ))}
            {pending ? <p className="text-sm text-muted">Finding something small</p> : null}
            <div className="flex flex-wrap gap-2">
              {MOODS.map((mood) => (
                <button
                  key={mood.id}
                  type="button"
                  disabled={pending}
                  onClick={() => pick(mood.id, mood.label)}
                  className="min-h-11 rounded-full border border-control bg-surface px-4 text-sm font-bold hover:bg-chip disabled:opacity-60"
                >
                  {mood.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-12 items-center gap-2 rounded-full bg-ink px-5 font-semibold text-on-ink shadow-pop hover:opacity-90"
      >
        <Sparkles aria-hidden className="size-5" />
        Spark Guide
      </button>
    </div>
  );
}
