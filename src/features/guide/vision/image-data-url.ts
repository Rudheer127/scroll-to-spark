import { MAX_IMAGE_DECODED_BYTES, type AcceptedImageType } from "./constants";

export type ImageDataUrlCheck =
  | { ok: true; dataUrl: string; mime: AcceptedImageType; bytes: number }
  | { ok: false; reason: "format" | "too_large" | "mismatch" };

const DATA_URL = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

/** Bytes the base64 text decodes to, without decoding all of it. */
export function decodedLength(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (base64.length / 4) * 3 - padding;
}

function startsWith(bytes: Uint8Array, prefix: number[], offset = 0): boolean {
  return prefix.every((value, i) => bytes[offset + i] === value);
}

/** What the first bytes say the file really is, whatever the data URL claims. */
export function sniffImageType(head: Uint8Array): AcceptedImageType | null {
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(head, [0xff, 0xd8, 0xff])) return "image/jpeg";
  const riff = [0x52, 0x49, 0x46, 0x46];
  const webp = [0x57, 0x45, 0x42, 0x50];
  if (startsWith(head, riff) && startsWith(head, webp, 8)) return "image/webp";
  return null;
}

function headBytes(base64: string): Uint8Array {
  const binary = atob(base64.slice(0, 16));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/**
 * Strict check of an image sent by the browser: a base64 data URL of an accepted type, small
 * enough after the browser shrank it, whose first bytes match the type it claims.
 */
export function checkImageDataUrl(value: string): ImageDataUrlCheck {
  const match = DATA_URL.exec(value);
  if (!match) return { ok: false, reason: "format" };
  const [, mime, base64] = match;
  if (base64.length % 4 !== 0 || base64.length < 16) return { ok: false, reason: "format" };
  const bytes = decodedLength(base64);
  if (bytes > MAX_IMAGE_DECODED_BYTES) return { ok: false, reason: "too_large" };
  const sniffed = sniffImageType(headBytes(base64));
  if (sniffed === null || sniffed !== mime) return { ok: false, reason: "mismatch" };
  return { ok: true, dataUrl: value, mime: sniffed, bytes };
}
