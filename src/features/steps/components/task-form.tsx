"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { fieldError, formError } from "@/lib/form-state";
import { createTask } from "@/features/steps/actions";
import {
  DESCRIPTION_MAX,
  EFFORTS,
  EFFORT_LABELS,
  PLACES,
  PLACE_LABELS,
  REPLY_PROMISE_HOURS,
  TITLE_MAX,
} from "@/features/steps/constants";

type OwnedGroup = { id: string; name: string };

const PILL =
  "flex min-h-11 cursor-pointer items-center rounded-full border border-control px-4 text-sm font-semibold peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-action md:min-h-10";

export function TaskForm({ groups }: { groups: OwnedGroup[] }) {
  const [state, formAction, pending] = useActionState(createTask, null);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      <Field
        label="Which group is this for?"
        htmlFor="groupId"
        error={fieldError(state, "groupId")}
      >
        <select
          id="groupId"
          name="groupId"
          required
          className={inputClass}
          defaultValue={groups[0]?.id}
        >
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="What is the task?" htmlFor="title" error={fieldError(state, "title")}>
        <input id="title" name="title" required maxLength={TITLE_MAX} className={inputClass} />
      </Field>
      <Field
        label="What will the person do?"
        htmlFor="description"
        hint="One or two sentences. Optional."
        error={fieldError(state, "description")}
      >
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={DESCRIPTION_MAX}
          className={inputClass}
        />
      </Field>
      <Field label="Minutes it takes" htmlFor="minutes" error={fieldError(state, "minutes")}>
        <input
          id="minutes"
          name="minutes"
          type="number"
          min={1}
          max={600}
          defaultValue={5}
          required
          className={`${inputClass} max-w-40`}
        />
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">How big is it?</legend>
        <div className="flex flex-wrap gap-2">
          {EFFORTS.map((effort, index) => (
            <label key={effort}>
              <input
                type="radio"
                name="effort"
                value={effort}
                defaultChecked={index === 0}
                className="peer sr-only"
              />
              <span className={PILL}>{EFFORT_LABELS[effort].label}</span>
            </label>
          ))}
        </div>
        {fieldError(state, "effort") ? (
          <p role="alert" className="text-sm text-danger">
            {fieldError(state, "effort")}
          </p>
        ) : null}
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">Where does it happen?</legend>
        <div className="flex flex-wrap gap-2">
          {PLACES.map((place, index) => (
            <label key={place}>
              <input
                type="radio"
                name="place"
                value={place}
                defaultChecked={index === 0}
                className="peer sr-only"
              />
              <span className={PILL}>{PLACE_LABELS[place]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="rounded-(--radius-input) bg-chip p-4 text-sm">
        By posting this, a real person from your group promises to reply to everyone who does it
        within {REPLY_PROMISE_HOURS} hours.
      </p>
      {formError(state) ? (
        <p role="alert" className="text-sm text-danger">
          {formError(state)}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant="brand" disabled={pending}>
          {pending ? "Posting" : "Post task"}
        </Button>
        <Link href="/portal" className="text-sm font-semibold text-action hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
