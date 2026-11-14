import { AccountRow } from "@/components/layout/account-row";
import { getCurrentProfile, getCurrentUser } from "@/features/auth/queries";
import { signOut } from "@/features/auth/actions";

/** The signed-in person's account row for the sidebar. Render inside Suspense. */
export async function UserBlock() {
  const [profile, user] = await Promise.all([getCurrentProfile(), getCurrentUser()]);
  const name = profile?.display_name ?? profile?.username ?? "Account";
  return (
    <AccountRow name={name} avatarUrl={profile?.avatar_url} email={user?.email} signOut={signOut} />
  );
}
