"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { fieldError, formError } from "@/lib/form-state";
import { updateEmail } from "@/features/profile/actions";

export function EmailForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(updateEmail, null);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <Field
        label="Email address"
        htmlFor="email"
        hint="You sign in with this. We email a link to the new address to confirm the change."
        error={fieldError(state, "email")}
      >
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={email}
          autoComplete="email"
          required
          className={inputClass}
        />
      </Field>
      {formError(state) && !fieldError(state, "email") ? (
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
          {pending ? "Sending link" : "Change email"}
        </Button>
      </div>
    </form>
  );
}
