import { NOTE_TERMS } from "./rates";

// Dropbox Sign is used MANUALLY through its dashboard here, not via API - the
// account's plan doesn't include API access, and Dropbox Sign sells API
// access as a separate paid product on top of the app plan. This module has
// no network calls and no API key. It exists purely to compute the values
// staff need to paste into Dropbox Sign's dashboard when sending each
// document, since several of them (the capacity clause, the %-stripped
// rates, the formatted principal) are non-trivial to compute by hand.
//
// In the Dropbox Sign template editor, every {{field}} placeholder documented
// in document-templates/FIELD-MAP.md should be configured as a
// "Me (when sending)" field (Dropbox Sign's own term for a field the sender
// fills in by hand each time, as opposed to one filled in by a signer). Every
// time staff sends from that template, Dropbox Sign prompts for each one by
// the label given here. The `id` values below exist only as a human-readable
// cross-reference to FIELD-MAP.md; nothing in this file talks to Dropbox
// Sign over the network.
//
// The Subscription Agreement and Pledge Agreement are sent together as ONE
// signature request: on the dashboard's "Select documents to be signed"
// screen, use "Add template" a second time to add both templates to the same
// send before clicking Next. Confirmed working in the dashboard (2026-08-16)
// - the screen accepts multiple templates in its "Selected documents" list,
// same as it accepts multiple raw file uploads. Dropbox Sign will still
// prompt for each template's own "Me (when sending)" fields separately even
// within the combined send, which is why this file still returns one
// FieldSheet per document rather than merging them.
//
// If SPM adds a paid Dropbox Sign API plan later, the pure computation below
// (capacityClause, rate formatting, field sheets) is exactly what a real
// send() call would reuse - only the "send it over the network" part is
// missing today.

export type LenderKind = "individual" | "entity" | "ira";

export type SigningPacketInput = {
  lenderName: string;
  lenderEmail: string;
  lenderAddress: string;
  lenderKind: LenderKind;
  // Required when lenderKind is "entity"; ignored otherwise.
  entityStateOrCountry?: string;
  entityType?: string;
  // Required when lenderKind is "ira"; ignored otherwise.
  custodianName?: string;
  custodianAccountNumber?: string;
  // Required when lenderKind is "entity" or "ira"; ignored for "individual".
  signatoryNameAndTitle?: string;
  // Optional, individual investors only - name of a spouse/spousal equivalent
  // subscribing jointly, if any. Left blank (not "N/A") when the investor
  // simply doesn't have one; "N/A" is reserved for whole sections that don't
  // apply to this investor's type, which isn't the case here.
  jointSubscriberName?: string;
  principalAmount: string; // pre-formatted, e.g. "$500,000.00"
  termMonths: number; // must match a months value in NOTE_TERMS
  effectiveDate: string; // pre-formatted long form, e.g. "July 10, 2026"
  maturityDate: string; // pre-formatted, e.g. "07.09.2031" - initial date only,
  // subject to the Note's automatic extension (Section 1.5)
  // Who signs on Stage Point's behalf - shown to staff so they know who to
  // add as the Company signer when sending from the dashboard.
  companySignatoryName?: string;
  companySignatoryEmail?: string;
};

export type FieldSheetEntry = { id: string; label: string; value: string };
export type FieldSheetSigner = { role: "Company" | "Investor"; name: string; email: string };
export type FieldSheet = {
  documentLabel: string;
  templateFile: string;
  signers: FieldSheetSigner[];
  fields: FieldSheetEntry[];
};

export type FieldSheetResult =
  | { ok: true; sheets: FieldSheet[] }
  | { ok: false; reason: string };

// Computes the single value for the Pledge's capacity clause, replacing the
// two bracketed alternatives in the source Exhibit B form (see FIELD-MAP.md,
// "The capacity clause"). The source form itself only offers
// individual/entity phrasings; the IRA phrasing below was added here (not in
// the source document, which has no third option) to mirror how the
// Subscription Agreement's own Section 3.C already frames IRA participation.
// FLAG FOR COUNSEL: this phrasing was drafted for consistency, not sourced
// from an executed precedent - confirm it's correct for a custodian pledging
// collateral on behalf of an IRA.
function capacityClause(input: SigningPacketInput): string {
  if (input.lenderKind === "entity") {
    return `a ${input.entityStateOrCountry} ${input.entityType} with its principal place of business at ${input.lenderAddress}`;
  }
  if (input.lenderKind === "ira") {
    return `${input.custodianName}, solely in its capacity as custodian for the benefit of ${input.lenderName}, and not in its individual capacity, with a mailing address at ${input.lenderAddress}`;
  }
  return `an individual residing at ${input.lenderAddress}`;
}

