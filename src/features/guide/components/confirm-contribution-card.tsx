"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMinutes } from "@/lib/format-time";
import { confirmContribution } from "../actions";
import type { GuideResponse } from "../schemas";

type Proposal = NonNullable<GuideResponse["proposed_contribution"]>;
type Status = "idle" | "saved" | "dismissed";

/** Shows what the guide understood and saves it only when the person says so. Read only. */
export function ConfirmContributionCard({ proposal }: { proposal: Proposal }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await confirmContribution(proposal);
      if (result.ok) setStatus("saved");
      else setError(result.error);
    });
  }

  if (status === "dismissed") return <p className="text-sm text-muted">Not saved.</p>;
  if (status === "saved") {
    return (
      <p role="status" className="flex items-center gap-1.5 text-sm text-success">
        <Check aria-hidden className="size-4" />
        Saved to your record.
      </p>
    );
  }

  return (
    <article className="flex flex-col gap-3 rounded-(--radius-card) border border-border bg-surface p-4">
      <header className="flex flex-col gap-0.5">
        <h3 className="text-base font-bold">{proposal.title}</h3>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
          <li>{formatMinutes(proposal.minutes)}</li>
          <li>{proposal.occurred_on}</li>
        </ul>
      </header>
      {proposal.description ? <p className="text-sm">{proposal.description}</p> : null}
      <p className="text-sm text-muted">Self reported. We do not verify hours.</p>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="brand" disabled={pending} onClick={save}>
          {pending ? "Saving" : "Save"}
        </Button>
        <Button variant="ghost" disabled={pending} onClick={() => setStatus("dismissed")}>
          Not now
        </Button>
        <span className="text-sm text-muted">Save this to your record.</span>
      </div>
    </article>
  );
}
