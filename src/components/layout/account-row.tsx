import { LogOut } from "lucide-react";
import { AccountMenu } from "@/components/layout/account-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";

type AccountRowProps = {
  name: string;
  avatarUrl?: string | null;
  email?: string;
  signOut: () => Promise<void>;
};

/**
 * The account row at the bottom of the sidebar: the avatar (it opens the account menu), the name
 * in a readable size, then the theme switch and sign out. In the collapsed rail the name hides and
 * the three controls stack, so nothing is clipped.
 */
export function AccountRow({ name, avatarUrl, email, signOut }: AccountRowProps) {
  return (
    <div data-sidebar-account className="flex items-center gap-1 border-t border-border px-1 pt-4">
      <AccountMenu name={name} avatarUrl={avatarUrl} email={email} signOut={signOut} />
      <p
        data-sidebar-expanded-only
        title={name}
        className="min-w-0 flex-1 truncate pl-2 text-[0.9375rem] font-semibold"
      >
        {name}
      </p>
      <ThemeToggle />
      <form action={signOut}>
        <button
          type="submit"
          aria-label="Sign out"
          title="Sign out"
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-chip hover:text-ink active:opacity-75"
        >
          <LogOut aria-hidden className="size-4" />
        </button>
      </form>
    </div>
  );
}
