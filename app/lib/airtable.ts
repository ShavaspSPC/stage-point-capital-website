// Airtable integration for investor lead capture and subscription intake.
//
// Writes each website submission as a record in the CRM "Contact" table. Base
// and table are not secret and live here as constants. The access token IS
// secret and is read from the AIRTABLE_TOKEN environment variable (set in
// Vercel, never committed). Field names below match the live Contact table
// exactly; a mismatch makes Airtable reject the write with UNKNOWN_FIELD_NAME.
//
// Both forms stay functional even before the token is set: without a token a
// submission is logged and accepted rather than failing.

import { NOTE_TERMS, termFormLabel } from "./rates";

export const AIRTABLE_BASE_ID = "appzKzsbGiYEqxXMn";
export const AIRTABLE_TABLE_ID = "tblul4fGlzp75AHvQ"; // "Contact" table

// The linked "SPC Contact" table: who at Stage Point owns a given prospect.
const SPC_CONTACT_TABLE_ID = "tblyFSQMwtp7jqqEl";
const SPC_CONTACT_NAME_FIELD = "Full Name";

// Record id of Shavasp Quillen in that table. Every lead the website itself
// generates is owned by him; only records added by hand in the admin can pick
// a different owner. Linking by id rather than by name means typecast can
// never create a duplicate person record if the name text ever changes.
const DEFAULT_SPC_CONTACT_RECORD_ID = "recO3rsRVdFpe0qnM";
export const DEFAULT_SPC_CONTACT_NAME = "Shavasp Quillen";

export type SpcContactOption = { id: string; name: string };

// Lists the people a prospect can be assigned to, for the owner picker on the
// staff "add investor" form.
//
// Never throws: the picker is an enhancement, and a problem reaching this
// table should hide it and fall back to the default owner rather than take
// down the page it sits on. Failures are logged rather than swallowed, so a
// wrong table id or renamed name field is diagnosable from the server logs
// instead of silently presenting as "the picker just isn't there".
export async function listSpcContacts(): Promise<SpcContactOption[]> {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return [];

  try {
    const out: SpcContactOption[] = [];
    let offset: string | undefined;
    do {
      const params = new URLSearchParams({ pageSize: "100" });
      params.append("fields[]", SPC_CONTACT_NAME_FIELD);
      if (offset) params.set("offset", offset);
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${SPC_CONTACT_TABLE_ID}?${params.toString()}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error("[airtable] SPC contact list failed; owner picker will be hidden", {
          status: res.status,
          detail,
          table: SPC_CONTACT_TABLE_ID,
          nameField: SPC_CONTACT_NAME_FIELD,
        });
        return [];
      }
      const data = (await res.json()) as { records?: AirtableRecord[]; offset?: string };
      for (const rec of data.records ?? []) {
        const name = (rec.fields[SPC_CONTACT_NAME_FIELD] as string) ?? "";
        if (name.trim()) out.push({ id: rec.id, name: name.trim() });
      }
      offset = data.offset;
    } while (offset);

    if (out.length === 0) {
      console.warn("[airtable] SPC contact table returned no named records", {
        table: SPC_CONTACT_TABLE_ID,
        nameField: SPC_CONTACT_NAME_FIELD,
      });
    }
    out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
  } catch (err) {
    console.error("[airtable] SPC contact list threw; owner picker will be hidden", err);
    return [];
  }
}

// Exact Contact-table column names (case-sensitive).
const FIELDS = {
  spcContact: "SPC Contact",
  contact: "Contact",
  firstName: "First Name",
  lastName: "LastName",
  email: "EmailAddress",
  // The base carries two phone columns. Every write path fills both so the
  // number is wherever staff looks for it; `phoneNumber` is always passed as
  // an optional field, so if either column is ever renamed or removed the
  // save still succeeds with the other.
  phone: "MobileNumber",
  phoneNumber: "PhoneNumber",
  contactType: "Contact Type",
  prospectStatus: "Prospective Investor Status",
  noteTerm: "Current Note Term",
  subscriptionAmount: "orig. Subscr. Amt.",
  profitDistribution: "Profit Distribution",
  notes: "Notes",
  // These four are the source fields behind the "Full Address (Investor)"
  // formula field, per the live base:
  //   CONCATENATE({Registered Street Address}&" "&{City}&" "&{State})&" "&Zip
  // Writing directly to a formula field is rejected by Airtable's API, so
  // this module writes the components; Airtable computes the formula field
  // itself. Wrapped in the same optional/fallback path as before in case a
  // name here doesn't match exactly - see writeWithFieldFallback.
  streetAddress: "Registered Street Address",
  city: "City",
  state: "State",
  zip: "Zip",
  country: "Country",
  // Read-only: the formula field itself. Never included in a write payload.
  fullAddress: "Full Address (Investor)",
  // Tax reporting. taxNumber holds the raw SSN or EIN digits; never written
  // into Notes (see buildManualInvestorNotes) so it doesn't end up duplicated
  // in a plain-text field that's easier to glance at or export by accident.
  taxNumberType: "Tax Number Type",
  taxNumber: "S.S. # or EIN",
  // Loan lifecycle dates. originationDate is entered directly; maturityDate is
  // computed from it plus the note term (see suggestMaturityDate in
  // InvestorForm.tsx) but stays a normal editable field here. currentMaturityDate
  // starts equal to maturityDate and is the one to move if a note is rolled or
  // extended, so the original scheduled maturity in maturityDate is preserved.
  originationDate: "Loan Origination Date",
  maturityDate: "Maturity Date",
  currentMaturityDate: "Current Maturity Date",
  // Percent, e.g. 8.3 for 8.30%. Auto-filled from the selected note term's
  // published rate (NoteTerm.annualValue in lib/rates.ts) but stored as its own
  // column so a negotiated, non-schedule rate can be entered instead.
  interestRate: "% Int. Rate",
  wireBankAccountNumber: "Wire Bank Account Number",
} as const;

// FIELD NAMES BELOW ARE BEST-GUESS, NOT CONFIRMED (2026-08-21): taxNumberType,
// taxNumber, originationDate, maturityDate, currentMaturityDate, interestRate,
// and wireBankAccountNumber were added without being able to read this base's
// actual schema (the Airtable token is encrypted in Vercel and unreadable from
// here). They are all listed in OPTIONAL_WRITE_FIELDS below, so a wrong guess
// just drops that one column rather than blocking the rest of the save - but
// "drops silently" is exactly the failure mode that matters for a field like a
// tax ID or a bank account number. Check /admin/airtable against the real base
// and correct any of these that don't match before relying on them.

// Columns a write may safely proceed without. If the base does not have one of
// these, writeWithFieldFallback drops just that column and saves the rest
// rather than failing the whole record. The admin's Airtable field check lists
// anything being dropped this way, so it degrades visibly rather than silently.
const OPTIONAL_WRITE_FIELDS: string[] = [
  FIELDS.phoneNumber,
  FIELDS.streetAddress,
  FIELDS.city,
  FIELDS.state,
  FIELDS.zip,
  FIELDS.country,
  FIELDS.taxNumberType,
  FIELDS.taxNumber,
  FIELDS.originationDate,
  FIELDS.maturityDate,
  FIELDS.currentMaturityDate,
  FIELDS.interestRate,
  FIELDS.wireBankAccountNumber,
];

