import Link from "next/link";
import { StepList } from "@/features/steps/components/step-list";
import { getMyCompletions } from "@/features/steps/queries";

export default async function StepsPage() {
  const completions = await getMyCompletions();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">My steps</h1>
        <p className="text-muted">Everything you have done, and what the groups said back.</p>
      </header>
      {completions.length === 0 ? (
        <p className="text-muted">
          You have not done a step yet.{" "}
          <Link href="/" className="font-semibold text-action hover:underline">
            Find a small step
          </Link>
        </p>
      ) : (
        <StepList completions={completions} />
      )}
    </div>
  );
}
