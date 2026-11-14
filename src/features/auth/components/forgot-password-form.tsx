"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { fieldError, formError } from "@/lib/form-state";
import { requestPasswordReset } from "@/features/auth/actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, null);

  if (state?.ok) {
    return (
      <div className="flex flex-col gap-5">
        <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-chip">
          <Mail aria-hidden className="size-7" />
        </span>
        <h2 className="text-3xl font-bold">Check your email</h2>
        <p className="text-lg">
          If there is an account for that address, we sent a link for choosing a new password.
        </p>
        <Link href="/login" className="text-sm font-semibold text-action hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

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
      {formError(state) ? (
        <p role="alert" className="text-sm text-danger">
          {formError(state)}
        </p>
      ) : null}
      <Button type="submit" variant="brand" disabled={pending}>
        {pending ? "Sending" : "Send the link"}
      </Button>
      <Link href="/login" className="text-sm font-semibold text-action hover:underline">
        Back to log in
      </Link>
    </form>
  );
}
