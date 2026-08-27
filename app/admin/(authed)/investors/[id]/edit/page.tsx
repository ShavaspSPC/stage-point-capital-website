import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminContactById, listSpcContacts, DEFAULT_SPC_CONTACT_NAME } from "@/app/lib/airtable";
import { InvestorForm, type InvestorFormValues } from "@/app/components/admin/InvestorForm";

export const dynamic = "force-dynamic";

export default async function EditInvestorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [contact, owners] = await Promise.all([
    getAdminContactById(id).catch(() => null),
    listSpcContacts().catch(() => []),
  ]);
  if (!contact) notFound();

  const initial: Partial<InvestorFormValues> = {
    investorKind: contact.investorKind ?? "individual",
    name: contact.name,
    email: contact.email,
    phone: contact.phone ?? "",
    streetAddress: contact.streetAddress ?? "",
    city: contact.city ?? "",
    state: contact.state ?? "",
    zip: contact.zip ?? "",
    country: contact.country ?? "",
    entityStateOrCountry: contact.entityStateOrCountry ?? "",
    entityType: contact.entityType ?? "",
    custodianName: contact.custodianName ?? "",
    custodianAccountNumber: contact.custodianAccountNumber ?? "",
    signatoryNameAndTitle: contact.signatoryNameAndTitle ?? "",
    jointSubscriberName: contact.jointSubscriberName ?? "",
    stage: contact.stage,
    principalAmount: contact.principalAmount
      ? contact.principalAmount.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
      : (contact.intendedInvestment ?? ""),
    termMonths: contact.termMonths ? String(contact.termMonths) : "",
    spcContactId: contact.spcContactId ?? "",
    contactType: contact.contactType ?? "",
    taxNumberType: contact.taxNumberType ?? "",
    // taxNumber itself is never sent to the client - see AdminContact and the
    // hasTaxNumberOnFile prop below.
    taxNumber: "",
    profitDistribution: contact.distribution ?? "",
    originationDate: contact.originationDate ?? "",
    maturityDate: contact.maturityDate ?? "",
    currentMaturityDate: contact.currentMaturityDate ?? "",
    interestRate: contact.interestRate != null ? String(contact.interestRate) : "",
    wireBankAccountNumber: "",
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin"
        className="text-[13px] font-semibold text-neutral-slate transition-colors hover:text-institutional-navy"
      >
        ← Back to investors
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-medium text-institutional-navy">
        Edit {contact.name}
      </h1>
      <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-neutral-slate">
        Corrections are saved to the CRM record and kept as a dated entry in its notes, so the
        original submission stays readable alongside what changed.
      </p>
      <div className="mt-8">
        <InvestorForm
          mode="edit"
          recordId={id}
          initial={initial}
          owners={owners}
          defaultOwnerName={DEFAULT_SPC_CONTACT_NAME}
          hasTaxNumberOnFile={contact.hasTaxNumberOnFile}
          hasWireBankAccountOnFile={contact.hasWireBankAccountOnFile}
        />
      </div>
    </div>
  );
}
