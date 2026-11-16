import { z } from "zod";
import { safeMobilizeUrl } from "@/features/events/normalize";

export const ZIP_PATTERN = /^\d{5}$/;

/** Either a typed ZIP, or the coordinates the browser gave once. Never both, never stored. */
export const findNearbySchema = z.union([
  z.object({ zip: z.string().trim().regex(ZIP_PATTERN, "Enter a five-digit ZIP code.") }),
  z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
]);

const eventKey = z.string().regex(/^mobilize:\d+:\d+$/, "That event cannot be saved.");

/** The part of an event that is kept with an RSVP. The link must be an organizer page on mobilize.us. */
export const rsvpSnapshotSchema = z.object({
  eventKey,
  title: z.string().trim().min(1).max(200),
  organizer: z.string().trim().max(200).nullable(),
  url: z
    .string()
    .max(500)
    .transform((value, ctx) => {
      const safe = safeMobilizeUrl(value);
      if (!safe) ctx.addIssue({ code: "custom", message: "That link cannot be saved." });
      return safe ?? "";
    }),
  startsAt: z.iso.datetime(),
  timezone: z.string().min(1).max(64),
  isVirtual: z.boolean(),
  city: z.string().trim().max(100).nullable(),
});

export const setRsvpSchema = z.object({
  event: rsvpSnapshotSchema,
  status: z.enum(["going", "attended"]),
});

export const logContributionSchema = z.object({
  eventKey,
  minutes: z.number().int().min(1).max(1440),
});

/** A search the person typed, trimmed and squashed to single spaces. */
export const searchTermSchema = z
  .string()
  .transform((value) => value.trim().replace(/\s+/g, " "))
  .pipe(z.string().min(2, "Type at least two letters.").max(80));
