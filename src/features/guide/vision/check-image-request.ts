import { isImageInputEnabled } from "./image-input-enabled";
import { checkImageDataUrl } from "./image-data-url";

export type ImageRequestCheck = { ok: true; dataUrl?: string } | { ok: false; error: string };

const ERRORS = {
  off: "Image reading is not turned on. Type what the image says instead.",
  format: "That image could not be used. Try a PNG, JPEG or WebP image.",
  too_large: "That image is too large. Try a smaller one.",
  mismatch: "That file is not the image type it claims to be. Try another image.",
} as const;

/**
 * Checks the optional image on a guide request. No image is fine. An image needs image reading
 * to be on and must pass the strict data URL check.
 */
export function checkImageRequest(
  imageDataUrl: string | undefined,
  enabled: () => boolean = isImageInputEnabled,
): ImageRequestCheck {
  if (imageDataUrl === undefined) return { ok: true };
  if (!enabled()) return { ok: false, error: ERRORS.off };
  const check = checkImageDataUrl(imageDataUrl);
  if (!check.ok) return { ok: false, error: ERRORS[check.reason] };
  return { ok: true, dataUrl: check.dataUrl };
}
