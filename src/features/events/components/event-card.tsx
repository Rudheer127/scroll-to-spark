"use client";

import { useState, useTransition } from "react";
import { CalendarDays, Check, ExternalLink, MapPin, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { logAttendedContribution, removeRsvp, setRsvp } from "@/features/events/actions";
import { formatEventTime, formatPlace } from "@/features/events/components/format";
import type { CivicEvent, RsvpStatus } from "@/features/events/types";

type EventCardProps = {
  event: CivicEvent;
  status: RsvpStatus | null;
  distanceMiles: number | null;
  /** Called with the new status, or null once the RSVP is removed. */
  onStatusChange: (eventKey: string, next: RsvpStatus | null) => void;
};

/** One event, with the organizer's sign-up link and the person's own "I'm going" note. */
export function EventCard({ event, status, distanceMiles, onStatusChange }: EventCardProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [minutes, setMinutes] = useState("60");
  const [now] = useState(() => Date.now());
  const started = new Date(event.startsAt).getTime() <= now;
  const PlaceIcon = event.isVirtual ? Video : MapPin;

  function save(next: RsvpStatus) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await setRsvp({
        event: {
          eventKey: event.key,
          title: event.title,
          organizer: event.organizer,
          url: event.url,
          startsAt: event.startsAt,
          timezone: event.timezone,
          isVirtual: event.isVirtual,
          city: event.city,
        },
        status: next,
      });
      if (!result.ok) setError(result.error);
      else onStatusChange(event.key, result.data.status);
    });
  }

  function remove() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await removeRsvp(event.key);
      if (!result.ok) setError(result.error);
      else onStatusChange(event.key, null);
    });
  }

  function addContribution() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await logAttendedContribution({
        eventKey: event.key,
        minutes: Number(minutes),
      });
      if (!result.ok) setError(result.error);
      else setMessage(result.message ?? "Added to your contributions.");
    });
  }

  return (
    <li className="flex flex-col gap-3 rounded-(--radius-card) border border-border bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="rounded-full bg-chip px-2.5 py-0.5">{event.kind}</span>
        {event.isSample ? (
          <span className="rounded-full bg-lavender-soft px-2.5 py-0.5 text-lavender-ink">
            Sample event, not real
          </span>
        ) : null}
        {status ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-soft px-2.5 py-0.5 text-teal-ink">
            <Check aria-hidden className="size-3" />
            {status === "attended" ? "You said you went" : "On your list"}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold">{event.title}</h3>
        <p className="text-sm text-muted">{event.organizer}</p>
      </div>
      {event.summary ? <p className="text-sm">{event.summary}</p> : null}
      <dl className="flex flex-col gap-1 text-sm text-muted">
        <div className="flex items-start gap-2">
          <dt className="sr-only">When</dt>
          <CalendarDays aria-hidden className="mt-0.5 size-4 shrink-0" />
          <dd>{formatEventTime(event)}</dd>
        </div>
        <div className="flex items-start gap-2">
          <dt className="sr-only">Where</dt>
          <PlaceIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
          <dd>
            {formatPlace(event)}
            {distanceMiles !== null ? ` · ${Math.max(1, Math.round(distanceMiles))} mi away` : ""}
          </dd>
        </div>
      </dl>

      {event.isSample ? (
        <p className="text-sm text-muted">
          This is an example so the page is not empty. It has no sign-up page and cannot be saved.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {event.url ? (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses("brand")}
              >
                Sign up on the organizer&apos;s page
                <ExternalLink aria-hidden className="size-4" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : null}
            {status ? (
              <Button variant="outline" onClick={remove} disabled={pending}>
                Remove from my list
              </Button>
            ) : (
              <Button variant="outline" onClick={() => save("going")} disabled={pending}>
                I&apos;m going
              </Button>
            )}
            {status === "going" && started ? (
              <Button variant="outline" onClick={() => save("attended")} disabled={pending}>
                I went
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted">
            &ldquo;I&apos;m going&rdquo; only saves this in your Spark list. It does not register
            you with the organizer, so use their page to sign up.
          </p>
          {status === "attended" ? (
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1 text-sm font-semibold">
                Minutes you gave
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={1440}
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className={`${inputClass} w-28`}
                />
              </label>
              <Button variant="outline" onClick={addContribution} disabled={pending}>
                Add to my contributions
              </Button>
              <p className="basis-full text-xs text-muted">
                Saved as self-reported. Nobody checks it.
              </p>
            </div>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}
          {message ? (
            <p role="status" className="text-sm text-success">
              {message}
            </p>
          ) : null}
        </div>
      )}
    </li>
  );
}