function validateCommonInput(input: SigningPacketInput): string | null {
  if (input.lenderKind === "entity" && (!input.entityStateOrCountry || !input.entityType)) {
    return "entityStateOrCountry and entityType are required when lenderKind is entity";
  }
  if (input.lenderKind === "ira" && (!input.custodianName || !input.custodianAccountNumber)) {
    return "custodianName and custodianAccountNumber are required when lenderKind is ira";
  }
  if ((input.lenderKind === "entity" || input.lenderKind === "ira") && !input.signatoryNameAndTitle) {
    return "signatoryNameAndTitle is required when lenderKind is entity or ira";
  }
  if (!NOTE_TERMS.some((t) => t.months === input.termMonths)) {
    return `No rate schedule entry for ${input.termMonths} months`;
  }
  return null;
}

// Fields common to every document.
function baseFields(input: SigningPacketInput): FieldSheetEntry[] {
  return [
    { id: "lender_name", label: "Lender / Investor name", value: input.lenderName },
    { id: "lender_address", label: "Lender / Investor address", value: input.lenderAddress },
    { id: "principal_amount", label: "Principal amount", value: input.principalAmount },
    { id: "effective_date", label: "Effective date", value: input.effectiveDate },
  ];
}

// Call when staff accepts a subscription. Returns the field sheets for the
// Subscription Agreement and the Pledge Agreement - one per document, both
// meant to be added to the SAME Dropbox Sign send via "Add template" (see
// header comment above). Does NOT include the Note; see buildNoteFieldSheet.
export function buildAcceptanceFieldSheets(input: SigningPacketInput): FieldSheetResult {
  const inputError = validateCommonInput(input);
  if (inputError) return { ok: false, reason: inputError };

  const company: FieldSheetSigner = {
    role: "Company",
    name: input.companySignatoryName ?? "",
    email: input.companySignatoryEmail ?? "",
  };
  const investor: FieldSheetSigner = { role: "Investor", name: input.lenderName, email: input.lenderEmail };

  // The Subscription Agreement's Section 3 has three investor-type variants
  // (Individual/Entity/IRA) sharing one template - only one variant applies
  // per investor, but the other two still print in every signed copy (see
  // FIELD-MAP.md, "Layout fixes" / the N/A convention). So every field below
  // is investor-type-scoped: it gets the real value when it matches the
  // current investor's type, and "N/A" otherwise - never left blank, and
  // never sharing a Dropbox Sign field ID with a same-named field from a
  // different variant (that would fill both from one typed value). Not built
  // from baseFields() like the Note/Pledge: this document has no single
  // generic "lender_name" or "lender_address" spot, and no {{effective_date}}
  // field at all (its dates are all per-signature "Date Signed" fields).
  const NA = "N/A";
  const subscriptionFields: FieldSheetEntry[] = [
    { id: "principal_amount", label: "Principal amount", value: input.principalAmount },
    { id: "term_months", label: "Confirmed term (months)", value: String(input.termMonths) },
    {
      id: "lender_name_individual",
      label: "Full legal name (3.A Individual) / Print name (Individual signature block)",
      value: input.lenderKind === "individual" ? input.lenderName : NA,
    },
    {
      id: "lender_address_individual",
      label: "Residential address (3.A Individual)",
      value: input.lenderKind === "individual" ? input.lenderAddress : NA,
    },
    {
      id: "joint_subscriber_name",
      label: "Joint subscriber name, if any (3.A Individual) - leave blank if none, not N/A",
      value: input.lenderKind === "individual" ? (input.jointSubscriberName ?? "") : NA,
    },
    {
      id: "lender_name_entity",
      label: "Entity legal name (3.B Entity) / Entity name (Entity signature block)",
      value: input.lenderKind === "entity" ? input.lenderName : NA,
    },
    {
      id: "entity_state_or_country",
      label: "Entity state or country of formation (3.B Entity)",
      value: input.lenderKind === "entity" ? (input.entityStateOrCountry ?? "") : NA,
    },
    {
      id: "entity_type",
      label: "Entity type (3.B Entity)",
      value: input.lenderKind === "entity" ? (input.entityType ?? "") : NA,
    },
    {
      id: "lender_address_entity",
      label: "Principal place of business (3.B Entity)",
      value: input.lenderKind === "entity" ? input.lenderAddress : NA,
    },
    {
      id: "signatory_name_and_title_entity",
      label: "Signatory name and title (Entity signature block)",
      value: input.lenderKind === "entity" ? (input.signatoryNameAndTitle ?? "") : NA,
    },
    {
      id: "custodian_name",
      label: "Custodian name (3.C IRA) / Custodian name (IRA signature block)",
      value: input.lenderKind === "ira" ? (input.custodianName ?? "") : NA,
    },
    {
      id: "custodian_account_number",
      label: "Custodian account number (3.C IRA)",
      value: input.lenderKind === "ira" ? (input.custodianAccountNumber ?? "") : NA,
    },
    {
      id: "lender_name_ira",
      label: "Name of account owner (3.C IRA) / For the account of (IRA signature block)",
      value: input.lenderKind === "ira" ? input.lenderName : NA,
    },
    {
      id: "signatory_name_and_title_ira",
      label: "Signatory name and title (IRA signature block)",
      value: input.lenderKind === "ira" ? (input.signatoryNameAndTitle ?? "") : NA,
    },
  ];

  const pledgeFields: FieldSheetEntry[] = [
    ...baseFields(input),
    // The value is the investor's office or residence, wrapped in whatever
    // legal capacity phrasing their investor type calls for. Renamed from
    // secured_party_capacity_clause on 2026-08-21 to match the field name in
    // the Dropbox Sign template, which was renamed there first.
    {
      id: "office_or_residence_location",
      label: "Office or residence location",
      value: capacityClause(input),
    },
  ];

  return {
    ok: true,
    sheets: [
      {
        documentLabel: "Subscription Agreement",
        templateFile: "SPM-Subscription-Agreement-TEMPLATE.docx",
        signers: [investor, company],
        fields: subscriptionFields,
      },
      {
        documentLabel: "Membership Interest Pledge Agreement",
        templateFile: "SPM-Membership-Interest-Pledge-Agreement-TEMPLATE.docx",
        signers: [investor, company],
        fields: pledgeFields,
      },
    ],
  };
}

