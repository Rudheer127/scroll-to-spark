"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LocateFixed, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { clearLookupHistory, lookupOfficials, removeLookup } from "@/features/officials/actions";
import {
  collapseHouse,
  filterOfficials,
  levelsPresent,
  orderOfficials,
} from "@/features/officials/filters";
import { NO_SENATOR_PLACES } from "@/features/officials/normalize";
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

/** Puts the looked-up ZIP in the address bar, so a reload or Back lands on the same list. */
function showZipInUrl(zip: string | null) {
  const current = new URLSearchParams(window.location.search).get("zip");
  if (current === zip) return;
  window.history.pushState(null, "", zip ? `?zip=${zip}` : window.location.pathname);
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
  const params = useSearchParams();
  const zipParam = params.get("zip");
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
  const [showAllDistricts, setShowAllDistricts] = useState(false);
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
        // An old list under a new error would look like the answer to this search.
        setResult(null);
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
      setShowAllDistricts(false);
      showZipInUrl(data.location.zip);
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
    showZipInUrl(null);
  }

  // The address bar leads: a ZIP in it is looked up (on arrival, reload, Back or Forward), and no
  // ZIP there means a clean screen. A ZIP the person chose to remember on this device comes second.
  useEffect(() => {
    if (zipParam && /^\d{5}$/.test(zipParam)) {
      if (result?.location.zip === zipParam) return;
      const timer = setTimeout(() => {
        setZip(zipParam);
        lookup({ zip: zipParam }, remember);
      }, 0);
      return () => clearTimeout(timer);
    }
    if (result) {
      const timer = setTimeout(() => {
        cancel();
        setZip("");
        setResult(null);
        setApiError(null);
        setZipError(null);
      }, 0);
      return () => clearTimeout(timer);
    }
    const saved = readSavedZip();
    if (!saved) return;
    const timer = setTimeout(() => {
      setRemember(true);
      setZip(saved);
      lookup({ zip: saved }, true);
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacts to the address bar only
  }, [zipParam]);

  const ordered = useMemo(
    () =>
      result
        ? orderOfficials(
            filterOfficials(result.officials, { level, query, district }),
            result.likelyDistrict,
          )
        : [],
    [result, level, query, district],
  );
  // Fold the other districts away until asked, but never while a filter is narrowing the list.
  const { shown: visible, hidden: hiddenDistricts } = collapseHouse(ordered, {
    likelyDistrict: result?.likelyDistrict ?? null,
    collapse:
      result?.houseMode === "choose" &&
      !showAllDistricts &&
      district === null &&
      query.trim() === "" &&
      level !== "state",
  });
  const noSenatorPlace = result ? NO_SENATOR_PLACES[result.location.state] : undefined;
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

  const seg = (active: boolean) =>
    cn(
      "min-h-9 rounded-lg px-3 text-sm font-semibold",
      active ? "bg-ink text-on-ink" : "hover:bg-border",
    );
  const filtersActive = level !== null || query !== "" || district !== null;

  return (
    <div className="flex flex-col gap-4">
      <section
        aria-label="Find your officials"
        className="flex flex-col gap-2.5 rounded-(--radius-card) border border-border bg-surface p-3 shadow-card"
      >
        <form onSubmit={submit} noValidate className="flex flex-wrap items-center gap-2">
          <div className="relative w-32 shrink-0">
            <label htmlFor="officials-zip" className="sr-only">
              ZIP code
            </label>
            <input
              id="officials-zip"
              value={zip}
              onChange={(e) => {
                setZip(e.target.value.replace(/\D/g, "").slice(0, 5));
                setZipError(null);
              }}
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="ZIP code"
              aria-invalid={zipError ? true : undefined}
              aria-describedby={zipError ? "officials-zip-error" : undefined}
              className={cn(inputClass, "min-h-11 pr-9 md:min-h-10")}
            />
            {zip ? (
              <button
                type="button"
                aria-label="Clear ZIP code"
                onClick={clearAll}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-muted hover:bg-chip"
              >
                <X aria-hidden className="size-4" />
              </button>
            ) : null}
          </div>
          <Button type="submit" disabled={loading} className="px-4">
            Find<span className="sr-only"> my officials</span>
          </Button>
          <Button
            variant="outline"
            onClick={useMyLocation}
            disabled={loading}
            aria-label="Use my location"
            title="Use my location"
            className="px-3"
          >
            <LocateFixed aria-hidden className="size-4" />
          </Button>
          {loading ? (
            <Button variant="ghost" onClick={cancel}>
              Cancel
            </Button>
          ) : null}
          {result && !loading ? (
            <>
              <div className="relative min-w-44 flex-1 basis-full sm:basis-0">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
                />
                <label htmlFor="officials-search" className="sr-only">
                  Search by name or office
                </label>
                <input
                  id="officials-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name or office"
                  className={cn(inputClass, "min-h-11 pl-9 md:min-h-10")}
                />
              </div>
              {result.houseMode === "choose" ? (
                <div className="min-w-0 flex-1 sm:flex-none">
                  <label htmlFor="officials-district" className="sr-only">
                    Congressional district
                  </label>
                  <select
                    id="officials-district"
                    value={district ?? ""}
                    onChange={(e) =>
                      setDistrict(e.target.value === "" ? null : Number(e.target.value))
                    }
                    className={cn(inputClass, "min-h-11 md:min-h-10")}
                  >
                    <option value="">All districts</option>
                    {houseDistricts.map((d) => (
                      <option key={d} value={d}>
                        District {d}
                        {d === result.likelyDistrict ? " (likely)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div
                role="group"
                aria-label="Level of government"
                className="flex gap-0.5 rounded-xl bg-chip p-0.5"
              >
                <button
                  type="button"
                  aria-pressed={level === null}
                  onClick={() => setLevel(null)}
                  className={seg(level === null)}
                >
                  All
                </button>
                {LEVELS.filter((l) => levels.includes(l.value)).map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    aria-pressed={level === l.value}
                    onClick={() => setLevel(l.value)}
                    className={seg(level === l.value)}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </form>
        {zipError ? (
          <p id="officials-zip-error" role="alert" className="text-sm text-danger">
            {zipError}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => {
                setRemember(e.target.checked);
                writeSavedZip(e.target.checked && result ? result.location.zip : null);
              }}
              className="size-4"
            />
            Remember my ZIP on this device
          </label>
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
        </div>
        <p className="text-xs text-muted">
          Only the ZIP code is sent. A location from your browser is rounded, used once to find a
          ZIP code and district, and never saved.
        </p>
      </section>

      {loading ? (
        <div role="status" aria-busy="true" className="flex flex-col gap-3">
          <p className="text-sm text-muted">Finding your officials…</p>
          <div className="grid animate-pulse gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-[4.5rem] rounded-(--radius-card) bg-chip" />
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
        <section aria-label="Results" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-base font-semibold text-muted">
              Who represents {result.location.city}, {result.location.state} {result.location.zip}
              {" · "}
              {visible.length} {visible.length === 1 ? "official" : "officials"}
            </h2>
            {filtersActive ? (
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

          {result.houseMode === "choose" ? (
            <p className="text-xs text-muted">
              A ZIP code can touch more than one district, and {result.location.state} has{" "}
              {result.districtCount}. We show every House member for the state. Pick your district
              above, or use your location for an exact answer.
            </p>
          ) : null}
          {noSenatorPlace ? (
            <p className="text-xs text-muted">
              {noSenatorPlace.name} has no U.S. senators. It sends a non-voting{" "}
              {noSenatorPlace.office.toLowerCase()} to the House of Representatives.
            </p>
          ) : null}
          {result.stateStatus === "missing-key" ? (
            <p role="status" className="text-xs text-muted">
              State legislators are coming soon.
            </p>
          ) : null}
          {result.stateStatus === "down" ? (
            <p role="status" className="text-xs text-muted">
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

          {visible.length === 0 ? (
            <p
              role="status"
              className="rounded-(--radius-card) border border-border bg-surface p-6 text-center text-sm text-muted"
            >
              No officials match those filters.
            </p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
          {hiddenDistricts > 0 ? (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setShowAllDistricts(true)}>
                Show {hiddenDistricts} other {hiddenDistricts === 1 ? "district" : "districts"}
              </Button>
            </div>
          ) : null}
          {showAllDistricts && result.houseMode === "choose" && result.likelyDistrict !== null ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllDistricts(false)}
                className="text-sm font-semibold text-action hover:underline"
              >
                Show only my likely district
              </button>
            </div>
          ) : null}
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
