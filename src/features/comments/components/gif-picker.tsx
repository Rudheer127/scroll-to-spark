"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { altFromTitle, GIF_QUERY_MAX, type GifResult } from "@/features/comments/gifs";
import { IMAGE_ALT_MAX } from "@/features/threads/image-rules";

export type GifAttach = {
  gif: GifResult | null;
  alt: string;
  setGif: (gif: GifResult | null) => void;
  setAlt: (alt: string) => void;
  clear: () => void;
  /** An error to show when a GIF is chosen without a description, otherwise null. */
  check: () => string | null;
};

export function useGifAttach(): GifAttach {
  const [gif, setGifState] = useState<GifResult | null>(null);
  const [alt, setAlt] = useState("");

  const setGif = useCallback((next: GifResult | null) => {
    setGifState(next);
    setAlt(next ? altFromTitle(next.title) : "");
  }, []);
  const clear = useCallback(() => {
    setGifState(null);
    setAlt("");
  }, []);
  const check = () =>
    gif && alt.trim() === ""
      ? "Describe the GIF so people using screen readers can follow along."
      : null;

  return { gif, alt, setGif, setAlt, clear, check };
}

/** Search GIPHY through our own route, pick one, and describe it. Comments only. */
export function GifPicker({ attach }: { attach: GifAttach }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GifResult[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const loadedOnce = useRef(false);
  const searchId = useId();
  const altId = useId();

  const load = useCallback(async (term: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/gifs?q=${encodeURIComponent(term)}`);
      const body = (await response.json()) as { gifs?: GifResult[]; error?: string };
      setResults(body.gifs ?? []);
      if (body.error) setMessage(body.error);
      else if (!body.gifs?.length) setMessage("No GIFs found. Try different words.");
    } catch {
      setResults([]);
      setMessage("GIFs are not available right now. You can still write a comment.");
    } finally {
      setLoading(false);
    }
  }, []);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !loadedOnce.current) {
      loadedOnce.current = true;
      void load("");
    }
  }

  if (attach.gif) {
    return (
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote GIPHY media */}
          <img
            src={attach.gif.url}
            alt="Preview of the GIF you chose"
            className="max-h-32 max-w-[60%] rounded-lg border border-border object-contain"
          />
          <Button variant="ghost" onClick={attach.clear} className="px-2">
            <X aria-hidden className="size-4" />
            Remove GIF
          </Button>
        </div>
        <label htmlFor={altId} className="text-sm font-semibold">
          Describe the GIF (required)
        </label>
        <input
          id={altId}
          value={attach.alt}
          onChange={(event) => attach.setAlt(event.target.value)}
          maxLength={IMAGE_ALT_MAX}
          placeholder="For example: a crowd cheering"
          className={inputClass}
        />
        <p className="text-xs text-muted">Powered by GIPHY.</p>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div>
        <Button variant="outline" aria-expanded={open} onClick={toggle}>
          Add a GIF
        </Button>
      </div>
      {open ? (
        <div className="flex min-w-0 flex-col gap-3 rounded-(--radius-input) border border-border bg-background p-3">
          <div className="flex gap-2">
            <label htmlFor={searchId} className="sr-only">
              Search GIFs
            </label>
            <input
              id={searchId}
              type="search"
              value={query}
              maxLength={GIF_QUERY_MAX}
              placeholder="Search GIFs"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void load(query);
                }
              }}
              className={inputClass}
            />
            <Button variant="primary" onClick={() => void load(query)} disabled={loading}>
              <Search aria-hidden className="size-4" />
              Search
            </Button>
          </div>
          <p className="text-xs text-muted">
            What you search for is sent to GIPHY. Powered by GIPHY.
          </p>
          {message ? (
            <p role="status" className="text-sm text-muted">
              {message}
            </p>
          ) : null}
          {loading ? <p className="text-sm text-muted">Loading GIFs</p> : null}
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {results.map((gif) => (
              <li key={gif.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    attach.setGif(gif);
                    setOpen(false);
                  }}
                  className="flex min-h-11 w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-surface focus-visible:outline-2 focus-visible:outline-action"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote GIPHY media */}
                  <img
                    src={gif.previewUrl}
                    alt={gif.title || "GIF"}
                    loading="lazy"
                    className="h-24 w-full object-cover"
                  />
                  <span className="sr-only">Choose this GIF</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
