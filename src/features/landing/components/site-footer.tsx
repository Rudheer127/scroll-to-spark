import Link from "next/link";
import { CONTACT, FOOTER, SIGN_IN_HREF, SIGN_UP_HREF } from "../content";
import { WithAuth } from "./landing-actions";

const HEADING = "text-sm font-bold text-ink";
const LINK = "inline-flex min-h-8 items-center text-sm text-muted transition-colors hover:text-ink";

type Column = { title: string; links: { label: string; href: string }[] };

const COLUMNS: Column[] = [
  {
    title: "Explore",
    links: [
      { label: "Home", href: "#top" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Features", href: "#features" },
    ],
  },
  {
    title: "Spark",
    links: [
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
      { label: "Email us", href: `mailto:${CONTACT.email}` },
    ],
  },
];

/** Footer: the brand on the left, link columns on the right, and a quiet bottom bar. */
export function SiteFooter() {
  return (
    <footer className="bg-background px-6 text-ink lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 py-16 lg:flex-row lg:justify-between">
        <div className="flex max-w-xs flex-col gap-4">
          <a href="#top" aria-label="Spark, back to the top" className="w-fit">
            <span className="bg-(image:--gradient-spark) bg-clip-text font-display text-3xl font-extrabold tracking-tight text-transparent">
              Spark
            </span>
          </a>
          <p className="text-sm text-muted">{FOOTER.tagline}</p>
        </div>
        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-3 lg:gap-x-16"
        >
          {COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <h2 className={HEADING}>{column.title}</h2>
              <ul className="flex flex-col gap-1">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className={LINK}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="flex flex-col gap-3">
            <h2 className={HEADING}>Your account</h2>
            <ul className="flex flex-col gap-1">
              <WithAuth
                signedOut={
                  <>
                    <li>
                      <Link href={SIGN_IN_HREF} className={LINK}>
                        Sign in
                      </Link>
                    </li>
                    <li>
                      <Link href={SIGN_UP_HREF} className={LINK}>
                        Sign up
                      </Link>
                    </li>
                  </>
                }
                signedIn={
                  <li>
                    <Link href="/" className={LINK}>
                      Open the app
                    </Link>
                  </li>
                }
              />
            </ul>
          </div>
        </nav>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-border py-6 text-xs text-muted">
        <p>
          © {FOOTER.year} Spark. {FOOTER.note}
        </p>
        <p>{FOOTER.legal}</p>
      </div>
    </footer>
  );
}
