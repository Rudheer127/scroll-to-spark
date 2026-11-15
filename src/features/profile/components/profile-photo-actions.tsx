"use client";

import { useState, useTransition } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { removeAvatar } from "@/features/profile/actions";
import { PhotoEditor } from "@/features/profile/components/photo-editor";

type ProfilePhotoActionsProps = { userId: string; url: string | null };

/** The photo buttons in the top card: one opens the editor in a popup, the other takes the photo away. */
export function ProfilePhotoActions({ userId, url }: ProfilePhotoActionsProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    setMessage(null);
    startTransition(async () => {
      const result = await removeAvatar();
      setMessage(
        result.ok
          ? { kind: "ok", text: result.message ?? "Photo removed." }
          : { kind: "error", text: result.error },
      );
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => setOpen(true)} disabled={pending}>
          <Camera aria-hidden className="size-4" />
          {url ? "Edit photo" : "Add photo"}
        </Button>
        {url ? (
          <Button variant="outline" onClick={remove} disabled={pending}>
            {pending ? "Removing" : "Remove"}
          </Button>
        ) : null}
      </div>
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
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Edit profile photo"
        description="Drag the picture and zoom until it looks right. The circle is what people see."
      >
        {open ? (
          <PhotoEditor
            userId={userId}
            currentUrl={url}
            onCancel={() => setOpen(false)}
            onSaved={(text) => {
              setMessage({ kind: "ok", text });
              setOpen(false);
            }}
          />
        ) : null}
      </Dialog>
    </div>
  );
}
