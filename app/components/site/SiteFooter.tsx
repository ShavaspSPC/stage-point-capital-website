import Link from "next/link";
import { LinkedinLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { INVEST_HREF, INVEST_LABEL, NAV_ITEMS, OFFICE } from "./siteNavigation";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-deep text-white">
      <div className="mx-auto max-w-[1400px] px-6 py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <p className="font-[family-name:var(--font-display)] text-[22px] font-semibold tracking-[-0.01em]">
              Stage Point Capital
            </p>
            <address className="mt-5 text-[14px] leading-relaxed text-white/60 not-italic">
              {OFFICE.street}
              <br />
              {OFFICE.city}
              <br />
              <a
                href={OFFICE.phoneHref}
                className="transition-colors duration-150 hover:text-white focus-visible:text-white focus-visible:outline-none"
              >
                {OFFICE.phone}
              </a>
            </address>
            <a
              href={OFFICE.linkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/20 text-white/70 transition-colors duration-150 ease-out-soft hover:border-white/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal"
              aria-label="Stage Point Capital on LinkedIn"
            >
              <LinkedinLogoIcon size={19} />
            </a>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {NAV_ITEMS.filter((item) => item.children).map((item) => (
              <div key={item.label}>
                <p className="text-[12px] font-semibold tracking-[0.08em] text-white/60 uppercase">
                  {item.label}
                </p>
                <ul className="mt-4 flex flex-col gap-3">
                  {item.children?.map((child) => (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        className="text-[14px] text-white/70 transition-colors duration-150 hover:text-white focus-visible:text-white focus-visible:outline-none"
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <p className="text-[12px] font-semibold tracking-[0.08em] text-white/60 uppercase">
                Firm
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                <li>
                  <Link
                    href="/about"
                    className="text-[14px] text-white/70 transition-colors duration-150 hover:text-white focus-visible:text-white focus-visible:outline-none"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href={INVEST_HREF}
                    className="text-[14px] text-white/70 transition-colors duration-150 hover:text-white focus-visible:text-white focus-visible:outline-none"
                  >
                    {INVEST_LABEL}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-10">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-white/60 uppercase">
            Important disclosure
          </p>
          <p className="mt-4 max-w-4xl text-[13px] leading-relaxed text-white/55">
            This site is furnished for informational purposes only and does not constitute an
            offer, solicitation, or recommendation to buy or sell any securities, investment
            products, or advisory services. Any offer to invest is made only to prospective
            eligible investors by means of an offering memorandum, subscription agreement, and
            related materials describing the terms of the investment. All investments involve a
            significant degree of risk, and there can be no assurance that Stage Point&apos;s
            investment or advisory objectives will be achieved or that any investment will be
            profitable. Investors must be prepared to bear the risk of a total loss of their
            investment. Past performance is not necessarily indicative of future results.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-[13px] text-white/60">
              Copyright © {year} - Stage Point Capital, LLC - All Rights Reserved.{" "}
              <span className="text-white/50">|</span>{" "}
              <Link
                href="/terms-and-conditions"
                className="transition-colors duration-150 hover:text-white/70 focus-visible:text-white/70 focus-visible:outline-none"
              >
                Terms and Conditions
              </Link>
            </p>
            {/* Unobtrusive way back into the admin area for staff. /admin is
                auth-gated server-side, so an unauthenticated click just lands
                on the sign-in page. */}
            <Link
              href="/admin"
              className="text-[12px] font-medium text-white/50 transition-colors duration-150 hover:text-white/60 focus-visible:text-white/60 focus-visible:outline-none"
            >
              Staff
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
