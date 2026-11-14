import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type GuideEventKind =
  "injection_signal" | "crisis" | "output_blocked" | "provider_failure" | "rate_limited";

/**
 * Records a safety event with the service-role client. Detail holds signal and rule names only,
 * never the user's text. Never throws: logging must not break a reply.
 */
export async function logGuideEvent(
  admin: SupabaseClient<Database>,
  userId: string,
  kind: GuideEventKind,
  detail: Record<string, string | number>,
): Promise<void> {
  try {
    await admin.from("guide_events").insert({ user_id: userId, kind, detail });
  } catch {
    // Intentionally ignored.
  }
}
