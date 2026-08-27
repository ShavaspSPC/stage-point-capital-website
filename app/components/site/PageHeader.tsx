import type { ReactNode } from "react";
import { ScrollReveal } from "../ScrollReveal";

// The masthead every interior page opens with. Interior pages deliberately do
// not repeat the home page's full-bleed photograph: one photographic moment per
// visit keeps the imagery meaningful, and a reader who clicked "Leadership"
// wants the content, not another skyline.

export function PageHeader({
  title,
  lede,
  children,
}: {
  title: string;
  lede?: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-neutral-border bg-neutral-paper">
      <div className="mx-auto max-w-[1400px] px-6 pt-16 pb-16 lg:pt-24 lg:pb-20">
        <ScrollReveal className="max-w-3xl">
          <h1 className="font-[family-name:var(--font-display)] text-[2.25rem] leading-[1.06] font-semibold tracking-[-0.02em] text-institutional-navy md:text-[3rem] lg:text-[3.5rem]">
            {title}
          </h1>
          {lede && (
            <p className="mt-6 max-w-[62ch] text-[17px] leading-relaxed text-neutral-slate lg:text-[19px]">
              {lede}
            </p>
          )}
          {children}
        </ScrollReveal>
      </div>
    </section>
  );
}
