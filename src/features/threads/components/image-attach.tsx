"use client";

import { useCallback, useId, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/client";
import {
  IMAGE_ACCEPT,
  IMAGE_ALT_MAX,
  IMAGE_BUCKET,
  imageExtension,
  validateImageFile,
} from "@/features/threads/image-rules";

export type ImageAttach = {
  file: File | null;
  preview: string | null;
  alt: string;
  error: string | null;
  setFile: (file: File | null) => void;
  setAlt: (alt: string) => void;
  clear: () => void;
  /** Checks the picture and its description. Returns an error to show, or null when ready. */
  check: () => string | null;
  /** Uploads to the private bucket. Resolves to the stored path, null when there is no image. */
  upload: () => Promise<{ path: string | null; error: string | null }>;
};

/** State for one optional image. The file itself never goes through a server action. */
export function useImageAttach(): ImageAttach {
  const [file, setFileState] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const uploaded = useRef<{ file: File; path: string } | null>(null);

  function setFile(next: File | null) {
    if (next) {
      const problem = validateImageFile(next);
      if (problem) {
        setError(problem);
        setFileState(null);
        return;
      }
    }
    setError(null);
    setFileState(next);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return next ? URL.createObjectURL(next) : null;
    });
  }

  const clear = useCallback(() => {
    setFileState(null);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setAlt("");
    setError(null);
    uploaded.current = null;
  }, []);

  function check() {
    if (!file) return null;
    if (alt.trim() === "") {
      const message = "Describe the image so people using screen readers can follow along.";
      setError(message);
      return message;
    }
    return null;
  }

  async function upload() {
    if (!file) return { path: null, error: null };
    if (uploaded.current?.file === file) return { path: uploaded.current.path, error: null };
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    const extension = imageExtension(file.type);
    if (!data.user || !extension) return { path: null, error: "Sign in again to attach images." };

    const path = `${data.user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      const message = "The image did not upload. Check your connection and try again.";
      setError(message);
      return { path: null, error: message };
    }
    uploaded.current = { file, path };
    return { path, error: null };
  }

  return { file, preview, alt, error, setFile, setAlt, clear, check, upload };
}

/** Attach button, preview, and the required description. */
export function ImageAttachField({
  attach,
  label = "Add an image",
}: {
  attach: ImageAttach;
  label?: string;
}) {
  const inputId = useId();
  const altId = useId();

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {attach.file ? (
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-start gap-3">
            {attach.preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- local blob preview
              <img
                src={attach.preview}
                alt="Preview of the image you chose"
                className="max-h-32 max-w-[60%] rounded-lg border border-border object-cover"
              />
            ) : null}
            <Button variant="ghost" onClick={attach.clear} className="px-2">
              <X aria-hidden className="size-4" />
              Remove image
            </Button>
          </div>
          <label htmlFor={altId} className="text-sm font-semibold">
            Describe the image (required)
          </label>
          <input
            id={altId}
            value={attach.alt}
            onChange={(event) => attach.setAlt(event.target.value)}
            maxLength={IMAGE_ALT_MAX}
            placeholder="For example: volunteers sorting cans at a food drive"
            className={inputClass}
          />
        </div>
      ) : (
        <div>
          <label
            htmlFor={inputId}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-(--radius-control) border border-border bg-surface px-4 text-sm font-semibold hover:bg-chip md:min-h-10"
          >
            <ImagePlus aria-hidden className="size-4" />
            {label}
          </label>
          <input
            id={inputId}
            type="file"
            accept={IMAGE_ACCEPT}
            className="sr-only"
            onChange={(event) => {
              attach.setFile(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
          <p className="mt-1 text-xs text-muted">JPEG, PNG or WebP, up to 5 MB.</p>
        </div>
      )}
      {attach.error ? (
        <p role="alert" className="text-sm text-danger">
          {attach.error}
        </p>
      ) : null}
    </div>
  );
}
