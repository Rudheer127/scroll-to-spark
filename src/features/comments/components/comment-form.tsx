"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { fieldError, formError } from "@/lib/form-state";
import { addComment } from "@/features/comments/actions";
import { COMMENT_MAX } from "@/features/comments/constants";
import { GifPicker, useGifAttach } from "@/features/comments/components/gif-picker";
import { ImageAttachField, useImageAttach } from "@/features/threads/components/image-attach";
import { PersonalInfoWarning } from "@/features/threads/components/personal-info-warning";

type CommentFormProps = {
  threadId: string;
  parentId?: string;
  label: string;
  onDone?: () => void;
};

/** A box for a new comment, or a reply when parentId is given. It clears itself after posting. */
export function CommentForm({ threadId, parentId, label, onDone }: CommentFormProps) {
  const [state, formAction, pending] = useActionState(addComment, null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const attach = useImageAttach();
  const gif = useGifAttach();
  const { clear } = attach;
  const clearGif = gif.clear;

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      clear();
      clearGif();
      onDone?.();
    }
  }, [state, onDone, clear, clearGif]);

  async function submit(formData: FormData) {
    const gifProblem = gif.check();
    setLocalError(gifProblem);
    if (attach.check() || gifProblem) return;
    setUploading(true);
    const { path, error } = await attach.upload();
    setUploading(false);
    if (error) return;
    if (path) {
      formData.set("imagePath", path);
      formData.set("imageAlt", attach.alt.trim());
    }
    if (gif.gif) {
      formData.set("gifUrl", gif.gif.url);
      formData.set("imageAlt", gif.alt.trim());
    }
    formAction(formData);
  }

  const busy = pending || uploading;
  const personalInfo = fieldError(state, "personalInfo");
  const problem =
    localError ?? fieldError(state, "body") ?? fieldError(state, "imageAlt") ?? formError(state);

  return (
    <form ref={formRef} action={submit} className="flex min-w-0 flex-col gap-2">
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
        className={inputClass}
      />
      {gif.gif ? null : <ImageAttachField attach={attach} />}
      {attach.file ? null : <GifPicker attach={gif} />}
      {personalInfo ? <PersonalInfoWarning message={personalInfo} pending={busy} /> : null}
      {problem ? (
        <p role="alert" className="text-sm text-danger">
          {problem}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? "Posting" : parentId ? "Post reply" : "Post comment"}
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
