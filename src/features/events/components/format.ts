import type { CivicEvent } from "@/features/events/types";

/** "Sat, Dec 12, 12:00 PM MST", shown in the event's own time zone so it matches the organizer's page. */
export function formatEventTime(event: Pick<CivicEvent, "startsAt" | "timezone">): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: event.timezone,
    timeZoneName: "short",
  }).format(new Date(event.startsAt));
}

export function formatPlace(event: CivicEvent): string {
  if (event.isVirtual) return "Online";
  const city = [event.city, event.region].filter(Boolean).join(", ");
  return [event.venue, city].filter(Boolean).join(" · ") || "Place not listed";
}
