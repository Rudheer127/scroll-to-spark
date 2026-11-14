"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { joinGroup, leaveGroup } from "@/features/groups/actions";

type JoinLeaveButtonProps = { groupId: string; isMember: boolean; joinedLabel?: string };

/** Join when you are not in, and a quieter button to leave when you are. */
export function JoinLeaveButton({
  groupId,
  isMember,
  joinedLabel = "Leave",
}: JoinLeaveButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await (isMember ? leaveGroup(groupId) : joinGroup(groupId));
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant={isMember ? "outline" : "join"}
        onClick={handleClick}
        disabled={pending}
        aria-label={isMember ? "Leave this group" : "Join this group"}
      >
        {isMember ? joinedLabel : "Join"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