// Every column name this module writes to or reads from, so the admin's
// Airtable field check can report which of them the live base is missing.
// A name here that the base does not have is silently dropped from writes by
// writeWithFieldFallback, which is what makes an explicit check worth having.
export const MAPPED_FIELD_NAMES: string[] = Object.values(FIELDS);

// term label (from lib/rates.termFormLabel) -> "Current Note Term" select
// option, derived from the canonical schedule so labels and CRM options
// cannot drift apart.
//
// Airtable has no API for adding select choices (the update-field endpoint
// takes only name and description). Instead, `typecast: true` on the record
// write creates a missing option automatically. Each term maps to a label
// matching the field's existing terse style, so created options stay
// consistent with "1 Yr." / "3 Yr." rather than the verbose form wording.
// "1 Yr.", "3 Yr." and "5 Yr." already exist; the rest are created on first use.
const NOTE_TERM_MAP: Record<string, string> = Object.fromEntries(
  NOTE_TERMS.map((term) => [termFormLabel(term), term.airtableOption]),
);

type ContactSnapshot = { id: string; notes: string; status: string[]; fields: Record<string, unknown> };

// Looks up a Contact record by email regardless of its current status. This
// is the single lookup every write path (lead, subscription, decision) is
// built on, so "does this person already have a record" is answered the same
// way everywhere and can't drift into inconsistent results per caller.
async function findContactByEmail(email: string): Promise<ContactSnapshot | null> {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return null;

  const escaped = email.trim().replace(/"/g, '\\"');
  const formula = `LOWER({${FIELDS.email}}) = LOWER("${escaped}")`;
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Airtable lookup failed: ${res.status} ${detail}`);
  }
  const data = (await res.json()) as { records?: Array<{ id: string; fields: Record<string, unknown> }> };
  const record = data.records?.[0];
  if (!record) return null;
  return {
    id: record.id,
    notes: (record.fields[FIELDS.notes] as string) ?? "",
    status: (record.fields[FIELDS.prospectStatus] as string[]) ?? [],
    fields: record.fields,
  };
}

// POSTs or PATCHes fields; if Airtable rejects the write because a field
// (e.g. "Address") doesn't exist on this base yet, retries once without the
// fields listed in `optionalFields` so the rest of the write still succeeds.
// This is what lets writes to a not-yet-created column degrade gracefully
// today and start working automatically the moment the column is added.
async function writeWithFieldFallback(
  method: "POST" | "PATCH",
  url: string,
  token: string,
  fields: Record<string, unknown>,
  optionalFields: string[],
): Promise<void> {
  const attempt = (f: Record<string, unknown>) =>
    fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ typecast: true, fields: f }),
    });

  // Airtable names the offending column in the error, e.g.
  //   Unknown field name: "PhoneNumber"
  // so only that one is dropped. Stripping every optional field at once
  // (the previous behaviour) meant one missing column took unrelated data
  // down with it - a missing "PhoneNumber" would also discard the address.
  const unknownFieldFrom = (detail: string): string | undefined =>
    detail.match(/Unknown field name:\s*\\?"([^"\\]+)\\?"/)?.[1];

  const payload = { ...fields };
  const dropped: string[] = [];

  // Bounded: each pass can only remove one field, and every pass strictly
  // shrinks the payload, so this cannot loop indefinitely.
  for (let pass = 0; pass <= optionalFields.length; pass += 1) {
    const res = await attempt(payload);
    if (res.ok) {
      if (dropped.length) {
        console.warn("[airtable] wrote without fields that don't exist on this base", { dropped });
      }
      return;
    }

    const detail = await res.text().catch(() => "");
    const unknown = detail.includes("UNKNOWN_FIELD_NAME") ? unknownFieldFrom(detail) : undefined;

    // Only optional fields may be dropped. An unknown *required* field is a
    // real schema mismatch and must surface rather than silently losing data.
    if (!unknown || !optionalFields.includes(unknown) || !(unknown in payload)) {
      throw new Error(`Airtable write failed: ${res.status} ${detail}`);
    }

    delete payload[unknown];
    dropped.push(unknown);
  }

  throw new Error(`Airtable write failed: could not resolve unknown fields (dropped ${dropped.join(", ")})`);
}

// The primary "Contact" column holds the submitter's own name (or entity /
// account name), so each record is titled by the investor, not by staff.
// Ownership is recorded separately via the linked "SPC Contact" field.
//
// Finds the existing Contact record for this email and updates it (merging
// status tags and appending to Notes) rather than creating a new one, so the
// same person never ends up with two records as they move from lead to
// subscription. Creates a new record only when no match exists. Returns
// silently when AIRTABLE_TOKEN is not yet configured, so both forms stay
// usable before the integration is wired up.
async function upsertContactRecord(
  email: string,
  newFields: Record<string, unknown>,
  noteBlock: string,
  logContext: Record<string, unknown>,
  optionalFields: string[] = [],
): Promise<void> {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    console.warn(
      "[airtable] AIRTABLE_TOKEN not set; submission accepted but not persisted",
      { ...logContext, at: new Date().toISOString() },
    );
    return;
  }

  const existing = await findContactByEmail(email);

  if (existing) {
    // Status replaces rather than merges: the field holds where the investor
    // is now, not everywhere they have been. Merging is what made a record
    // accumulate Interested + Committed + Accepted all at once. If this write
    // carries no status (an edit that isn't a stage change) the existing one
    // is left alone.
    const newStatus = (newFields[FIELDS.prospectStatus] as string[] | undefined) ?? [];
    const status = newStatus.length > 0 ? newStatus : existing.status;
    const mergedNotes = [existing.notes, noteBlock].filter(Boolean).join("\n\n");
    const fields = { ...newFields, [FIELDS.prospectStatus]: status, [FIELDS.notes]: mergedNotes };
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${existing.id}`;
    await writeWithFieldFallback("PATCH", url, token, fields, optionalFields);
    return;
  }

  const fields = { ...newFields, [FIELDS.notes]: noteBlock };
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;
  await writeWithFieldFallback("POST", url, token, fields, optionalFields);
}

// ---------------------------------------------------------------------------
// Lead capture ("/request-access" - top of funnel, range + self-attestation)
// ---------------------------------------------------------------------------

// Readable labels for the accreditation self-attestation slugs. Matches the
// categories in PPM Section VI so lead-stage and subscription-stage data use
// the same vocabulary.
const ACCREDITATION_LABELS: Record<string, string> = {
  income: "Income Test ($200k individual / $300k joint)",
  "net-worth": "Net Worth Test (over $1,000,000 excluding primary residence)",
  professional: "Professional Certification (Series 7, 65, or 82)",
  "entity-assets": "Entity Test (not formed for this purpose, over $5,000,000 in assets)",
  "all-equity-accredited": "All-Equity-Owner Test (all equity owners are accredited)",
  institutional: "Institutional Investor (bank, insurance company, RIC, BDC, or similar)",
  unsure: "Unsure, wants to discuss",
};

