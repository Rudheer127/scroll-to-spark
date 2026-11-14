"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, inputClass } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { fieldError, formError } from "@/lib/form-state";
import { createGroup } from "@/features/groups/actions";
import {
  GROUP_COLOR_VALUES,
  GROUP_DESCRIPTION_MAX,
  GROUP_NAME_MAX,
  swatchClass,
} from "@/features/groups/constants";

function CreateGroupForm({ onCancel }: { onCancel: () => void }) {
  const [state, formAction, pending] = useActionState(createGroup, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Group name" htmlFor="group-name" error={fieldError(state, "name")}>
        <input
          id="group-name"
          name="name"
          required
          maxLength={GROUP_NAME_MAX}
          className={inputClass}
        />
      </Field>
      <Field
        label="What is this group about?"
        htmlFor="group-description"
        hint="Optional."
        error={fieldError(state, "description")}
      >
        <textarea
          id="group-description"
          name="description"
          rows={3}
          maxLength={GROUP_DESCRIPTION_MAX}
          className={inputClass}
        />
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">Group color</legend>
        <div className="flex gap-3">
          {GROUP_COLOR_VALUES.map((color, index) => (
            <label key={color} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={color}
                defaultChecked={index === 1}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "block size-9 rounded-full ring-ink ring-offset-2 peer-checked:ring-2 peer-focus-visible:outline-2 peer-focus-visible:outline-action",
                  swatchClass(color),
                )}
              >
                <span className="sr-only">{color}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {formError(state) ? (
        <p role="alert" className="text-sm text-danger">
          {formError(state)}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating" : "Create group"}
        </Button>
      </div>
    </form>
  );
}

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="brand" onClick={() => setOpen(true)}>
        <Plus aria-hidden className="size-4" />
        Create group
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Create a group"
        description="Start a space for people who care about the same thing."
      >
        {open ? <CreateGroupForm onCancel={() => setOpen(false)} /> : null}
      </Dialog>
    </>
  );
}
