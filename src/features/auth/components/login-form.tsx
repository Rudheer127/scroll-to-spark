"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { fieldError, formError } from "@/lib/form-state";
import { signIn } from "@/features/auth/actions";
import { GoogleButton } from "@/features/auth/components/google-button";
import { PasswordField } from "@/features/auth/components/password-field";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, null);

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-5">
        <Field label="Email address" htmlFor="email" error={fieldError(state, "email")}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            className={cn(inputClass, "min-h-12")}
          />
        </Field>
        <PasswordField autoComplete="current-password" error={fieldError(state, "password")} />
        <Link
          href="/forgot-password"
          className="-mt-2 w-fit self-end text-sm font-semibold text-action hover:underline"
        >
          Forgot password?
        </Link>
        {formError(state) ? (
          <p role="alert" className="text-sm text-danger">
            {formError(state)}
          </p>
        ) : null}
        <Button type="submit" variant="primary" disabled={pending} className="min-h-12">
          {pending ? "Signing in" : "Sign in"}
        </Button>
      </form>
      <div className="flex items-center gap-4 text-sm text-muted" aria-hidden>
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton label="Continue with Google" hideHint />
    </div>
  );
}
