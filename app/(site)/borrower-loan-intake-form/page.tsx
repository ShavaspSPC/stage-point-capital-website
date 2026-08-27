import type { Metadata } from "next";
import { PageHeader } from "../../components/site/PageHeader";
import { BorrowerLoanForm } from "../../components/site/BorrowerLoanForm";

export const metadata: Metadata = {
  title: "Borrower Loan Intake Form",
  description:
    "Submit a loan enquiry to Stage Point Fund, a private real estate lender financing the purchase and improvement of single and multi-family workforce housing.",
};

export default function BorrowerLoanIntakePage() {
  return (
    <>
      <PageHeader
        title="Loan Intake Form"
        lede="Stage Point Fund lends to third-party fix & flip investors buying and improving single and multi-family workforce housing. Tell us about the deal and the origination team will follow up."
      />

      <section className="bg-neutral-paper">
        <div className="mx-auto max-w-3xl px-6 py-16 lg:py-20">
          <BorrowerLoanForm />
        </div>
      </section>
    </>
  );
}
