"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { fieldError, formError } from "@/lib/form-state";
import { addComment } from "@/features/comments/actions";
import { COMMENT_MAX } from "@/features/comments/constants";

type CommentFormProps = {
  threadId: string;
  parentId?: string;
  label: string;
  onDone?: () => void;
};

/** A box for a new comment, or a reply when parentId is given. It clears itself after posting. */
export function CommentForm({ threadId, parentId, label, onDone }: CommentFormProps) {
  const [state, formAction, pending] = useActionState(addComment, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      onDone?.();
    }
  }, [state, onDone]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="threadId" value={threadId} />
      <input type="hidden" name="parentId" value={parentId ?? ""} />
      <label htmlFor={`body-${parentId ?? "top"}`} className="text-sm font-semibold">
        {label}
      </label>
      <textarea
        id={`body-${parentId ?? "top"}`}
        name="body"
        rows={3}
        maxLength={COMMENT_MAX}
        required
        className={inputClass}
      />
      {(fieldError(state, "body") ?? formError(state)) ? (
        <p role="alert" className="text-sm text-danger">
          {fieldError(state, "body") ?? formError(state)}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Posting" : parentId ? "Post reply" : "Post comment"}
        </Button>
        {onDone ? (
          <Button variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
