import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "../../components/site/PageHeader";
import { ScrollReveal } from "../../components/ScrollReveal";

export const metadata: Metadata = {
  title: "Stage Point Fund",
  description:
    "Stage Point Fund is a private real estate lender that finances the purchase and improvement of single and multi-family workforce housing for third-party fix & flip investors.",
};

export default function StagePointFundPage() {
  return (
    <>
      <PageHeader
        title="Stage Point Fund"
        lede="Stage Point Fund is a private real estate lender that finances the purchase and improvement of single and multi-family workforce housing for third-party fix & flip investors."
      >
        <p className="mt-6 text-[14px] font-medium text-neutral-mist">
          Wholly owned by Stage Point Master, which is wholly owned by Stage Point Capital.
        </p>
      </PageHeader>

      <section className="bg-neutral-white">
        <div className="mx-auto max-w-[1400px] px-6 py-16 lg:py-24">
          <ScrollReveal>
            <figure className="relative aspect-[21/9] w-full overflow-hidden rounded-lg">
              <Image
                src="/images/spc-feature-2.jpg"
                alt="A street of single-family workforce housing of the kind Stage Point Fund finances"
                fill
                sizes="(min-width: 1400px) 1352px, 92vw"
                className="object-cover"
              />
            </figure>
          </ScrollReveal>

          <div className="mt-16 grid gap-10 lg:grid-cols-12 lg:gap-16">
            <ScrollReveal className="lg:col-span-7">
              <h2 className="font-[family-name:var(--font-display)] text-[1.75rem] leading-[1.15] font-semibold tracking-[-0.02em] text-institutional-navy md:text-[2.25rem]">
                The loan portfolio entity
              </h2>
              <p className="mt-6 max-w-[62ch] text-[16px] leading-relaxed text-neutral-slate">
                SPF originates and holds the loans. It is the operating entity at the bottom of
                the structure: capital raised by Stage Point Master is invested directly into
                SPF, which lends it against real property.
              </p>
              <p className="mt-4 max-w-[62ch] text-[16px] leading-relaxed text-neutral-slate">
                Borrowers are third-party fix &amp; flip investors buying and improving single
                and multi-family workforce housing.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.08} className="lg:col-span-5">
              <div className="rounded-lg border border-neutral-border bg-neutral-paper p-8">
                <p className="text-[17px] font-semibold text-institutional-navy">
                  Looking for a loan?
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-neutral-slate">
                  SPF lends to experienced fix &amp; flip investors. Start with the intake form
                  and the origination team will follow up.
                </p>
                <Link
                  href="/borrower-loan-intake-form"
                  className="group mt-6 inline-flex items-center gap-2.5 rounded-md bg-institutional-navy px-6 py-3 text-[14px] font-semibold text-white transition-[background-color,transform] duration-150 ease-out-soft hover:bg-navy-deep active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal"
                >
                  Borrower loan intake form
                  <ArrowRightIcon
                    size={15}
                    weight="bold"
                    aria-hidden
                    className="transition-transform duration-150 ease-out-soft group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
}