export type AccessLead = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  investorType: string;
  investmentRange: string;
  preferredTerm?: string;
  accreditationBasis: string;
  // Branch-specific substantiation, present only for the accreditationBasis
  // selected on the client; all optional since only one branch applies.
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

// The lead's self-reported detail that has no dedicated column goes into Notes.
// This is also the record of the Rule 506(c) "reasonable steps to verify"
// facts collected at intake, so every substantiating answer is captured, not
// just the top-level category.
function buildLeadNotes(lead: AccessLead): string {
  const yesNo = (b: boolean) => (b ? "Yes" : "No");
  const lines = [
    "Source: website Request the Offering Memorandum form",
    `Submitted: ${new Date().toISOString()}`,
    `Investor type: ${lead.investorType}`,
    `Intended investment: ${lead.investmentRange}`,
    `Preferred term: ${lead.preferredTerm || "No preference"}`,
    `Accreditation basis: ${ACCREDITATION_LABELS[lead.accreditationBasis] ?? lead.accreditationBasis}`,
  ];
  if (lead.incomeDocsAvailable) lines.push(`Income documentation available on request: ${lead.incomeDocsAvailable}`);
  if (lead.netWorthDocsAvailable) lines.push(`Net worth documentation available on request: ${lead.netWorthDocsAvailable}`);
  if (lead.licenseType) lines.push(`License held: ${lead.licenseType} (active and in good standing: ${lead.licenseActive ?? "unspecified"})`);
  if (lead.entityAssetRange) lines.push(`Entity total assets: ${lead.entityAssetRange}`);
  if (lead.entityEquityOwnerCount) lines.push(`Entity equity owners: ${lead.entityEquityOwnerCount} (all independently accredited: ${lead.entityAllOwnersAccredited ?? "unspecified"})`);
  if (lead.institutionType) lines.push(`Institution type: ${lead.institutionType}`);
  if (lead.entityFormationDate) lines.push(`Entity formation date: ${lead.entityFormationDate}`);
  if (lead.custodianName) lines.push(`IRA custodian: ${lead.custodianName}`);
  lines.push(
    `Third-party financing for this investment: ${lead.thirdPartyFinancing}`,
    `How they heard about the offering: ${lead.howHeard || "not specified"}`,
    `Verification certification acknowledged: ${yesNo(lead.verificationAcknowledged)}`,
    `Information-only acknowledged: ${yesNo(lead.noOfferAcknowledged)}`,
  );
  return lines.join("\n");
}

export async function createLeadRecord(lead: AccessLead): Promise<void> {
  const fields: Record<string, unknown> = {
    // Groups every website lead under Shavasp Quillen in the SPM Prospective
    // Investor view.
    [FIELDS.spcContact]: [DEFAULT_SPC_CONTACT_RECORD_ID],
    [FIELDS.contact]: `${lead.firstName.trim()} ${lead.lastName.trim()}`,
    [FIELDS.firstName]: lead.firstName,
    [FIELDS.lastName]: lead.lastName,
    [FIELDS.email]: lead.email,
    [FIELDS.contactType]: ["Prospective Investor"],
    [FIELDS.prospectStatus]: ["Interested"],
  };
  if (lead.phone) {
    fields[FIELDS.phone] = lead.phone;
    fields[FIELDS.phoneNumber] = lead.phone;
  }
  const mappedTerm = lead.preferredTerm ? NOTE_TERM_MAP[lead.preferredTerm] : undefined;
  if (mappedTerm) fields[FIELDS.noteTerm] = [mappedTerm];

  await upsertContactRecord(lead.email, fields, buildLeadNotes(lead), { stage: "lead", email: lead.email }, [
    FIELDS.phoneNumber,
  ]);
}

// ---------------------------------------------------------------------------
// Subscription intake ("/subscribe" - exact legal data, post-lead)
// ---------------------------------------------------------------------------

export type InvestorKind = "individual" | "entity" | "ira";

// Slugs match the Rule 501(a) categories in PPM Section VI / VI(Eligible
// Investors); labels are written into Notes since there is no dedicated
// multi-select column for this on the Contact table.
export const ACCREDITATION_CATEGORY_LABELS: Record<string, string> = {
  "net-worth": "Net Worth Test (over $1,000,000 excluding primary residence)",
  income: "Income Test ($200k individual / $300k joint, two most recent years)",
  professional: "Professional Certification (Series 7, 65, or 82)",
  "entity-assets": "Entity Test (not formed for this purpose, over $5,000,000 in assets)",
  "all-equity-accredited": "All-Equity-Owner Test (all equity owners are accredited)",
  "qualified-purchaser": "Qualified Purchaser (Investment Company Act Section 2(a)(51)(A))",
  institutional: "Institutional Investor (bank, insurance company, RIC, BDC, or similar)",
};

export type SubscriptionSubmission = {
  investorKind: InvestorKind;
  // Individual: full legal name. Entity: entity legal name. IRA: account
  // owner's full legal name (the custodian is captured separately).
  lenderName: string;
  lenderEmail: string;
  lenderPhone?: string;
  // Single formatted line, used in Notes and in legal documents (e.g. the
  // Pledge's capacity clause). streetAddress/city/state/zip below are the
  // same address broken into the components the "Full Address (Investor)"
  // formula field expects; both are sent so neither purpose is lost.
  lenderAddress: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  entityStateOrCountry?: string;
  entityType?: string;
  custodianName?: string;
  custodianAccountNumber?: string;
  // The person who will sign the Subscription Agreement and Pledge on behalf
  // of the entity or custodian, e.g. "Jane Doe, Managing Member". Required
  // for entity/ira, unused for individual.
  signatoryNameAndTitle?: string;
  // Optional, individual investors only - name of a spouse/spousal equivalent
  // subscribing jointly, if any.
  jointSubscriberName?: string;
  accreditationCategories: string[]; // keys of ACCREDITATION_CATEGORY_LABELS
  principalAmount: string; // exact, formatted, e.g. "$500,000"
  termMonths: number;
  distributionElection: "distribute" | "reinvest";
};

