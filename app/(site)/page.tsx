import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { ScrollReveal } from "../components/ScrollReveal";

// Home. The single photographic moment of the site lives here; every interior
// page opens on type instead, so the skyline keeps its weight.
//
// All body copy on this page is the live site's copy, unchanged. The one
// structural change is that the firm's positioning paragraph moved out of the
// hero and into the section below it: at 42 words it pushed the call to action
// below the fold on a laptop, which is the whole job of the hero.

const VALUE_PROPS = [
  {
    text: "Strong, steady historical yields with the choice of quarterly interest distributions or reinvestment.",
    image: "/images/spc-feature-1.jpg",
    alt: "The interior of a renovated multi-family residence",
  },
  {
    text: "For investors seeking consistent cash income and principal protection, with relatively low correlation to other asset classes.",
    image: "/images/spc-feature-2.jpg",
    alt: "A street of single-family workforce housing",
  },
];

const VEHICLES = [
  {
    href: "/stage-point-fund",
    abbr: "SPF",
    name: "Stage Point Fund",
    text: "A private real estate lender that finances the purchase and improvement of single and multi-family workforce housing for third-party fix & flip investors.",
  },
  {
    href: "/stage-point-master",
    abbr: "SPM",
    name: "Stage Point Master",
    text: "An evergreen special purpose vehicle and the sole owner of SPF. Investors lend to SPM via secured notes.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[min(78vh,640px)] items-end overflow-hidden bg-navy-deep">
        <Image
          src="/images/spc-hero-nyc.webp"
          alt="The Manhattan skyline seen from the East River"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Scrim: the headline sits over sky and water, so it needs a real
            gradient rather than a flat tint to stay legible at both ends. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-navy-deep/95 via-navy-deep/60 to-navy-deep/20"
        />

        <div className="relative mx-auto w-full max-w-[1400px] px-6 pt-24 pb-16 lg:pb-24">
          <ScrollReveal className="max-w-4xl">
            <h1 className="font-[family-name:var(--font-display)] text-[2.5rem] leading-[1.04] font-semibold tracking-[-0.025em] text-white sm:text-[3.25rem] lg:text-[4.25rem]">
              Welcome to Stage Point Capital
            </h1>
          </ScrollReveal>
        </div>
      </section>

      {/* Positioning */}
      <section className="border-b border-neutral-border bg-neutral-white">
        <div className="mx-auto max-w-[1400px] px-6 py-20 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <ScrollReveal className="lg:col-span-8">
              <p className="max-w-[46ch] font-[family-name:var(--font-display)] text-[1.5rem] leading-[1.35] font-medium tracking-[-0.015em] text-institutional-navy md:text-[1.875rem] lg:text-[2.125rem]">
                Stage Point Capital, LLC (&ldquo;SPC&rdquo;) is a private investment firm, founded
                by a New York-based single-family office in 2013, providing investments in the
                areas of commercial and residential real estate investments, management, and
                direct lending.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.08} className="lg:col-span-4 lg:pt-2">
              <div className="border-t-2 border-steel-teal pt-6">
                <p className="text-[16px] leading-relaxed text-neutral-slate">
                  Delivering investors consistent, liquid, high-yield, low-duration, debt-like
                  profits for over 10 years.
                </p>
                <Link
                  href="/about"
                  className="group mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-institutional-navy transition-colors duration-150 ease-out-soft hover:text-steel-teal-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal"
                >
                  About the firm
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

      {/* What the investment is, in the firm's own words, paired with its own
          photography. Two rows only, alternating sides. */}
      <section className="bg-neutral-white">
        <div className="mx-auto max-w-[1400px] px-6 py-8 lg:py-16">
          {VALUE_PROPS.map((prop, i) => (
            <ScrollReveal
              key={prop.image}
              className={`grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-20 lg:py-16 ${
                i % 2 === 1 ? "lg:[&>figure]:order-last" : ""
              }`}
            >
              <figure className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
                <Image
                  src={prop.image}
                  alt={prop.alt}
                  fill
                  sizes="(min-width: 1024px) 45vw, 90vw"
                  className="object-cover"
                />
              </figure>
              <p className="max-w-[24ch] font-[family-name:var(--font-display)] text-[1.5rem] leading-[1.3] font-medium tracking-[-0.015em] text-institutional-navy md:text-[1.75rem] lg:text-[2rem]">
                {prop.text}
              </p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Vehicles */}
      <section className="border-t border-neutral-border bg-neutral-paper">
        <div className="mx-auto max-w-[1400px] px-6 py-20 lg:py-28">
          <ScrollReveal>
            <h2 className="max-w-2xl font-[family-name:var(--font-display)] text-[2rem] leading-[1.1] font-semibold tracking-[-0.02em] text-institutional-navy md:text-[2.5rem]">
              Two entities, one flow of capital
            </h2>
          </ScrollReveal>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {VEHICLES.map((v, i) => (
              <ScrollReveal key={v.href} delay={i * 0.08}>
                <Link
                  href={v.href}
                  className="group flex h-full flex-col rounded-lg border border-neutral-border bg-neutral-white p-8 transition-[border-color,box-shadow,transform] duration-200 ease-out-soft hover:-translate-y-0.5 hover:border-steel-teal hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal lg:p-10"
                >
                  <p className="font-[family-name:var(--font-display)] text-[2.5rem] leading-none font-semibold tracking-[-0.02em] text-steel-teal-deep">
                    {v.abbr}
                  </p>
                  <p className="mt-5 text-[19px] font-semibold text-institutional-navy">
                    {v.name}
                  </p>
                  <p className="mt-3 flex-1 text-[15px] leading-relaxed text-neutral-slate">
                    {v.text}
                  </p>
                  <span className="mt-7 inline-flex items-center gap-2 text-[14px] font-semibold text-institutional-navy">
                    Read more
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
      </section>

      {/* Path into the note offering */}
      <section className="bg-institutional-navy">
        <div className="mx-auto max-w-[1400px] px-6 py-20 lg:py-24">
          <ScrollReveal className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <h2 className="font-[family-name:var(--font-display)] text-[1.875rem] leading-[1.15] font-semibold tracking-[-0.02em] text-white md:text-[2.25rem]">
                The Stage Point Master note offering
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-white/70">
                Stage Point Master issues secured promissory notes across terms from 3 to 60
                months, offered only to accredited and qualified investors.
              </p>
            </div>
            <Link
              href="/offering"
              className="group inline-flex shrink-0 items-center gap-2.5 rounded-md bg-neutral-white px-7 py-4 text-[15px] font-semibold whitespace-nowrap text-institutional-navy transition-[background-color,transform] duration-150 ease-out-soft hover:bg-navy-tint active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal"
            >
              View the offering
              <ArrowRightIcon
                size={17}
                weight="bold"
                aria-hidden
                className="transition-transform duration-150 ease-out-soft group-hover:translate-x-1"
              />
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
