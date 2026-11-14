"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { fieldError, formError } from "@/lib/form-state";
import { signUp } from "@/features/auth/actions";
import { PasswordField } from "@/features/auth/components/password-field";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Email" htmlFor="email" error={fieldError(state, "email")}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
        />
      </Field>
      <PasswordField
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
        {pending ? "Creating account" : "Create account"}
      </Button>
      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-action hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
