import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "../../components/site/PageHeader";
import { ScrollReveal } from "../../components/ScrollReveal";
import { MANAGEMENT, initialsOf } from "../../lib/team";

export const metadata: Metadata = {
  title: "Management Bios",
  description:
    "Biographies of the Stage Point Capital management team: Whitney Quillen, Sanjeev Khurana, Clayton Rice, Michael Shore, and Shavasp Quillen.",
};

// On the live site each biography is its own page reached from a grid of
// names, so reading the team costs six round trips. They are one page here:
// the bios are short enough to scan in a single pass, which is what someone
// doing diligence on a firm actually wants to do.

export default function ManagementBiosPage() {
  return (
    <>
      <PageHeader
        title="Management Bios"
        lede="The senior team responsible for originating, underwriting, and managing the firm's loan portfolio."
      />

      <section className="bg-neutral-white">
        <div className="mx-auto max-w-[1400px] px-6 py-16 lg:py-24">
          <ul className="flex flex-col divide-y divide-neutral-border">
            {MANAGEMENT.map((member, i) => (
              <li
                key={member.slug}
                id={member.slug}
                className="scroll-mt-[96px] py-12 first:pt-0 lg:py-16"
              >
                <ScrollReveal delay={Math.min(i, 3) * 0.04}>
                  <article className="grid gap-8 md:grid-cols-[220px_1fr] md:gap-12 lg:gap-16">
                    <div>
                      {member.photo ? (
                        <div className="relative aspect-square w-full max-w-[220px] overflow-hidden rounded-lg border border-neutral-border">
                          <Image
                            src={member.photo}
                            alt={member.name}
                            fill
                            sizes="220px"
                            className="object-cover object-top"
                          />
                        </div>
                      ) : (
                        // No photograph on file. A branded initials tile keeps
                        // the roster visually even without inventing a face.
                        <div
                          aria-hidden
                          className="flex aspect-square w-full max-w-[220px] items-center justify-center rounded-lg border border-neutral-border bg-steel-teal-tint"
                        >
                          <span className="font-[family-name:var(--font-display)] text-[3rem] font-semibold tracking-[-0.02em] text-steel-teal-deep">
                            {initialsOf(member.name)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <h2 className="font-[family-name:var(--font-display)] text-[1.5rem] leading-tight font-semibold tracking-[-0.015em] text-institutional-navy md:text-[1.875rem]">
                        {member.name}
                      </h2>
                      <p className="mt-2 text-[15px] font-medium text-steel-teal-deep">
                        {member.title}
                      </p>
                      <div className="mt-6 flex flex-col gap-4">
                        {member.bio.map((para, p) => (
                          <p
                            key={p}
                            className="max-w-[68ch] text-[15.5px] leading-relaxed text-neutral-slate"
                          >
                            {para}
                          </p>
                        ))}
                      </div>
                    </div>
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
