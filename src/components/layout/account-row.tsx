import { AccountMenu } from "@/components/layout/account-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";

type AccountRowProps = {
  name: string;
  avatarUrl?: string | null;
  email?: string;
  signOut: () => Promise<void>;
};

/**
 * The account row at the bottom of the sidebar: the avatar and name together (the whole
 * thing opens the account menu), then the theme switch. Sign out is one labelled item in the account menu, not
 * a second icon button. In the collapsed rail the name hides and the controls stack.
 */
export function AccountRow({ name, avatarUrl, email, signOut }: AccountRowProps) {
  return (
    <div data-sidebar-account className="flex items-center gap-1 border-t border-border px-1 pt-4">
      <AccountMenu name={name} avatarUrl={avatarUrl} email={email} signOut={signOut} showName />
      <ThemeToggle />
    </div>
  );
}
