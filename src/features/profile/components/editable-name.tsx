"use client";

import { useActionState, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { inputClass } from "@/components/ui/field";
import { fieldError, formError } from "@/lib/form-state";
import type { ActionResult } from "@/lib/result";
import { updateDisplayName } from "@/features/profile/actions";
import { DISPLAY_NAME_MAX } from "@/features/profile/schemas";

type EditableNameProps = { shownName: string; displayName: string | null; username: string };

/** The name in the top card, with a small pencil that turns it into a box right there. */
export function EditableName({ shownName, displayName, username }: EditableNameProps) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (previous: ActionResult | null, formData: FormData) => {
      const result = await updateDisplayName(previous, formData);
      if (result.ok) setEditing(false);
      return result;
    },
    null,
  );

  if (!editing) {
    return (
      <div className="flex min-w-0 items-center gap-1">
        <h1 className="truncate text-3xl font-bold">{shownName}</h1>
        <IconButton label="Edit display name" onClick={() => setEditing(true)}>
          <Pencil aria-hidden className="size-4" />
        </IconButton>
      </div>
    );
  }

  const problem = fieldError(state, "displayName") ?? formError(state);
  return (
    <form action={formAction} className="flex max-w-md flex-col gap-1">
      <div className="flex items-center gap-1">
        <input
          name="displayName"
          aria-label="Display name"
          defaultValue={displayName ?? ""}
          placeholder={username}
          maxLength={DISPLAY_NAME_MAX}
          autoComplete="name"
          autoFocus
          onKeyDown={(event) => {
            if (event.key === "Escape") setEditing(false);
          }}
          className={`${inputClass} min-w-0 flex-1`}
        />
        <IconButton label="Save name" type="submit" disabled={pending} className="text-success">
          <Check aria-hidden className="size-5" />
        </IconButton>
        <IconButton label="Cancel" onClick={() => setEditing(false)} disabled={pending}>
          <X aria-hidden className="size-5" />
        </IconButton>
      </div>
      <p className="text-sm text-muted">Leave it empty to show only your username.</p>
      {problem ? (
        <p role="alert" className="text-sm text-danger">
          {problem}
        </p>
      ) : null}
    </form>
  );
}
