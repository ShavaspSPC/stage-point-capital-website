import { ScrollReveal } from "./ScrollReveal";
import { YieldLadder } from "./YieldLadder";

const BENEFITS = [
  {
    title: "Flexible distributions",
    body: "Elect quarterly cash interest payments, or reinvest interest for principal appreciation.",
  },
  {
    title: "Simple tax reporting",
    body: "A single 1099-INT each year, with no state or federal K-1 filing obligation.",
  },
  {
    title: "Accessible minimum",
    body: "A $200,000 minimum for individual investors, $1,000,000 for entities.",
  },
];

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden
      className="mt-1 shrink-0 text-steel-teal-deep"
    >
      <path
        d="M3.5 9.5L7 13l7.5-8.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Offering() {
  return (
    <section id="offering" className="bg-neutral-white">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <ScrollReveal className="max-w-2xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl leading-[1.15] font-medium text-institutional-navy md:text-4xl">
            The offering.
          </h2>
          <p className="mt-5 max-w-[65ch] text-[1.0625rem] leading-relaxed text-neutral-slate">
            Investors lend to Stage Point Master, LLC, an evergreen special purpose vehicle and
            the sole owner of Stage Point Fund, the loan portfolio entity. Every dollar lent to
            SPM through a secured note is invested directly in that operating entity.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.06} className="mt-12">
          <p className="mb-4 text-[15px] text-neutral-slate">
            Select a term to see its rate. Longer commitments earn a higher yield.
          </p>
          <YieldLadder />
        </ScrollReveal>

        <div className="mt-16 grid gap-x-12 gap-y-8 border-t border-neutral-border pt-12 sm:grid-cols-3">
          {BENEFITS.map((benefit, i) => (
            <ScrollReveal key={benefit.title} delay={i * 0.06} className="flex gap-3">
              <CheckIcon />
              <div>
                <h3 className="text-[15px] font-semibold text-institutional-navy">{benefit.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-neutral-slate">{benefit.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
