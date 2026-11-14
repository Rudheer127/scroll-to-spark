import { LogOut } from "lucide-react";
import { AccountMenu } from "@/components/layout/account-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getCurrentProfile, getCurrentUser } from "@/features/auth/queries";
import { signOut } from "@/features/auth/actions";

/** The signed-in person, pinned to the bottom of the rail: account menu on the left, theme toggle and sign out on the right. */
export async function UserBlock() {
  const [profile, user] = await Promise.all([getCurrentProfile(), getCurrentUser()]);
  const name = profile?.display_name ?? profile?.username ?? "Account";

  return (
    <div className="-mx-6 -mb-6 flex items-center gap-3 border-t border-border px-6 py-4">
      <AccountMenu
        name={name}
        avatarUrl={profile?.avatar_url}
        email={user?.email}
        signOut={signOut}
      />
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <p className="truncate text-sm font-semibold">{name}</p>
        <p className="text-xs text-muted">Signed in</p>
      </div>
      <ThemeToggle />
      <form action={signOut}>
        <button
          type="submit"
          aria-label="Sign out"
          title="Sign out"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-chip hover:text-ink active:opacity-75"
        >
          <LogOut aria-hidden className="size-4" />
        </button>
      </form>
    </div>
  );
}
