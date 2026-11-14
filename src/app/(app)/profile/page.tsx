import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/features/auth/queries";
import { UsernameForm } from "@/features/profile/components/username-form";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted">Choose the name other people see.</p>
      </header>
      <UsernameForm username={profile.username} />
    </div>
  );
}
