import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clearPendingEmail } from "@/features/auth/pending-email";

/**
 * Only paths on this site are allowed, so the link cannot send people somewhere else.
 * Browsers read a backslash as a slash, so "/\\evil.com" would leave the site. The check
 * resolves the value the way the redirect will and requires the same origin.
 */
function safeNextPath(value: string | null, base: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\"))
    return "/";
  const resolved = new URL(value, base);
  return resolved.origin === new URL(base).origin ? `${resolved.pathname}${resolved.search}` : "/";
}

/** The link in an email lands here. It trades the code for a session, then goes on to the next page. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"), request.url);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await clearPendingEmail();
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?error=confirm", request.url));
}
