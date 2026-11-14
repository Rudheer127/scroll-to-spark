"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { fieldError, formError } from "@/lib/form-state";
import { createThread } from "@/features/threads/actions";
import { THREAD_BODY_MAX, THREAD_TITLE_MAX } from "@/features/threads/schemas";

/** Start a thread. Only shown to members. It clears itself after posting. */
export function ThreadComposer({ groupId, groupName }: { groupId: string; groupName: string }) {
  const [state, formAction, pending] = useActionState(createThread, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-(--radius-card) border border-border bg-surface p-5"
    >
      <input type="hidden" name="groupId" value={groupId} />
      <h2 className="text-lg font-bold">Start a thread in {groupName}</h2>
      <Field label="Title" htmlFor="thread-title" error={fieldError(state, "title")}>
        <input
          id="thread-title"
          name="title"
          required
          maxLength={THREAD_TITLE_MAX}
          className={inputClass}
        />
      </Field>
      <Field
        label="What do you want to say?"
        htmlFor="thread-body"
        hint="Optional."
        error={fieldError(state, "body")}
      >
        <textarea
          id="thread-body"
          name="body"
          rows={3}
          maxLength={THREAD_BODY_MAX}
          className={inputClass}
        />
      </Field>
      {formError(state) ? (
        <p role="alert" className="text-sm text-danger">
          {formError(state)}
        </p>
      ) : null}
      {state?.ok ? (
        <p role="status" className="text-sm font-semibold text-success">
          Posted.
        </p>
      ) : null}
      <div>
        <Button type="submit" variant="brand" disabled={pending}>
          {pending ? "Posting" : "Post thread"}
        </Button>
      </div>
    </form>
  );
}
