"use client";

import { useRef, useState } from "react";
import { checkImageFile } from "../vision/check-image-file";
import { MAX_IMAGE_DECODED_BYTES } from "../vision/constants";
import { downscaleImage } from "../vision/downscale-image";
import { decodedLength } from "../vision/image-data-url";

export type AttachmentState =
  | { status: "empty" }
  | { status: "processing"; name: string }
  | { status: "ready"; name: string; dataUrl: string }
  | { status: "error"; message: string };

export type ImageAttachment = {
  state: AttachmentState;
  /** Checks, shrinks and holds one image. A new pick replaces the old one. */
  attach: (file: File) => void;
  clear: () => void;
};

const SHRINK_ERROR = "That image could not be opened. Try another one.";
const TOO_BIG_AFTER = "That image is still too large after shrinking. Try a smaller one.";

/** One image for the next message. It lives in the provider so it survives expand and minimize. */
export function useImageAttachment(): ImageAttachment {
  const [state, setState] = useState<AttachmentState>({ status: "empty" });
  const pick = useRef(0);

  function attach(file: File) {
    const problem = checkImageFile(file);
    if (problem) {
      setState({ status: "error", message: problem });
      return;
    }
    const ticket = ++pick.current;
    setState({ status: "processing", name: file.name });
    downscaleImage(file)
      .then((dataUrl) => {
        if (ticket !== pick.current) return;
        const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
        if (decodedLength(base64) > MAX_IMAGE_DECODED_BYTES) {
          setState({ status: "error", message: TOO_BIG_AFTER });
          return;
        }
        setState({ status: "ready", name: file.name, dataUrl });
      })
      .catch(() => {
        if (ticket === pick.current) setState({ status: "error", message: SHRINK_ERROR });
      });
  }

  function clear() {
    pick.current += 1;
    setState({ status: "empty" });
  }

  return { state, attach, clear };
}
