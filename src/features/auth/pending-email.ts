import { cookies } from "next/headers";

const COOKIE_NAME = "pending-signup-email";
const ONE_HOUR_SECONDS = 60 * 60;

/**
 * Remember which email is waiting for confirmation, so the check email page can show it.
 * A cookie keeps the address out of the URL.
 */
export async function rememberPendingEmail(email: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, email, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: ONE_HOUR_SECONDS,
    path: "/",
  });
}

export async function getPendingEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function clearPendingEmail(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
