"use client";

import { useActionState, useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, inputClass } from "@/components/ui/field";
import { fieldError, formError } from "@/lib/form-state";
import { reportContent } from "@/features/threads/reports";
import { REPORT_REASONS } from "@/features/threads/schemas";

type ReportButtonProps = {
  targetType: "thread" | "comment" | "group";
  targetId: string;
  /** What is being reported, in the person's words: "thread", "comment" or "group". */
  noun: string;
  className?: string;
};

function ReportForm({
  targetType,
  targetId,
  noun,
  onClose,
}: Omit<ReportButtonProps, "className"> & { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(
    reportContent.bind(null, targetType, targetId),
    null,
  );

  if (state?.ok) {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="text-sm font-semibold text-success">
          {state.message}
        </p>
        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">Why are you reporting this {noun}?</legend>
        {REPORT_REASONS.map((reason, index) => (
          <label key={reason.value} className="flex items-center gap-2 text-sm">
            <input type="radio" name="reason" value={reason.value} required={index === 0} />
            {reason.label}
          </label>
        ))}
        {fieldError(state, "reason") ? (
          <p role="alert" className="text-sm text-danger">
            {fieldError(state, "reason")}
          </p>
        ) : null}
      </fieldset>
      <Field
        label="Anything we should know?"
        htmlFor={`report-details-${targetId}`}
        hint="Optional."
        error={fieldError(state, "details")}
      >
        <textarea
          id={`report-details-${targetId}`}
          name="details"
          rows={3}
          maxLength={500}
          className={inputClass}
        />
      </Field>
      {formError(state) ? (
        <p role="alert" className="text-sm text-danger">
          {formError(state)}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="danger" disabled={pending}>
          {pending ? "Sending" : "Send report"}
        </Button>
      </div>
    </form>
  );
}

/** A quiet Report button that opens a short form. Reports are private to the reporter. */
export function ReportButton({ targetType, targetId, noun, className }: ReportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)} className={className ?? "px-2"}>
        <Flag aria-hidden className="size-4" />
        Report<span className="sr-only"> this {noun}</span>
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Report this ${noun}`}
        description="Only you can see your report. If enough people report something, it is hidden while it is reviewed."
      >
        {open ? (
          <ReportForm
            targetType={targetType}
            targetId={targetId}
            noun={noun}
            onClose={() => setOpen(false)}
          />
        ) : null}
      </Dialog>
    </>
  );
}
