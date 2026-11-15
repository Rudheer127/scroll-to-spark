"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { fieldError, formError } from "@/lib/form-state";
import { DEFAULT_GROUP_RULES } from "@/features/groups/constants";
import { createThread } from "@/features/threads/actions";
import { ImageAttachField, useImageAttach } from "@/features/threads/components/image-attach";
import { PersonalInfoWarning } from "@/features/threads/components/personal-info-warning";
import { THREAD_BODY_MAX, THREAD_TITLE_MAX } from "@/features/threads/schemas";

type ThreadComposerProps = { groupId: string; groupName: string; rules: string | null };

/** Start a thread. Only shown to members. It clears itself after posting. */
export function ThreadComposer({ groupId, groupName, rules }: ThreadComposerProps) {
  const [state, formAction, pending] = useActionState(createThread, null);
  const [uploading, setUploading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const attach = useImageAttach();
  const { clear } = attach;

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      clear();
    }
  }, [state, clear]);

  async function submit(formData: FormData) {
    if (attach.check()) return;
    setUploading(true);
    const { path, error } = await attach.upload();
    setUploading(false);
    if (error) return;
    if (path) {
      formData.set("imagePath", path);
      formData.set("imageAlt", attach.alt.trim());
    }
    formAction(formData);
  }

  const busy = pending || uploading;
  const personalInfo = fieldError(state, "personalInfo");

  return (
    <form
      ref={formRef}
      action={submit}
      className="flex min-w-0 flex-col gap-4 rounded-(--radius-card) shadow-card border border-border bg-surface p-5"
    >
      <input type="hidden" name="groupId" value={groupId} />
      <h2 className="text-lg font-bold [overflow-wrap:anywhere]">Start a thread in {groupName}</h2>
      <details className="rounded-(--radius-input) bg-chip px-3.5 py-2.5 text-sm" open>
        <summary className="cursor-pointer font-semibold">Group rules</summary>
        <p className="mt-1.5 whitespace-pre-wrap text-muted [overflow-wrap:anywhere]">
          {rules ?? DEFAULT_GROUP_RULES}
        </p>
      </details>
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
      <ImageAttachField attach={attach} />
      {personalInfo ? <PersonalInfoWarning message={personalInfo} pending={busy} /> : null}
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
        <Button type="submit" variant="brand" disabled={busy}>
          {busy ? "Posting" : "Post thread"}
        </Button>
      </div>
    </form>
  );
}
