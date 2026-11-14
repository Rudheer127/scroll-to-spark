import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/features/auth/queries";
import { getMyCompletions } from "@/features/steps/queries";
import { UsernameForm } from "@/features/profile/components/username-form";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const completions = await getMyCompletions();
  const replies = completions.filter((item) => item.thankYou).length;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <header className="flex items-center gap-5 rounded-(--radius-card) border border-border bg-surface p-6 shadow-card">
        <span
          aria-hidden
          className="flex size-20 shrink-0 items-center justify-center rounded-full bg-(image:--gradient-spark) font-display text-3xl font-bold text-white"
        >
          {profile.username.slice(0, 1).toUpperCase()}
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">{profile.username}</h1>
          <p className="text-muted">
            {completions.length} {completions.length === 1 ? "step" : "steps"} done, {replies}{" "}
            {replies === 1 ? "thank-you" : "thank-yous"} received
          </p>
        </div>
      </header>
      <section className="flex flex-col gap-4 rounded-(--radius-card) border border-border bg-surface p-6 shadow-card">
        <h2 className="text-xl font-bold">Your name</h2>
        <p className="text-muted">Choose the name other people see.</p>
        <UsernameForm username={profile.username} />
      </section>
    </div>
  );
}
