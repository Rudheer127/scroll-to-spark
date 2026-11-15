"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ChevronDown, LocateFixed, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { findNearby } from "@/features/events/actions";
import { EventCard } from "@/features/events/components/event-card";
import { formatEventTime } from "@/features/events/components/format";
import {
  RADIUS_OPTIONS,
  WHEN_OPTIONS,
  type EventWhen,
  eventDistance,
  filterEvents,
  type EventMode,
} from "@/features/events/filters";
import type { EventFeed, EventLocation, Rsvp, RsvpStatus } from "@/features/events/types";

const MODES: { value: EventMode; label: string }[] = [
  { value: "all", label: "All" },
  { value: "near", label: "Near me" },
  { value: "online", label: "Online" },
  { value: "inperson", label: "In person" },
];

const SAVED_ZIP_KEY = "spark:events:zip";

function readSavedZip(): string | null {
  try {
    const value = window.localStorage.getItem(SAVED_ZIP_KEY);
    return value && /^\d{5}$/.test(value) ? value : null;
  } catch {
    return null;
  }
}

function writeSavedZip(zip: string | null) {
  try {
    if (zip) window.localStorage.setItem(SAVED_ZIP_KEY, zip);
    else window.localStorage.removeItem(SAVED_ZIP_KEY);
  } catch {
    // Storage can be blocked. Remembering is a convenience, so nothing else needs to happen.
  }
}

type Props = { initialFeed: EventFeed; initialRsvps: Rsvp[] };

