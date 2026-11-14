"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { fieldError, formError } from "@/lib/form-state";
import { completeTask } from "@/features/steps/actions";
import { NOTE_MAX } from "@/features/steps/constants";

export function CompleteTaskForm({ taskId }: { taskId: string }) {
  const [state, formAction, pending] = useActionState(completeTask, null);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      <input type="hidden" name="taskId" value={taskId} />
      <Field
        label="Write your note"
        htmlFor="note"
        hint="A line or two is plenty. The group reads it."
        error={fieldError(state, "note")}
      >
        <textarea
          id="note"
          name="note"
          rows={5}
          maxLength={NOTE_MAX}
          required
          className={inputClass}
        />
      </Field>
      {formError(state) ? (
        <p role="alert" className="text-sm text-danger">
          {formError(state)}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant="brand" disabled={pending}>
          {pending ? "Sending" : "Send my note"}
        </Button>
      </div>
    </form>
  );
}
