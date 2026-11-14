"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, inputClass } from "@/components/ui/field";
import { sendThankYou } from "@/features/steps/actions";
import { NOTE_MAX } from "@/features/steps/constants";

type ReplyControlsProps = { completionId: string; personName: string };

/** Two ways to reply: a one-tap thanks, or a few written lines. Both come from a real person. */
export function ReplyControls({ completionId, personName }: ReplyControlsProps) {
  const [pending, startTransition] = useTransition();
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function send(kind: "tap" | "written") {
    setError(null);
    startTransition(async () => {
      const result = await sendThankYou(completionId, kind, kind === "written" ? text : undefined);
      if (result.ok) setWriting(false);
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => send("tap")} disabled={pending}>
          <Heart aria-hidden className="size-4" />
          One-tap thanks
        </Button>
        <Button variant="primary" onClick={() => setWriting(true)} disabled={pending}>
          Write a line
        </Button>
      </div>
      {error && !writing ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <Dialog
        open={writing}
        onClose={() => setWriting(false)}
        title={`Reply to ${personName}`}
        description="Say what their step did. They will see this with your group's name on it."
      >
        {writing ? (
          <div className="flex flex-col gap-5">
            <Field label="Your reply" htmlFor={`reply-${completionId}`} error={error ?? undefined}>
              <textarea
                id={`reply-${completionId}`}
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={4}
                maxLength={NOTE_MAX}
                className={inputClass}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setWriting(false)}>
                Cancel
              </Button>
              <Button variant="brand" onClick={() => send("written")} disabled={pending}>
                {pending ? "Sending" : "Send reply"}
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
