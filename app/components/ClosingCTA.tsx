import { ScrollReveal } from "./ScrollReveal";
import { BOOKING_URL } from "../lib/links";

export function ClosingCTA() {
  return (
    <section id="contact" className="bg-institutional-navy">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-28">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-[family-name:var(--font-display)] text-3xl leading-[1.15] font-medium text-white md:text-4xl">
            Let&apos;s talk about your allocation.
          </h2>
          <p className="mt-5 text-[1.0625rem] leading-relaxed text-white/75">
            Request the offering memorandum, or set up a call with the team to walk through the
            note terms and the portfolio behind them.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/request-access"
              className="inline-flex w-full items-center justify-center rounded-md bg-white px-8 py-4 text-[15px] font-semibold text-institutional-navy transition-[background-color,transform] duration-150 ease-out-soft hover:bg-steel-teal-tint active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal sm:w-auto"
            >
              Request the Offering Memorandum
            </a>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-md border-[1.5px] border-white/40 px-8 py-[14px] text-[15px] font-semibold text-white transition-[background-color,transform] duration-150 ease-out-soft hover:bg-white/10 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal sm:w-auto"
            >
              Speak with the Team
            </a>
          </div>

          <div className="mt-12 grid gap-6 border-t border-white/15 pt-8 text-left sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.08em] text-white/50 uppercase">Office</p>
              <p className="mt-1.5 text-[15px] text-white/85">
                12 East 49th St. #1808
                <br />
                New York, NY 10017
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.08em] text-white/50 uppercase">Contact</p>
              <p className="mt-1.5 text-[15px] text-white/85">
                (401) 227-5775
                <br />
                ir@stagepointcapital.com
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
