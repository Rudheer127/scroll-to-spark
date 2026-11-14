import Link from "next/link";
import { AccountMenu } from "@/components/layout/account-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getCurrentProfile, getCurrentUser } from "@/features/auth/queries";
import { signOut } from "@/features/auth/actions";

/** The top bar for windows narrower than the large breakpoint: logo on the left, account on the right. */
export async function MobileHeader() {
  const [profile, user] = await Promise.all([getCurrentProfile(), getCurrentUser()]);

  return (
    <header className="flex items-center justify-between gap-3 border-b border-border bg-surface px-[var(--page-gutter)] py-3 lg:hidden">
      <Link href="/" className="active:opacity-75">
        <span className="bg-(image:--gradient-spark) bg-clip-text font-display text-2xl font-extrabold tracking-tight text-transparent">
          Spark
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <AccountMenu
          name={profile?.display_name ?? profile?.username ?? "Account"}
          avatarUrl={profile?.avatar_url}
          email={user?.email}
          signOut={signOut}
        />
      </div>
    </header>
  );
}
