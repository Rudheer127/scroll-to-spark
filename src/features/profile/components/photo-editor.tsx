"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { AVATAR_BUCKET, AVATAR_SIZE_PX } from "@/features/profile/constants";
import { saveAvatar } from "@/features/profile/actions";
import {
  INITIAL_CROP,
  MAX_ZOOM,
  MIN_ZOOM,
  clampCrop,
  drawCrop,
  type CropState,
} from "@/features/profile/photo-crop";

const MAX_PICKED_BYTES = 10 * 1024 * 1024;
const VIEW_PX = 288;
const NUDGE = 0.02;

type Source = { bitmap: ImageBitmap; width: number; height: number };

type PhotoEditorProps = {
  userId: string;
  /** The photo they have now, offered for adjusting. */
  currentUrl: string | null;
  onSaved: (message: string) => void;
  onCancel: () => void;
};

async function readFile(file: File): Promise<Source> {
  const bitmap = await createImageBitmap(file);
  return { bitmap, width: bitmap.width, height: bitmap.height };
}

async function readUrl(url: string): Promise<Source> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("fetch failed");
  const bitmap = await createImageBitmap(await response.blob());
  return { bitmap, width: bitmap.width, height: bitmap.height };
}

/** Choose a picture, drag and zoom it inside a circle, and watch the result as it will appear around Spark. */
export function PhotoEditor({ userId, currentUrl, onSaved, onCancel }: PhotoEditorProps) {
  const [source, setSource] = useState<Source | null>(null);
  const [crop, setCrop] = useState<CropState>(INITIAL_CROP);
  const [loading, setLoading] = useState(currentUrl !== null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLCanvasElement>(null);
  const largeRef = useRef<HTMLCanvasElement>(null);
  const smallRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ pointer: number; startX: number; startY: number; crop: CropState } | null>(
    null,
  );

  const adopt = useCallback((next: Source) => {
    setSource((previous) => {
      previous?.bitmap.close();
      return next;
    });
    setCrop(INITIAL_CROP);
  }, []);

  // Open straight into adjusting the photo they already have.
  useEffect(() => {
    if (!currentUrl) return;
    let live = true;
    readUrl(currentUrl)
      .then((next) => {
        if (live) adopt(next);
        else next.bitmap.close();
      })
      .catch(() => {
        if (live) setError("We could not open your current photo. Choose a new one instead.");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [currentUrl, adopt]);

  // Redraw the editor and both previews whenever the picture or the crop changes.
  useEffect(() => {
    if (!source) return;
    for (const ref of [mainRef, largeRef, smallRef]) {
      const canvas = ref.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) continue;
      drawCrop(context, source.bitmap, source.width, source.height, crop, canvas.width);
    }
  }, [source, crop]);

  function change(patch: Partial<CropState>) {
    if (!source) return;
    setCrop((now) => clampCrop({ ...now, ...patch }, source.width, source.height));
  }

  async function choose(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) return setError("Pick an image file.");
    if (file.size > MAX_PICKED_BYTES) return setError("That image is over 10 MB. Pick a smaller one.");
    try {
      adopt(await readFile(file));
    } catch {
      setError("We could not read that image. Try a JPG, PNG or WebP.");
    }
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointer: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      crop,
    };
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const start = drag.current;
    if (!start || start.pointer !== event.pointerId || !source) return;
    const box = event.currentTarget.getBoundingClientRect();
    setCrop(
      clampCrop(
        {
          ...start.crop,
          x: start.crop.x + (event.clientX - start.startX) / box.width,
          y: start.crop.y + (event.clientY - start.startY) / box.height,
        },
        source.width,
        source.height,
      ),
    );
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLCanvasElement>) {
    const moves: Record<string, Partial<CropState>> = {
      ArrowLeft: { x: crop.x - NUDGE },
      ArrowRight: { x: crop.x + NUDGE },
      ArrowUp: { y: crop.y - NUDGE },
      ArrowDown: { y: crop.y + NUDGE },
      "+": { zoom: crop.zoom + 0.1 },
      "=": { zoom: crop.zoom + 0.1 },
      "-": { zoom: crop.zoom - 0.1 },
    };
    const patch = moves[event.key];
    if (!patch) return;
    event.preventDefault();
    change(patch);
  }

  async function save() {
    if (!source) return;
    setSaving(true);
    setError(null);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = AVATAR_SIZE_PX;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("no canvas");
      drawCrop(context, source.bitmap, source.width, source.height, crop, AVATAR_SIZE_PX);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((made) => (made ? resolve(made) : reject(new Error("no blob"))), "image/webp", 0.88),
      );
      const path = `${userId}/avatar-${Date.now()}.webp`;
      const { error: uploadError } = await createClient()
        .storage.from(AVATAR_BUCKET)
        .upload(path, blob, { contentType: "image/webp", upsert: false });
      if (uploadError) throw uploadError;
      const result = await saveAvatar(path);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved(result.message ?? "Photo saved.");
    } catch {
      setError("We could not upload that photo. Try again or pick another image.");
    } finally {
      setSaving(false);
    }
  }

  const picker = (
    <input
      ref={fileRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="sr-only"
      tabIndex={-1}
      aria-label="Choose a profile photo"
      onChange={(event) => {
        void choose(event.target.files?.[0]);
        event.target.value = "";
      }}
    />
  );

  if (!source) {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          disabled={loading}
          onClick={() => fileRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            void choose(event.dataTransfer.files[0]);
          }}
          className={`flex min-h-56 flex-col items-center justify-center gap-3 rounded-(--radius-card) border-2 border-dashed p-6 text-center hover:bg-chip ${
            dragOver ? "border-action bg-chip" : "border-border"
          }`}
        >
          <ImagePlus aria-hidden className="size-8 text-muted" />
          <span className="font-semibold">{loading ? "Opening your photo" : "Choose a photo"}</span>
          <span className="text-sm text-muted">Or drop one here. JPG, PNG or WebP, up to 10 MB.</span>
        </button>
        {picker}
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  const zoomLabel = `${Math.round(crop.zoom * 100)}%`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-6">
        <div
          className="relative shrink-0 overflow-hidden rounded-(--radius-input) bg-chip"
          style={{ width: VIEW_PX, height: VIEW_PX }}
        >
          <canvas
            ref={mainRef}
            width={VIEW_PX * 2}
            height={VIEW_PX * 2}
            tabIndex={0}
            role="img"
            aria-label="Photo crop area. Drag to move the picture, or use the arrow keys. Plus and minus zoom."
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
            onKeyDown={onKeyDown}
            className="size-full cursor-grab touch-none active:cursor-grabbing"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_999px_rgba(0,0,0,0.55)] ring-2 ring-white/80"
          />
        </div>
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-semibold">Preview</p>
          <canvas
            ref={largeRef}
            width={192}
            height={192}
            aria-hidden
            className="size-24 rounded-full border border-border"
          />
          <canvas
            ref={smallRef}
            width={72}
            height={72}
            aria-hidden
            className="size-9 rounded-full border border-border"
          />
          <p className="max-w-32 text-center text-xs text-muted">
            What shows next to your name and in the menu.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-3 text-sm font-semibold">
          <span className="w-12 shrink-0">Zoom</span>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={crop.zoom}
            onChange={(event) => change({ zoom: Number(event.target.value) })}
            aria-valuetext={zoomLabel}
            className="h-2 min-w-0 flex-1 accent-(--color-action)"
          />
          <span className="w-12 shrink-0 text-right font-normal text-muted tabular-nums">
            {zoomLabel}
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => change({ rotation: (((crop.rotation + 90) % 360) as CropState["rotation"]) })}
          >
            <RotateCw aria-hidden className="size-4" />
            Rotate
          </Button>
          <Button variant="outline" onClick={() => setCrop(INITIAL_CROP)}>
            Reset
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <ImagePlus aria-hidden className="size-4" />
            Different photo
          </Button>
        </div>
        {picker}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={save} disabled={saving}>
          {saving ? "Saving" : "Save photo"}
        </Button>
      </div>
    </div>
  );
}
