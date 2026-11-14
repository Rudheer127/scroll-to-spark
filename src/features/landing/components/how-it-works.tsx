import { HERO, STEPS } from "../content";
import { MainCta } from "./landing-actions";
import { Reveal } from "./reveal";

const BADGES = ["bg-sun text-on-sun", "bg-coral text-white", "bg-teal text-white"] as const;

/** Three steps, one sentence each, then the main action again. */
export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="scroll-mt-20 px-6 py-20 lg:px-12 lg:py-28"
    >
      <Reveal className="mb-12 flex flex-col items-start gap-3">
        <p className="text-sm font-semibold text-muted">How it works</p>
        <h2 id="how-heading" className="text-4xl font-bold sm:text-5xl">
          Three simple steps
        </h2>
      </Reveal>

      <ol className="relative grid gap-6 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="relative">
            <Reveal delay={index * 140} className="h-full">
              <div className="landing-lift flex h-full flex-col items-start gap-4 rounded-(--radius-card) border border-border bg-surface p-7 shadow-card">
                <span
                  className={`flex size-12 items-center justify-center rounded-full text-xl font-bold ${BADGES[index]}`}
                >
                  {index + 1}
                </span>
                <h3 className="text-2xl font-semibold">{step.title}</h3>
                <p className="max-w-[34ch] text-lg text-muted">{step.body}</p>
              </div>
            </Reveal>
            {index < STEPS.length - 1 && (
              <span
                aria-hidden
                className="landing-line absolute left-[calc(100%-0.25rem)] top-[3.5rem] hidden h-0.5 w-8 bg-control md:block"
              />
            )}
          </li>
        ))}
      </ol>

      <Reveal className="mt-12">
        <MainCta
          signedOutLabel={HERO.primaryCta}
          variant="primary"
          className="min-h-12 px-7 text-base"
        />
      </Reveal>
    </section>
  );
}