/** The Events screen: where you are, what kind of event, a search box, and the list. */
export function EventsExplorer({ initialFeed, initialRsvps }: Props) {
  const [feed, setFeed] = useState(initialFeed);
  const [location, setLocation] = useState<EventLocation | null>(null);
  const [zipInput, setZipInput] = useState("");
  const [remember, setRemember] = useState(false);
  const [mode, setMode] = useState<EventMode>("all");
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState<number>(25);
  const [when, setWhen] = useState<EventWhen>("any");
  const [placeOpen, setPlaceOpen] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [finding, startFinding] = useTransition();
  const [rsvps, setRsvps] = useState(() => new Map(initialRsvps.map((r) => [r.eventKey, r])));

  function lookup(input: { zip: string } | { lat: number; lng: number }, keep: boolean) {
    setLocationError(null);
    startFinding(async () => {
      const result = await findNearby(input);
      if (!result.ok) {
        setLocationError(result.error);
        return;
      }
      setLocation(result.data.location);
      setZipInput(result.data.location.zip);
      setFeed(result.data.feed);
      setMode((current) => (current === "all" ? "near" : current));
      setPlaceOpen(false);
      writeSavedZip(keep ? result.data.location.zip : null);
    });
  }

  function restoreSavedZip(saved: string) {
    setRemember(true);
    setZipInput(saved);
    lookup({ zip: saved }, true);
  }

  // A ZIP the person chose to remember on this device is used again on the next visit.
  useEffect(() => {
    const saved = readSavedZip();
    if (!saved) return;
    const timer = setTimeout(() => restoreSavedZip(saved), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on arrival
  }, []);

  function useBrowserLocation() {
    if (!("geolocation" in navigator)) {
      setLocationError("This browser cannot share a location. Type your ZIP code instead.");
      return;
    }
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) =>
        // Rounded to about a kilometre before it leaves the browser, and never saved.
        lookup(
          {
            lat: Math.round(position.coords.latitude * 100) / 100,
            lng: Math.round(position.coords.longitude * 100) / 100,
          },
          remember,
        ),
      () =>
        setLocationError(
          "We could not get your location. You can allow it in your browser, or type your ZIP code.",
        ),
      { maximumAge: 600_000, timeout: 10_000 },
    );
  }

  function submitZip(event: React.FormEvent) {
    event.preventDefault();
    lookup({ zip: zipInput.trim() }, remember);
  }

  function clearLocation() {
    setLocation(null);
    setZipInput("");
    setRemember(false);
    writeSavedZip(null);
    setMode((current) => (current === "near" ? "all" : current));
    setFeed(initialFeed);
  }

  function changeRemember(next: boolean) {
    setRemember(next);
    if (!next) writeSavedZip(null);
    else if (location) writeSavedZip(location.zip);
  }

  function changeStatus(eventKey: string, next: RsvpStatus | null) {
    setRsvps((current) => {
      const copy = new Map(current);
      const event = feed.events.find((e) => e.key === eventKey);
      if (next === null) copy.delete(eventKey);
      else
        copy.set(eventKey, {
          eventKey,
          status: next,
          title: event?.title ?? current.get(eventKey)?.title ?? "Event",
          startsAt: event?.startsAt ?? current.get(eventKey)?.startsAt ?? new Date().toISOString(),
          timezone: event?.timezone ?? current.get(eventKey)?.timezone ?? "UTC",
        });
      return copy;
    });
  }

  const center = location ? { lat: location.lat, lng: location.lng } : null;
  const visible = useMemo(
    () => filterEvents(feed.events, { mode, query, center, radiusMiles: radius, when }),
    // center is rebuilt from location each render, so depend on location itself
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [feed.events, mode, query, location, radius, when],
  );
  const needsPlace = mode === "near" && !location;
  const saved = [...rsvps.values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const radioClass = (active: boolean) =>
    cn(
      "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-(--radius-input) px-3 text-sm font-semibold md:min-h-10",
      active ? "bg-chip" : "hover:bg-chip",
    );

  return (
    <div className="flex flex-col gap-6">
      {feed.kind === "sample" ? (
        <p
          role="status"
          className="rounded-(--radius-card) border border-border bg-lavender-soft p-4 text-sm text-lavender-ink"
        >
          We could not reach the live events source right now, so these are made-up examples. They
          are not real events. Try again in a few minutes.
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <div className="flex flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-card sm:flex-row sm:rounded-full">
          <div className="relative flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted"
            />
            <label htmlFor="events-search" className="sr-only">
              Search events
            </label>
            <input
              id="events-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events, groups or cities"
              className="h-12 w-full bg-transparent pl-12 pr-4 text-base outline-offset-[-2px]"
            />
          </div>
          <button
            type="button"
            aria-expanded={placeOpen}
            aria-controls="events-place"
            onClick={() => setPlaceOpen((v) => !v)}
            className="flex h-12 items-center gap-2 border-t border-border px-4 text-left text-base font-semibold hover:bg-chip sm:w-72 sm:border-l sm:border-t-0"
          >
            <MapPin aria-hidden className="size-5 shrink-0 text-muted" />
            <span className="flex-1 truncate">
              {location ? `${location.city}, ${location.region}` : "Add your location"}
            </span>
            <ChevronDown
              aria-hidden
              className={cn("size-4 shrink-0 transition-transform", placeOpen && "rotate-180")}
            />
          </button>
        </div>

        {placeOpen ? (
          <section
            id="events-place"
            aria-label="Your place"
            className="flex flex-col gap-3 rounded-(--radius-card) border border-border bg-surface p-4 shadow-card"
          >
            <form onSubmit={submitZip} className="flex flex-wrap items-end gap-2">
              <div className="flex w-32 flex-col gap-1.5">
                <label htmlFor="events-zip" className="text-sm font-semibold">
                  ZIP code
                </label>
                <input
                  id="events-zip"
                  value={zipInput}
                  onChange={(e) => setZipInput(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="85281"
                  className={inputClass}
                />
              </div>
              <Button type="submit" disabled={finding || zipInput.length !== 5}>
                Find events
              </Button>
              <Button variant="outline" onClick={useBrowserLocation} disabled={finding}>
                <LocateFixed aria-hidden className="size-4" />
                Use my location
              </Button>
              {location ? (
                <button
                  type="button"
                  onClick={clearLocation}
                  className="px-2 text-sm font-semibold text-action hover:underline"
                >
                  Clear place
                </button>
              ) : null}
            </form>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => changeRemember(e.target.checked)}
                className="size-4"
              />
              Remember my ZIP code on this device
            </label>
            <p className="text-xs text-muted">
              Your browser location, if you share it, is rounded and used once to find a ZIP code.
              It is not saved.
            </p>
          </section>
        ) : null}
        {finding ? (
          <p role="status" className="px-2 text-sm text-muted">
            Looking for events near you…
          </p>
        ) : null}
        {locationError ? (
          <p role="alert" className="px-2 text-sm text-danger">
            {locationError}
          </p>
        ) : null}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside aria-label="Filters" className="flex flex-col gap-4 lg:sticky lg:top-8">
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 text-lg font-bold">Kind of event</legend>
            <div className="flex flex-wrap gap-1 lg:flex-col">
              {MODES.map(({ value, label }) => (
                <label key={value} className={radioClass(mode === value)}>
                  <input
                    type="radio"
                    name="events-mode"
                    checked={mode === value}
                    onChange={() => setMode(value)}
                    className="size-4"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 text-lg font-bold">Date</legend>
            <div className="flex flex-wrap gap-1 lg:flex-col">
              {WHEN_OPTIONS.map(({ value, label }) => (
                <label key={value} className={radioClass(when === value)}>
                  <input
                    type="radio"
                    name="events-when"
                    checked={when === value}
                    onChange={() => setWhen(value)}
                    className="size-4"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          {location ? (
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Distance from {location.zip}
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className={inputClass}
              >
                {RADIUS_OPTIONS.map((miles) => (
                  <option key={miles} value={miles}>
                    Within {miles} miles
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          <p role="status" className="text-sm text-muted">
            {needsPlace
              ? "Add your location above to see events near you."
              : `${visible.length} ${visible.length === 1 ? "event" : "events"}${feed.kind === "sample" ? " (samples)" : ""}`}
          </p>

          {needsPlace ? null : visible.length === 0 ? (
            <div className="rounded-(--radius-card) border border-border bg-surface p-6 shadow-card">
              <p className="font-semibold">Nothing matches right now.</p>
              <p className="mt-1 text-sm text-muted">
                {mode === "near"
                  ? "Try a wider distance, or look at online events."
                  : "Try fewer words, or switch to All."}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {visible.map((event) => (
                <EventCard
                  key={event.key}
                  event={event}
                  status={rsvps.get(event.key)?.status ?? null}
                  distanceMiles={eventDistance(event, center)}
                  onStatusChange={changeStatus}
                />
              ))}
            </ul>
          )}

          {saved.length > 0 ? (
            <section aria-label="Your list" className="flex flex-col gap-2 pt-2">
              <h2 className="text-lg font-semibold">Your list</h2>
              <ul className="flex flex-col gap-1.5 text-sm">
                {saved.map((item) => (
                  <li
                    key={item.eventKey}
                    className="flex flex-wrap justify-between gap-2 rounded-(--radius-input) bg-chip px-3.5 py-2.5"
                  >
                    <span className="font-semibold">{item.title}</span>
                    <span className="text-muted">
                      {item.status === "attended" ? "You said you went · " : ""}
                      {formatEventTime(item)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
