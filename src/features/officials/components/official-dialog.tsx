"use client";

import Link from "next/link";
import { ExternalLink, Globe, Mail, MapPin, Phone } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/shared/user-avatar";
import { FundingPanel } from "@/features/officials/components/funding-panel";
import { PartyChip } from "@/features/officials/components/official-card";
import { districtLabel, termEndLabel } from "@/features/officials/filters";
import { socialUrl } from "@/features/officials/normalize";
import type { Official } from "@/features/officials/types";

const linkClass = "inline-flex items-center gap-2 font-semibold text-action hover:underline";

/** The larger popup for one official: contact, socials and (for Congress) campaign funding. */
export function OfficialDialog({
  official,
  onClose,
}: {
  official: Official | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={official !== null}
      onClose={onClose}
      title={official?.name ?? "Official"}
      description={
        official
          ? [official.office, districtLabel(official)].filter(Boolean).join(" · ")
          : undefined
      }
    >
      {official ? (
        <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto">
          <div className="flex items-center gap-4">
            <UserAvatar name={official.name} url={official.photoUrl} className="size-24" />
            <div className="flex flex-col gap-1.5 text-sm">
              <PartyChip party={official.party} />
              {termEndLabel(official.termEnd) ? (
                <span className="text-muted">{termEndLabel(official.termEnd)}</span>
              ) : null}
            </div>
          </div>
          <section aria-label="Contact" className="flex flex-col gap-2 text-sm">
            <h3 className="text-base font-bold">Contact</h3>
            {official.phone ? (
              <a href={`tel:${official.phone.replace(/[^\d+]/g, "")}`} className={linkClass}>
                <Phone aria-hidden className="size-4" /> {official.phone}
              </a>
            ) : null}
            {official.email ? (
              <a href={`mailto:${official.email}`} className={linkClass}>
                <Mail aria-hidden className="size-4" /> {official.email}
              </a>
            ) : null}
            {official.contactForm ? (
              <a
                href={official.contactForm}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                <Mail aria-hidden className="size-4" /> Contact form{" "}
                <ExternalLink aria-hidden className="size-3.5" />
              </a>
            ) : null}
            {official.website ? (
              <a
                href={official.website}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                <Globe aria-hidden className="size-4" /> Official website{" "}
                <ExternalLink aria-hidden className="size-3.5" />
              </a>
            ) : null}
            {official.address ? (
              <p className="flex items-start gap-2 text-muted">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0" /> {official.address}
              </p>
            ) : null}
            {!official.phone && !official.email && !official.contactForm && !official.website ? (
              <p className="text-muted">No contact details came with this record.</p>
            ) : null}
          </section>
          {official.socials.length > 0 ? (
            <section aria-label="Social media" className="flex flex-col gap-2 text-sm">
              <h3 className="text-base font-bold">Social media</h3>
              <ul className="flex flex-wrap gap-x-4 gap-y-1">
                {official.socials.map((s) => (
                  <li key={s.network}>
                    <a
                      href={socialUrl(s)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      <span className="capitalize">
                        {s.network === "twitter" ? "X" : s.network}
                      </span>{" "}
                      @{s.handle}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {official.level === "federal" ? (
            <FundingPanel key={official.id} official={official} />
          ) : null}
          <Link href="/guide" className={`${linkClass} text-sm`}>
            Take action: ask the Guide how to contact {official.name.split(" ").slice(-1)[0]}
          </Link>
        </div>
      ) : null}
    </Dialog>
  );
}
