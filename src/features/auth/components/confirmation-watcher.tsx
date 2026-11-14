"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CHECK_EVERY_MS = 3000;

/**
 * Waits for the person to open the confirmation link, which signs them in on another tab.
 * The session cookie is shared between tabs, so this tab notices and moves on by itself.
 */
export function ConfirmationWatcher() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (active && user) router.replace("/");
    }

    const timer = setInterval(check, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [router]);

  return null;
}
