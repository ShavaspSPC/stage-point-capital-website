import { CountUpStat } from "./CountUpStat";
import { ScrollReveal } from "./ScrollReveal";

export function TrackRecord() {
  return (
    <section id="track-record" className="bg-neutral-white">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <ScrollReveal className="max-w-2xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl leading-[1.15] font-medium text-institutional-navy md:text-4xl">
            A track record built over twelve years.
          </h2>
          <p className="mt-5 max-w-[65ch] text-[1.0625rem] leading-relaxed text-neutral-slate">
            Stage Point Capital has executed this lending strategy since 2013, scaling from a
            friends-and-family office into an institutional-grade platform, and every audited
            year since 2014 has closed in the black.
          </p>
        </ScrollReveal>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
          <ScrollReveal className="sm:col-span-2 lg:col-span-2 lg:row-span-2">
            <div className="flex h-full flex-col justify-center rounded-[10px] border border-neutral-border bg-navy-tint p-8 transition-[box-shadow,transform] duration-[240ms] ease-out-soft hover:-translate-y-0.5 hover:shadow-card-hover lg:p-10">
              <p className="font-[family-name:var(--font-sans)] text-6xl font-bold text-institutional-navy lg:text-7xl">
                <CountUpStat value={50} suffix="th" />
              </p>
              <p className="mt-3 text-[15px] font-medium text-neutral-slate">
                Consecutive quarter of positive investor returns and audited annual financials
                since inception in 2014.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.05}>
            <div className="flex h-full flex-col justify-center rounded-[10px] border border-neutral-border bg-neutral-white p-6 transition-[box-shadow,transform] duration-[240ms] ease-out-soft hover:-translate-y-0.5 hover:shadow-card-hover">
              <p className="font-[family-name:var(--font-sans)] text-4xl font-bold text-institutional-navy">
                <CountUpStat value={0} prefix="$" />
              </p>
              <p className="mt-2 text-[13px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
                Principal loss since 2014
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="flex h-full flex-col justify-center rounded-[10px] border border-neutral-border bg-neutral-white p-6 transition-[box-shadow,transform] duration-[240ms] ease-out-soft hover:-translate-y-0.5 hover:shadow-card-hover">
              <p className="font-[family-name:var(--font-sans)] text-4xl font-bold text-institutional-navy">
                <CountUpStat value={205} prefix="$" suffix="M+" />
              </p>
              <p className="mt-2 text-[13px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
                Total originations, ~757 loans
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div className="flex h-full flex-col justify-center rounded-[10px] border border-neutral-border bg-neutral-white p-6 transition-[box-shadow,transform] duration-[240ms] ease-out-soft hover:-translate-y-0.5 hover:shadow-card-hover">
              <p className="font-[family-name:var(--font-sans)] text-4xl font-bold text-institutional-navy">
                <CountUpStat value={51} prefix="$" suffix="M" />
              </p>
              <p className="mt-2 text-[13px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
                Assets under management
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="flex h-full flex-col justify-center rounded-[10px] border border-neutral-border bg-neutral-white p-6 transition-[box-shadow,transform] duration-[240ms] ease-out-soft hover:-translate-y-0.5 hover:shadow-card-hover">
              <p className="font-[family-name:var(--font-sans)] text-4xl font-bold text-institutional-navy">
                <CountUpStat value={12.66} decimals={2} suffix="%" />
              </p>
              <p className="mt-2 text-[13px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
                Twelve-year average ROE, 7.74% to 13.48% annually
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
