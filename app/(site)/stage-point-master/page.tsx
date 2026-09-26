import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "../../components/site/PageHeader";
import { ScrollReveal } from "../../components/ScrollReveal";
import { YIELD_HIGH, YIELD_LOW } from "../../lib/rates";

export const metadata: Metadata = {
  title: "Stage Point Master",
  description:
    "Stage Point Master is an evergreen special purpose vehicle and the sole owner of Stage Point Fund. Investors lend to SPM via secured notes.",
};

export default function StagePointMasterPage() {
  return (
    <>
      <PageHeader title="Stage Point Master">
        <p className="mt-4 text-[15px] font-semibold tracking-[0.02em] text-steel-teal-deep">
          Feeder Fund to SPF
        </p>
      </PageHeader>

      <section className="bg-neutral-white">
        <div className="mx-auto max-w-[1400px] px-6 py-20 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <ScrollReveal className="lg:col-span-7">
              {/* The live page runs "Debt (Not Equity)" inline at the head of the
                  paragraph with the two words italicised. It is the single most
                  important fact about the instrument, so it gets to be a
                  heading rather than a phrase buried in a sentence. */}
              <h2 className="font-[family-name:var(--font-display)] text-[2rem] leading-[1.1] font-semibold tracking-[-0.02em] text-institutional-navy md:text-[2.5rem]">
                Debt, <em className="pb-1 leading-[1.1] not-italic text-steel-teal-deep">not equity</em>
              </h2>
              <p className="mt-6 max-w-[62ch] text-[17px] leading-relaxed text-neutral-slate">
                Investors lend to SPM, an evergreen special purpose vehicle and the sole owner of
                SPF, the loan portfolio entity. Every dollar which investors lend to SPM via
                secured notes is invested directly in the operating entity, SPF.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.08} className="lg:col-span-5">
              <div className="rounded-lg border border-neutral-border bg-neutral-paper p-8 lg:p-10">
                <p className="text-[13px] font-semibold tracking-[0.08em] text-neutral-mist uppercase">
                  Current note yields
                </p>
                <p className="mt-4 font-[family-name:var(--font-display)] text-[2.75rem] leading-none font-semibold tabular-nums tracking-[-0.02em] text-institutional-navy">
                  {YIELD_LOW} to {YIELD_HIGH}
                </p>
                <p className="mt-4 text-[15px] leading-relaxed text-neutral-slate">
                  Annual yields across eight terms, from 3 to 60 months, with the choice of
                  quarterly interest distributions or reinvestment.
                </p>
                <Link
                  href="/offering"
                  className="group mt-7 inline-flex items-center gap-2.5 rounded-md bg-institutional-navy px-6 py-3.5 text-[14px] font-semibold text-white transition-[background-color,transform] duration-150 ease-out-soft hover:bg-navy-deep active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal"
                >
                  View the offering
                  <ArrowRightIcon
                    size={15}
                    weight="bold"
                    aria-hidden
                    className="transition-transform duration-150 ease-out-soft group-hover:translate-x-1"
                  />
                </Link>
                <p className="mt-4 text-[13px] text-neutral-mist">
                  For accredited and qualified investors.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
}
