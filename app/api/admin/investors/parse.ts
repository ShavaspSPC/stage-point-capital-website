import type { InvestorKind, ManualInvestorInput, ManualInvestorStage } from "@/app/lib/airtable";

// Shared request-body validation for the create (POST) and edit (PATCH)
// investor routes. Both accept exactly the same shape, so the parsing lives
// here rather than being written twice and drifting apart.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KINDS: InvestorKind[] = ["individual", "entity", "ira"];
const STAGES: ManualInvestorStage[] = [
  "interested",
  "committed",
  "accepted",
  "funded",
  "declined",
];

export type ParseResult =
  | { ok: true; data: ManualInvestorInput }
  | { ok: false; error: string };

export function parseInvestorBody(body: unknown): ParseResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid request body." };
  }
  const b = body as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const optional = (v: unknown) => str(v) || undefined;
  // Distinguishes "the client didn't send this key" (leave the CRM alone) from
  // "the client sent it empty" (clear the CRM column).
  const present = (o: Record<string, unknown>, key: string) =>
    key in o && typeof o[key] === "string" ? str(o[key]) : undefined;

  const investorKind = str(b.investorKind) as InvestorKind;
  if (!KINDS.includes(investorKind)) {
    return { ok: false, error: "Select an investor type." };
  }

  const stage = str(b.stage) as ManualInvestorStage;
  if (!STAGES.includes(stage)) {
    return { ok: false, error: "Select where this investor is in the pipeline." };
  }

  const name = str(b.name);
  if (!name) return { ok: false, error: "Enter the investor's name." };

  const email = str(b.email);
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email address." };

  const termMonthsRaw = b.termMonths;
  const termMonths =
    typeof termMonthsRaw === "number" && Number.isFinite(termMonthsRaw) ? termMonthsRaw : undefined;

  const interestRateRaw = b.interestRate;
  const interestRate =
    typeof interestRateRaw === "number" && Number.isFinite(interestRateRaw) ? interestRateRaw : undefined;

  const taxNumberTypeStr = str(b.taxNumberType);
  const taxNumberType =
    taxNumberTypeStr === "ssn" || taxNumberTypeStr === "ein" ? taxNumberTypeStr : undefined;

  const distributionStr = str(b.profitDistribution);
  const profitDistribution =
    distributionStr === "distribute" || distributionStr === "reinvest" ? distributionStr : undefined;

  // yyyy-mm-dd from an <input type="date">. Loosely checked - this is an
  // internal staff tool, not a public form, so a malformed value is a typo to
  // fix, not something to defend against.
  const isoDate = (v: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(str(v)) ? str(v) : undefined);

  return {
    ok: true,
    data: {
      investorKind,
      name,
      email,
      phone: optional(b.phone),
      // Address parts come through as "" rather than undefined when the field
      // was present but emptied, which is what lets the write clear a column
      // the investor no longer has a value for.
      streetAddress: present(b, "streetAddress"),
      city: present(b, "city"),
      state: present(b, "state"),
      zip: present(b, "zip"),
      country: present(b, "country"),
      // Investor-type-specific detail is only carried through when it applies,
      // so switching type on an edit doesn't leave stale entity fields behind
      // on an IRA record.
      entityStateOrCountry: investorKind === "entity" ? optional(b.entityStateOrCountry) : undefined,
      entityType: investorKind === "entity" ? optional(b.entityType) : undefined,
      custodianName: investorKind === "ira" ? optional(b.custodianName) : undefined,
      custodianAccountNumber: investorKind === "ira" ? optional(b.custodianAccountNumber) : undefined,
      signatoryNameAndTitle:
        investorKind !== "individual" ? optional(b.signatoryNameAndTitle) : undefined,
      jointSubscriberName:
        investorKind === "individual" ? optional(b.jointSubscriberName) : undefined,
      stage,
      principalAmount: optional(b.principalAmount),
      termMonths,
      staffNote: optional(b.staffNote),
      // Airtable record ids are always "rec"-prefixed; anything else would be
      // rejected by the link write anyway, so it is dropped here in favour of
      // the default owner rather than failing the whole save.
      spcContactId: /^rec[A-Za-z0-9]+$/.test(str(b.spcContactId)) ? str(b.spcContactId) : undefined,
      contactType: optional(b.contactType),
      taxNumberType,
      taxNumber: optional(b.taxNumber),
      profitDistribution,
      originationDate: isoDate(b.originationDate),
      maturityDate: isoDate(b.maturityDate),
      currentMaturityDate: isoDate(b.currentMaturityDate),
      interestRate,
      wireBankAccountNumber: optional(b.wireBankAccountNumber),
    },
  };
}
