import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_FILE_BYTES } from "./constants";

type FileFacts = { type: string; size: number };

/** Checks a picked file before any work is done. Returns a plain reason, or null when it is fine. */
export function checkImageFile(file: FileFacts): string | null {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "That file type is not supported. Use a PNG, JPEG or WebP image.";
  }
  if (file.size > MAX_IMAGE_FILE_BYTES) return "That image is over 5 MB. Try a smaller one.";
  if (file.size === 0) return "That image looks empty. Try another one.";
  return null;
}

/** The longest side scaled to fit maxSide, never scaled up. */
export function scaledSize(
  width: number,
  height: number,
  maxSide: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxSide) return { width, height };
  const ratio = maxSide / longest;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}
