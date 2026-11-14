import Link from "next/link";
import { StepList } from "@/features/steps/components/step-list";
import { getMyCompletions } from "@/features/steps/queries";

export default async function StepsPage() {
  const completions = await getMyCompletions();
  const replies = completions.filter((item) => item.thankYou).length;
  const minutes = completions.reduce((sum, item) => sum + item.minutes, 0);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-4xl font-bold">My steps</h1>
        <p className="text-muted">Everything you have done, and what the groups said back.</p>
      </header>
      {completions.length === 0 ? (
        <p className="rounded-(--radius-card) border border-border bg-surface p-6 text-muted shadow-card">
          You have not done a step yet.{" "}
          <Link href="/" className="font-semibold text-action hover:underline">
            Find a small step
          </Link>
        </p>
      ) : (
        <>
          <dl className="grid max-w-3xl grid-cols-3 gap-3">
            {[
              { label: "Steps done", value: completions.length, tone: "bg-sun/40" },
              { label: "Minutes given", value: minutes, tone: "bg-lavender-soft" },
              { label: "Thank-yous", value: replies, tone: "bg-teal-soft" },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`flex flex-col gap-0.5 rounded-(--radius-card) p-4 ${stat.tone}`}
              >
                <dt className="text-sm font-semibold text-muted">{stat.label}</dt>
                <dd className="font-display text-3xl font-bold">{stat.value}</dd>
              </div>
            ))}
          </dl>
          <StepList completions={completions} />
        </>
      )}
    </div>
  );
}
