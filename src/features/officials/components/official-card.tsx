"use client";

import { Mail, Phone } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/cn";
import { districtLabel, termEndLabel } from "@/features/officials/filters";
import { partyTone } from "@/features/officials/normalize";
import type { Official } from "@/features/officials/types";

const PARTY_DOT = {
  blue: "bg-blue-600",
  red: "bg-red-600",
  other: "bg-muted",
} as const;

export function PartyChip({ party }: { party: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-chip px-2.5 py-0.5 text-xs font-semibold">
      <span aria-hidden className={cn("size-2 rounded-full", PARTY_DOT[partyTone(party)])} />
      {party}
    </span>
  );
}

/** A compact shortcut for one official. The main area opens details; the icons reach them directly. */
export function OfficialCard({
  official,
  onOpen,
  likely,
}: {
  official: Official;
  onOpen: (official: Official) => void;
  likely?: boolean;
}) {
  const term = termEndLabel(official.termEnd);
  const place = districtLabel(official);
  const iconLink =
    "flex size-10 items-center justify-center rounded-full bg-chip text-ink hover:opacity-80";
  return (
    <li className="flex min-w-0 items-center gap-1 rounded-(--radius-card) border border-border bg-surface pr-3 shadow-card">
      <button
        type="button"
        onClick={() => onOpen(official)}
        aria-label={`${official.name}, ${official.office}. Open details`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-(--radius-card) p-3 text-left hover:bg-chip"
      >
        <UserAvatar name={official.name} url={official.photoUrl} className="size-11 shrink-0" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-base font-bold [overflow-wrap:anywhere]">{official.name}</span>
          <span className="text-sm text-muted [overflow-wrap:anywhere]">
            {official.office}
            {place ? ` · ${place}` : ""}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
            <span
              aria-hidden
              className={cn("size-2 shrink-0 rounded-full", PARTY_DOT[partyTone(official.party)])}
            />
            <span className="font-semibold text-ink">{official.party}</span>
            {term ? (
              <span>· {term.replace("Term ends", "to").replace("Term ended", "term ended")}</span>
            ) : null}
            {likely ? (
              <span className="rounded-full bg-lavender-soft px-2 py-0.5 font-semibold text-lavender-ink">
                Likely yours
              </span>
            ) : null}
          </span>
        </span>
      </button>
      <span className="flex shrink-0 gap-1.5">
        {official.phone ? (
          <a
            href={`tel:${official.phone}`}
            aria-label={`Call ${official.name}`}
            className={iconLink}
          >
            <Phone aria-hidden className="size-4" />
          </a>
        ) : null}
        {official.email ? (
          <a
            href={`mailto:${official.email}`}
            aria-label={`Email ${official.name}`}
            className={iconLink}
          >
            <Mail aria-hidden className="size-4" />
          </a>
        ) : official.contactForm ? (
          <a
            href={official.contactForm}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Contact form for ${official.name} (opens in a new tab)`}
            className={iconLink}
          >
            <Mail aria-hidden className="size-4" />
          </a>
        ) : null}
      </span>
    </li>
  );
}
