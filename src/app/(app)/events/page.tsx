import type { Metadata } from "next";
import { Suspense } from "react";
import { getPublicEnv } from "@/lib/env";
import { EventsExplorer } from "@/features/events/components/events-explorer";
import { getEvents } from "@/features/events/source";
import { getMyRsvps, getRecentSearches } from "@/features/events/queries";
import { Breadcrumb } from "@/components/shared/breadcrumb";

export const metadata: Metadata = { title: "Events" };

async function EventsContent() {
  const [feed, rsvps, searches] = await Promise.all([
    getEvents(null),
    getMyRsvps(),
    getRecentSearches(),
  ]);
  return (
    <EventsExplorer
      initialFeed={feed}
      initialRsvps={rsvps}
      initialSearches={searches}
      mapKey={getPublicEnv().NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY}
    />
  );
}

function EventsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading events" className="flex animate-pulse flex-col gap-6">
      <div className="h-36 rounded-(--radius-card) bg-chip" />
      <div className="h-10 w-80 max-w-full rounded-full bg-chip" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-52 rounded-(--radius-card) bg-chip" />
        ))}
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Events" }]} />
      <header className="flex flex-col gap-1">
        <h1 className="text-4xl font-bold">Events</h1>
        <p className="text-lg text-muted">
          Ways to show up for your community, near you and online. Listings come from Mobilize and
          each one links to the organizer. We do not check or endorse any organizer.
        </p>
      </header>
      <Suspense fallback={<EventsSkeleton />}>
        <EventsContent />
      </Suspense>
    </div>
  );
}
