import Image from "next/image";
import { ScrollReveal } from "./ScrollReveal";
import { BOOKING_URL } from "../lib/links";
import { YIELD_HIGH, YIELD_LOW } from "../lib/rates";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-neutral-white">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 pt-16 pb-20 lg:grid-cols-2 lg:pt-20 lg:pb-28">
        <ScrollReveal>
          <p className="text-[13px] font-semibold tracking-[0.08em] text-steel-teal-deep uppercase">
            Stage Point Master, LLC
          </p>
          <h1 className="mt-4 max-w-xl font-[family-name:var(--font-display)] text-[2.5rem] leading-[1.08] font-medium text-institutional-navy md:text-5xl lg:text-[3.25rem]">
            A high-yield secured promissory note offering.
          </h1>

          <div className="mt-10 max-w-lg border-t border-neutral-border pt-6">
            <p className="font-[family-name:var(--font-sans)] text-4xl font-bold tabular-nums text-institutional-navy md:text-[2.75rem]">
              {YIELD_LOW} to {YIELD_HIGH}
            </p>
            <p className="mt-2 text-[15px] text-neutral-slate">
              Annual yields across eight terms, from 3 to 60 months.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href="/request-access"
              className="inline-flex items-center justify-center rounded-md bg-institutional-navy px-8 py-4 text-[15px] font-semibold text-white transition-[background-color,transform] duration-150 ease-out-soft hover:bg-navy-deep active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal"
            >
              Request the Offering Memorandum
            </a>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border-[1.5px] border-institutional-navy px-8 py-[14px] text-[15px] font-semibold text-institutional-navy transition-[background-color,transform] duration-150 ease-out-soft hover:bg-navy-tint active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal"
            >
              Speak with the Team
            </a>
          </div>

          <p className="mt-6 text-sm text-neutral-mist">
            For accredited and qualified investors.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.08} className="relative">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-neutral-border lg:aspect-[3/4]">
            <Image
              src="/images/hero-renovation.jpg"
              alt="A single-family renovation project financed by a Stage Point Fund first-lien loan"
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 hidden max-w-[220px] rounded-lg border border-neutral-border bg-neutral-white p-5 shadow-[0_8px_24px_rgba(0,32,96,0.08)] sm:block">
            <p className="text-[11px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
              First-lien collateral
            </p>
            <p className="mt-1 text-sm text-neutral-slate">
              Every note is backed by real, income-producing renovation projects.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
