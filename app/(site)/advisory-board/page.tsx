import type { Metadata } from "next";
import { PageHeader } from "../../components/site/PageHeader";
import { ScrollReveal } from "../../components/ScrollReveal";
import { ADVISORY_BOARD } from "../../lib/team";

export const metadata: Metadata = {
  title: "Advisory Board",
  description:
    "The Stage Point Capital advisory board: James D. Marver, Jarrett Lilien, and Joan Fleischmann Tobin.",
};

export default function AdvisoryBoardPage() {
  return (
    <>
      <PageHeader
        title="Advisory Board"
        lede="Three advisers from venture capital, public-market financial services, and property management."
      />

      <section className="bg-neutral-white">
        <div className="mx-auto max-w-[1400px] px-6 py-16 lg:py-24">
          <ul className="flex flex-col gap-6">
            {ADVISORY_BOARD.map((member, i) => (
              <li key={member.name}>
                <ScrollReveal delay={i * 0.06}>
                  <article className="grid gap-6 rounded-lg border border-neutral-border bg-neutral-paper p-8 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-16 lg:p-10">
                    <div>
                      <h2 className="font-[family-name:var(--font-display)] text-[1.5rem] leading-tight font-semibold tracking-[-0.015em] text-institutional-navy md:text-[1.75rem]">
                        {member.name}
                      </h2>
                      <p className="mt-3 text-[14.5px] leading-snug font-medium text-steel-teal-deep">
                        {member.title}
                      </p>
                    </div>
                    <p className="max-w-[68ch] text-[15.5px] leading-relaxed text-neutral-slate">
                      {member.bio}
                    </p>
                  </article>
                </ScrollReveal>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
