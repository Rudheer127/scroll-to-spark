import { MAX_INPUT_CHARS } from "../constants";
import { IMAGE_MARKER } from "./constants";

const PREFIX = "[Image description: ";
const SUFFIX = "]";

/**
 * Adds the image description to the person's own words as a clearly labeled part of their
 * message. Room is reserved for their words: only the description is shortened to fit.
 */
export function foldImageDescription(ownText: string, description: string): string {
  const separator = ownText.length > 0 ? " " : "";
  const room = MAX_INPUT_CHARS - ownText.length - separator.length - PREFIX.length - SUFFIX.length;
  if (room <= 0) return ownText;
  const fitted = description.replace(/[[\]]/g, "").slice(0, room).trimEnd();
  if (fitted.length === 0) return ownText;
  return `${ownText}${separator}${PREFIX}${fitted}${SUFFIX}`;
}

/** What is stored for the user turn: their own words and a marker, never the image. */
export function storedUserText(ownText: string, hasImage: boolean): string {
  if (!hasImage) return ownText;
  return ownText.length > 0 ? `${ownText} ${IMAGE_MARKER}` : IMAGE_MARKER;
}
