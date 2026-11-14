import Link from "next/link";
import { NextStepCard } from "@/features/steps/components/next-step-card";
import { ProgressSummary } from "@/features/steps/components/progress-summary";
import { ThankYouCard } from "@/features/steps/components/thank-you-card";
import { isEffort } from "@/features/steps/constants";
import { summarizeProgress } from "@/features/steps/progress";
import { getMyCompletions, getNextTask } from "@/features/steps/queries";

const RECENT_REPLIES = 3;

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const { effort: effortParam, skip } = await searchParams;
  const effort = isEffort(effortParam) ? effortParam : undefined;

  const [task, completions] = await Promise.all([
    getNextTask({ effort, skip: typeof skip === "string" ? skip : undefined }),
    getMyCompletions(),
  ]);
  const replies = completions.filter((item) => item.thankYou).slice(0, RECENT_REPLIES);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-muted">No pressure. Here is one small thing you could do today.</p>
      </header>
      <NextStepCard task={task} effort={effort} />
      <ProgressSummary progress={summarizeProgress(completions)} />
      <section className="flex flex-col gap-4 rounded-(--radius-card) border border-border bg-surface p-6 shadow-card">
        <div className="flex items-center gap-4">
          <h2 className="flex-1 text-2xl font-semibold">Thank-yous for you</h2>
          <Link href="/steps" className="text-sm font-extrabold text-action hover:underline">
            All my steps
          </Link>
        </div>
        {replies.length === 0 ? (
          <p className="text-muted">Replies from groups show up here after you finish a step.</p>
        ) : (
          replies.map((item) => <ThankYouCard key={item.id} completion={item} />)
        )}
      </section>
    </div>
  );
}
