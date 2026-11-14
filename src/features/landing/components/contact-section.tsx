import Image from "next/image";
import { Mail } from "lucide-react";
import { CONTACT, PHOTOS } from "../content";
import { ContactActions, WithAuth } from "./landing-actions";
import { Reveal } from "./reveal";

/** The closing call to action over a warm photo. Buttons change with sign-in state. The email always shows. */
export function ContactSection() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="relative isolate scroll-mt-20 overflow-hidden rounded-t-[48px] bg-background px-6 pb-12 pt-20 text-ink lg:px-12 lg:pt-28"
    >
      <Image
        src={PHOTOS.contact}
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover object-center"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-background/80" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-r from-background/90 to-transparent"
      />

      <Reveal className="flex max-w-[44rem] flex-col items-start gap-6">
        <h2 id="contact-heading" className="text-4xl font-bold sm:text-5xl">
          {CONTACT.heading}
        </h2>
        <WithAuth
          signedOut={<p className="max-w-[52ch] text-lg text-ink/85">{CONTACT.body}</p>}
          signedIn={<p className="max-w-[52ch] text-lg text-ink/85">{CONTACT.signedInBody}</p>}
        />
        <ContactActions
          primaryLabel={CONTACT.primaryCta}
          signedInLabel={CONTACT.signedInCta}
          secondaryLabel={CONTACT.secondaryCta}
        />
        <a
          href={`mailto:${CONTACT.email}`}
          className="inline-flex min-h-11 items-center gap-2 text-base font-semibold underline underline-offset-4"
        >
          <Mail aria-hidden className="size-5" />
          {CONTACT.email}
        </a>
      </Reveal>
    </section>
  );
}
