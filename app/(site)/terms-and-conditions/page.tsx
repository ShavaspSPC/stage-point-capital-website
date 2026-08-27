import type { Metadata } from "next";
import { PageHeader } from "../../components/site/PageHeader";
import { ScrollReveal } from "../../components/ScrollReveal";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "Terms and conditions governing the use of information provided by Stage Point Capital, LLC.",
};

// Reproduced verbatim from the live site. Legal copy is never paraphrased.
const TERMS = [
  "The information provided herein is for use by professional investors and is for informational purposes only; it is correct to the best of our knowledge and may change at any time.",
  "This information does not constitute a prospectus, an offer, or an invitation to invest, or a recommendation in relation to any investments.",
  "The information provided is for illustrative purposes only and should not be construed as a recommendation to purchase or sell any security or asset.",
  "This information may not be used for the purpose of an offer or solicitation in any jurisdiction or in any circumstances in which such offer or solicitation is unlawful or not authorized.",
  "The information included herein should not be copied or circulated without the express, written permission of Stage Point Capital, LLC.",
];

export default function TermsPage() {
  return (
    <>
      <PageHeader title="Terms and Conditions" />

      <section className="bg-neutral-white">
        <div className="mx-auto max-w-[1400px] px-6 py-16 lg:py-24">
          <ScrollReveal>
            <ul className="flex max-w-[68ch] flex-col gap-6">
              {TERMS.map((term) => (
                <li
                  key={term}
                  className="border-l-2 border-neutral-border pl-6 text-[16px] leading-relaxed text-neutral-slate"
                >
                  {term}
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
