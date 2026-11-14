import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import type { ButtonVariant } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/queries";
import { APP_HREF, SIGN_IN_HREF, SIGN_UP_HREF } from "../content";

type AuthSwitchProps = { signedOut: React.ReactNode; signedIn: React.ReactNode };

/** Shows one thing to signed-out visitors and another to signed-in people, decided on the server from the session. */
export async function AuthSwitch({ signedOut, signedIn }: AuthSwitchProps) {
  // The session depends on the request, so wait for one before reading it. This keeps the page's
  // static shell free of per-request values.
  await connection();
  const user = await getCurrentUser();
  return user ? signedIn : signedOut;
}

/** Same as AuthSwitch, but shows the signed-out version while the session is read, so there is no empty gap. */
export function WithAuth(props: AuthSwitchProps) {
  return (
    <Suspense fallback={props.signedOut}>
      <AuthSwitch {...props} />
    </Suspense>
  );
}

type MainCtaProps = {
  signedOutLabel: string;
  signedInLabel?: string;
  variant?: ButtonVariant;
  className?: string;
};

/** The main action. Signed out it goes to sign up. Signed in it goes straight to the app. */
export function MainCta({
  signedOutLabel,
  signedInLabel,
  variant = "primary",
  className,
}: MainCtaProps) {
  const link = (href: string, label: string) => (
    <ButtonLink href={href} variant={variant} className={className}>
      {label}
      <ArrowRight aria-hidden className="size-5" />
    </ButtonLink>
  );
  return (
    <WithAuth
      signedOut={link(SIGN_UP_HREF, signedOutLabel)}
      signedIn={link(APP_HREF, signedInLabel ?? signedOutLabel)}
    />
  );
}

/** Top bar buttons: Sign in and Get started, or a single Open the app when already signed in. */
export function NavActions() {
  return (
    <WithAuth
      signedOut={
        <>
          <ButtonLink
            href={SIGN_IN_HREF}
            variant="ghost"
            className="hidden hover:bg-white/10 sm:inline-flex"
          >
            Sign in
          </ButtonLink>
          <ButtonLink
            href={SIGN_UP_HREF}
            variant="primary"
            className="bg-sun text-ink hover:opacity-90"
          >
            Get started
          </ButtonLink>
        </>
      }
      signedIn={
        <ButtonLink href={APP_HREF} variant="primary" className="bg-sun text-ink hover:opacity-90">
          Open the app
        </ButtonLink>
      }
    />
  );
}

/** Closing section buttons. A signed-in person does not need a sign in button. */
export function ContactActions({
  primaryLabel,
  signedInLabel,
  secondaryLabel,
}: {
  primaryLabel: string;
  signedInLabel: string;
  secondaryLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <MainCta
        signedOutLabel={primaryLabel}
        signedInLabel={signedInLabel}
        className="min-h-12 bg-sun px-7 text-base text-ink hover:opacity-90"
      />
      <WithAuth
        signedOut={
          <ButtonLink
            href={SIGN_IN_HREF}
            variant="ghost"
            className="min-h-12 border border-white/30 px-7 text-base hover:bg-white/10"
          >
            {secondaryLabel}
          </ButtonLink>
        }
        signedIn={null}
      />
    </div>
  );
}