function buildSubscriptionNotes(sub: SubscriptionSubmission): string {
  const lines = [
    "Source: website Subscription form (/subscribe)",
    `Submitted: ${new Date().toISOString()}`,
    `Investor type: ${sub.investorKind}`,
    `Address: ${sub.lenderAddress}`,
  ];
  if (sub.investorKind === "entity") {
    // Two separate labelled lines rather than one combined "Entity formation"
    // line: parseNoteLine can read each back independently to pre-fill the
    // staff tool, which a combined "Delaware limited liability company" string
    // cannot be split back out of unambiguously.
    lines.push(
      `Entity state or country: ${sub.entityStateOrCountry ?? ""}`,
      `Entity type: ${sub.entityType ?? ""}`,
    );
  }
  if (sub.investorKind === "ira") {
    lines.push(`Custodian: ${sub.custodianName ?? ""}`, `Custodian account #: ${sub.custodianAccountNumber ?? ""}`);
  }
  if (sub.investorKind === "individual" && sub.jointSubscriberName) {
    lines.push(`Joint subscriber: ${sub.jointSubscriberName}`);
  }
  if (sub.investorKind === "entity" || sub.investorKind === "ira") {
    lines.push(`Signatory: ${sub.signatoryNameAndTitle ?? ""}`);
  }
  lines.push(
    `Accreditation categories: ${
      sub.accreditationCategories.map((k) => ACCREDITATION_CATEGORY_LABELS[k] ?? k).join("; ") || "none selected"
    }`,
    `Principal amount: ${sub.principalAmount}`,
    `Term: ${sub.termMonths} months`,
    `Distribution election: ${sub.distributionElection === "distribute" ? "Quarterly cash distribution" : "Reinvest"}`,
  );
  return lines.join("\n");
}

// A currency field in Airtable expects a plain number, not a formatted string.
function parseCurrency(value: string): number | undefined {
  const n = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export async function createSubscriptionRecord(sub: SubscriptionSubmission): Promise<void> {
  const term = NOTE_TERMS.find((t) => t.months === sub.termMonths);

  const fields: Record<string, unknown> = {
    [FIELDS.spcContact]: [DEFAULT_SPC_CONTACT_RECORD_ID],
    [FIELDS.contact]: sub.lenderName,
    [FIELDS.email]: sub.lenderEmail,
    [FIELDS.contactType]: ["Prospective Investor"],
    // Distinct from the lead-stage "Interested": a subscription submission is
    // a concrete commitment awaiting document generation and signature. Both
    // tags are kept (see upsertContactRecord) rather than one replacing the
    // other, so the funnel history stays visible.
    [FIELDS.prospectStatus]: ["Committed"],
    [FIELDS.profitDistribution]: [sub.distributionElection === "distribute" ? "Distribute" : "Re-invest"],
  };
  if (sub.streetAddress) fields[FIELDS.streetAddress] = sub.streetAddress;
  if (sub.city) fields[FIELDS.city] = sub.city;
  if (sub.state) fields[FIELDS.state] = sub.state;
  if (sub.zip) fields[FIELDS.zip] = sub.zip;
  if (sub.investorKind === "individual") {
    const [firstName, ...rest] = sub.lenderName.trim().split(/\s+/);
    fields[FIELDS.firstName] = firstName;
    if (rest.length) fields[FIELDS.lastName] = rest.join(" ");
  }
  if (sub.lenderPhone) {
    fields[FIELDS.phone] = sub.lenderPhone;
    fields[FIELDS.phoneNumber] = sub.lenderPhone;
  }
  if (term) fields[FIELDS.noteTerm] = [term.airtableOption];
  const amount = parseCurrency(sub.principalAmount);
  if (amount) fields[FIELDS.subscriptionAmount] = amount;

  // Finds the same person's existing "Interested" record (from
  // /request-access) by email and updates it in place, rather than creating
  // a second record — this is what stops one investor from appearing twice
  // in the dashboard/CRM. The four address components are optional here: if
  // any field name doesn't match exactly, the write degrades gracefully to
  // Notes-only rather than failing the whole submission.
  await upsertContactRecord(
    sub.lenderEmail,
    fields,
    buildSubscriptionNotes(sub),
    { stage: "subscription", email: sub.lenderEmail },
    [FIELDS.streetAddress, FIELDS.city, FIELDS.state, FIELDS.zip, FIELDS.phoneNumber],
  );
}

// ---------------------------------------------------------------------------
// Staff decision ("/admin/investors/[id]/prepare" - accept or decline a Committed
// subscription). This is the actual approval gate: nothing before this point
// binds SPM to anything, so this is the first place a decision is recorded.
// ---------------------------------------------------------------------------

export type SubscriptionDecision = "accepted" | "declined";

type CommittedRecordLookup = { id: string; notes: string; status: string[]; contactName: string };

// Finds the investor's existing record and confirms it has reached
// "Committed" - built on the same shared lookup every write path uses, so
// this always finds the one record that upsertContactRecord maintains for
// them (previously this filtered in the Airtable formula itself with
// `{status} = "Committed"`, which only matches when Committed is the *only*
// tag on the field - a multi-select equality check silently never matches
// once a second tag like "Interested" is also present).
async function findCommittedRecord(email: string): Promise<CommittedRecordLookup | null> {
  const existing = await findContactByEmail(email);
  if (!existing || !existing.status.some((s) => s.toLowerCase() === "committed")) return null;
  return {
    id: existing.id,
    notes: existing.notes,
    status: existing.status,
    contactName: (existing.fields[FIELDS.contact] as string) ?? "",
  };
}

// Records staff's accept/decline decision against the investor's existing
// Committed record. Best-effort by design: a missing token or an email with
// no matching Committed record returns `{ recorded: false }` rather than
// throwing, so this never blocks the (time-sensitive) document work it
// accompanies.
//
// This never creates a record. Adding an investor is its own explicit action
// (createInvestorRecord, from /admin/investors/new); creating one as a side
// effect of accepting is what previously allowed a second record to be
// written for someone already in the CRM at an earlier stage.
export async function recordSubscriptionDecision(
  email: string,
  decision: SubscriptionDecision,
  staffNote?: string,
): Promise<{ recorded: boolean; created?: boolean; investorName?: string }> {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    console.warn("[airtable] AIRTABLE_TOKEN not set; decision not persisted", {
      email,
      decision,
      at: new Date().toISOString(),
    });
    return { recorded: false };
  }

  const record = await findCommittedRecord(email);
  if (!record) {
    console.warn("[airtable] no Committed record found for decision", { email, decision });
    return { recorded: false };
  }

  const statusLabel = decision === "accepted" ? "Accepted" : "Declined";
  const decisionLine = [
    `Staff decision: ${statusLabel} (${new Date().toISOString()})`,
    staffNote ? `Notes: ${staffNote}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");
  const updatedNotes = [record.notes, decisionLine].filter(Boolean).join("\n\n");
  // The decision replaces the previous status rather than being added next to
  // it. The funnel history stays readable in Notes, which is appended above.
  const updatedStatus = [statusLabel];

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${record.id}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      typecast: true,
      fields: { [FIELDS.prospectStatus]: updatedStatus, [FIELDS.notes]: updatedNotes },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Airtable decision update failed: ${res.status} ${detail}`);
  }
  return { recorded: true, investorName: record.contactName || undefined };
}

