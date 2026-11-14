"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { fieldError, formError } from "@/lib/form-state";
import { updatePassword } from "@/features/profile/actions";
import { PASSWORD_MIN } from "@/features/profile/schemas";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex max-w-md flex-col gap-4">
      <Field
        label="Current password"
        htmlFor="currentPassword"
        error={fieldError(state, "currentPassword")}
      >
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </Field>
      <Field
        label="New password"
        htmlFor="newPassword"
        hint={`At least ${PASSWORD_MIN} characters.`}
        error={fieldError(state, "newPassword")}
      >
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN}
          required
          className={inputClass}
        />
      </Field>
      <Field
        label="Confirm new password"
        htmlFor="confirmPassword"
        error={fieldError(state, "confirmPassword")}
      >
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className={inputClass}
        />
      </Field>
      {formError(state) && !state?.ok ? (
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
          {pending ? "Updating" : "Update password"}
        </Button>
      </div>
    </form>
  );
}
