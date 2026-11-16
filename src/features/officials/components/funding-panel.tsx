"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { getFunding } from "@/features/officials/actions";
import { fecCandidateUrl } from "@/features/officials/normalize";
import { formatMoney } from "@/features/officials/filters";
import type { FundingSummary, Official } from "@/features/officials/types";

type State =
  | { kind: "loading" }
  | { kind: "ready"; funding: FundingSummary | null }
  | { kind: "error"; message: string };

/** Campaign money from the FEC. Loads when the dialog opens, and the load is dropped if it closes first. */
export function FundingPanel({ official }: { official: Official }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!official.bioguide) return;
    const controller = new AbortController();
    // A Server Action cannot be cut off mid-flight, so the controller gates the answer instead.
    void getFunding(official.bioguide).then((result) => {
      if (controller.signal.aborted) return;
      setState(
        result.ok
          ? { kind: "ready", funding: result.data.funding }
          : { kind: "error", message: result.error },
      );
    });
    return () => controller.abort();
  }, [official.bioguide, attempt]);

  if (!official.bioguide) return null;
  const link = official.fecId ? fecCandidateUrl(official.fecId) : null;

  return (
    <section aria-label="Campaign funding" className="flex flex-col gap-2">
      <h3 className="text-base font-bold">Campaign funding</h3>
      {state.kind === "loading" ? (
        <p role="status" className="animate-pulse text-sm text-muted">
          Loading figures from the FEC…
        </p>
      ) : null}
      {state.kind === "error" ? (
        <p role="alert" className="text-sm text-danger">
          {state.message}{" "}
          <button
            type="button"
            onClick={() => {
              setState({ kind: "loading" });
              setAttempt((n) => n + 1);
            }}
            className="font-semibold text-action hover:underline"
          >
            Try again
          </button>
        </p>
      ) : null}
      {state.kind === "ready" && !state.funding ? (
        <p className="text-sm text-muted">
          The FEC has no campaign totals on file for this person.
        </p>
      ) : null}
      {state.kind === "ready" && state.funding ? (
        <div className="flex flex-col gap-3">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Raised" value={formatMoney(state.funding.receipts)} />
            <Stat label="Spent" value={formatMoney(state.funding.disbursements)} />
            <Stat label="From individuals" value={formatMoney(state.funding.individual)} />
            <Stat label="From committees (PACs)" value={formatMoney(state.funding.committees)} />
          </dl>
          {state.funding.topEmployers.length > 0 ? (
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold">Top employers of individual donors</p>
              <ul className="flex flex-col gap-0.5 text-sm">
                {state.funding.topEmployers.map((row) => (
                  <li key={row.employer} className="flex justify-between gap-3">
                    <span className="truncate">{row.employer}</span>
                    <span className="text-muted">{formatMoney(row.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="text-xs text-muted">
            Source: FEC, {state.funding.cycle || "latest"} cycle
            {state.funding.coverageStart && state.funding.coverageEnd
              ? `, reports from ${state.funding.coverageStart} to ${state.funding.coverageEnd}`
              : ""}
            . Donor employers are self-reported and do not show who a donor is or why they gave.
          </p>
        </div>
      ) : null}
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-semibold text-action hover:underline"
        >
          See the full record at FEC.gov <ExternalLink aria-hidden className="size-3.5" />
        </a>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-(--radius-input) bg-chip p-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-base font-bold">{value}</dd>
    </div>
  );
}
