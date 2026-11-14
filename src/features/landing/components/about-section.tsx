import Image from "next/image";
import { Ban } from "lucide-react";
import { ABOUT, PHOTOS } from "../content";
import { Reveal } from "./reveal";

/** A few sentences on why it exists, a real photo, and the three things it will never do. */
export function AboutSection() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="scroll-mt-20 px-6 py-20 lg:px-12 lg:py-28"
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:items-stretch">
        <Reveal className="flex flex-col items-start gap-6">
          <h2 id="about-heading" className="text-4xl font-bold sm:text-5xl">
            {ABOUT.heading}
          </h2>
          <p className="max-w-[60ch] text-xl leading-relaxed text-muted">{ABOUT.body}</p>
          <div className="w-full rounded-(--radius-card) border border-border bg-surface p-6 shadow-card">
            <h3 className="mb-4 text-xl font-semibold">{ABOUT.neverTitle}</h3>
            <ul className="flex flex-col gap-3">
              {ABOUT.never.map((item) => (
                <li key={item} className="flex items-center gap-3 text-lg">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-chip">
                    <Ban aria-hidden className="size-4 text-danger" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal
          delay={150}
          className="relative min-h-[20rem] overflow-hidden rounded-(--radius-card) shadow-lift"
        >
          <Image
            src={PHOTOS.about}
            alt={PHOTOS.aboutAlt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </Reveal>
      </div>
    </section>
  );
}
