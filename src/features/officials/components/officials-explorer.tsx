"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { clearLookupHistory, lookupOfficials, removeLookup } from "@/features/officials/actions";
import { filterOfficials, levelsPresent } from "@/features/officials/filters";
import {
  LEVELS,
  type Level,
  type LookupResult,
  type Official,
  type RecentLookup,
} from "@/features/officials/types";
import { OfficialCard } from "@/features/officials/components/official-card";
import { OfficialDialog } from "@/features/officials/components/official-dialog";
import { RecentLookups } from "@/features/officials/components/recent-lookups";

const SAVED_ZIP_KEY = "spark:officials:zip";

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
    // Storage can be blocked. Remembering is only a convenience.
  }
}

/** The "Your officials" screen: a ZIP box, recent lookups, filters, and a grid of compact cards. */
export function OfficialsExplorer({ initialRecent }: { initialRecent: RecentLookup[] }) {
  const [zip, setZip] = useState("");
  const [zipError, setZipError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [recent, setRecent] = useState(initialRecent);
  const [remember, setRemember] = useState(false);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<Level | null>(null);
  const [district, setDistrict] = useState<number | null>(null);
  const [open, setOpen] = useState<Official | null>(null);
  const controller = useRef<AbortController | null>(null);
  const [lastInput, setLastInput] = useState<{ zip: string } | { lat: number; lng: number } | null>(
    null,
  );

  function lookup(input: { zip: string } | { lat: number; lng: number }, keep: boolean) {
    controller.current?.abort();
    const mine = new AbortController();
    controller.current = mine;
    setLastInput(input);
    setApiError(null);
    setZipError(null);
    setLoading(true);
    // A Server Action cannot be cut off mid-flight, so aborting makes this call's answer be ignored.
    void lookupOfficials(input).then((outcome) => {
      if (mine.signal.aborted) return;
      setLoading(false);
      if (!outcome.ok) {
        if (outcome.fieldErrors?.zip) setZipError(outcome.fieldErrors.zip);
        else setApiError(outcome.error);
        return;
      }
      const data = outcome.data;
      setResult(data);
      setZip(data.location.zip);
      setDistrict(null);
      setLevel(null);
      setQuery("");
      writeSavedZip(keep ? data.location.zip : null);
      setRecent((current) =>
        [data.location, ...current.filter((item) => item.zip !== data.location.zip)].slice(0, 10),
      );
    });
  }

  function cancel() {
    controller.current?.abort();
    setLoading(false);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{5}$/.test(zip.trim())) {
      setZipError("Enter a five-digit ZIP code.");
      return;
    }
    lookup({ zip: zip.trim() }, remember);
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setApiError("This browser cannot share a location. Type your ZIP code instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) =>
        lookup(
          {
            lat: Math.round(p.coords.latitude * 100) / 100,
            lng: Math.round(p.coords.longitude * 100) / 100,
          },
          remember,
        ),
      () =>
        setApiError(
          "We could not get your location. You can allow it in your browser, or type your ZIP code.",
        ),
      { maximumAge: 600_000, timeout: 10_000 },
    );
  }

  function clearAll() {
    cancel();
    setZip("");
    setResult(null);
    setApiError(null);
    setZipError(null);
    setRemember(false);
    writeSavedZip(null);
  }

  // A ZIP the person chose to remember on this device is looked up again on arrival.
  useEffect(() => {
    const saved = readSavedZip();
    if (!saved) return;
    const timer = setTimeout(() => {
      setRemember(true);
      setZip(saved);
      lookup({ zip: saved }, true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const visible = useMemo(
    () => (result ? filterOfficials(result.officials, { level, query, district }) : []),
    [result, level, query, district],
  );
  const levels = result ? levelsPresent(result.officials) : [];
  const houseDistricts = useMemo(
    () =>
      result?.houseMode === "choose"
        ? result.officials
            .filter((o) => o.level === "federal" && !o.isSenator)
            .map((o) => Number(o.district))
            .sort((a, b) => a - b)
        : [],
    [result],
  );

  const chip = (active: boolean) =>
    cn(
      "min-h-9 rounded-full px-4 text-sm font-semibold",
      active ? "bg-ink text-on-ink" : "bg-chip hover:opacity-80",
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <form
          onSubmit={submit}
          noValidate
          className="flex flex-wrap items-end gap-2 rounded-(--radius-card) border border-border bg-surface p-4 shadow-card"
        >
          <div className="flex w-40 flex-col gap-1.5">
            <label htmlFor="officials-zip" className="text-sm font-semibold">
              ZIP code
            </label>
            <div className="relative">
              <input
                id="officials-zip"
                value={zip}
                onChange={(e) => {
                  setZip(e.target.value.replace(/\D/g, "").slice(0, 5));
                  setZipError(null);
                }}
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="85281"
                aria-invalid={zipError ? true : undefined}
                aria-describedby={zipError ? "officials-zip-error" : undefined}
                className={cn(inputClass, "pr-9")}
              />
              {zip ? (
                <button
                  type="button"
                  aria-label="Clear ZIP code"
                  onClick={clearAll}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:bg-chip"
                >
                  <X aria-hidden className="size-4" />
                </button>
              ) : null}
            </div>
          </div>
          <Button type="submit" disabled={loading}>
            Find my officials
          </Button>
          <Button variant="outline" onClick={useMyLocation} disabled={loading}>
            <LocateFixed aria-hidden className="size-4" />
            Use my location
          </Button>
          {loading ? (
            <Button variant="ghost" onClick={cancel}>
              Cancel
            </Button>
          ) : null}
          <label className="flex w-full items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => {
                setRemember(e.target.checked);
                writeSavedZip(e.target.checked && result ? result.location.zip : null);
              }}
              className="size-4"
            />
            Remember my ZIP code on this device
          </label>
          {zipError ? (
            <p id="officials-zip-error" role="alert" className="w-full text-sm text-danger">
              {zipError}
            </p>
          ) : null}
        </form>
        <RecentLookups
          items={recent}
          onPick={(value) => {
            setZip(value);
            lookup({ zip: value }, remember);
          }}
          onRemove={(value) => {
            setRecent((current) => current.filter((item) => item.zip !== value));
            void removeLookup(value);
          }}
          onClear={() => {
            setRecent([]);
            void clearLookupHistory();
          }}
        />
        <p className="px-2 text-xs text-muted">
          Only the ZIP code is sent. A location from your browser is rounded, used once to find a
          ZIP code and district, and never saved.
        </p>
      </div>

      {loading ? (
        <div role="status" aria-busy="true" className="flex flex-col gap-3">
          <p className="text-sm text-muted">Finding your officials…</p>
          <div className="grid animate-pulse gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-28 rounded-(--radius-card) bg-chip" />
            ))}
          </div>
        </div>
      ) : null}

      {apiError && !loading ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-(--radius-card) border border-border bg-surface p-4 text-sm"
        >
          <span className="flex-1">{apiError}</span>
          {lastInput ? (
            <Button variant="outline" onClick={() => lookup(lastInput, remember)}>
              Try again
            </Button>
          ) : null}
        </div>
      ) : null}

      {result && !loading ? (
        <section aria-label="Results" className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">
            Who represents {result.location.city}, {result.location.state} {result.location.zip}
          </h2>

          {result.houseMode === "choose" ? (
            <div className="flex flex-col gap-2 rounded-(--radius-card) border border-border bg-lavender-soft p-4 text-sm text-lavender-ink">
              <p>
                A ZIP code can touch more than one district, and {result.location.state} has{" "}
                {result.districtCount}. We show every House member for the state. Pick your
                district, or use your location for an exact answer.
              </p>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Congressional district"
              >
                <button
                  type="button"
                  onClick={() => setDistrict(null)}
                  className={chip(district === null)}
                >
                  All
                </button>
                {houseDistricts.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDistrict(d)}
                    aria-pressed={district === d}
                    className={chip(district === d)}
                  >
                    District {d}
                    {d === result.likelyDistrict ? " (likely)" : ""}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {result.stateStatus === "missing-key" ? (
            <p
              role="status"
              className="rounded-(--radius-card) border border-border bg-surface p-4 text-sm text-muted"
            >
              State legislators are switched off because no Open States key is set up on this app
              yet. Federal officials are shown below.
            </p>
          ) : null}
          {result.stateStatus === "down" ? (
            <p
              role="status"
              className="rounded-(--radius-card) border border-border bg-surface p-4 text-sm text-muted"
            >
              We could not reach the state legislator source right now, so only federal officials
              are shown. Try again in a few minutes.
            </p>
          ) : null}
          {result.stateStatus === "ok" && result.stateApproximate ? (
            <p className="text-xs text-muted">
              State legislators are found from the centre of your ZIP code. If it spans districts,
              use your location for an exact match.
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-60 flex-1">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
              />
              <label htmlFor="officials-search" className="sr-only">
                Search by name or office
              </label>
              <input
                id="officials-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or office"
                className={cn(inputClass, "pl-10")}
              />
            </div>
            <div role="group" aria-label="Level of government" className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={level === null}
                onClick={() => setLevel(null)}
                className={chip(level === null)}
              >
                All
              </button>
              {LEVELS.filter((l) => levels.includes(l.value)).map((l) => (
                <button
                  key={l.value}
                  type="button"
                  aria-pressed={level === l.value}
                  onClick={() => setLevel(l.value)}
                  className={chip(level === l.value)}
                >
                  {l.label}
                </button>
              ))}
            </div>
            {level !== null || query !== "" || district !== null ? (
              <button
                type="button"
                onClick={() => {
                  setLevel(null);
                  setQuery("");
                  setDistrict(null);
                }}
                className="text-sm font-semibold text-action hover:underline"
              >
                Clear filters
              </button>
            ) : null}
          </div>

          {visible.length === 0 ? (
            <p
              role="status"
              className="rounded-(--radius-card) border border-border bg-surface p-6 text-center text-sm text-muted"
            >
              No officials match those filters.
            </p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {visible.map((o) => (
                <OfficialCard
                  key={o.id}
                  official={o}
                  onOpen={setOpen}
                  likely={
                    result.houseMode === "choose" &&
                    !o.isSenator &&
                    o.level === "federal" &&
                    o.district === result.likelyDistrict
                  }
                />
              ))}
            </ul>
          )}
          <p className="text-xs text-muted">
            Federal data: unitedstates/congress-legislators (public domain). State data: Open
            States. Funding: FEC. This is information, not an endorsement of anyone.
          </p>
        </section>
      ) : null}

      {!result && !loading && !apiError ? (
        <p className="rounded-(--radius-card) border border-border bg-surface p-6 text-center text-sm text-muted">
          Enter your ZIP code to see your two U.S. senators, your House member and your state
          legislators.
        </p>
      ) : null}

      <OfficialDialog official={open} onClose={() => setOpen(null)} />
    </div>
  );
}
