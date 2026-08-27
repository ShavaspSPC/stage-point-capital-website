import { ScrollReveal } from "./ScrollReveal";

function FlowArrow() {
  return (
    <div className="flex rotate-90 items-center justify-center py-2 text-neutral-mist lg:rotate-0 lg:py-0" aria-hidden>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function CapitalStructure() {
  return (
    <section className="bg-neutral-paper">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <ScrollReveal className="max-w-2xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl leading-[1.15] font-medium text-institutional-navy md:text-4xl">
            A simple, evergreen capital structure.
          </h2>
          <p className="mt-5 max-w-[65ch] text-[1.0625rem] leading-relaxed text-neutral-slate">
            A single manager oversees the entire chain from your note to the underlying loan,
            so there is no added layer of fees or fund managers between your capital and the
            collateral behind it.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.08} className="mt-14">
          <div className="rounded-2xl border border-neutral-border bg-neutral-white p-6 lg:p-10">
            <div className="mx-auto max-w-md rounded-lg border border-institutional-navy bg-institutional-navy px-6 py-4 text-center">
              <p className="text-[15px] font-semibold text-white">Stage Point Capital, LLC</p>
              <p className="mt-0.5 text-[13px] text-white/70">
                Sole owner and manager of both entities below
              </p>
            </div>

            <div className="mx-auto mt-2 h-8 w-px bg-neutral-border" aria-hidden />

            <div className="grid gap-0 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch lg:gap-6">
              <div className="rounded-lg border border-neutral-border bg-neutral-paper p-6">
                <p className="text-[13px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
                  The issuer
                </p>
                <p className="mt-1 text-[17px] font-semibold text-institutional-navy">
                  Stage Point Master, LLC
                </p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-slate">
                  Receives investor capital via secured notes. Simple 1099-INT reporting, no K-1
                  filing.
                </p>
              </div>

              <FlowArrow />

              <div className="rounded-lg border border-neutral-border bg-neutral-paper p-6">
                <p className="text-[13px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
                  The operating entity
                </p>
                <p className="mt-1 text-[17px] font-semibold text-institutional-navy">
                  Stage Point Fund, LLC
                </p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-slate">
                  Holds the loan collateral securing SPM notes. ~$205M in originations since
                  inception.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 border-t border-neutral-border pt-6 lg:grid-cols-2">
              <div className="rounded-lg border border-neutral-border bg-neutral-paper p-5">
                <p className="text-[13px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
                  Fund lends to
                </p>
                <p className="mt-1 text-[15px] font-medium text-institutional-navy">
                  Third-party real estate entrepreneurs
                </p>
                <p className="mt-1 text-sm text-neutral-slate">
                  First-lien mortgage loans to repeat, experienced borrowers.
                </p>
              </div>
              <div className="rounded-lg border border-neutral-border bg-neutral-paper p-5">
                <p className="text-[13px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
                  Institutional credit lines
                </p>
                <p className="mt-1 text-[15px] font-medium text-institutional-navy">
                  Variant Income Fund and Customers Bank
                </p>
                <p className="mt-1 text-sm text-neutral-slate">
                  Senior, capped facilities that supplement, never replace, note holder capital.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-5 text-sm text-neutral-mist">
            Stage Point's principals and their families hold roughly 17% of total SPM debt,
            investing alongside note holders on the same terms.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
