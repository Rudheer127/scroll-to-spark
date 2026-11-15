import type { CivicEvent } from "@/features/events/types";

const DAY_MS = 24 * 60 * 60 * 1000;

type SampleSeed = Pick<CivicEvent, "title" | "summary" | "kind" | "isVirtual"> &
  Partial<Pick<CivicEvent, "city" | "region" | "venue" | "lat" | "lng">> & {
    inDays: number;
    hour: number;
  };

const SEEDS: SampleSeed[] = [
  {
    title: "Neighborhood cleanup morning",
    summary: "An example of a hands-on community event. Bring gloves and a water bottle.",
    kind: "Community event",
    isVirtual: false,
    city: "Tempe",
    region: "AZ",
    venue: "A neighborhood park",
    lat: 33.4255,
    lng: -111.94,
    inDays: 5,
    hour: 9,
  },
  {
    title: "How a city council meeting works",
    summary: "An example of an online workshop that explains how to speak at a public meeting.",
    kind: "Workshop",
    isVirtual: true,
    inDays: 3,
    hour: 18,
  },
  {
    title: "Letter-writing night",
    summary: "An example of a quiet, low-pressure way to write to a local representative.",
    kind: "Letter writing",
    isVirtual: true,
    inDays: 8,
    hour: 19,
  },
  {
    title: "Community listening session",
    summary: "An example of a meeting where neighbors share what their block needs.",
    kind: "Meeting",
    isVirtual: false,
    city: "Phoenix",
    region: "AZ",
    venue: "A public library meeting room",
    lat: 33.4484,
    lng: -112.074,
    inDays: 10,
    hour: 17,
  },
];

/**
 * Made-up events shown only when the live source cannot be reached. Every one is flagged isSample,
 * has no link and no key that matches a real event, so nothing here can be mistaken for a real listing
 * or be saved as an RSVP.
 */
export function sampleEvents(now: Date = new Date()): CivicEvent[] {
  return SEEDS.map((seed, index) => {
    const start = new Date(now.getTime() + seed.inDays * DAY_MS);
    start.setUTCHours(seed.hour + 7, 0, 0, 0); // roughly local evening in Arizona, which has no daylight saving
    return {
      key: `sample:${index + 1}`,
      source: "sample",
      title: seed.title,
      summary: seed.summary,
      organizer: "Sample organizer (not real)",
      kind: seed.kind,
      startsAt: start.toISOString(),
      endsAt: new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      timezone: "America/Phoenix",
      isVirtual: seed.isVirtual,
      venue: seed.venue ?? null,
      city: seed.city ?? null,
      region: seed.region ?? null,
      lat: seed.lat ?? null,
      lng: seed.lng ?? null,
      url: null,
      isSample: true,
    };
  });
}
