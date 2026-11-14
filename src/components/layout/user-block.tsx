import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/features/auth/queries";
import { signOut } from "@/features/auth/actions";

/** The signed-in person's name and the sign out button, at the bottom of the navigation rail. */
export async function UserBlock() {
  const profile = await getCurrentProfile();

  return (
    <form action={signOut} className="flex flex-col gap-2 border-t border-border pt-4">
      {profile ? <p className="truncate px-3 text-sm text-muted">{profile.username}</p> : null}
      <Button type="submit" variant="ghost" className="justify-start px-3">
        <LogOut aria-hidden className="size-5" />
        Sign out
      </Button>
    </form>
  );
}