// Records that the wire cleared and the Note was issued (see
// app/lib/dropboxSign.ts issueNote). Called only after an Accepted record
// already exists - if none is found there is nothing to mark, since a Note
// should never be issued for an investor who was never accepted.
export async function recordFundedAndNoteIssued(email: string): Promise<{ recorded: boolean }> {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    console.warn("[airtable] AIRTABLE_TOKEN not set; Note issuance not persisted", {
      email,
      at: new Date().toISOString(),
    });
    return { recorded: false };
  }

  const existing = await findContactByEmail(email);
  if (!existing) {
    console.warn("[airtable] no record found to mark funded/Note issued", { email });
    return { recorded: false };
  }

  const noteLine = `Wire received; Note issued (${new Date().toISOString()})`;
  const updatedNotes = [existing.notes, noteLine].filter(Boolean).join("\n\n");
  // Funded is the status; the fact that the Note was issued is recorded in the
  // note line above rather than as a second tag stacked in the same column.
  const updatedStatus = ["Funded"];

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${existing.id}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      typecast: true,
      fields: { [FIELDS.prospectStatus]: updatedStatus, [FIELDS.notes]: updatedNotes },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Airtable Note-issuance update failed: ${res.status} ${detail}`);
  }
  return { recorded: true };
}

// ---------------------------------------------------------------------------
// Admin read layer ("/admin" dashboard - list and inspect website submissions)
// ---------------------------------------------------------------------------

// The furthest-along point a submission has reached. Derived from the
// accumulating "Prospective Investor Status" tags (Interested -> Committed ->
// Accepted -> Funded, or Declined), so it reflects the real funnel position
// rather than any single tag. "funded" is reached only after staff has used
// the "Wire received - issue Note" action (see app/lib/dropboxSign.ts
// issueNote) - never automatically, since there is no bank integration here.
export type AdminStage = "interested" | "committed" | "accepted" | "funded" | "declined";

export type AdminContact = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  // Free-text investor type as reported (e.g. "Individual", "entity", "Retirement
  // account (IRA or other)"), plus a normalized kind for downstream logic.
  investorType?: string;
  investorKind?: InvestorKind;
  statusTags: string[];
  stage: AdminStage;
  principalAmount?: number;
  intendedInvestment?: string;
  noteTermOption?: string;
  termMonths?: number;
  distribution?: "distribute" | "reinvest";
  /** Airtable's computed "Full Address (Investor)", for display. */
  address?: string;
  // The address components, read straight off their own columns so the edit
  // form can round-trip them instead of re-parsing a concatenated string.
  streetAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  // Investor-type-specific detail, parsed back out of the structured Notes
  // block so the staff tool can pre-fill every field it needs rather than
  // making staff re-type what the investor already told us.
  entityStateOrCountry?: string;
  entityType?: string;
  custodianName?: string;
  custodianAccountNumber?: string;
  signatoryNameAndTitle?: string;
  jointSubscriberName?: string;
  accreditation?: string;
  thirdPartyFinancing?: string;
  // Who at Stage Point owns this prospect (a record id in the SPC Contact
  // table). Resolved to a name for display against listSpcContacts().
  spcContactId?: string;
  // What this person is to the firm in the CRM (e.g. "SPM Lender",
  // "Prospective Investor"), read straight off its own column.
  contactType?: string;
  taxNumberType?: "ssn" | "ein";
  // The raw SSN/EIN and wire account number are deliberately NOT read back
  // here - only whether one is on file. Round-tripping the actual digits into
  // every edit-page load would put a Social Security Number into page HTML
  // every time staff opens the record, for no benefit: the edit form only
  // ever needs to overwrite the value, never redisplay it.
  hasTaxNumberOnFile?: boolean;
  hasWireBankAccountOnFile?: boolean;
  /** ISO date (yyyy-mm-dd). */
  originationDate?: string;
  /** ISO date (yyyy-mm-dd). */
  maturityDate?: string;
  /** ISO date (yyyy-mm-dd). */
  currentMaturityDate?: string;
  /** Percent, e.g. 8.3 for 8.30%. */
  interestRate?: number;
  source: "lead" | "subscription" | "staff" | "unknown";
  notes: string;
  submittedAt?: string;
};

type AirtableRecord = { id: string; fields: Record<string, unknown> };

// Pulls a single "Label: value" line out of the structured Notes text the
// write path produces (see buildLeadNotes / buildSubscriptionNotes). Since a
// record can now carry both a lead block and a later subscription block for
// the same label (e.g. "Investor type"), this returns the *last* match, i.e.
// whatever was submitted most recently.
function parseNoteLine(notes: string, label: string): string | undefined {
  const re = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*(.+)$`, "gm");
  const matches = [...notes.matchAll(re)];
  return matches.length ? matches[matches.length - 1][1].trim() : undefined;
}

function deriveStage(tags: string[]): AdminStage {
  const has = (t: string) => tags.some((x) => x.toLowerCase() === t);
  if (has("declined")) return "declined";
  if (has("funded")) return "funded";
  if (has("accepted")) return "accepted";
  if (has("committed")) return "committed";
  return "interested";
}

function normalizeKind(investorType: string | undefined): InvestorKind | undefined {
  if (!investorType) return undefined;
  const v = investorType.toLowerCase();
  if (v.includes("entity") || v.includes("llc") || v.includes("corporation") || v.includes("trust") || v.includes("partnership")) {
    return "entity";
  }
  if (v.includes("ira") || v.includes("retirement")) return "ira";
  if (v.includes("individual") || v.includes("joint")) return "individual";
  return undefined;
}

function firstOfLinkedField(value: unknown): string | undefined {
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : undefined;
  return typeof value === "string" ? value : undefined;
}

