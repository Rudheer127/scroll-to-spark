import { redirect } from "next/navigation";
import { UserAvatar } from "@/components/shared/user-avatar";
import { getCurrentProfile, getCurrentUser } from "@/features/auth/queries";
import { DisplayNameForm } from "@/features/profile/components/display-name-form";
import { EmailForm } from "@/features/profile/components/email-form";
import { PasswordForm } from "@/features/profile/components/password-form";
import { ProfilePhotoActions } from "@/features/profile/components/profile-photo-actions";
import { SettingsSection } from "@/features/profile/components/settings-section";
import { UsernameForm } from "@/features/profile/components/username-form";
import { getMyCompletions } from "@/features/steps/queries";

export default async function SettingsPage() {
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);
  if (!user || !profile) redirect("/login");
  const completions = await getMyCompletions();
  const replies = completions.filter((item) => item.thankYou).length;
  const shownName = profile.display_name ?? profile.username;
  const usesPassword = user.app_metadata.provider === "email";

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-5 rounded-(--radius-card) border border-border bg-surface p-6 shadow-card sm:flex-row sm:items-center">
        <UserAvatar name={shownName} url={profile.avatar_url} className="size-20 text-3xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="truncate text-3xl font-bold">{shownName}</h1>
          <p className="truncate text-muted">
            @{profile.username} &middot; {user.email}
          </p>
          <p className="text-sm text-muted">
            {completions.length} {completions.length === 1 ? "step" : "steps"} done, {replies}{" "}
            {replies === 1 ? "thank-you" : "thank-yous"} received
          </p>
        </div>
        <ProfilePhotoActions userId={user.id} url={profile.avatar_url} />
      </header>

      <SettingsSection
        title="Display name"
        description="The name people see first. Your username stays as your handle."
      >
        <DisplayNameForm displayName={profile.display_name} />
      </SettingsSection>
      <SettingsSection
        title="Username"
        description="Your unique handle. Capitals are fine, and so are dots and hyphens."
      >
        <UsernameForm username={profile.username} />
      </SettingsSection>
      <SettingsSection
        title="Email"
        description="Where we send sign-in links and replies. Changing it needs a click on a link we email."
      >
        <EmailForm email={user.email ?? ""} />
      </SettingsSection>
      <SettingsSection
        title="Password"
        description={
          usesPassword
            ? "Pick a new one at least 8 characters long. We ask for the current one to be sure it is you."
            : "You sign in with Google, so there is no Spark password to change."
        }
      >
        {usesPassword ? <PasswordForm /> : null}
      </SettingsSection>
    </div>
  );
}
