"use client";

import { useState, useTransition } from "react";
import { Check, ExternalLink, MapPin, Video } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { logAttendedContribution, removeRsvp, setRsvp } from "@/features/events/actions";
import { EventMap } from "@/features/events/components/event-map";
import { formatEventTime, formatPlace } from "@/features/events/components/format";
import type { CivicEvent, RsvpStatus } from "@/features/events/types";

type EventCardProps = {
  event: CivicEvent;
  status: RsvpStatus | null;
  distanceMiles: number | null;
  /** Called with the new status, or null once the RSVP is removed. */
  onStatusChange: (eventKey: string, next: RsvpStatus | null) => void;
  mapKey?: string;
};

function DateTile({ event }: { event: CivicEvent }) {
  const date = new Date(event.startsAt);
  const month = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: event.timezone,
  }).format(date);
  const day = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: event.timezone }).format(
    date,
  );
  return (
    <div
      aria-hidden
      className="flex size-full flex-col items-center justify-center bg-(image:--gradient-spark) text-white"
    >
      <span className="text-xs font-bold uppercase tracking-wide">{month}</span>
      <span className="text-3xl font-extrabold leading-none">{day}</span>
    </div>
  );
}

/** One event as a row: picture, when and where, who runs it, and what you can do about it. */
export function EventCard({
  event,
  status,
  distanceMiles,
  onStatusChange,
  mapKey,
}: EventCardProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [minutes, setMinutes] = useState("60");
  const [now] = useState(() => Date.now());
  const started = new Date(event.startsAt).getTime() <= now;
  const PlaceIcon = event.isVirtual ? Video : MapPin;

  function run(task: () => Promise<void>) {
    setError(null);
    setMessage(null);
    startTransition(task);
  }

  function save(next: RsvpStatus) {
    run(async () => {
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
    run(async () => {
      const result = await removeRsvp(event.key);
      if (!result.ok) setError(result.error);
      else onStatusChange(event.key, null);
    });
  }

  function addContribution() {
    run(async () => {
      const result = await logAttendedContribution({
        eventKey: event.key,
        minutes: Number(minutes),
      });
      if (!result.ok) setError(result.error);
      else setMessage(result.message ?? "Added to your contributions.");
    });
  }

  return (
    <li className="flex flex-col gap-4 rounded-(--radius-card) border border-border bg-surface p-4 shadow-card sm:flex-row sm:p-5">
      <div className="aspect-[16/9] w-full shrink-0 overflow-hidden rounded-(--radius-input) bg-chip sm:aspect-auto sm:h-36 sm:w-52">
        {event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote organizer picture from an allow-listed host
          <img
            src={event.imageUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="size-full object-cover"
          />
        ) : (
          <DateTile event={event} />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-coral">{formatEventTime(event)}</p>
          <h3 className="text-xl font-bold leading-snug">{event.title}</h3>
          <p className="flex items-start gap-1.5 text-sm text-muted">
            <PlaceIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>
              {formatPlace(event)}
              {distanceMiles !== null ? ` · ${Math.max(1, Math.round(distanceMiles))} mi away` : ""}
            </span>
          </p>
          <p className="text-sm text-muted">By {event.organizer}</p>
        </div>

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

        {event.summary ? <p className="line-clamp-2 text-sm">{event.summary}</p> : null}

        {event.lat !== null && event.lng !== null && !event.isSample ? (
          <EventMap lat={event.lat} lng={event.lng} title={event.title} embedKey={mapKey} />
        ) : null}

        {event.isSample ? (
          <p className="text-sm text-muted">
            This is an example so the page is not empty. It has no sign-up page and cannot be saved.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {event.url ? (
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses("brand")}
                >
                  Sign up with the organizer
                  <ExternalLink aria-hidden className="size-4" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : null}
              {status ? (
                <Button
                  variant="outline"
                  onClick={remove}
                  disabled={pending}
                  aria-label={`Remove ${event.title} from my list`}
                >
                  Remove from my list
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => save("going")}
                  disabled={pending}
                  aria-label={`I'm going to ${event.title}`}
                >
                  I&apos;m going
                </Button>
              )}
              {status === "going" && started ? (
                <Button
                  variant="outline"
                  onClick={() => save("attended")}
                  disabled={pending}
                  aria-label={`I went to ${event.title}`}
                >
                  I went
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted">
              &ldquo;I&apos;m going&rdquo; only saves this in your Spark list. It does not register
              you with the organizer.
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
      </div>
    </li>
  );
}
