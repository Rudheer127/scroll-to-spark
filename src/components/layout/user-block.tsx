import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/features/auth/queries";
import { signOut } from "@/features/auth/actions";

/** The signed-in person's name and the sign out button, in a soft lavender card at the bottom of the rail. */
export async function UserBlock() {
  const profile = await getCurrentProfile();

  return (
    <form action={signOut} className="flex flex-col gap-3 rounded-[20px] bg-lavender-soft p-4">
      {profile ? (
        <div className="flex flex-col">
          <p className="font-display text-lg font-semibold">{profile.username}</p>
          <p className="text-sm text-muted">Signed in</p>
        </div>
      ) : null}
      <Button type="submit" variant="outline" className="bg-surface text-lavender-ink">
        <LogOut aria-hidden className="size-4" />
        Sign out
      </Button>
    </form>
  );
}