function mapAdminRecord(rec: AirtableRecord): AdminContact {
  const f = rec.fields;
  const notes = (f[FIELDS.notes] as string) ?? "";
  const tags = (f[FIELDS.prospectStatus] as string[]) ?? [];
  const investorType = parseNoteLine(notes, "Investor type");
  const noteTermOption = firstOfLinkedField(f[FIELDS.noteTerm]);
  const term = noteTermOption ? NOTE_TERMS.find((t) => t.airtableOption === noteTermOption) : undefined;
  const distributionRaw = firstOfLinkedField(f[FIELDS.profitDistribution]);
  const taxNumberTypeRaw = firstOfLinkedField(f[FIELDS.taxNumberType]);
  const source: AdminContact["source"] = notes.includes("Subscription form")
    ? "subscription"
    : notes.includes("Request the Offering Memorandum")
      ? "lead"
      : notes.includes("staff-added")
        ? "staff"
        : "unknown";

  return {
    id: rec.id,
    name: (f[FIELDS.contact] as string) ?? "(no name on record)",
    email: (f[FIELDS.email] as string) ?? "",
    // Either column may hold it: older records predate the dual write, and
    // one of the two may not exist on the base at all.
    phone: (f[FIELDS.phone] as string) || (f[FIELDS.phoneNumber] as string) || undefined,
    investorType,
    investorKind: normalizeKind(investorType),
    statusTags: tags,
    stage: deriveStage(tags),
    principalAmount: typeof f[FIELDS.subscriptionAmount] === "number" ? (f[FIELDS.subscriptionAmount] as number) : undefined,
    intendedInvestment: parseNoteLine(notes, "Intended investment"),
    noteTermOption,
    termMonths: term?.months,
    distribution: distributionRaw ? (distributionRaw.toLowerCase().startsWith("re") ? "reinvest" : "distribute") : undefined,
    // Prefers Airtable's own computed "Full Address (Investor)" formula
    // field (populated automatically once the source fields below are
    // written); falls back to parsing Notes for records from before that
    // was wired up.
    address: (f[FIELDS.fullAddress] as string) || parseNoteLine(notes, "Address"),
    streetAddress: (f[FIELDS.streetAddress] as string) || undefined,
    city: (f[FIELDS.city] as string) || undefined,
    state: (f[FIELDS.state] as string) || undefined,
    zip: f[FIELDS.zip] != null ? String(f[FIELDS.zip]) : undefined,
    country: (f[FIELDS.country] as string) || undefined,
    entityStateOrCountry: parseNoteLine(notes, "Entity state or country"),
    entityType: parseNoteLine(notes, "Entity type"),
    custodianName: parseNoteLine(notes, "Custodian"),
    custodianAccountNumber: parseNoteLine(notes, "Custodian account #"),
    signatoryNameAndTitle: parseNoteLine(notes, "Signatory"),
    jointSubscriberName: parseNoteLine(notes, "Joint subscriber"),
    accreditation:
      parseNoteLine(notes, "Accreditation categories") ?? parseNoteLine(notes, "Accreditation basis"),
    thirdPartyFinancing:
      parseNoteLine(notes, "Third-party financing for this investment") ??
      parseNoteLine(notes, "Third-party financing"),
    spcContactId: firstOfLinkedField(f[FIELDS.spcContact]),
    contactType: firstOfLinkedField(f[FIELDS.contactType]),
    taxNumberType: taxNumberTypeRaw ? (taxNumberTypeRaw.toLowerCase().startsWith("ein") ? "ein" : "ssn") : undefined,
    hasTaxNumberOnFile: Boolean(f[FIELDS.taxNumber]),
    hasWireBankAccountOnFile: Boolean(f[FIELDS.wireBankAccountNumber]),
    originationDate: typeof f[FIELDS.originationDate] === "string" ? (f[FIELDS.originationDate] as string) : undefined,
    maturityDate: typeof f[FIELDS.maturityDate] === "string" ? (f[FIELDS.maturityDate] as string) : undefined,
    currentMaturityDate:
      typeof f[FIELDS.currentMaturityDate] === "string" ? (f[FIELDS.currentMaturityDate] as string) : undefined,
    interestRate: typeof f[FIELDS.interestRate] === "number" ? (f[FIELDS.interestRate] as number) : undefined,
    source,
    notes,
    submittedAt: parseNoteLine(notes, "Submitted"),
  };
}

// Lists every website-originated submission (identified by the "Source: website"
// marker the write path stamps into Notes), newest first. Returns an empty
// list when AIRTABLE_TOKEN is unset so the dashboard renders an empty state
// rather than erroring.
export async function listAdminContacts(): Promise<AdminContact[]> {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return [];

  // Website submissions plus records staff added by hand in the admin. Both
  // write a "Source: ..." marker into Notes; this is what separates records
  // this app owns from the rest of the CRM's Contact table.
  const formula = `OR(SEARCH("Source: website", {${FIELDS.notes}}), SEARCH("Source: staff-added", {${FIELDS.notes}}))`;
  const out: AdminContact[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ filterByFormula: formula, pageSize: "100" });
    if (offset) params.set("offset", offset);
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?${params.toString()}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Airtable list failed: ${res.status} ${detail}`);
    }
    const data = (await res.json()) as { records?: AirtableRecord[]; offset?: string };
    for (const rec of data.records ?? []) out.push(mapAdminRecord(rec));
    offset = data.offset;
  } while (offset);

  // Newest submission first. Records without a parseable timestamp sort last.
  out.sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
  return out;
}

// Fetches one submission by Airtable record id, for pre-filling the staff tool.
export async function getAdminContactById(id: string): Promise<AdminContact | null> {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return null;

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${encodeURIComponent(id)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Airtable get failed: ${res.status} ${detail}`);
  }
  return mapAdminRecord((await res.json()) as AirtableRecord);
}

// ---------------------------------------------------------------------------
// Staff-entered investors ("/admin/investors/new" and ".../edit")
//
// One write path serves both create and edit. Creating goes through
// upsertContactRecord, which finds any existing record for the same email and
// enriches it instead of adding a second one - so adding someone who already
// came through the website can never produce a duplicate. Editing targets a
// known record id directly, since the email itself may be what's being
// corrected.
// ---------------------------------------------------------------------------

// Every stage staff can set by hand - the same set the dashboard derives, so
// any state the pipeline can reach is also one a human can correct it back to.
export type ManualInvestorStage = AdminStage;

export type ManualInvestorInput = {
  investorKind: InvestorKind;
  name: string;
  email: string;
  phone?: string;
  // The address as five columns, matching the Contact table. It used to be one
  // free-text box that only ever reached Notes, so the base's own address
  // columns stayed empty for every staff-entered investor.
  streetAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  entityStateOrCountry?: string;
  entityType?: string;
  custodianName?: string;
  custodianAccountNumber?: string;
  signatoryNameAndTitle?: string;
  jointSubscriberName?: string;
  stage: ManualInvestorStage;
  principalAmount?: string;
  termMonths?: number;
  staffNote?: string;
  // Record id from the SPC Contact table - who at Stage Point this prospect
  // belongs to. Omitted means the default owner, which is what every
  // website-generated lead uses.
  spcContactId?: string;
  // What this person is to the firm in the CRM, distinct from prospectStatus
  // (where they are in the funnel). Free text rather than a closed union so a
  // new Contact Type option added in Airtable doesn't need a code change to
  // become selectable. Blank means "no admin input" - see
  // buildManualInvestorFields for the SPM Lender default that applies then.
  contactType?: string;
  taxNumberType?: "ssn" | "ein";
  /** Raw SSN or EIN digits. Never surfaced in Notes - see buildManualInvestorNotes. */
  taxNumber?: string;
  profitDistribution?: "distribute" | "reinvest";
  /** ISO date (yyyy-mm-dd). */
  originationDate?: string;
  /** ISO date (yyyy-mm-dd). Auto-computed client-side from originationDate + term, but editable. */
  maturityDate?: string;
  /** ISO date (yyyy-mm-dd). Starts equal to maturityDate; move this one on a roll or extension. */
  currentMaturityDate?: string;
  /** Percent, e.g. 8.3 for 8.30%. Auto-filled client-side from the note term's published rate. */
  interestRate?: number;
  wireBankAccountNumber?: string;
};

