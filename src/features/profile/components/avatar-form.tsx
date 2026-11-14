"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { createClient } from "@/lib/supabase/client";
import { AVATAR_BUCKET, AVATAR_SIZE_PX } from "@/features/profile/constants";
import { removeAvatar, saveAvatar } from "@/features/profile/actions";

type AvatarFormProps = { userId: string; name: string; url: string | null };

const MAX_PICKED_BYTES = 10 * 1024 * 1024;

/** Crops the picked image to a centered square, shrinks it and turns it into a WebP. */
async function toSquareWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.min(AVATAR_SIZE_PX, side);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no canvas");
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  bitmap.close();
  return await new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("no blob"))),
      "image/webp",
      0.85,
    ),
  );
}

export function AvatarForm({ userId, name, url }: AvatarFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const shown = preview ?? url;

  function pick(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    if (!file.type.startsWith("image/")) {
      setMessage({ kind: "error", text: "Pick an image file." });
      return;
    }
    if (file.size > MAX_PICKED_BYTES) {
      setMessage({ kind: "error", text: "That image is over 10 MB. Pick a smaller one." });
      return;
    }
    startTransition(async () => {
      try {
        const blob = await toSquareWebp(file);
        const path = `${userId}/avatar-${Date.now()}.webp`;
        const { error } = await createClient()
          .storage.from(AVATAR_BUCKET)
          .upload(path, blob, { contentType: "image/webp", upsert: false });
        if (error) throw error;
        const result = await saveAvatar(path);
        if (!result.ok) {
          setMessage({ kind: "error", text: result.error });
          return;
        }
        setPreview(URL.createObjectURL(blob));
        setMessage({ kind: "ok", text: result.message ?? "Photo saved." });
      } catch {
        setMessage({ kind: "error", text: "We could not upload that photo. Try another image." });
      }
    });
  }

  function remove() {
    setMessage(null);
    startTransition(async () => {
      const result = await removeAvatar();
      if (!result.ok) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setPreview(null);
      setMessage({ kind: "ok", text: result.message ?? "Photo removed." });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-5">
        <UserAvatar name={name} url={shown} className="size-24 text-3xl" />
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => inputRef.current?.click()} disabled={pending}>
            {pending ? "Working" : shown ? "Change photo" : "Upload photo"}
          </Button>
          {shown ? (
            <Button variant="outline" onClick={remove} disabled={pending}>
              Remove
            </Button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-label="Choose a profile photo"
          onChange={(event) => {
            pick(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
      <p className="text-sm text-muted">JPG, PNG or WebP. It is cropped to a square.</p>
      {message ? (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={
            message.kind === "error" ? "text-sm text-danger" : "text-sm font-semibold text-success"
          }
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
