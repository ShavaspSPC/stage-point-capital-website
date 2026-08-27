import { NextResponse } from "next/server";
import { createSubscriptionRecord, type SubscriptionSubmission } from "@/app/lib/airtable";
import { NOTE_TERMS } from "@/app/lib/rates";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_KINDS = ["individual", "entity", "ira"] as const;

function validate(
  body: unknown,
): { ok: true; data: SubscriptionSubmission } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid request body." };
  }
  const b = body as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const investorKind = str(b.investorKind);
  if (!VALID_KINDS.includes(investorKind as (typeof VALID_KINDS)[number])) {
    return { ok: false, error: "Please select an investor type." };
  }

  const lenderName = str(b.lenderName);
  const lenderEmail = str(b.lenderEmail);
  const lenderAddress = str(b.lenderAddress);
  // The client (SubscriptionFlow) also sends these as separate fields so
  // they can be written to Airtable's actual address columns, which back a
  // formula field there ("Full Address (Investor)") rather than combined
  // into one string like lenderAddress is.
  const addressLine1 = str(b.addressLine1);
  const addressLine2 = str(b.addressLine2);
  const addressCity = str(b.addressCity);
  const addressState = str(b.addressState);
  const addressZip = str(b.addressZip);
  const principalAmount = str(b.principalAmount);
  const termMonths = Number(b.termMonths);
  const distributionElection = str(b.distributionElection);
  const accreditationCategories = Array.isArray(b.accreditationCategories)
    ? b.accreditationCategories.filter((c): c is string => typeof c === "string")
    : [];

  if (!lenderName) return { ok: false, error: "Please provide the investor's full legal name." };
  if (!EMAIL_RE.test(lenderEmail)) return { ok: false, error: "Please provide a valid email address." };
  if (!lenderAddress) return { ok: false, error: "Please provide an address." };
  if (accreditationCategories.length === 0) {
    return { ok: false, error: "Please select at least one accredited investor category." };
  }
  if (!principalAmount) return { ok: false, error: "Please provide the exact investment amount." };
  if (!NOTE_TERMS.some((t) => t.months === termMonths)) {
    return { ok: false, error: "Please select a valid note term." };
  }
  if (distributionElection !== "distribute" && distributionElection !== "reinvest") {
    return { ok: false, error: "Please select a distribution election." };
  }
  if (b.nonFinancingAcknowledged !== true) {
    return { ok: false, error: "Please acknowledge the third-party financing representation." };
  }
  if (b.restrictedSecuritiesAcknowledged !== true) {
    return { ok: false, error: "Please acknowledge the restricted securities notice." };
  }
  if (b.reviewedMemorandumAcknowledged !== true) {
    return { ok: false, error: "Please acknowledge that you have reviewed the Memorandum." };
  }

  const entityStateOrCountry = str(b.entityStateOrCountry);
  const entityType = str(b.entityType);
  if (investorKind === "entity" && (!entityStateOrCountry || !entityType)) {
    return { ok: false, error: "Please provide the entity's state/country of formation and entity type." };
  }

  const custodianName = str(b.custodianName);
  const custodianAccountNumber = str(b.custodianAccountNumber);
  if (investorKind === "ira" && (!custodianName || !custodianAccountNumber)) {
    return { ok: false, error: "Please provide the custodian name and account number." };
  }

  const signatoryNameAndTitle = str(b.signatoryNameAndTitle);
  if ((investorKind === "entity" || investorKind === "ira") && !signatoryNameAndTitle) {
    return {
      ok: false,
      error: "Please provide the name and title of the person who will sign on behalf of your entity or custodian.",
    };
  }

  const jointSubscriberName = str(b.jointSubscriberName);

  return {
    ok: true,
    data: {
      investorKind: investorKind as SubscriptionSubmission["investorKind"],
      lenderName,
      lenderEmail,
      lenderPhone: str(b.lenderPhone) || undefined,
      lenderAddress,
      streetAddress: [addressLine1, addressLine2].filter(Boolean).join(", ") || undefined,
      city: addressCity || undefined,
      state: addressState || undefined,
      zip: addressZip || undefined,
      entityStateOrCountry: investorKind === "entity" ? entityStateOrCountry : undefined,
      entityType: investorKind === "entity" ? entityType : undefined,
      custodianName: investorKind === "ira" ? custodianName : undefined,
      custodianAccountNumber: investorKind === "ira" ? custodianAccountNumber : undefined,
      signatoryNameAndTitle:
        investorKind === "entity" || investorKind === "ira" ? signatoryNameAndTitle : undefined,
      jointSubscriberName: investorKind === "individual" ? jointSubscriberName || undefined : undefined,
      accreditationCategories,
      principalAmount,
      termMonths,
      distributionElection: distributionElection as "distribute" | "reinvest",
    },
  };
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
    await createSubscriptionRecord(result.data);
  } catch (err) {
    console.error("[subscribe] delivery failed", err);
    return NextResponse.json(
      { error: "We could not submit your subscription. Please try again or contact us directly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
