"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { fieldError, formError } from "@/lib/form-state";
import { signIn } from "@/features/auth/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, null);

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
      <Field label="Password" htmlFor="password" error={fieldError(state, "password")}>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </Field>
      {formError(state) ? (
        <p role="alert" className="text-sm text-danger">
          {formError(state)}
        </p>
      ) : null}
      <Button type="submit" variant="brand" disabled={pending}>
        {pending ? "Logging in" : "Log in"}
      </Button>
      <p className="text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-action">
          Create an account
        </Link>
      </p>
    </form>
  );
}
