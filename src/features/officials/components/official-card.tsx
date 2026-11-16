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

/** A compact shortcut for one official. Clicking it opens the full details. */
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
  return (
    <li className="relative">
      <button
        type="button"
        onClick={() => onOpen(official)}
        aria-label={`${official.name}, ${official.office}. Open details`}
        className="flex w-full items-center gap-4 rounded-(--radius-card) border border-border bg-surface p-4 text-left shadow-card hover:bg-chip"
      >
        <UserAvatar name={official.name} url={official.photoUrl} className="size-16" />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-base font-bold">{official.name}</span>
          <span className="text-sm text-muted">
            {official.office}
            {place ? ` · ${place}` : ""}
          </span>
          <span className="flex flex-wrap items-center gap-2">
            <PartyChip party={official.party} />
            {likely ? (
              <span className="rounded-full bg-lavender-soft px-2.5 py-0.5 text-xs font-semibold text-lavender-ink">
                Likely yours
              </span>
            ) : null}
            {term ? <span className="text-xs text-muted">{term}</span> : null}
          </span>
        </span>
        <span aria-hidden className="flex shrink-0 flex-col gap-2 text-muted">
          {official.phone ? <Phone className="size-4" /> : null}
          {official.email || official.contactForm ? <Mail className="size-4" /> : null}
        </span>
      </button>
    </li>
  );
}
