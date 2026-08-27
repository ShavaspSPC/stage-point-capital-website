import { ScrollReveal } from "./ScrollReveal";

const POINTS = [
  {
    challenge: "Community and regional banks have retreated from distressed real estate and renovation lending, while large banks focus on syndicated deals.",
    response: "Stage Point fills that gap directly, underwriting the distressed and renovation loans traditional banks now avoid.",
  },
  {
    challenge: "The U.S. housing stock is aging and requires significant renovation, creating sustained demand for financing that funds the work.",
    response: "Stage Point's loan portfolio is built around exactly this need, financing the entrepreneurs who renovate that housing back into use.",
  },
  {
    challenge: "The resulting absence of capital lets specialty lenders price risk more attractively than a crowded, low-margin market would allow.",
    response: "Stage Point captures that pricing advantage and passes disciplined, attractive yields through to note holders.",
  },
];

export function MarketOpportunity() {
  return (
    <section id="opportunity" className="bg-neutral-paper">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <ScrollReveal className="max-w-2xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl leading-[1.15] font-medium text-institutional-navy md:text-4xl">
            The banking void, and the opportunity it creates.
          </h2>
          <p className="mt-5 max-w-[65ch] text-[1.0625rem] leading-relaxed text-neutral-slate">
            Value-add real estate investors have limited access to financing for opportunistic
            purchases of distressed residential properties. Stage Point was built to close that
            gap.
          </p>
        </ScrollReveal>

        <div className="mt-14 divide-y divide-neutral-border border-t border-neutral-border">
          {POINTS.map((point, i) => (
            <ScrollReveal key={point.challenge} delay={i * 0.05}>
              <div className="grid gap-4 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-12">
                <p className="text-[1.0625rem] leading-relaxed text-neutral-slate">
                  {point.challenge}
                </p>
                <p className="text-[1.0625rem] leading-relaxed font-medium text-institutional-navy">
                  {point.response}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
