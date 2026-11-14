import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const LANDING_PATH = "/welcome";
const PUBLIC_PATHS = [
  LANDING_PATH,
  "/login",
  "/signup",
  "/check-email",
  "/forgot-password",
  "/auth/callback",
];
const SIGNED_OUT_ONLY_PATHS = ["/login", "/signup", "/check-email", "/forgot-password"];

function matches(pathname: string, paths: string[]): boolean {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Signed-out visitors see the landing page at "/" (the address stays "/"), and are sent to the login
 * page for everything else that is private. Signed-in people go to the app and away from the sign-in pages.
 */
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (!user && pathname === "/") {
    const landing = NextResponse.rewrite(new URL(LANDING_PATH, request.url));
    response.cookies.getAll().forEach((cookie) => landing.cookies.set(cookie));
    return landing;
  }

  const target =
    !user && !matches(pathname, PUBLIC_PATHS)
      ? "/login"
      : user && matches(pathname, SIGNED_OUT_ONLY_PATHS)
        ? "/"
        : null;

  if (!target) return response;

  const redirect = NextResponse.redirect(new URL(target, request.url));
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
