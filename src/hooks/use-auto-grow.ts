"use client";

import { useLayoutEffect } from "react";

/**
 * Grows a text box with its content. The CSS max height caps it, after which it scrolls.
 * Returns the fit function so a caller can run it again, for example on focus.
 */
export function useAutoGrow(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
): () => void {
  function fit() {
    const field = ref.current;
    if (!field) return;
    field.style.height = "auto";
    // A box inside a dialog that is not open yet measures 0; keep the rows height until focus.
    if (field.scrollHeight === 0) return;
    field.style.height = `${field.scrollHeight}px`;
  }

  useLayoutEffect(fit, [ref, value]);
  return fit;
}
