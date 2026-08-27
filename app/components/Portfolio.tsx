import { ScrollReveal } from "./ScrollReveal";
import { StateBar } from "./StateBar";

const LOAN_STATS = [
  { label: "Active loans", value: "~80" },
  { label: "Repeat borrowers", value: "80%+" },
  { label: "Avg. face value", value: "~$500k" },
  { label: "Loan term", value: "12 months" },
  { label: "Avg. loan rate", value: "~16.5%" },
  { label: "Gross yield", value: "18%+" },
];

const STATES = [
  { state: "Rhode Island", value: 37, color: "#002060" },
  { state: "Massachusetts", value: 29, color: "#66A7B8" },
  { state: "Florida", value: 14, color: "#3A63B0" },
  { state: "Pennsylvania", value: 13, color: "#8ABDCA" },
  { state: "Other", value: 7, color: "#CBD5E1" },
];

export function Portfolio() {
  return (
    <section className="bg-neutral-white">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <ScrollReveal className="max-w-2xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl leading-[1.15] font-medium text-institutional-navy md:text-4xl">
            A disciplined portfolio, built on repeat relationships.
          </h2>
          <p className="mt-5 max-w-[65ch] text-[1.0625rem] leading-relaxed text-neutral-slate">
            Stage Point Fund lends to experienced fix-and-flip contractors and entrepreneurs who
            specialize in residential rehabilitation. More than 80% of the Fund's loans go to
            borrowers who have already completed a successful project with the team.
          </p>
        </ScrollReveal>

        <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <ScrollReveal>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-8 border-t border-neutral-border pt-8">
              {LOAN_STATS.map((stat) => (
                <div key={stat.label}>
                  <dt className="text-[13px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
                    {stat.label}
                  </dt>
                  <dd className="mt-1.5 font-[family-name:var(--font-sans)] text-2xl font-bold text-institutional-navy">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <div className="rounded-2xl border border-neutral-border bg-neutral-paper p-8">
              <p className="text-[13px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
                Portfolio by state
              </p>
              <p className="mt-1 text-sm text-neutral-slate">
                By outstanding principal, as of Q3 2025.
              </p>

              <div className="mt-7 space-y-4">
                {STATES.map((item, i) => (
                  <StateBar
                    key={item.state}
                    state={item.state}
                    value={item.value}
                    color={item.color}
                    delay={i * 0.1}
                  />
                ))}
              </div>

              <p className="mt-6 text-[13px] text-neutral-mist">
                Concentrated in Rhode Island and southeastern Massachusetts, with additional
                lending in Florida, Pennsylvania, and Virginia.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
