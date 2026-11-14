"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, inputClass } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { fieldError, formError } from "@/lib/form-state";
import { updateGroup } from "@/features/groups/actions";
import {
  GROUP_COLOR_VALUES,
  GROUP_DESCRIPTION_MAX,
  GROUP_NAME_MAX,
  swatchClass,
} from "@/features/groups/constants";

type EditGroupDialogProps = {
  open: boolean;
  onClose: () => void;
  group: {
    id: string;
    name: string;
    description: string | null;
    color: string;
    isPrivate: boolean;
  };
};

function EditGroupForm({ group, onClose }: Omit<EditGroupDialogProps, "open">) {
  const [state, formAction, pending] = useActionState(updateGroup.bind(null, group.id), null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Group name" htmlFor="edit-group-name" error={fieldError(state, "name")}>
        <input
          id="edit-group-name"
          name="name"
          required
          maxLength={GROUP_NAME_MAX}
          defaultValue={group.name}
          className={inputClass}
        />
      </Field>
      <Field
        label="What is this group about?"
        htmlFor="edit-group-description"
        error={fieldError(state, "description")}
      >
        <textarea
          id="edit-group-description"
          name="description"
          rows={3}
          maxLength={GROUP_DESCRIPTION_MAX}
          defaultValue={group.description ?? ""}
          className={inputClass}
        />
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">Group color</legend>
        <div className="flex gap-3">
          {GROUP_COLOR_VALUES.map((color) => (
            <label key={color} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={color}
                defaultChecked={color === group.color}
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
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">Who can see it</legend>
        {(["public", "private"] as const).map((value) => (
          <label key={value} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="visibility"
              value={value}
              defaultChecked={(value === "private") === group.isPrivate}
            />
            {value === "public" ? "Anyone can find and join" : "Only members can see it"}
          </label>
        ))}
      </fieldset>
      {formError(state) ? (
        <p role="alert" className="text-sm text-danger">
          {formError(state)}
        </p>
      ) : null}
      {state?.ok ? (
        <p role="status" className="text-sm font-semibold text-success">
          Saved.
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          {state?.ok ? "Close" : "Cancel"}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

/** Owner only. Edits the group's name, description, color and visibility. */
export function EditGroupDialog({ open, onClose, group }: EditGroupDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Edit group">
      {open ? <EditGroupForm group={group} onClose={onClose} /> : null}
    </Dialog>
  );
}
