"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { fieldError, formError } from "@/lib/form-state";
import { updateUsername } from "@/features/profile/actions";
import { USERNAME_MAX } from "@/features/profile/schemas";

export function UsernameForm({ username }: { username: string }) {
  const [state, formAction, pending] = useActionState(updateUsername, null);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-5">
      <Field
        label="Username"
        htmlFor="username"
        hint="Other people see this name. Lowercase letters, numbers and underscores."
        error={fieldError(state, "username")}
      >
        <input
          id="username"
          name="username"
          defaultValue={username}
          required
          maxLength={USERNAME_MAX}
          autoComplete="username"
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
          {pending ? "Saving" : "Save username"}
        </Button>
      </div>
    </form>
  );
}
