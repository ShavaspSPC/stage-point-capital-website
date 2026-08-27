import { ScrollReveal } from "./ScrollReveal";

const CONTROLS = [
  { label: "Equity buffer", value: "~30% average, from lending on “As Complete Value.”" },
  { label: "Conservative leverage", value: "~70% loan-to-value on As Complete Value." },
  { label: "First-lien security", value: "Recorded, publicly verifiable liens on ~98% of the portfolio." },
  { label: "Personal guarantees", value: "Every corporate borrower's principals personally guarantee the loan." },
  { label: "Controlled draws", value: "Construction reserves release only as completed work is verified." },
  { label: "In-house workout capability", value: "Stage Point forecloses, renovates, and sells directly when needed." },
];

const TIERS = [
  {
    tier: "Tier 1",
    name: "Senior credit",
    detail: "Institutional lines, capped at 1:1 leverage",
    tone: "border-neutral-border bg-neutral-paper text-neutral-slate",
  },
  {
    tier: "Tier 2",
    name: "SPM note holders",
    detail: "Secured promissory notes, paid before equity",
    tone: "border-steel-teal bg-steel-teal-tint text-institutional-navy",
    highlight: true,
  },
  {
    tier: "Tier 3",
    name: "First loss capital",
    detail: "Management and equity cushion absorbs the first dollar of loss",
    tone: "border-institutional-navy bg-institutional-navy text-white",
  },
];

export function Protection() {
  return (
    <section id="protection" className="bg-neutral-paper">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <ScrollReveal className="max-w-2xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl leading-[1.15] font-medium text-institutional-navy md:text-4xl">
            How your capital is protected.
          </h2>
          <p className="mt-5 max-w-[65ch] text-[1.0625rem] leading-relaxed text-neutral-slate">
            Every loan is underwritten with a margin of safety: conservative valuation, strict
            draw controls, and the in-house ability to take over an asset if a borrower defaults.
          </p>
        </ScrollReveal>

        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <ScrollReveal>
            <ul className="space-y-6">
              {CONTROLS.map((item) => (
                <li key={item.label} className="border-t border-neutral-border pt-5 first:border-t-0 first:pt-0">
                  <p className="text-[15px] font-semibold text-institutional-navy">{item.label}</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-neutral-slate">{item.value}</p>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <div className="rounded-2xl border border-neutral-border bg-neutral-white p-8">
              <p className="text-[13px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
                The payment waterfall
              </p>
              <p className="mt-2 text-sm text-neutral-slate">
                Note holders sit above management and equity in the liquidation order, senior
                only to the institutional credit lines.
              </p>

              <div className="mt-8 flex gap-4">
                <div className="flex flex-col items-center justify-between py-1 text-neutral-mist" aria-hidden>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 12V2M7 2L3 6M7 2l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="my-2 rotate-180 text-[10px] font-semibold tracking-[0.1em] uppercase [writing-mode:vertical-rl]">
                    Paid first
                  </span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 2v10M7 12l-4-4M7 12l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div className="flex-1 space-y-3">
                  {TIERS.map((tier) => (
                    <div
                      key={tier.tier}
                      className={`rounded-lg border p-5 ${tier.tone}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase opacity-80">
                          {tier.tier}
                        </p>
                        {tier.highlight && (
                          <span className="rounded-full bg-institutional-navy px-2.5 py-1 text-[10px] font-semibold tracking-[0.04em] text-white uppercase">
                            Your position
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-[15px] font-semibold">{tier.name}</p>
                      <p className="mt-1 text-[13.5px] leading-relaxed opacity-90">{tier.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-neutral-border pt-6">
                <div>
                  <p className="font-[family-name:var(--font-sans)] text-2xl font-bold text-institutional-navy">~30%</p>
                  <p className="text-[13px] text-neutral-mist">Avg. equity buffer</p>
                </div>
                <div>
                  <p className="font-[family-name:var(--font-sans)] text-2xl font-bold text-institutional-navy">$0</p>
                  <p className="text-[13px] text-neutral-mist">Principal loss since 2014</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
