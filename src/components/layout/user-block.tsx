import { LogOut } from "lucide-react";
import { getCurrentProfile } from "@/features/auth/queries";
import { signOut } from "@/features/auth/actions";

/** The signed-in person, as one compact row pinned to the bottom of the rail with a sign out button. */
export async function UserBlock() {
  const profile = await getCurrentProfile();
  const name = profile?.username ?? "Account";

  return (
    <form
      action={signOut}
      className="-mx-6 -mb-6 flex items-center gap-3 border-t border-border px-6 py-4"
    >
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-(image:--gradient-spark) text-sm font-bold text-white"
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <p className="truncate text-sm font-semibold">{name}</p>
        <p className="text-xs text-muted">Signed in</p>
      </div>
      <button
        type="submit"
        aria-label="Sign out"
        title="Sign out"
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-chip hover:text-ink active:opacity-75"
      >
        <LogOut aria-hidden className="size-4" />
      </button>
    </form>
  );
}
