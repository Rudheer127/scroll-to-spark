/** Image types a person may attach. The browser re-encodes every image as JPEG before sending. */
export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

/** Largest file a person may pick, before the browser shrinks it. */
export const MAX_IMAGE_FILE_BYTES = 5 * 1024 * 1024;

/** Largest decoded image the server accepts, after the browser shrinks it. */
export const MAX_IMAGE_DECODED_BYTES = 1.5 * 1024 * 1024;

/** The browser scales the longest side down to this many pixels. */
export const IMAGE_MAX_SIDE_PX = 1280;

/** JPEG quality used by the browser when it shrinks an image. */
export const IMAGE_JPEG_QUALITY = 0.8;

/** Longest image description folded into a message, in characters. */
export const MAX_IMAGE_DESCRIPTION_CHARS = 600;

/** Stored in the message history instead of the image. Image bytes are never stored. */
export const IMAGE_MARKER = "[image attached]";

/** Shown before upload, so the limits are known up front. */
export const IMAGE_LIMITS_NOTE = "PNG, JPEG or WebP, up to 5 MB. One image per message.";

/** Plain answer when the image could not be read. */
export const IMAGE_UNREADABLE_MESSAGE =
  "I could not read that image, try another or type what it says.";
