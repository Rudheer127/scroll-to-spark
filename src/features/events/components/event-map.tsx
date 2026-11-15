"use client";

import { useState } from "react";
import { ExternalLink, Map as MapIcon } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

type EventMapProps = { lat: number; lng: number; title: string };

/**
 * A Google Maps preview of the event's public venue. Nothing is sent to Google until the person
 * opens it, and only the venue's coordinates are sent, never the person's own location.
 */
export function EventMap({ lat, lng, title }: EventMapProps) {
  const [open, setOpen] = useState(false);
  const place = `${lat},${lng}`;
  const embed = `https://maps.google.com/maps?q=${place}&z=15&output=embed`;
  const link = `https://www.google.com/maps/search/?api=1&query=${place}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={buttonClasses("outline", "min-h-9 px-4 md:min-h-9")}
        >
          <MapIcon aria-hidden className="size-4" />
          {open ? "Hide map" : "Show map"}
        </button>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-9 items-center gap-1.5 px-2 text-sm font-semibold text-action hover:underline"
        >
          Open in Google Maps
          <ExternalLink aria-hidden className="size-3.5" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
      {open ? (
        <iframe
          title={`Map showing where ${title} takes place`}
          src={embed}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-56 w-full rounded-(--radius-input) border border-border sm:h-64"
        />
      ) : null}
    </div>
  );
}
