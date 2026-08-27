import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "../../components/site/PageHeader";
import { ScrollReveal } from "../../components/ScrollReveal";

export const metadata: Metadata = {
  title: "Our Investment Vehicles",
  description:
    "Stage Point Capital is the sole owner and managing member of two vehicles: Stage Point Fund, the lender, and Stage Point Master, the entity investors lend to.",
};

// The live version of this page is two initials, SPF and SPM, with no
// explanation of either. The initials stay; each now carries the sentence the
// firm already uses to describe it elsewhere on the site, so the page answers
// its own question.
const VEHICLES = [
  {
    href: "/stage-point-fund",
    abbr: "SPF",
    name: "Stage Point Fund",
    role: "The lender",
    text: "Stage Point Fund is a private real estate lender that finances the purchase and improvement of single and multi-family workforce housing for third-party fix & flip investors.",
    image: "/images/spc-feature-2.jpg",
    alt: "A street of single-family workforce housing",
  },
  {
    href: "/stage-point-master",
    abbr: "SPM",
    name: "Stage Point Master",
    role: "The feeder investors lend to",
    text: "Investors lend to SPM, an evergreen special purpose vehicle and the sole owner of SPF, the loan portfolio entity. Every dollar which investors lend to SPM via secured notes is invested directly in the operating entity, SPF.",
    image: "/images/spc-feature-1.jpg",
    alt: "The interior of a renovated multi-family residence",
  },
];

export default function VehiclesPage() {
  return (
    <>
      <PageHeader
        title="Our Investment Vehicles"
        lede="Stage Point Capital is the sole owner and managing member of two entities. One originates and holds the loans. The other is where investors put their capital."
      />

      <section className="bg-neutral-white">
        <div className="mx-auto max-w-[1400px] px-6 py-16 lg:py-24">
          <div className="flex flex-col gap-16 lg:gap-24">
            {VEHICLES.map((v, i) => (
              <ScrollReveal key={v.href} delay={i * 0.05}>
                <article className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
                  <figure
                    className={`relative aspect-[4/3] w-full overflow-hidden rounded-lg ${
                      i % 2 === 1 ? "lg:order-last" : ""
                    }`}
                  >
                    <Image
                      src={v.image}
                      alt={v.alt}
                      fill
                      sizes="(min-width: 1024px) 45vw, 90vw"
                      className="object-cover"
                    />
                  </figure>

                  <div>
                    <p className="font-[family-name:var(--font-display)] text-[3.5rem] leading-none font-semibold tracking-[-0.03em] text-steel-teal-deep">
                      {v.abbr}
                    </p>
                    <h2 className="mt-4 font-[family-name:var(--font-display)] text-[1.75rem] leading-[1.15] font-semibold tracking-[-0.02em] text-institutional-navy md:text-[2.25rem]">
                      {v.name}
                    </h2>
                    <p className="mt-2 text-[14px] font-medium text-neutral-mist">{v.role}</p>
                    <p className="mt-6 max-w-[58ch] text-[16px] leading-relaxed text-neutral-slate">
                      {v.text}
                    </p>
                    <Link
                      href={v.href}
                      className="group mt-8 inline-flex items-center gap-2.5 rounded-md border-[1.5px] border-institutional-navy px-6 py-3 text-[14px] font-semibold text-institutional-navy transition-[background-color,transform] duration-150 ease-out-soft hover:bg-navy-tint active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal"
                    >
                      {v.name}
                      <ArrowRightIcon
                        size={15}
                        weight="bold"
                        aria-hidden
                        className="transition-transform duration-150 ease-out-soft group-hover:translate-x-1"
                      />
                    </Link>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
