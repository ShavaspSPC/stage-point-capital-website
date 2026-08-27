import { ScrollReveal } from "./ScrollReveal";

const KEY_TERMS = [
  { label: "Minimum investment", value: "$200,000 for an individual investor, $1,000,000 for an entity investor" },
  { label: "Eligible investors", value: "Accredited and qualified investors" },
];

const PROVIDERS = [
  { label: "Fund Auditor", value: "Horowitz & Ullmann, P.C." },
  { label: "Securities Legal Counsel", value: "Moss & Moss LLP" },
  { label: "Transfer Agent and Administrator", value: "Formidium" },
  { label: "Investment Manager", value: "Stage Point Capital, LLC (SEC Exempt Reporting Adviser)" },
];

export function Terms() {
  return (
    <section className="bg-neutral-paper">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <ScrollReveal className="max-w-2xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl leading-[1.15] font-medium text-institutional-navy md:text-4xl">
            Terms and service providers.
          </h2>
        </ScrollReveal>

        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-20">
          <ScrollReveal>
            <p className="text-[13px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
              Key terms
            </p>
            <dl className="mt-6 space-y-6">
              {KEY_TERMS.map((item) => (
                <div key={item.label}>
                  <dt className="text-[15px] font-semibold text-institutional-navy">{item.label}</dt>
                  <dd className="mt-1 text-[15px] leading-relaxed text-neutral-slate">{item.value}</dd>
                </div>
              ))}
            </dl>
          </ScrollReveal>

          <ScrollReveal delay={0.06}>
            <p className="text-[13px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
              Service providers
            </p>
            <dl className="mt-6 space-y-6">
              {PROVIDERS.map((item) => (
                <div key={item.label}>
                  <dt className="text-[15px] font-semibold text-institutional-navy">{item.label}</dt>
                  <dd className="mt-1 text-[15px] leading-relaxed text-neutral-slate">{item.value}</dd>
                </div>
              ))}
            </dl>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