// "Prospective Investor Status" holds exactly one value: where the investor is
// now. It used to accumulate the whole funnel (Interested, then Interested +
// Committed, then Interested + Committed + Accepted...) which left every
// record carrying a pile of stale tags and made the column unreadable at a
// glance in Airtable. The progression is still recorded, in Notes, which is
// where a history belongs.
const STAGE_LABELS: Record<ManualInvestorStage, string> = {
  interested: "Interested",
  committed: "Committed",
  accepted: "Accepted",
  funded: "Funded",
  declined: "Declined",
};

// Every value this module recognises as a status. Anything else found on a
// record was put there by hand in Airtable and is dropped when the stage is
// rewritten, because the field is now single-valued by design.
const STAGE_TAG_NAMES = Object.values(STAGE_LABELS);

/** The status value for a stage, as the single-element array Airtable expects. */
function stageTags(stage: ManualInvestorStage): string[] {
  return [STAGE_LABELS[stage]];
}

function applyStageTags(_existing: string[], stage: ManualInvestorStage): string[] {
  return stageTags(stage);
}

/** The address on one line, for the human-readable Notes block. */
function addressLine(input: ManualInvestorInput): string {
  return [input.streetAddress, input.city, input.state, input.zip, input.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

function buildManualInvestorNotes(input: ManualInvestorInput, mode: "created" | "updated"): string {
  const now = new Date().toISOString();
  const term = input.termMonths ? NOTE_TERMS.find((t) => t.months === input.termMonths) : undefined;
  const lines: (string | undefined)[] = [
    // The "Source:" marker is what listAdminContacts filters on; without it a
    // staff-added record would be invisible in the dashboard that created it.
    mode === "created" ? "Source: staff-added (admin)" : `Staff edit (${now})`,
    // parseNoteLine takes the LAST match for a label, so an edit block placed
    // after the original one wins - the record reads as a history, but the
    // dashboard and staff tool see the newest values.
    mode === "created" ? `Submitted: ${now}` : undefined,
    `Investor type: ${input.investorKind}`,
    addressLine(input) ? `Address: ${addressLine(input)}` : undefined,
  ];
  if (input.investorKind === "entity") {
    lines.push(
      `Entity state or country: ${input.entityStateOrCountry ?? ""}`,
      `Entity type: ${input.entityType ?? ""}`,
    );
  }
  if (input.investorKind === "ira") {
    lines.push(
      `Custodian: ${input.custodianName ?? ""}`,
      `Custodian account #: ${input.custodianAccountNumber ?? ""}`,
    );
  }
  if (input.investorKind === "individual" && input.jointSubscriberName) {
    lines.push(`Joint subscriber: ${input.jointSubscriberName}`);
  }
  if (input.investorKind !== "individual" && input.signatoryNameAndTitle) {
    lines.push(`Signatory: ${input.signatoryNameAndTitle}`);
  }
  lines.push(
    input.principalAmount ? `Principal amount: ${input.principalAmount}` : undefined,
    term ? `Term: ${term.months} months` : undefined,
    input.interestRate != null ? `Interest rate: ${input.interestRate}%` : undefined,
    input.profitDistribution ? `Profit distribution: ${input.profitDistribution === "distribute" ? "Distribute" : "Re-invest"}` : undefined,
    input.originationDate ? `Origination date: ${input.originationDate}` : undefined,
    input.maturityDate ? `Maturity date: ${input.maturityDate}` : undefined,
    input.currentMaturityDate ? `Current maturity date: ${input.currentMaturityDate}` : undefined,
    input.contactType ? `Contact type: ${input.contactType}` : undefined,
    // Records that a tax number was captured, deliberately without the number
    // itself - the value only ever goes to its own Airtable column, never here.
    input.taxNumberType ? `Tax number type: ${input.taxNumberType === "ssn" ? "SSN" : "EIN"} (number on file, see Tax Number Type / S.S. # or EIN columns)` : undefined,
    `Stage set by staff: ${STAGE_LABELS[input.stage]}`,
    input.staffNote ? `Notes: ${input.staffNote}` : undefined,
  );
  return lines.filter(Boolean).join("\n");
}

function buildManualInvestorFields(input: ManualInvestorInput): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    [FIELDS.spcContact]: [input.spcContactId || DEFAULT_SPC_CONTACT_RECORD_ID],
    [FIELDS.contact]: input.name.trim(),
    [FIELDS.email]: input.email.trim(),
    // Driven by what staff picked in the form. Absent any admin input, this
    // defaults to "SPM Lender" rather than the old hardcoded "Prospective
    // Investor" - see ManualInvestorInput.contactType.
    [FIELDS.contactType]: [input.contactType?.trim() || "SPM Lender"],
    [FIELDS.prospectStatus]: stageTags(input.stage),
  };
  if (input.investorKind === "individual") {
    const [firstName, ...rest] = input.name.trim().split(/\s+/);
    fields[FIELDS.firstName] = firstName;
    if (rest.length) fields[FIELDS.lastName] = rest.join(" ");
  }
  if (input.phone) {
    fields[FIELDS.phone] = input.phone;
    fields[FIELDS.phoneNumber] = input.phone;
  }
  // Written whenever the caller supplied a value, including an empty string,
  // so clearing a line of the address in the form actually clears the column
  // rather than leaving the old value stranded in the CRM.
  if (input.streetAddress !== undefined) fields[FIELDS.streetAddress] = input.streetAddress;
  if (input.city !== undefined) fields[FIELDS.city] = input.city;
  if (input.state !== undefined) fields[FIELDS.state] = input.state;
  if (input.zip !== undefined) fields[FIELDS.zip] = input.zip;
  if (input.country !== undefined) fields[FIELDS.country] = input.country;
  const term = input.termMonths ? NOTE_TERMS.find((t) => t.months === input.termMonths) : undefined;
  if (term) fields[FIELDS.noteTerm] = [term.airtableOption];
  if (input.profitDistribution) {
    fields[FIELDS.profitDistribution] = [input.profitDistribution === "distribute" ? "Distribute" : "Re-invest"];
  }
  if (input.taxNumberType) fields[FIELDS.taxNumberType] = [input.taxNumberType === "ssn" ? "SSN" : "EIN"];
  // Date and number columns: written only when a value is present, unlike the
  // address lines above. An empty string sent to a typed Airtable column
  // (Date, Number) is rejected as an invalid value, not accepted as "clear
  // this field" the way it is for a text column, so there is no safe way to
  // clear these from this form - that has to happen directly in Airtable.
  if (input.taxNumber) fields[FIELDS.taxNumber] = input.taxNumber;
  if (input.originationDate) fields[FIELDS.originationDate] = input.originationDate;
  if (input.maturityDate) fields[FIELDS.maturityDate] = input.maturityDate;
  if (input.currentMaturityDate) fields[FIELDS.currentMaturityDate] = input.currentMaturityDate;
  if (input.interestRate != null) fields[FIELDS.interestRate] = input.interestRate;
  if (input.wireBankAccountNumber) fields[FIELDS.wireBankAccountNumber] = input.wireBankAccountNumber;
  const amount = input.principalAmount ? parseCurrency(input.principalAmount) : undefined;
  if (amount) fields[FIELDS.subscriptionAmount] = amount;
  return fields;
}

