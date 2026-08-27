import { NextResponse } from "next/server";
import { createLeadRecord } from "@/app/lib/airtable";

// Shape of a submitted access request. Kept in sync with the client flow in
// app/components/RequestAccessFlow.tsx.
type RequestAccessPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  investorType: string;
  investmentRange: string;
  preferredTerm?: string;
  accreditationBasis: string;
  incomeDocsAvailable?: string;
  netWorthDocsAvailable?: string;
  licenseType?: string;
  licenseActive?: string;
  entityAssetRange?: string;
  entityEquityOwnerCount?: string;
  entityAllOwnersAccredited?: string;
  institutionType?: string;
  entityFormationDate?: string;
  custodianName?: string;
  thirdPartyFinancing: string;
  howHeard?: string;
  verificationAcknowledged: boolean;
  noOfferAcknowledged: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(body: unknown): { ok: true; data: RequestAccessPayload } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid request body." };
  }
  const b = body as Record<string, unknown>;

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const firstName = str(b.firstName);
  const lastName = str(b.lastName);
  const email = str(b.email);
  const investorType = str(b.investorType);
  const investmentRange = str(b.investmentRange);
  const accreditationBasis = str(b.accreditationBasis);
  const thirdPartyFinancing = str(b.thirdPartyFinancing);

  if (!firstName || !lastName) return { ok: false, error: "Please provide your first and last name." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please provide a valid email address." };
  if (!investorType) return { ok: false, error: "Please select an investor type." };
  if (!investmentRange) return { ok: false, error: "Please select an intended investment amount." };
  if (!accreditationBasis) return { ok: false, error: "Please indicate the basis for your eligibility." };
  if (!thirdPartyFinancing) return { ok: false, error: "Please answer the third-party financing question." };
  if (b.verificationAcknowledged !== true) {
    return { ok: false, error: "Please acknowledge the verification certification." };
  }
  if (b.noOfferAcknowledged !== true) {
    return { ok: false, error: "Please acknowledge the information-only notice." };
  }

  return {
    ok: true,
    data: {
      firstName,
      lastName,
      email,
      phone: str(b.phone) || undefined,
      investorType,
      investmentRange,
      preferredTerm: str(b.preferredTerm) || undefined,
      accreditationBasis,
      incomeDocsAvailable: str(b.incomeDocsAvailable) || undefined,
      netWorthDocsAvailable: str(b.netWorthDocsAvailable) || undefined,
      licenseType: str(b.licenseType) || undefined,
      licenseActive: str(b.licenseActive) || undefined,
      entityAssetRange: str(b.entityAssetRange) || undefined,
      entityEquityOwnerCount: str(b.entityEquityOwnerCount) || undefined,
      entityAllOwnersAccredited: str(b.entityAllOwnersAccredited) || undefined,
      institutionType: str(b.institutionType) || undefined,
      entityFormationDate: str(b.entityFormationDate) || undefined,
      custodianName: str(b.custodianName) || undefined,
      thirdPartyFinancing,
      howHeard: str(b.howHeard) || undefined,
      verificationAcknowledged: true,
      noOfferAcknowledged: true,
    },
  };
}

// Single delivery seam. Persists the lead as a record in Airtable (the system of
// record). Before AIRTABLE_TOKEN is configured, createLeadRecord logs and accepts
// the lead rather than failing, so the form stays functional.
async function deliverLead(lead: RequestAccessPayload): Promise<void> {
  await createLeadRecord(lead);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON." }, { status: 400 });
  }

  const result = validate(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  try {
    await deliverLead(result.data);
  } catch (err) {
    console.error("[request-access] delivery failed", err);
    return NextResponse.json(
      { error: "We could not submit your request. Please try again or contact us directly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
