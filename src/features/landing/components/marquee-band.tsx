import { MARQUEE_PHRASES } from "../content";

/** A slow looping band of the product's promises. Decorative: the same ideas are in the text below. */
export function MarqueeBand() {
  const row = [...MARQUEE_PHRASES, ...MARQUEE_PHRASES];

  return (
    <div aria-hidden className="landing-marquee-wrap overflow-hidden py-8">
      <div className="landing-marquee">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {row.map((phrase, index) => (
              <span
                key={`${copy}-${index}`}
                className="flex items-center font-display text-3xl font-semibold sm:text-5xl"
              >
                <span className="px-6">{phrase}</span>
                <span className="size-3 rounded-full bg-coral" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
