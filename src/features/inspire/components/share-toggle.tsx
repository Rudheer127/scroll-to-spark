"use client";

import { useState, useTransition } from "react";
import { setSharing } from "@/features/inspire/actions";
import type { Sharing } from "@/features/inspire/types";

type ShareToggleProps = { completionId: string; initial: Sharing; compact?: boolean };

/** Opt-in sharing for one finished step. Off by default; the person can turn it off any time. */
export function ShareToggle({ completionId, initial, compact = false }: ShareToggleProps) {
  const [value, setValue] = useState<Sharing>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function change(next: Sharing) {
    const previous = value;
    setValue(next);
    setError(null);
    startTransition(async () => {
      const result = await setSharing({ completionId, ...next });
      if (!result.ok) {
        setValue(previous);
        setError(result.error);
      }
    });
  }

  const idPrefix = `share-${completionId}`;
  return (
    <fieldset
      disabled={pending}
      className="flex flex-col gap-2 rounded-(--radius-input) bg-background p-3 text-sm"
    >
      <legend className="sr-only">Share this step on Get Inspired</legend>
      <label htmlFor={`${idPrefix}-public`} className="flex items-start gap-2 font-semibold">
        <input
          id={`${idPrefix}-public`}
          type="checkbox"
          checked={value.sharePublicly}
          onChange={(event) =>
            change({
              sharePublicly: event.target.checked,
              shareThankYou: event.target.checked && value.shareThankYou,
            })
          }
          className="mt-0.5 size-4"
        />
        Share this on the inspiration feed
      </label>
      {compact ? null : (
        <p className="pl-6 text-muted">
          People will see the step, the group, the minutes and your first name with your last
          initial (like Maya R.). Your note is never shown. Turn it off any time.
        </p>
      )}
      {value.sharePublicly ? (
        <label htmlFor={`${idPrefix}-thanks`} className="flex items-start gap-2 pl-6">
          <input
            id={`${idPrefix}-thanks`}
            type="checkbox"
            checked={value.shareThankYou}
            onChange={(event) => change({ ...value, shareThankYou: event.target.checked })}
            className="mt-0.5 size-4"
          />
          Also show the group&rsquo;s thank-you, if they send one
        </label>
      ) : null}
      {error ? (
        <p role="alert" className="pl-6 text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
