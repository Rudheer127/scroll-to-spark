import { z } from "zod";

export const ZIP_PATTERN = /^\d{5}$/;

export const zipSchema = z.string().trim().regex(ZIP_PATTERN, "Enter a five-digit ZIP code.");

/** Either a typed ZIP, or the rounded coordinates the browser gave once. Never stored. */
export const lookupSchema = z.union([
  z.object({ zip: zipSchema }),
  z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
]);

export const bioguideSchema = z
  .string()
  .regex(/^[A-Z]\d{6}$/, "That official cannot be looked up.");
