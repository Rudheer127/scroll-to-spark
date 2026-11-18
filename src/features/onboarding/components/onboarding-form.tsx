"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { completeOnboarding } from "@/features/onboarding/actions";
import { DISPLAY_NAME_MAX, NAME_MAX } from "@/features/onboarding/schemas";

type Props = {
  initial: { firstName: string; lastName: string; displayName: string; ageConfirmed: boolean };
};

/** The whole setup on one screen: three names, the 18+ box, one button right below them. */
export function OnboardingForm({ initial }: Props) {
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [displayName, setDisplayName] = useState(initial.displayName);
  // Follow the first name until the person types their own display name.
  const [displayTouched, setDisplayTouched] = useState(Boolean(initial.displayName));
  const [ageConfirmed, setAgeConfirmed] = useState(initial.ageConfirmed);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setErrors({});
    setFormError(null);
    startTransition(async () => {
      const result = await completeOnboarding({ firstName, lastName, displayName, ageConfirmed });
      // On success the action redirects, so only a failure comes back here.
      if (result && !result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.fieldErrors ? null : result.error);
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-(--radius-card) border border-border bg-surface p-6 shadow-card"
    >
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Set up your account</h1>
        <p className="text-muted">Three names and one checkbox. It takes under a minute.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" htmlFor="firstName" error={errors.firstName}>
          <input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            maxLength={NAME_MAX}
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              if (!displayTouched) setDisplayName(e.target.value);
            }}
            className={inputClass}
          />
        </Field>
        <Field label="Last name" htmlFor="lastName" error={errors.lastName}>
          <input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            maxLength={NAME_MAX}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        label="Display name"
        htmlFor="displayName"
        error={errors.displayName}
        hint="What other people see next to what you share. You can change it later in Settings."
      >
        <input
          id="displayName"
          name="displayName"
          autoComplete="nickname"
          maxLength={DISPLAY_NAME_MAX}
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            setDisplayTouched(true);
          }}
          className={inputClass}
        />
      </Field>

      <div className="flex flex-col gap-2">
        <label className="flex min-h-11 items-start gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={ageConfirmed}
            onChange={(e) => setAgeConfirmed(e.target.checked)}
            aria-describedby={errors.ageConfirmed ? "age-error" : undefined}
            className="mt-0.5 size-5 shrink-0"
          />
          I am 18 or older
        </label>
        {errors.ageConfirmed ? (
          <p id="age-error" role="alert" className="text-sm text-danger">
            {errors.ageConfirmed}
          </p>
        ) : null}
        <p className="text-sm text-muted">
          What you write stays private unless you share it. The Guide is an AI and can be wrong.{" "}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener"
            className="font-semibold text-action underline"
          >
            Privacy page (opens in a new tab)
          </Link>
        </p>
      </div>

      {formError ? (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <Button type="submit" variant="brand" className="w-full" disabled={pending}>
        {pending ? "Saving" : "Finish setup"}
      </Button>
    </form>
  );
}
