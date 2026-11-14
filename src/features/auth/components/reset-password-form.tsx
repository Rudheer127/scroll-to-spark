"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { fieldError, formError } from "@/lib/form-state";
import { updatePassword } from "@/features/auth/actions";
import { PasswordField } from "@/features/auth/components/password-field";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <PasswordField
        label="New password"
        autoComplete="new-password"
        hint="At least 8 characters."
        minLength={8}
        error={fieldError(state, "password")}
      />
      {formError(state) ? (
        <p role="alert" className="text-sm text-danger">
          {formError(state)}
        </p>
      ) : null}
      <Button type="submit" variant="brand" disabled={pending}>
        {pending ? "Saving" : "Save new password"}
      </Button>
    </form>
  );
}