// Call ONLY after staff has confirmed the investor's wire has actually
// cleared. Returns the field sheet for the Note alone - company-signer-only,
// since the Note is never signed by the investor (see FIELD-MAP.md).
export function buildNoteFieldSheet(input: SigningPacketInput): FieldSheetResult {
  const inputError = validateCommonInput(input);
  if (inputError) return { ok: false, reason: inputError };
  const term = NOTE_TERMS.find((t) => t.months === input.termMonths)!;

  const company: FieldSheetSigner = {
    role: "Company",
    name: input.companySignatoryName ?? "",
    email: input.companySignatoryEmail ?? "",
  };

  const fields: FieldSheetEntry[] = [
    ...baseFields(input),
    { id: "lender_email", label: "Lender / Investor email", value: input.lenderEmail },
    // The Note's own text already has a literal "%" immediately after each
    // of these fields ("...rate of {{annual_rate}}% per annum..."), so the
    // value entered here must NOT include "%" itself or the document would
    // read "8.30%%". term.annual/term.monthly (from app/lib/rates.ts)
    // include "%" for on-site display, so it's stripped here specifically
    // for this document.
    { id: "annual_rate", label: "Annual rate (no % sign)", value: term.annual.replace("%", "") },
    { id: "monthly_rate", label: "Monthly rate (no % sign)", value: term.monthly.replace("%", "") },
    { id: "maturity_date", label: "Maturity date", value: input.maturityDate },
  ];

  return {
    ok: true,
    sheets: [
      {
        documentLabel: "Secured Promissory Note",
        templateFile: "SPM-Secured-Promissory-Note-TEMPLATE.docx",
        signers: [company],
        fields,
      },
    ],
  };
}
