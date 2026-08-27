import Link from "next/link";
import { listSpcContacts, DEFAULT_SPC_CONTACT_NAME } from "@/app/lib/airtable";
import { InvestorForm } from "@/app/components/admin/InvestorForm";

export const dynamic = "force-dynamic";

export default async function NewInvestorPage() {
  // Never block adding an investor on the owner list being reachable; without
  // it the picker just doesn't render and the default owner is used.
  const owners = await listSpcContacts().catch(() => []);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin"
        className="text-[13px] font-semibold text-neutral-slate transition-colors hover:text-institutional-navy"
      >
        ← Back to investors
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-medium text-institutional-navy">
        Add an investor
      </h1>
      <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-neutral-slate">
        For someone who came to you directly rather than through the website. Only a name and email
        are required; everything else can be filled in as you learn it.
      </p>
      <div className="mt-8">
        <InvestorForm mode="create" owners={owners} defaultOwnerName={DEFAULT_SPC_CONTACT_NAME} />
      </div>
    </div>
  );
}
