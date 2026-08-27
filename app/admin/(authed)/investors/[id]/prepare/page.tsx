import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminContactById } from "@/app/lib/airtable";
import { SendSigningPacketForm, type SigningPrefill } from "@/app/components/admin/SendSigningPacketForm";

export const dynamic = "force-dynamic";

// Formats the stored numeric principal back into the form's expected string.
function formatPrincipal(n: number | undefined): string | undefined {
  if (n === undefined) return undefined;
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

// Always scoped to one investor. There is deliberately no blank version of
// this page: preparing documents is an action taken against a record that
// already exists, which is also what stops a second record being created for
// someone who is already in the CRM.
export default async function PrepareDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await getAdminContactById(id).catch(() => null);
  if (!contact) notFound();

  const prefill: SigningPrefill = {
    lenderKind: contact.investorKind ?? "individual",
    lenderName: contact.name,
    lenderEmail: contact.email,
    lenderAddress: contact.address,
    entityStateOrCountry: contact.entityStateOrCountry,
    entityType: contact.entityType,
    custodianName: contact.custodianName,
    custodianAccountNumber: contact.custodianAccountNumber,
    signatoryNameAndTitle: contact.signatoryNameAndTitle,
    jointSubscriberName: contact.jointSubscriberName,
    principalAmount: formatPrincipal(contact.principalAmount),
    termMonths: contact.termMonths,
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
        Prepare documents for {contact.name}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-neutral-slate">
        Confirm the details below, then copy them into Dropbox Sign. Accepting covers the
        Subscription Agreement and the Membership Interest Pledge Agreement, sent together. The
        Secured Promissory Note is prepared separately, further down this page, and only after the
        investor&apos;s wire has actually cleared — per the PPM, the Note is not issued at
        acceptance.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-steel-teal bg-steel-teal-tint px-4 py-3">
        <p className="text-[13px] text-institutional-navy">
          Pre-filled from this investor&apos;s record. Confirm every field before sending.
        </p>
        <Link
          href={`/admin/investors/${id}/edit`}
          className="text-[13px] font-semibold text-institutional-navy underline"
        >
          Edit their details
        </Link>
      </div>
      <div className="mt-8">
        <SendSigningPacketForm prefill={prefill} investorEmail={contact.email} />
      </div>
    </div>
  );
}