// Resolves the record id for an email, so the caller can navigate straight to
// a record it just wrote through the email-keyed upsert path.
export async function findAdminContactIdByEmail(email: string): Promise<string | undefined> {
  if (!process.env.AIRTABLE_TOKEN) return undefined;
  const existing = await findContactByEmail(email);
  return existing?.id;
}

// Creates a staff-entered investor. Routed through upsertContactRecord so an
// email that already exists updates that record instead of duplicating it.
export async function createInvestorRecord(input: ManualInvestorInput): Promise<{ saved: boolean }> {
  if (!process.env.AIRTABLE_TOKEN) return { saved: false };
  await upsertContactRecord(
    input.email,
    buildManualInvestorFields(input),
    buildManualInvestorNotes(input, "created"),
    { stage: "staff-added", email: input.email },
    OPTIONAL_WRITE_FIELDS,
  );
  return { saved: true };
}

// Updates an existing record by id. Targets the id rather than the email
// because the email is itself editable here.
export async function updateInvestorRecord(
  id: string,
  input: ManualInvestorInput,
): Promise<{ saved: boolean }> {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    console.warn("[airtable] AIRTABLE_TOKEN not set; investor edit not persisted", {
      id,
      at: new Date().toISOString(),
    });
    return { saved: false };
  }

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${encodeURIComponent(id)}`;
  const current = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!current.ok) {
    const detail = await current.text().catch(() => "");
    throw new Error(`Airtable get-before-edit failed: ${current.status} ${detail}`);
  }
  const record = (await current.json()) as AirtableRecord;
  const existingNotes = (record.fields[FIELDS.notes] as string) ?? "";
  const existingStatus = (record.fields[FIELDS.prospectStatus] as string[]) ?? [];

  const fields = buildManualInvestorFields(input);
  // The picked stage is authoritative, not additive. Merging (the previous
  // behaviour) made stage changes one-directional: moving someone back from
  // Accepted to Committed left the Accepted tag in place and silently did
  // nothing. Non-stage tags are still preserved - see applyStageTags.
  fields[FIELDS.prospectStatus] = applyStageTags(existingStatus, input.stage);
  fields[FIELDS.notes] = [existingNotes, buildManualInvestorNotes(input, "updated")]
    .filter(Boolean)
    .join("\n\n");

  await writeWithFieldFallback("PATCH", url, token, fields, OPTIONAL_WRITE_FIELDS);
  return { saved: true };
}

// Moves one record to a stage, without touching any of its other fields.
// Backs the quick stage control on the dashboard, where re-submitting the
// whole investor form just to correct a stage would be busywork.
export async function setInvestorStage(
  id: string,
  stage: ManualInvestorStage,
): Promise<{ saved: boolean; stage: ManualInvestorStage; tags: string[] }> {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    console.warn("[airtable] AIRTABLE_TOKEN not set; stage change not persisted", {
      id,
      stage,
      at: new Date().toISOString(),
    });
    return { saved: false, stage, tags: [] };
  }

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${encodeURIComponent(id)}`;
  const current = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!current.ok) {
    const detail = await current.text().catch(() => "");
    throw new Error(`Airtable get-before-stage-change failed: ${current.status} ${detail}`);
  }
  const record = (await current.json()) as AirtableRecord;
  const existingNotes = (record.fields[FIELDS.notes] as string) ?? "";
  const existingStatus = (record.fields[FIELDS.prospectStatus] as string[]) ?? [];

  // Dated line in Notes rather than a silent tag swap: the tags say where the
  // record is now, the notes say how it got there and when.
  const noteLine = `Stage set by staff: ${STAGE_LABELS[stage]} (${new Date().toISOString()})`;
  // Returned so the caller can update what it's showing without refetching -
  // the dashboard displays these tags, and they change as part of this write.
  const tags = applyStageTags(existingStatus, stage);

  await writeWithFieldFallback("PATCH", url, token, {
    [FIELDS.prospectStatus]: tags,
    [FIELDS.notes]: [existingNotes, noteLine].filter(Boolean).join("\n\n"),
  }, []);
  return { saved: true, stage, tags };
}

// Permanently deletes a submission from Airtable (used by the dashboard's
// "Delete submission" action). Returns { deleted: false } rather than
// throwing when AIRTABLE_TOKEN is unset, matching the rest of this module's
// graceful-degradation pattern.
export async function deleteContactRecord(id: string): Promise<{ deleted: boolean }> {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    console.warn("[airtable] AIRTABLE_TOKEN not set; delete skipped", { id, at: new Date().toISOString() });
    return { deleted: false };
  }

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${encodeURIComponent(id)}`;
  const res = await fetch(url, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Airtable delete failed: ${res.status} ${detail}`);
  }
  return { deleted: true };
}

// Deletes many records at once (the dashboard's multi-select "Delete
// selected" action). Airtable's batch-delete endpoint accepts at most 10
// records per call, so this chunks into groups of 10. If a chunk fails as a
// whole - e.g. one id in it no longer exists - it falls back to deleting that
// chunk's records one at a time, so a single bad id can't block the other
// nine from being removed. Returns which ids actually came out so the caller
// can update its own state and report any that didn't.
const AIRTABLE_DELETE_BATCH_SIZE = 10;

export async function deleteContactRecords(
  ids: string[],
): Promise<{ deletedIds: string[]; failedIds: string[] }> {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    console.warn("[airtable] AIRTABLE_TOKEN not set; bulk delete skipped", {
      count: ids.length,
      at: new Date().toISOString(),
    });
    return { deletedIds: [], failedIds: ids };
  }

  const deletedIds: string[] = [];
  const failedIds: string[] = [];

  for (let i = 0; i < ids.length; i += AIRTABLE_DELETE_BATCH_SIZE) {
    const chunk = ids.slice(i, i + AIRTABLE_DELETE_BATCH_SIZE);
    const params = new URLSearchParams();
    for (const id of chunk) params.append("records[]", id);
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?${params.toString()}`;

    const res = await fetch(url, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = (await res.json()) as { records?: Array<{ id: string; deleted: boolean }> };
      for (const record of data.records ?? []) {
        (record.deleted ? deletedIds : failedIds).push(record.id);
      }
      continue;
    }

    // The batch as a whole was rejected (commonly: one id in it doesn't
    // exist any more, e.g. already deleted elsewhere). Retry this chunk's
    // records individually rather than losing the other nine to one bad id.
    const detail = await res.text().catch(() => "");
    console.warn("[airtable] batch delete chunk failed, retrying individually", {
      status: res.status,
      detail,
      chunkSize: chunk.length,
    });
    for (const id of chunk) {
      try {
        const result = await deleteContactRecord(id);
        (result.deleted ? deletedIds : failedIds).push(id);
      } catch (err) {
        console.error("[airtable] individual delete failed during batch fallback", { id, err });
        failedIds.push(id);
      }
    }
  }

  return { deletedIds, failedIds };
}
