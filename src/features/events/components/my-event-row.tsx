"use client";

import { useState, useTransition } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { logAttendedContribution, removeRsvp, setRsvp } from "@/features/events/actions";
import { formatEventTime } from "@/features/events/components/format";
import type { Rsvp, RsvpStatus } from "@/features/events/types";

type MyEventRowProps = {
  item: Rsvp;
  /** True once the event's start time has passed. */
  started: boolean;
  /** Called with the new status, or null once the RSVP is removed. */
  onStatusChange: (eventKey: string, next: RsvpStatus | null) => void;
};

/** One saved event in My events, with what you can do about it: say you went, log your time, or remove it. */
export function MyEventRow({ item, started, onStatusChange }: MyEventRowProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [minutes, setMinutes] = useState("60");

  function run(task: () => Promise<void>) {
    setError(null);
    setMessage(null);
    startTransition(task);
  }

  function markWent() {
    // Only an event with its sign-up link can be updated: the saved row is looked up by its key and
    // only its status changes.
    if (!item.url) return;
    const url = item.url;
    run(async () => {
      const result = await setRsvp({
        event: {
          eventKey: item.eventKey,
          title: item.title,
          organizer: null,
          url,
          startsAt: item.startsAt,
          timezone: item.timezone,
          isVirtual: false,
          city: null,
        },
        status: "attended",
      });
      if (!result.ok) setError(result.error);
      else onStatusChange(item.eventKey, result.data.status);
    });
  }

  function remove() {
    run(async () => {
      const result = await removeRsvp(item.eventKey);
      if (!result.ok) setError(result.error);
      else onStatusChange(item.eventKey, null);
    });
  }

  function addContribution() {
    run(async () => {
      const result = await logAttendedContribution({
        eventKey: item.eventKey,
        minutes: Number(minutes),
      });
      if (!result.ok) setError(result.error);
      else setMessage(result.message ?? "Added to your contributions.");
    });
  }

  return (
    <li className="flex flex-col gap-2 rounded-(--radius-input) bg-chip px-3.5 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">{item.title}</span>
        <span className="flex items-center gap-2 text-muted">
          {formatEventTime(item)}
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${item.title} with the organizer`}
              className="text-action"
            >
              <ExternalLink aria-hidden className="size-4" />
            </a>
          ) : null}
        </span>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        {item.status === "going" && started && item.url ? (
          <Button
            variant="outline"
            onClick={markWent}
            disabled={pending}
            aria-label={`I went to ${item.title}`}
          >
            I went
          </Button>
        ) : null}
        {item.status === "attended" ? (
          <>
            <label className="flex flex-col gap-1 text-xs font-semibold">
              Minutes you gave
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={1440}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className={`${inputClass} w-24`}
              />
            </label>
            <Button
              variant="outline"
              onClick={addContribution}
              disabled={pending}
              aria-label={`Add ${item.title} to my contributions`}
            >
              Add to my contributions
            </Button>
          </>
        ) : null}
        <Button
          variant="ghost"
          onClick={remove}
          disabled={pending}
          aria-label={`Remove ${item.title} from my list`}
        >
          Remove
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="text-xs font-semibold text-success">
          {message}
        </p>
      ) : null}
    </li>
  );
}
