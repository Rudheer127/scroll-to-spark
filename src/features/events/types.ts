export type EventSource = "mobilize" | "sample";

/** One event, in the single shape every source is turned into. */
export type CivicEvent = {
  /** Stable id such as "mobilize:1081549:6679220" (event id and the time slot). Samples use "sample:…". */
  key: string;
  source: EventSource;
  title: string;
  /** Plain text, trimmed to a short blurb. */
  summary: string;
  organizer: string;
  /** Human label for the kind of event, e.g. "Community event". */
  kind: string;
  startsAt: string;
  endsAt: string | null;
  /** IANA zone of the event, used to show its local time. */
  timezone: string;
  isVirtual: boolean;
  venue: string | null;
  city: string | null;
  region: string | null;
  /** Public venue coordinates, only for in-person events whose address the organizer made public. */
  lat: number | null;
  lng: number | null;
  /** The organizer's own sign-up page. Always null for sample events. */
  url: string | null;
  /** The organizer's picture for the event, only from Mobilize's own image hosts. */
  imageUrl: string | null;
  isSample: boolean;
};

export type Coords = { lat: number; lng: number };

/** A place the person chose. Only a ZIP code, a city name and that ZIP's centre are kept. */
export type EventLocation = { zip: string; city: string; region: string; lat: number; lng: number };

export type EventFeed = {
  /** "live" came from the source just now (or from its short cache). "sample" is made-up fallback data. */
  kind: "live" | "sample";
  events: CivicEvent[];
};

export type RsvpStatus = "going" | "attended";

export type Rsvp = {
  eventKey: string;
  status: RsvpStatus;
  title: string;
  startsAt: string;
  timezone: string;
};
