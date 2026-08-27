import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownIcon, ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "../../components/site/PageHeader";
import { ScrollReveal } from "../../components/ScrollReveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "SPC manages real estate investments on behalf of its principals and other family offices, and is the sole owner and managing member of Stage Point Fund and Stage Point Master.",
};

// The live About page explains the SPC / SPM / SPF relationship in four
// consecutive paragraphs, which is where most readers lose the thread. The
// copy is unchanged; it is now attached to the step of the structure it
// actually describes, so the flow of capital is legible at a glance.
const STRUCTURE = [
  {
    abbr: "SPC",
    name: "Stage Point Capital",
    role: "Sole owner and managing member",
    text: "SPC is the sole owner and managing member of Stage Point Fund (“SPF”) and Stage Point Master (“SPM”).",
    href: null,
  },
  {
    abbr: "SPM",
    name: "Stage Point Master",
    role: "Where investors lend",
    text: "Investors lend to SPM, an evergreen special purpose vehicle and the sole owner of SPF, the loan portfolio entity. Every dollar which investors lend to SPM via secured notes is invested directly in the operating entity, SPF.",
    href: "/stage-point-master",
  },
  {
    abbr: "SPF",
    name: "Stage Point Fund",
    role: "Where the capital is lent out",
    text: "SPF is a private real estate lender that finances the purchase and improvement of single and multi-family workforce housing for third-party fix & flip investors.",
    href: "/stage-point-fund",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="About Stage Point Capital"
        lede="SPC manages real estate investments on behalf of its principals and other family offices. The family has been a lender, operator and direct investor in commercial and residential real estate, as well as an angel/private equity investor, and participant in management-led buyouts for more than 30 years."
      />

      <section className="bg-neutral-white">
        <div className="mx-auto max-w-[1400px] px-6 py-20 lg:py-28">
          <ScrollReveal>
            <h2 className="max-w-2xl font-[family-name:var(--font-display)] text-[2rem] leading-[1.1] font-semibold tracking-[-0.02em] text-institutional-navy md:text-[2.5rem]">
              How the capital moves
            </h2>
          </ScrollReveal>

          <ol className="mt-12 flex flex-col">
            {STRUCTURE.map((entity, i) => (
              <li key={entity.abbr}>
                <ScrollReveal delay={i * 0.06}>
                  <div className="grid gap-6 rounded-lg border border-neutral-border bg-neutral-white p-8 md:grid-cols-[200px_1fr] md:gap-12 lg:p-10">
                    <div>
                      <p className="font-[family-name:var(--font-display)] text-[2.75rem] leading-none font-semibold tracking-[-0.02em] text-steel-teal-deep">
                        {entity.abbr}
                      </p>
                      <p className="mt-3 text-[16px] font-semibold text-institutional-navy">
                        {entity.name}
                      </p>
                      <p className="mt-1 text-[13px] text-neutral-mist">{entity.role}</p>
                    </div>
                    <div className="flex flex-col items-start">
                      <p className="max-w-[62ch] text-[16px] leading-relaxed text-neutral-slate">
                        {entity.text}
                      </p>
                      {entity.href && (
                        <Link
                          href={entity.href}
                          className="group mt-5 inline-flex items-center gap-2 text-[14px] font-semibold text-institutional-navy transition-colors duration-150 ease-out-soft hover:text-steel-teal-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal"
                        >
                          {entity.name}
                          <ArrowRightIcon
                            size={15}
                            weight="bold"
                            aria-hidden
                            className="transition-transform duration-150 ease-out-soft group-hover:translate-x-1"
                          />
                        </Link>
                      )}
                    </div>
                  </div>
                </ScrollReveal>

                {i < STRUCTURE.length - 1 && (
                  <div className="flex justify-center py-3" aria-hidden>
                    <ArrowDownIcon size={20} className="text-neutral-border" weight="bold" />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-institutional-navy">
        <div className="mx-auto max-w-[1400px] px-6 py-20 lg:py-24">
          <ScrollReveal>
            <p className="max-w-[24ch] font-[family-name:var(--font-display)] text-[1.875rem] leading-[1.2] font-semibold tracking-[-0.02em] text-white md:text-[2.5rem] lg:max-w-[30ch]">
              Delivering investors consistent, liquid, high-yield, low-duration, debt-like profits
              for over 10 years.
            </p>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
