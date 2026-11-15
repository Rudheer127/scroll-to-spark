import { describe, expect, it } from "vitest";
import { distanceMiles, eventDistance, filterEvents, isEventMode } from "@/features/events/filters";
import type { CivicEvent } from "@/features/events/types";

function event(overrides: Partial<CivicEvent>): CivicEvent {
  return {
    key: "mobilize:1:1",
    source: "mobilize",
    title: "Event",
    summary: "",
    organizer: "Group",
    kind: "Meeting",
    startsAt: "2026-12-01T00:00:00.000Z",
    endsAt: null,
    timezone: "UTC",
    isVirtual: false,
    venue: null,
    city: null,
    region: null,
    lat: null,
    lng: null,
    url: "https://www.mobilize.us/x/event/1/",
    imageUrl: null,
    isSample: false,
    ...overrides,
  };
}

const TEMPE = { lat: 33.4255, lng: -111.94 };
const online = event({ key: "mobilize:2:2", title: "Online workshop", isVirtual: true });
const tempe = event({
  key: "mobilize:3:3",
  title: "Park cleanup",
  city: "Tempe",
  lat: 33.43,
  lng: -111.93,
});
const phoenix = event({
  key: "mobilize:4:4",
  title: "Library listening",
  city: "Phoenix",
  lat: 33.4484,
  lng: -112.074,
});
const flagstaff = event({
  key: "mobilize:5:5",
  title: "Forest walk",
  city: "Flagstaff",
  lat: 35.1983,
  lng: -111.6513,
});
const noCoords = event({ key: "mobilize:6:6", title: "Mystery", city: "Somewhere" });
const all = [online, tempe, phoenix, flagstaff, noCoords];

const base = { mode: "all", query: "", center: TEMPE, radiusMiles: 25 } as const;
const keys = (list: CivicEvent[]) => list.map((e) => e.key);

describe("distanceMiles", () => {
  it("is zero for the same point and about 8 miles to Phoenix", () => {
    expect(distanceMiles(TEMPE, TEMPE)).toBeCloseTo(0, 5);
    const miles = distanceMiles(TEMPE, { lat: 33.4484, lng: -112.074 });
    expect(miles).toBeGreaterThan(6);
    expect(miles).toBeLessThan(10);
  });
});

describe("eventDistance", () => {
  it("is null for online events, unknown places and no centre", () => {
    expect(eventDistance(online, TEMPE)).toBeNull();
    expect(eventDistance(noCoords, TEMPE)).toBeNull();
    expect(eventDistance(tempe, null)).toBeNull();
  });
});

describe("filterEvents", () => {
  it("shows everything for all with no search", () => {
    expect(filterEvents(all, base)).toHaveLength(5);
  });

  it("online keeps only online events", () => {
    expect(keys(filterEvents(all, { ...base, mode: "online" }))).toEqual([online.key]);
  });

  it("in person keeps events with a place, including ones without coordinates", () => {
    expect(keys(filterEvents(all, { ...base, mode: "inperson" }))).toEqual([
      tempe.key,
      phoenix.key,
      flagstaff.key,
      noCoords.key,
    ]);
  });

  it("near keeps in-person events within the radius, nearest places only", () => {
    expect(keys(filterEvents(all, { ...base, mode: "near", radiusMiles: 5 }))).toEqual([tempe.key]);
    expect(keys(filterEvents(all, { ...base, mode: "near", radiusMiles: 25 }))).toEqual([
      tempe.key,
      phoenix.key,
    ]);
  });

  it("near with no place shared returns nothing, and never lists online events", () => {
    expect(filterEvents(all, { ...base, mode: "near", center: null })).toEqual([]);
  });

  it("searches every word across title, organizer, city and kind, ignoring case", () => {
    expect(keys(filterEvents(all, { ...base, query: "park TEMPE" }))).toEqual([tempe.key]);
    expect(keys(filterEvents(all, { ...base, query: "group meeting" }))).toHaveLength(5);
    expect(filterEvents(all, { ...base, query: "zzz" })).toEqual([]);
  });

  it("combines mode and search", () => {
    expect(keys(filterEvents(all, { ...base, mode: "online", query: "park" }))).toEqual([]);
  });
});

describe("isEventMode", () => {
  it("accepts only the four modes", () => {
    expect(isEventMode("near")).toBe(true);
    expect(isEventMode("nearby")).toBe(false);
    expect(isEventMode(undefined)).toBe(false);
  });
});

describe("filterEvents by date", () => {
  const now = new Date("2026-12-01T00:00:00Z");
  const soon = event({ key: "mobilize:7:7", startsAt: "2026-12-05T00:00:00Z" });
  const later = event({ key: "mobilize:8:8", startsAt: "2026-12-20T00:00:00Z" });
  const far = event({ key: "mobilize:9:9", startsAt: "2027-02-01T00:00:00Z" });
  const list = [soon, later, far];

  it("keeps everything for any date", () => {
    expect(filterEvents(list, { ...base, when: "any", now })).toHaveLength(3);
  });
  it("limits to the next 7 or 30 days", () => {
    expect(keys(filterEvents(list, { ...base, when: "week", now }))).toEqual([soon.key]);
    expect(keys(filterEvents(list, { ...base, when: "month", now }))).toEqual([
      soon.key,
      later.key,
    ]);
  });
});
