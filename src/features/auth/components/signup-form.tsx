"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { fieldError, formError } from "@/lib/form-state";
import { signUp } from "@/features/auth/actions";

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
      <Field
        label="Password"
        htmlFor="password"
        hint="At least 8 characters."
        error={fieldError(state, "password")}
      >
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
        />
      </Field>
      {formError(state) ? (
        <p role="alert" className="text-sm text-danger">
          {formError(state)}
        </p>
      ) : null}
      {state?.ok && state.message ? (
        <p role="status" className="rounded-(--radius-control) bg-chip p-3 text-sm">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" variant="brand" disabled={pending}>
        {pending ? "Creating account" : "Create account"}
      </Button>
      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-action">
          Log in
        </Link>
      </p>
    </form>
  );
}
