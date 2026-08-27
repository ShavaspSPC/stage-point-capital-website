import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "./ScrollReveal";
import { MANAGEMENT, initialsOf } from "../lib/team";

// Titles come from app/lib/team.ts, the same source the corporate
// /management-bios page reads. They used to be hardcoded here and had drifted
// out of step with the titles published on stagepointcapital.com.
//
// The whole roster is shown rather than a fixed-length slice: a slice silently
// dropped whoever fell off the end whenever the team changed size.
const TEAM = MANAGEMENT;

export function Team() {
  return (
    <section id="team" className="bg-neutral-white">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <ScrollReveal className="max-w-2xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl leading-[1.15] font-medium text-institutional-navy md:text-4xl">
            Decades of real estate and legal experience.
          </h2>
          <p className="mt-5 max-w-[65ch] text-[1.0625rem] leading-relaxed text-neutral-slate">
            A small, senior team that underwrites every loan itself and stays close to every
            borrower relationship.
          </p>
        </ScrollReveal>

        <div className="mt-14 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {TEAM.map((member, i) => (
            <ScrollReveal key={member.slug} delay={i * 0.05} className="h-full">
              <Link
                href={`/management-bios#${member.slug}`}
                className="flex h-full flex-col overflow-hidden rounded-[10px] border border-neutral-border bg-neutral-paper transition-[box-shadow,transform,border-color] duration-[240ms] ease-out-soft hover:-translate-y-0.5 hover:border-steel-teal hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal"
              >
                <div className="relative aspect-square w-full shrink-0">
                  {member.photo ? (
                    <Image
                      src={member.photo}
                      alt={member.name}
                      fill
                      sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
                      className="object-cover"
                      style={{ objectPosition: member.photoPosition ?? "top" }}
                    />
                  ) : (
                    <div
                      aria-hidden
                      className="flex h-full w-full items-center justify-center bg-steel-teal-tint"
                    >
                      <span className="font-[family-name:var(--font-display)] text-[2rem] font-semibold text-steel-teal-deep">
                        {initialsOf(member.name)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex min-h-[88px] flex-1 flex-col justify-center p-5">
                  <p className="text-[15px] font-semibold text-institutional-navy">
                    {member.name.split(" ")[0]}
                  </p>
                  <p className="mt-1 text-[13px] leading-snug text-neutral-mist">
                    {member.shortTitle}
                  </p>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.08}>
          <Link
            href="/management-bios"
            className="mt-10 inline-flex items-center text-[14px] font-semibold text-institutional-navy underline underline-offset-4 transition-colors duration-150 ease-out-soft hover:text-steel-teal-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal"
          >
            Full management biographies
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
