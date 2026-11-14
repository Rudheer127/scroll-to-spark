import Link from "next/link";
import { FOOTER, NAV_LINKS, SIGN_IN_HREF, SIGN_UP_HREF } from "../content";
import { WithAuth } from "./landing-actions";

const LINK = "inline-flex min-h-11 items-center text-sm font-semibold hover:underline";

/** Quiet footer: a few links and a large decorative wordmark. Account links match the sign-in state. */
export function SiteFooter() {
  return (
    <footer className="overflow-hidden bg-background px-6 text-ink lg:px-12">
      <div className="flex flex-wrap items-start justify-between gap-8 border-t border-border py-10">
        <p className="text-sm text-ink/75">{FOOTER.note}</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-1">
          {NAV_LINKS.map((link) => (
            <a key={link.id} href={`#${link.id}`} className={LINK}>
              {link.label}
            </a>
          ))}
          <WithAuth
            signedOut={
              <>
                <Link href={SIGN_IN_HREF} className={LINK}>
                  Sign in
                </Link>
                <Link href={SIGN_UP_HREF} className={LINK}>
                  Sign up
                </Link>
              </>
            }
            signedIn={
              <Link href="/" className={LINK}>
                Open the app
              </Link>
            }
          />
        </nav>
      </div>
      <p
        aria-hidden
        className="select-none text-[26vw] font-bold leading-[0.8] text-ink/10 lg:text-[20vw]"
      >
        Spark
      </p>
    </footer>
  );
}
