import { EffortTabs } from "@/features/steps/components/effort-tabs";
import { NextStepCard } from "@/features/steps/components/next-step-card";
import { ProgressSummary } from "@/features/steps/components/progress-summary";
import { isEffort } from "@/features/steps/constants";
import { summarizeProgress } from "@/features/steps/progress";
import { getMyCompletions, getNextTask } from "@/features/steps/queries";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const { effort: effortParam, skip } = await searchParams;
  const effort = isEffort(effortParam) ? effortParam : undefined;

  const [task, completions] = await Promise.all([
    getNextTask({ effort, skip: typeof skip === "string" ? skip : undefined }),
    getMyCompletions(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Home</h1>
        <p className="text-muted">
          One small thing you could do today. You choose how much to give.
        </p>
      </header>
      <EffortTabs current={effort} />
      <NextStepCard task={task} effort={effort} />
      <ProgressSummary progress={summarizeProgress(completions)} />
    </div>
  );
}
