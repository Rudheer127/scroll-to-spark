"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { fieldError, formError } from "@/lib/form-state";
import { updateDisplayName } from "@/features/profile/actions";
import { DISPLAY_NAME_MAX } from "@/features/profile/schemas";

export function DisplayNameForm({ displayName }: { displayName: string | null }) {
  const [state, formAction, pending] = useActionState(updateDisplayName, null);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <Field
        label="Display name"
        htmlFor="displayName"
        hint="Your real name or a nickname. Leave it empty to show only your username."
        error={fieldError(state, "displayName")}
      >
        <input
          id="displayName"
          name="displayName"
          defaultValue={displayName ?? ""}
          maxLength={DISPLAY_NAME_MAX}
          autoComplete="name"
          className={inputClass}
        />
      </Field>
      {formError(state) ? (
        <p role="alert" className="text-sm text-danger">
          {formError(state)}
        </p>
      ) : null}
      {state?.ok && state.message ? (
        <p role="status" className="text-sm font-semibold text-success">
          {state.message}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving" : "Save name"}
        </Button>
      </div>
    </form>
  );
}
