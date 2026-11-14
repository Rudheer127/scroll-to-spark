"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { joinGroup, leaveGroup } from "@/features/groups/actions";

type JoinLeaveButtonProps = { groupId: string; isMember: boolean };

export function JoinLeaveButton({ groupId, isMember }: JoinLeaveButtonProps) {
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
      <Button variant={isMember ? "outline" : "primary"} onClick={handleClick} disabled={pending}>
        {isMember ? "Leave" : "Join"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
