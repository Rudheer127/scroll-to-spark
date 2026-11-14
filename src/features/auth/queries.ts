import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** The signed-in user, or null. Cached so several callers in one request ask Supabase once. */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** The signed-in person's profile, or null. */
export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  return data;
});
