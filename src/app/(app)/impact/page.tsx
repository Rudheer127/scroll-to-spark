import type { Metadata } from "next";
import { Check, Clock, Users } from "lucide-react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { SampleBadge } from "@/components/shared/sample-badge";
import { ButtonLink } from "@/components/ui/button-link";
import { SAMPLE_IMPACT } from "@/features/impact/sample";

export const metadata: Metadata = { title: "Your impact" };

export default function ImpactPage() {
  const impact = SAMPLE_IMPACT;
  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Your impact" }]} />
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-bold">Your impact</h1>
          <SampleBadge />
        </div>
        <p className="text-lg text-muted">
          A preview of what you will see after a step you took helps something happen. Every name,
          number and result below is made up to show the idea. Nothing here is about you yet.
        </p>
      </header>

      <section
        aria-label="What you did"
        className="flex flex-col gap-2 rounded-(--radius-card) border border-border bg-surface p-6 shadow-card"
      >
        <p className="text-sm font-semibold text-coral">{impact.action.when}</p>
        <h2 className="text-2xl font-bold">{impact.action.title}</h2>
        <p className="text-sm text-muted">
          {impact.action.group} · {impact.action.minutes} minutes
        </p>
        <p className="mt-1 text-lg">{impact.summary}</p>
      </section>

      <ul aria-label="The numbers" className="grid gap-4 sm:grid-cols-3">
        {impact.numbers.map((item) => (
          <li
            key={item.label}
            className="rounded-(--radius-card) border border-border bg-surface p-5 shadow-card"
          >
            <p className="text-3xl font-bold">{item.value}</p>
            <p className="text-sm text-muted">{item.label}</p>
          </li>
        ))}
      </ul>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section
          aria-label="What happened next"
          className="flex flex-col gap-4 rounded-(--radius-card) border border-border bg-surface p-6 shadow-card"
        >
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Clock aria-hidden className="size-5 text-muted" />
            What happened next
          </h2>
          <ol className="flex flex-col gap-4">
            {impact.timeline.map((step) => (
              <li key={step.when} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-teal-soft text-teal-ink"
                >
                  <Check className="size-3.5" />
                </span>
                <div className="flex flex-col">
                  <p className="font-semibold">
                    {step.when}: {step.title}
                  </p>
                  <p className="text-sm text-muted">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="flex flex-col gap-6">
          <section
            aria-label="What changed"
            className="flex flex-col gap-3 rounded-(--radius-card) border border-border bg-surface p-6 shadow-card"
          >
            <h2 className="text-xl font-bold">What changed</h2>
            <ul className="flex flex-col gap-3">
              {impact.changes.map((change) => (
                <li key={change.label} className="flex flex-col gap-1 text-sm">
                  <p className="font-semibold">{change.label}</p>
                  <p className="flex flex-wrap gap-x-2 text-muted">
                    <span>Before: {change.before}</span>
                    <span aria-hidden>→</span>
                    <span className="font-semibold text-teal-ink">Now: {change.after}</span>
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-label="People involved"
            className="flex flex-col gap-3 rounded-(--radius-card) border border-border bg-surface p-6 shadow-card"
          >
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Users aria-hidden className="size-5 text-muted" />
              People involved
            </h2>
            <ul className="flex flex-col gap-2 text-sm">
              {impact.people.map((person) => (
                <li key={person.name}>
                  <span className="font-semibold">{person.name}</span>
                  <span className="text-muted"> · {person.role}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <section
        aria-label="What to do next"
        className="flex flex-wrap items-center justify-between gap-4 rounded-(--radius-card) border border-border bg-surface p-6 shadow-card"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">{impact.next.title}</h2>
          <p className="text-muted">
            Real results will show up here once groups report them back to you.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={impact.next.href} variant="brand">
            {impact.next.label}
          </ButtonLink>
          <ButtonLink href="/officials" variant="outline">
            Find who represents you
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
