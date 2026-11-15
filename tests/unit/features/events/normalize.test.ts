import { describe, expect, it } from "vitest";
import {
  normalizeMobilizeEvent,
  normalizeMobilizeEvents,
  safeMobilizeUrl,
  toSummary,
} from "@/features/events/normalize";
import { sampleEvents } from "@/features/events/samples";

const NOW = new Date("2026-11-15T12:00:00Z");
const inDays = (days: number) => Math.floor(NOW.getTime() / 1000) + days * 86400;

function raw(overrides: Record<string, unknown> = {}) {
  return {
    id: 1081549,
    title: "  Volunteer Picnic ",
    summary: "",
    description: "Join us.\n\n<b>Bring</b> a chair.",
    event_type: "COMMUNITY",
    is_virtual: false,
    browser_url: "https://www.mobilize.us/sosarizona/event/1081549/",
    timezone: "America/Phoenix",
    visibility: "PUBLIC",
    sponsor: { name: "Save Our Schools Arizona" },
    timeslots: [{ id: 7, start_date: inDays(3), end_date: inDays(3) + 7200 }],
    location: {
      venue: "Papago Park",
      locality: "Tempe",
      region: "AZ",
      location: { latitude: 33.44, longitude: -111.93 },
    },
    ...overrides,
  };
}

describe("normalizeMobilizeEvent", () => {
  it("maps an in-person event into the shared shape", () => {
    const event = normalizeMobilizeEvent(raw(), NOW);
    expect(event).toMatchObject({
      key: "mobilize:1081549:7",
      source: "mobilize",
      title: "Volunteer Picnic",
      organizer: "Save Our Schools Arizona",
      kind: "Community event",
      isVirtual: false,
      city: "Tempe",
      region: "AZ",
      lat: 33.44,
      lng: -111.93,
      isSample: false,
      url: "https://www.mobilize.us/sosarizona/event/1081549/",
    });
    expect(event?.summary).toBe("Join us. Bring a chair.");
  });

  it("drops place details for online events", () => {
    const event = normalizeMobilizeEvent(raw({ is_virtual: true }), NOW);
    expect(event).toMatchObject({ isVirtual: true, city: null, lat: null, lng: null, venue: null });
  });

  it("picks the next time slot that has not ended", () => {
    const event = normalizeMobilizeEvent(
      raw({
        timeslots: [
          { id: 1, start_date: inDays(-5), end_date: inDays(-5) + 3600 },
          { id: 3, start_date: inDays(9), end_date: inDays(9) + 3600 },
          { id: 2, start_date: inDays(2), end_date: inDays(2) + 3600 },
        ],
      }),
      NOW,
    );
    expect(event?.key).toBe("mobilize:1081549:2");
  });

  it("keeps an event that started but has not ended", () => {
    const event = normalizeMobilizeEvent(
      raw({ timeslots: [{ id: 4, start_date: inDays(0) - 600, end_date: inDays(0) + 3000 }] }),
      NOW,
    );
    expect(event?.key).toBe("mobilize:1081549:4");
  });

  it.each([
    [
      "only past slots",
      { timeslots: [{ id: 1, start_date: inDays(-2), end_date: inDays(-2) + 60 }] },
    ],
    ["a fundraiser", { event_type: "FUNDRAISER" }],
    ["a non-public event", { visibility: "PRIVATE" }],
    ["no link", { browser_url: null }],
    ["a link off mobilize.us", { browser_url: "https://evil.example/mobilize.us/" }],
    ["a non-https link", { browser_url: "http://www.mobilize.us/x/event/1/" }],
  ])("skips %s", (_name, overrides) => {
    expect(normalizeMobilizeEvent(raw(overrides), NOW)).toBeNull();
  });

  it("skips rows that are not events", () => {
    expect(normalizeMobilizeEvent({ nope: true }, NOW)).toBeNull();
    expect(normalizeMobilizeEvent(null, NOW)).toBeNull();
  });

  it("falls back to UTC for an unknown time zone and names a missing organizer", () => {
    const event = normalizeMobilizeEvent(raw({ timezone: "Mars/Base", sponsor: null }), NOW);
    expect(event?.timezone).toBe("UTC");
    expect(event?.organizer).toBe("Organizer not listed");
  });
});

describe("normalizeMobilizeEvents", () => {
  it("removes repeats, skips bad rows and sorts by start", () => {
    const later = raw({
      id: 2,
      timeslots: [{ id: 9, start_date: inDays(8), end_date: inDays(8) + 60 }],
    });
    const sooner = raw({
      id: 3,
      timeslots: [{ id: 5, start_date: inDays(1), end_date: inDays(1) + 60 }],
    });
    const events = normalizeMobilizeEvents([later, sooner, later, { bad: 1 }], NOW);
    expect(events.map((e) => e.key)).toEqual(["mobilize:3:5", "mobilize:2:9"]);
  });

  it("returns an empty list for a non-array answer", () => {
    expect(normalizeMobilizeEvents({ data: [] }, NOW)).toEqual([]);
  });
});

describe("toSummary and safeMobilizeUrl", () => {
  it("cuts long text at a word with an ellipsis", () => {
    const text = "word ".repeat(100);
    const summary = toSummary(text);
    expect(summary.length).toBeLessThanOrEqual(241);
    expect(summary.endsWith("…")).toBe(true);
  });

  it("accepts only https mobilize.us pages", () => {
    expect(safeMobilizeUrl("https://mobilize.us/a/event/1/")).not.toBeNull();
    expect(safeMobilizeUrl("javascript:alert(1)")).toBeNull();
    expect(safeMobilizeUrl("https://notmobilize.us/")).toBeNull();
    expect(safeMobilizeUrl("not a url")).toBeNull();
  });
});

describe("sampleEvents", () => {
  it("are always flagged as samples, have no link and cannot be mistaken for real keys", () => {
    const samples = sampleEvents(NOW);
    expect(samples.length).toBeGreaterThan(0);
    for (const event of samples) {
      expect(event.isSample).toBe(true);
      expect(event.source).toBe("sample");
      expect(event.url).toBeNull();
      expect(event.key.startsWith("sample:")).toBe(true);
      expect(event.organizer).toMatch(/not real/i);
    }
  });
});

describe("event pictures", () => {
  it("keeps pictures from Mobilize hosts only", async () => {
    const { safeImageUrl } = await import("@/features/events/normalize");
    expect(safeImageUrl("https://mobilizeamerica.imgix.net/uploads/a.jpg")).not.toBeNull();
    expect(safeImageUrl("https://evil.example/a.jpg")).toBeNull();
    expect(safeImageUrl("http://mobilizeamerica.imgix.net/a.jpg")).toBeNull();
    expect(safeImageUrl(null)).toBeNull();
  });
});
