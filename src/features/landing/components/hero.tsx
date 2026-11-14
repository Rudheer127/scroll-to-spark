import Image from "next/image";
import { HERO, PHOTOS } from "../content";
import { HeroScene } from "./hero-scene";
import { MainCta } from "./landing-actions";

/** The first screen: a real photo, one headline, one sentence, one main action, and a lively scene. */
export function Hero() {
  const words = HERO.headline.split(" ");
  const step = (n: number) => ({ "--i": n }) as React.CSSProperties;

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden rounded-b-[48px] bg-ink text-background"
    >
      <Image
        src={PHOTOS.hero}
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-[55%_center]"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-ink/55" />
      <div aria-hidden className="landing-glow absolute inset-0 -z-10" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-r from-ink/85 to-transparent"
      />

      <div className="grid min-h-[calc(100svh-4.5rem)] items-center gap-10 px-6 pb-16 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-12">
        <div className="flex flex-col items-start gap-8">
          <p
            className="landing-rise rounded-(--radius-control) border border-white/25 bg-white/5 px-4 py-1.5 text-sm font-semibold backdrop-blur"
            style={step(0)}
          >
            {HERO.tagline}
          </p>
          <h1
            id="hero-heading"
            className="text-5xl font-bold leading-[1.05] sm:text-6xl xl:text-7xl"
          >
            {words.map((word, index) => (
              <span
                key={`${word}-${index}`}
                style={step(index + 1)}
                className="landing-rise inline-block"
              >
                {word}
                {index < words.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>
          <p
            className="landing-rise max-w-[46ch] text-lg text-background/90 sm:text-xl"
            style={step(words.length + 1)}
          >
            {HERO.support}
          </p>
          <div
            className="landing-rise flex flex-wrap items-center gap-3"
            style={step(words.length + 2)}
          >
            <MainCta
              signedOutLabel={HERO.primaryCta}
              className="min-h-12 bg-sun px-7 text-base text-ink hover:opacity-90"
            />
            <a
              href="#how-it-works"
              className="inline-flex min-h-12 items-center rounded-(--radius-control) px-0 text-base font-semibold underline-offset-4 hover:underline sm:px-5"
            >
              {HERO.secondaryCta}
            </a>
          </div>
          <p className="landing-rise text-sm text-background/80" style={step(words.length + 3)}>
            {HERO.note}
          </p>
        </div>
        <HeroScene />
      </div>
    </section>
  );
}
