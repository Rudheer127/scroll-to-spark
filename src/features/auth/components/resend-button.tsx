"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { resendConfirmation } from "@/features/auth/actions";

const COOLDOWN_SECONDS = 30;

export function ResendButton() {
  const [pending, startTransition] = useTransition();
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  function handleClick() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await resendConfirmation();
      if (result.ok) {
        setMessage("We sent the link again.");
        setSecondsLeft(COOLDOWN_SECONDS);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="outline" onClick={handleClick} disabled={pending || secondsLeft > 0}>
        {secondsLeft > 0 ? `Send again in ${secondsLeft} seconds` : "Send the link again"}
      </Button>
      {message ? (
        <p role="status" className="text-sm">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
