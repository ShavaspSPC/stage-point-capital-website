import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
} from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "../../components/site/PageHeader";
import { ScrollReveal } from "../../components/ScrollReveal";
import { OFFICE } from "../../components/site/siteNavigation";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Stage Point Capital, 12 East 49th St. #1808, New York, NY 10017. Call (401) 227-5775, Monday to Friday, 10am to 6pm.",
};

// The live contact page gives an address, hours, and one phone number for
// every kind of visitor. Two very different people arrive here, an investor
// and a borrower, and each has a real destination elsewhere on the site, so
// the page routes them instead of leaving them to find it.
const ROUTES = [
  {
    href: "/invest",
    heading: "I want to invest",
    text: "Stage Point Master issues secured promissory notes across terms from 3 to 60 months. For accredited and qualified investors.",
    cta: "View the offering",
  },
  {
    href: "/borrower-loan-intake-form",
    heading: "I am looking for a loan",
    text: "Stage Point Fund lends to fix & flip investors buying and improving single and multi-family workforce housing.",
    cta: "Loan intake form",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Contact Us"
        lede="The firm is based in Midtown Manhattan. Call the office during business hours, or use the route below that fits what you need."
      />

      <section className="bg-neutral-white">
        <div className="mx-auto max-w-[1400px] px-6 py-20 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <ScrollReveal className="lg:col-span-5">
              <h2 className="font-[family-name:var(--font-display)] text-[1.75rem] leading-[1.15] font-semibold tracking-[-0.02em] text-institutional-navy md:text-[2rem]">
                Visit us
              </h2>

              <dl className="mt-8 flex flex-col gap-7">
                <div className="flex gap-4">
                  <MapPinIcon
                    size={20}
                    className="mt-0.5 shrink-0 text-steel-teal-deep"
                    aria-hidden
                  />
                  <div>
                    <dt className="text-[13px] font-semibold text-neutral-mist">Address</dt>
                    <dd className="mt-1 text-[16px] leading-relaxed text-neutral-slate">
                      {OFFICE.street}
                      <br />
                      {OFFICE.city}
                    </dd>
                  </div>
                </div>

                <div className="flex gap-4">
                  <ClockIcon size={20} className="mt-0.5 shrink-0 text-steel-teal-deep" aria-hidden />
                  <div>
                    <dt className="text-[13px] font-semibold text-neutral-mist">Hours</dt>
                    <dd className="mt-1 text-[16px] leading-relaxed text-neutral-slate">
                      {OFFICE.hours}
                    </dd>
                  </div>
                </div>

                <div className="flex gap-4">
                  <PhoneIcon size={20} className="mt-0.5 shrink-0 text-steel-teal-deep" aria-hidden />
                  <div>
                    <dt className="text-[13px] font-semibold text-neutral-mist">Phone</dt>
                    <dd className="mt-1 text-[16px] leading-relaxed">
                      <a
                        href={OFFICE.phoneHref}
                        className="font-medium text-institutional-navy transition-colors duration-150 hover:text-steel-teal-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal"
                      >
                        {OFFICE.phone}
                      </a>
                    </dd>
                  </div>
                </div>
              </dl>
            </ScrollReveal>

            <div className="lg:col-span-7">
              <div className="flex flex-col gap-5">
                {ROUTES.map((route, i) => (
                  <ScrollReveal key={route.href} delay={i * 0.08}>
                    <Link
                      href={route.href}
                      className="group block rounded-lg border border-neutral-border bg-neutral-paper p-8 transition-[border-color,box-shadow,transform] duration-200 ease-out-soft hover:-translate-y-0.5 hover:border-steel-teal hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal lg:p-10"
                    >
                      <p className="font-[family-name:var(--font-display)] text-[1.375rem] leading-tight font-semibold tracking-[-0.015em] text-institutional-navy">
                        {route.heading}
                      </p>
                      <p className="mt-3 max-w-[54ch] text-[15px] leading-relaxed text-neutral-slate">
                        {route.text}
                      </p>
                      <span className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-institutional-navy">
                        {route.cta}
                        <ArrowRightIcon
                          size={15}
                          weight="bold"
                          aria-hidden
                          className="transition-transform duration-150 ease-out-soft group-hover:translate-x-1"
                        />
                      </span>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
