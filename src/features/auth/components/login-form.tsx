"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { fieldError, formError } from "@/lib/form-state";
import { signIn } from "@/features/auth/actions";
import { GoogleButton } from "@/features/auth/components/google-button";
import { PasswordField } from "@/features/auth/components/password-field";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <GoogleButton label="Continue with Google" />
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
      <div className="flex flex-col gap-2">
        <PasswordField autoComplete="current-password" error={fieldError(state, "password")} />
        <Link href="/forgot-password" className="text-sm font-semibold text-action hover:underline">
          Forgot your password?
        </Link>
      </div>
      {formError(state) ? (
        <p role="alert" className="text-sm text-danger">
          {formError(state)}
        </p>
      ) : null}
      <Button type="submit" variant="brand" disabled={pending}>
        {pending ? "Logging in" : "Log in"}
      </Button>
    </form>
  );
}
