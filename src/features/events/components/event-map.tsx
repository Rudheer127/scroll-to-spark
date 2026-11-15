"use client";

import { useState } from "react";
import { ExternalLink, Map as MapIcon } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

type EventMapProps = { lat: number; lng: number; title: string; embedKey?: string };

/** The Maps Embed API when a key is set, otherwise Google's keyless embed. */
export function mapEmbedUrl(lat: number, lng: number, embedKey?: string): string {
  const place = `${lat},${lng}`;
  return embedKey
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(embedKey)}&q=${place}&zoom=15`
    : `https://maps.google.com/maps?q=${place}&z=15&output=embed`;
}

/**
 * A Google Maps preview of the event's public venue. Nothing is sent to Google until the person
 * opens it, and only the venue's coordinates are sent, never the person's own location.
 */
export function EventMap({ lat, lng, title, embedKey }: EventMapProps) {
  const [open, setOpen] = useState(false);
  const place = `${lat},${lng}`;
  const embed = mapEmbedUrl(lat, lng, embedKey);
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
