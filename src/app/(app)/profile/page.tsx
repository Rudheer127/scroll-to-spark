import { redirect } from "next/navigation";

/** Profile settings moved to /settings. This keeps old links and bookmarks working. */
export default function ProfilePage() {
  redirect("/settings");
}
