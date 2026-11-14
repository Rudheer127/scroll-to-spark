import { HeartHandshake, ShieldCheck, Sparkles, Sprout, type LucideIcon } from "lucide-react";
import { FEATURES, type FeatureIcon } from "../content";
import { MainCta } from "./landing-actions";
import { Reveal } from "./reveal";

const ICONS: Record<FeatureIcon, { Icon: LucideIcon; tile: string }> = {
  steps: { Icon: Sprout, tile: "bg-teal-soft text-teal-ink" },
  thanks: { Icon: HeartHandshake, tile: "bg-sun text-on-sun" },
  guide: { Icon: Sparkles, tile: "bg-lavender-soft text-lavender-ink" },
  private: { Icon: ShieldCheck, tile: "bg-chip text-ink" },
};

/** At most four features, each a title and one short sentence. */
export function FeaturesGrid() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="scroll-mt-20 bg-chip px-6 py-20 lg:px-12 lg:py-28"
    >
      <Reveal className="mb-12 flex flex-col items-start gap-3">
        <p className="text-sm font-semibold text-muted">What you get</p>
        <h2 id="features-heading" className="text-4xl font-bold sm:text-5xl">
          Made to feel good, not guilty
        </h2>
      </Reveal>

      <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {FEATURES.map((feature, index) => {
          const { Icon, tile } = ICONS[feature.icon];
          return (
            <li key={feature.title}>
              <Reveal delay={index * 110} className="h-full">
                <div className="group landing-lift flex h-full flex-col items-start gap-4 rounded-(--radius-card) border border-border bg-surface p-7 shadow-card">
                  <span
                    className={`landing-wiggle flex size-12 items-center justify-center rounded-2xl ${tile}`}
                  >
                    <Icon aria-hidden className="size-6" />
                  </span>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    {"badge" in feature && (
                      <span className="rounded-(--radius-control) bg-lavender-soft px-2 py-0.5 text-xs font-bold text-lavender-ink">
                        {feature.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-base text-muted">{feature.body}</p>
                </div>
              </Reveal>
            </li>
          );
        })}
      </ul>

      <Reveal className="mt-12">
        <MainCta
          signedOutLabel="Get started"
          signedInLabel="Open the app"
          variant="primary"
          className="min-h-12 px-7 text-base"
        />
      </Reveal>
    </section>
  );
}
