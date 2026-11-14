"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, inputClass } from "@/components/ui/field";
import { deleteGroup } from "@/features/groups/actions";

type DeleteGroupDialogProps = {
  groupId: string;
  groupName: string;
  open: boolean;
  onClose: () => void;
};

function DeleteGroupForm({
  groupId,
  groupName,
  onCancel,
}: Omit<DeleteGroupDialogProps, "open" | "onClose"> & { onCancel: () => void }) {
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteGroup(groupId, typed);
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <Field
        label={`Type ${groupName} to confirm`}
        htmlFor="confirm-name"
        error={error ?? undefined}
      >
        <input
          id="confirm-name"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          className={inputClass}
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleDelete}
          disabled={pending || typed.trim() !== groupName}
        >
          {pending ? "Deleting" : "Delete group"}
        </Button>
      </div>
    </div>
  );
}

/** Owner only. It asks for the group name before anything is removed. */
export function DeleteGroupDialog({ groupId, groupName, open, onClose }: DeleteGroupDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Delete ${groupName}?`}
      description="This removes every thread and comment in the group for everyone. It cannot be undone."
    >
      {open ? <DeleteGroupForm groupId={groupId} groupName={groupName} onCancel={onClose} /> : null}
    </Dialog>
  );
}
