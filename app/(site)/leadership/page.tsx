import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "../../components/site/PageHeader";
import { ScrollReveal } from "../../components/ScrollReveal";
import { MANAGEMENT } from "../../lib/team";

export const metadata: Metadata = {
  title: "Leadership",
  description:
    "SPC's senior leadership brings combined experience of more than 100 years in real estate, asset management, investment banking, trading, law, and research.",
};

// The two claims below are a bulleted list on the live site. Two items is not a
// list, it is two statements, so each gets the weight of a statement.
const CLAIMS = [
  "Our team has a track record of successful and disciplined investing across industries and market cycles.",
  "We have managed and traded portfolios worth billions of dollars.",
];

export default function LeadershipPage() {
  return (
    <>
      <PageHeader
        title="Leadership"
        lede="SPC's senior leadership brings combined experience of more than 100 years in real estate, asset management, investment banking, trading, law, and research."
      />

      <section className="bg-neutral-white">
        <div className="mx-auto max-w-[1400px] px-6 py-20 lg:py-28">
          <div className="grid gap-10 md:grid-cols-2 lg:gap-16">
            {CLAIMS.map((claim, i) => (
              <ScrollReveal key={claim} delay={i * 0.08}>
                <p className="border-t-2 border-steel-teal pt-6 font-[family-name:var(--font-display)] text-[1.375rem] leading-[1.35] font-medium tracking-[-0.01em] text-institutional-navy md:text-[1.625rem]">
                  {claim}
                </p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-border bg-neutral-paper">
        <div className="mx-auto max-w-[1400px] px-6 py-20 lg:py-24">
          <ScrollReveal>
            <h2 className="font-[family-name:var(--font-display)] text-[1.875rem] leading-[1.15] font-semibold tracking-[-0.02em] text-institutional-navy md:text-[2.25rem]">
              The people behind the firm
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.06}>
            <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
              {MANAGEMENT.map((m) => (
                <li key={m.slug} className="text-[16px] text-neutral-slate">
                  <span className="font-semibold text-institutional-navy">{m.name}</span>
                  <span className="text-neutral-mist">, {m.shortTitle}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/management-bios"
                className="group inline-flex items-center gap-2.5 rounded-md bg-institutional-navy px-6 py-3.5 text-[14px] font-semibold text-white transition-[background-color,transform] duration-150 ease-out-soft hover:bg-navy-deep active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal"
              >
                Management bios
                <ArrowRightIcon
                  size={15}
                  weight="bold"
                  aria-hidden
                  className="transition-transform duration-150 ease-out-soft group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/advisory-board"
                className="inline-flex items-center rounded-md border-[1.5px] border-institutional-navy px-6 py-3 text-[14px] font-semibold text-institutional-navy transition-[background-color,transform] duration-150 ease-out-soft hover:bg-navy-tint active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal"
              >
                Advisory board
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
