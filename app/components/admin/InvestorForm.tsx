"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NOTE_TERMS } from "../../lib/rates";
import type { InvestorKind, ManualInvestorStage, SpcContactOption } from "../../lib/airtable";

/** Adds `months` calendar months to an ISO date (yyyy-mm-dd), returned the same way. */
function addMonthsIso(isoDate: string, months: number): string {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

// One form, two modes. "create" posts a new investor; "edit" patches an
// existing one. They are deliberately the same component rather than two
// near-identical screens: the fields, validation, and copy are the same, and
// the only real difference is where the values start and which verb the
// submit button uses.
//
// This form captures who the investor is and the loan's own record-keeping
// detail (dates, rate, tax and wire info). The signing packet's own effective
// date is a separate thing: it's whatever date the documents actually get
// signed on, entered fresh at the prepare step rather than read from here.

const inputClass =
  "w-full rounded-md border-[1.5px] border-neutral-border bg-neutral-white px-4 py-3 text-[15px] text-neutral-ink transition-colors duration-150 ease-out-soft placeholder:text-neutral-mist focus:border-institutional-navy focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-steel-teal";
const labelClass = "block text-[13px] font-semibold text-neutral-slate";
const hintClass = "text-[12.5px] leading-relaxed text-neutral-mist";

export type InvestorFormValues = {
  investorKind: InvestorKind;
  name: string;
  email: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  entityStateOrCountry: string;
  entityType: string;
  custodianName: string;
  custodianAccountNumber: string;
  signatoryNameAndTitle: string;
  jointSubscriberName: string;
  stage: ManualInvestorStage;
  principalAmount: string;
  termMonths: string; // "" means no preference recorded yet
  staffNote: string;
  spcContactId: string; // "" means the default owner
  // "" means no admin input, in which case the write defaults to "SPM Lender".
  contactType: string;
  taxNumberType: "" | "ssn" | "ein";
  taxNumber: string;
  profitDistribution: "" | "distribute" | "reinvest";
  originationDate: string; // "" or yyyy-mm-dd
  maturityDate: string; // "" or yyyy-mm-dd, auto-computed from originationDate + term unless edited
  currentMaturityDate: string; // "" or yyyy-mm-dd, auto-mirrors maturityDate unless edited
  interestRate: string; // "" or a percent like "8.30", auto-filled from the selected term unless edited
  wireBankAccountNumber: string;
};

export const EMPTY_INVESTOR: InvestorFormValues = {
  investorKind: "individual",
  name: "",
  email: "",
  phone: "",
  streetAddress: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  entityStateOrCountry: "",
  entityType: "",
  custodianName: "",
  custodianAccountNumber: "",
  signatoryNameAndTitle: "",
  jointSubscriberName: "",
  stage: "interested",
  principalAmount: "",
  termMonths: "",
  staffNote: "",
  spcContactId: "",
  contactType: "",
  taxNumberType: "",
  taxNumber: "",
  profitDistribution: "",
  originationDate: "",
  maturityDate: "",
  currentMaturityDate: "",
  interestRate: "",
  wireBankAccountNumber: "",
};

// Every stage is settable, in either direction. The pipeline sets these
// automatically as an investor moves through it; this is how you correct one
// that landed in the wrong place.
export const STAGE_OPTIONS: { value: ManualInvestorStage; label: string; hint: string }[] = [
  {
    value: "interested",
    label: "Interested",
    hint: "Has asked about the offering but has not committed to an amount.",
  },
  {
    value: "committed",
    label: "Committed",
    hint: "Has agreed to an amount and term, and is awaiting your review.",
  },
  {
    value: "accepted",
    label: "Accepted",
    hint: "You have accepted their subscription. Their documents still need preparing and sending.",
  },
  {
    value: "funded",
    label: "Funded",
    hint: "Their wire has cleared and the Note has been issued.",
  },
  {
    value: "declined",
    label: "Declined",
    hint: "You turned the subscription down. Setting this here does not email them.",
  },
];

function Fieldset({
  legend,
  hint,
  children,
}: {
  legend: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-t border-neutral-border pt-5">
      <legend className="pr-3 text-[12px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
        {legend}
      </legend>
      {hint && <p className={`mb-4 ${hintClass}`}>{hint}</p>}
      <div className="space-y-5">{children}</div>
    </fieldset>
  );
}

export function InvestorForm({
  mode,
  recordId,
  initial,
  owners = [],
  defaultOwnerName,
  hasTaxNumberOnFile = false,
  hasWireBankAccountOnFile = false,
}: {
  mode: "create" | "edit";
  recordId?: string;
  initial?: Partial<InvestorFormValues>;
  // The people a prospect can be assigned to, read live from the CRM. Empty
  // when Airtable isn't reachable, in which case the picker is hidden and the
  // write falls back to the default owner.
  owners?: SpcContactOption[];
  defaultOwnerName?: string;
  // Whether a tax number / wire account is already saved on this record. The
  // actual value is never sent to the client (see AdminContact in
  // lib/airtable.ts), so this is display-only: it lets the form say "one is on
  // file" without ever putting the real number in the page.
  hasTaxNumberOnFile?: boolean;
  hasWireBankAccountOnFile?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<InvestorFormValues>({ ...EMPTY_INVESTOR, ...initial });
  const [saving, setSaving] = useState<null | "save" | "prepare">(null);
  const [error, setError] = useState<string | null>(null);
  // Mirrors the drawer's delete UX (AdminDashboard.tsx) so the same action
  // behaves the same way everywhere it appears, rather than drifting.
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Interest rate and both maturity dates auto-fill from the term/origination
  // date the staff member picks, but only until they type into that field
  // themselves - after that their value wins even if the term changes again.
  // Loading an existing record with a value already saved counts as "touched"
  // too, so opening an edit page never overwrites what's already on file.
  const [rateTouched, setRateTouched] = useState(Boolean(initial?.interestRate));
  const [maturityTouched, setMaturityTouched] = useState(Boolean(initial?.maturityDate));
  const [currentMaturityTouched, setCurrentMaturityTouched] = useState(
    Boolean(initial?.currentMaturityDate),
  );

  function update<K extends keyof InvestorFormValues>(key: K, value: InvestorFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateTermMonths(value: string) {
    setForm((prev) => {
      const next = { ...prev, termMonths: value };
      const months = value ? Number(value) : undefined;
      const term = months ? NOTE_TERMS.find((t) => t.months === months) : undefined;
      if (term && !rateTouched) next.interestRate = String(term.annualValue);
      if (term && prev.originationDate && !maturityTouched) {
        next.maturityDate = addMonthsIso(prev.originationDate, term.months);
        if (!currentMaturityTouched) next.currentMaturityDate = next.maturityDate;
      }
      return next;
    });
  }

  function updateOriginationDate(value: string) {
    setForm((prev) => {
      const next = { ...prev, originationDate: value };
      const months = prev.termMonths ? Number(prev.termMonths) : undefined;
      if (value && months && !maturityTouched) {
        next.maturityDate = addMonthsIso(value, months);
        if (!currentMaturityTouched) next.currentMaturityDate = next.maturityDate;
      }
      return next;
    });
  }

  function updateMaturityDate(value: string) {
    setMaturityTouched(true);
    setForm((prev) => {
      const next = { ...prev, maturityDate: value };
      if (!currentMaturityTouched) next.currentMaturityDate = value;
      return next;
    });
  }

  function validate(): string | null {
    if (!form.name.trim()) {
      return form.investorKind === "entity"
        ? "Enter the entity's legal name."
        : form.investorKind === "ira"
          ? "Enter the account owner's full legal name."
          : "Enter the investor's full legal name.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Enter a valid email address.";
    }
    if (form.investorKind === "entity" && !form.entityStateOrCountry.trim() && !form.entityType.trim()) {
      // Not required this early - entity detail is only mandatory at the
      // prepare step - so this is a nudge, not a blocker.
      return null;
    }
    return null;
  }

  async function submit(then: "save" | "prepare") {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(then);
    try {
      const res = await fetch(
        mode === "edit" ? `/api/admin/investors/${recordId}` : "/api/admin/investors",
        {
          method: mode === "edit" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            termMonths: form.termMonths ? Number(form.termMonths) : undefined,
            interestRate: form.interestRate ? Number(form.interestRate) : undefined,
          }),
        },
      );
      const data = (await res.json().catch(() => null)) as { error?: string; id?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? "Could not save this investor.");
        setSaving(null);
        return;
      }
      const id = data?.id ?? recordId;
      // router.refresh() clears the cached dashboard so the new or edited
      // record is there when we land back on it.
      router.refresh();
      router.push(then === "prepare" && id ? `/admin/investors/${id}/prepare` : "/admin");
    } catch {
      setError("Could not reach the server.");
      setSaving(null);
    }
  }

  async function handleDelete() {
    if (!recordId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/investors/${recordId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setDeleteError(data?.error ?? "Could not delete this record.");
        setDeleting(false);
        return;
      }
      router.refresh();
      router.push("/admin");
    } catch {
      setDeleteError("Could not reach the server.");
      setDeleting(false);
    }
  }

  const nameLabel =
    form.investorKind === "entity"
      ? "Entity legal name"
      : form.investorKind === "ira"
        ? "Account owner full legal name"
        : "Full legal name";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit("save");
      }}
      className="space-y-6 rounded-lg border border-neutral-border bg-neutral-white p-6 sm:p-8"
    >
      <div className="space-y-3">
        <p className={labelClass}>Investor type</p>
        <div className="flex gap-3">
          {(["individual", "entity", "ira"] as const).map((kind) => (
            <label
              key={kind}
              className={`flex-1 cursor-pointer rounded-md border-[1.5px] px-4 py-2.5 text-center text-[14px] font-medium transition-colors duration-150 ease-out-soft ${
                form.investorKind === kind
                  ? "border-institutional-navy bg-navy-tint text-institutional-navy"
                  : "border-neutral-border text-neutral-slate hover:border-steel-teal"
              }`}
            >
              <input
                type="radio"
                name="investorKind"
                value={kind}
                checked={form.investorKind === kind}
                onChange={() => update("investorKind", kind)}
                className="sr-only"
              />
              {kind === "individual" ? "Individual" : kind === "entity" ? "Entity" : "IRA"}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="name" className={labelClass}>
            {nameLabel}
          </label>
          <input
            id="name"
            className={inputClass}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            className={inputClass}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
          {mode === "create" && (
            <p className={hintClass}>
              If this email already has a record, that record is updated rather than duplicated.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="phone" className={labelClass}>
            Phone <span className="font-normal text-neutral-mist">(optional)</span>
          </label>
          <input
            id="phone"
            className={inputClass}
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>
      </div>

      {/* Five columns rather than one free-text line, matching the Contact
          table. Airtable's "Full Address (Investor)" is a formula over these,
          so it fills itself in once these are saved. */}
      <Fieldset
        legend={form.investorKind === "entity" ? "Principal place of business" : "Address"}
        hint="Optional at this stage. Needed before documents can be prepared."
      >
        <div className="space-y-1.5">
          <label htmlFor="streetAddress" className={labelClass}>
            Street address
          </label>
          <input
            id="streetAddress"
            className={inputClass}
            autoComplete="street-address"
            value={form.streetAddress}
            onChange={(e) => update("streetAddress", e.target.value)}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="city" className={labelClass}>
              City
            </label>
            <input
              id="city"
              className={inputClass}
              autoComplete="address-level2"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="state" className={labelClass}>
              State
            </label>
            <input
              id="state"
              className={inputClass}
              autoComplete="address-level1"
              value={form.state}
              onChange={(e) => update("state", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="zip" className={labelClass}>
              ZIP
            </label>
            <input
              id="zip"
              className={inputClass}
              autoComplete="postal-code"
              value={form.zip}
              onChange={(e) => update("zip", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="country" className={labelClass}>
              Country
            </label>
            <input
              id="country"
              className={inputClass}
              autoComplete="country-name"
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
            />
          </div>
        </div>
      </Fieldset>

      {form.investorKind === "individual" && (
        <div className="space-y-1.5">
          <label htmlFor="jointSubscriberName" className={labelClass}>
            Joint subscriber name <span className="font-normal text-neutral-mist">(optional)</span>
          </label>
          <input
            id="jointSubscriberName"
            className={inputClass}
            placeholder="If subscribing jointly with a spouse or spousal equivalent"
            value={form.jointSubscriberName}
            onChange={(e) => update("jointSubscriberName", e.target.value)}
          />
        </div>
      )}

      {form.investorKind === "entity" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="entityStateOrCountry" className={labelClass}>
              State or country of formation
            </label>
            <input
              id="entityStateOrCountry"
              className={inputClass}
              placeholder="Delaware"
              value={form.entityStateOrCountry}
              onChange={(e) => update("entityStateOrCountry", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="entityType" className={labelClass}>
              Entity type
            </label>
            <input
              id="entityType"
              className={inputClass}
              placeholder="limited liability company"
              value={form.entityType}
              onChange={(e) => update("entityType", e.target.value)}
            />
          </div>
        </div>
      )}

      {form.investorKind === "ira" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="custodianName" className={labelClass}>
              Custodian name
            </label>
            <input
              id="custodianName"
              className={inputClass}
              placeholder="e.g. Equity Trust Company"
              value={form.custodianName}
              onChange={(e) => update("custodianName", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="custodianAccountNumber" className={labelClass}>
              Custodian account number
            </label>
            <input
              id="custodianAccountNumber"
              className={inputClass}
              value={form.custodianAccountNumber}
              onChange={(e) => update("custodianAccountNumber", e.target.value)}
            />
          </div>
        </div>
      )}

      {form.investorKind !== "individual" && (
        <div className="space-y-1.5">
          <label htmlFor="signatoryNameAndTitle" className={labelClass}>
            Signatory name and title{" "}
            <span className="font-normal text-neutral-mist">(optional for now)</span>
          </label>
          <input
            id="signatoryNameAndTitle"
            className={inputClass}
            placeholder="e.g. Jane Doe, Managing Member"
            value={form.signatoryNameAndTitle}
            onChange={(e) => update("signatoryNameAndTitle", e.target.value)}
          />
          <p className={hintClass}>
            Whoever signs on behalf of the {form.investorKind === "entity" ? "entity" : "custodian"}.
            Required before their documents can be prepared, but you can add it later.
          </p>
        </div>
      )}

      <Fieldset
        legend="Where they are"
        hint="You can move them along later; nothing here sends anything to the investor."
      >
        {owners.length > 0 && (
          <div className="space-y-1.5">
            <label htmlFor="spcContactId" className={labelClass}>
              Whose prospect is this?
            </label>
            <select
              id="spcContactId"
              className={inputClass}
              value={form.spcContactId}
              onChange={(e) => update("spcContactId", e.target.value)}
            >
              <option value="">
                {defaultOwnerName ? `${defaultOwnerName} (default)` : "Default owner"}
              </option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </select>
            <p className={hintClass}>
              Files them under this person in the CRM. Leads that come in through the website are
              always filed under {defaultOwnerName ?? "the default owner"}.
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="contactType" className={labelClass}>
            Contact type
          </label>
          <select
            id="contactType"
            className={inputClass}
            value={form.contactType}
            onChange={(e) => update("contactType", e.target.value)}
          >
            <option value="">SPM Lender (default when left blank)</option>
            <option value="SPM Lender">SPM Lender</option>
            <option value="Prospective Investor">Prospective Investor</option>
          </select>
          <p className={hintClass}>
            What this person is to the firm in the CRM. Leave blank to file them as an SPM Lender.
          </p>
        </div>

        <div className="space-y-2">
          {STAGE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer gap-3 rounded-md border-[1.5px] px-4 py-3 transition-colors duration-150 ease-out-soft ${
                form.stage === option.value
                  ? "border-institutional-navy bg-navy-tint"
                  : "border-neutral-border hover:border-steel-teal"
              }`}
            >
              <input
                type="radio"
                name="stage"
                value={option.value}
                checked={form.stage === option.value}
                onChange={() => update("stage", option.value)}
                className="mt-1 h-4 w-4 shrink-0 accent-institutional-navy"
              />
              <span>
                <span className="block text-[14px] font-semibold text-institutional-navy">
                  {option.label}
                </span>
                <span className={`block ${hintClass}`}>{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </Fieldset>

      <Fieldset
        legend="Investment"
        hint="Optional at this stage. The exact amount and term are confirmed when you prepare their documents."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="principalAmount" className={labelClass}>
              Amount
            </label>
            <input
              id="principalAmount"
              className={inputClass}
              placeholder="$500,000"
              value={form.principalAmount}
              onChange={(e) => update("principalAmount", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="termMonths" className={labelClass}>
              Term
            </label>
            <select
              id="termMonths"
              className={inputClass}
              value={form.termMonths}
              onChange={(e) => updateTermMonths(e.target.value)}
            >
              <option value="">No preference recorded</option>
              {NOTE_TERMS.map((t) => (
                <option key={t.months} value={String(t.months)}>
                  {t.full} at {t.annual}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className={labelClass}>Profit distribution</legend>
          <div className="flex gap-3">
            {(
              [
                ["distribute", "Quarterly cash distribution"],
                ["reinvest", "Reinvest for principal appreciation"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`flex-1 cursor-pointer rounded-md border-[1.5px] px-4 py-2.5 text-center text-[13.5px] font-medium transition-colors duration-150 ease-out-soft ${
                  form.profitDistribution === value
                    ? "border-institutional-navy bg-navy-tint text-institutional-navy"
                    : "border-neutral-border text-neutral-slate hover:border-steel-teal"
                }`}
              >
                <input
                  type="radio"
                  name="profitDistribution"
                  value={value}
                  checked={form.profitDistribution === value}
                  onChange={() => update("profitDistribution", value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
          <p className={hintClass}>Leave unset until the investor has confirmed an election.</p>
        </fieldset>

        <div className="space-y-1.5">
          <label htmlFor="staffNote" className={labelClass}>
            Note <span className="font-normal text-neutral-mist">(optional)</span>
          </label>
          <textarea
            id="staffNote"
            rows={2}
            className={inputClass}
            placeholder="How you met, who referred them, anything worth remembering."
            value={form.staffNote}
            onChange={(e) => update("staffNote", e.target.value)}
          />
        </div>
      </Fieldset>

      <Fieldset
        legend="Loan dates & rate"
        hint="Maturity date fills itself in from the origination date and term. Edit it directly if this loan was rolled or extended - current maturity date is the one to move then, so the original schedule in maturity date stays on record."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="originationDate" className={labelClass}>
              Origination date
            </label>
            <input
              id="originationDate"
              type="date"
              className={inputClass}
              value={form.originationDate}
              onChange={(e) => updateOriginationDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="interestRate" className={labelClass}>
              Interest rate <span className="font-normal text-neutral-mist">(%)</span>
            </label>
            <input
              id="interestRate"
              type="number"
              step="0.01"
              className={inputClass}
              placeholder="8.30"
              value={form.interestRate}
              onChange={(e) => {
                setRateTouched(true);
                update("interestRate", e.target.value);
              }}
            />
            <p className={hintClass}>Auto-filled from the selected term. Override for a negotiated rate.</p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="maturityDate" className={labelClass}>
              Maturity date
            </label>
            <input
              id="maturityDate"
              type="date"
              className={inputClass}
              value={form.maturityDate}
              onChange={(e) => updateMaturityDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="currentMaturityDate" className={labelClass}>
              Current maturity date
            </label>
            <input
              id="currentMaturityDate"
              type="date"
              className={inputClass}
              value={form.currentMaturityDate}
              onChange={(e) => {
                setCurrentMaturityTouched(true);
                update("currentMaturityDate", e.target.value);
              }}
            />
          </div>
        </div>
      </Fieldset>

      <Fieldset legend="Tax & wire information">
        <fieldset className="space-y-2">
          <legend className={labelClass}>Tax number type</legend>
          <div className="flex gap-3">
            {(
              [
                ["ssn", "SSN"],
                ["ein", "EIN"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`flex-1 cursor-pointer rounded-md border-[1.5px] px-4 py-2.5 text-center text-[13.5px] font-medium transition-colors duration-150 ease-out-soft ${
                  form.taxNumberType === value
                    ? "border-institutional-navy bg-navy-tint text-institutional-navy"
                    : "border-neutral-border text-neutral-slate hover:border-steel-teal"
                }`}
              >
                <input
                  type="radio"
                  name="taxNumberType"
                  value={value}
                  checked={form.taxNumberType === value}
                  onChange={() => update("taxNumberType", value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <label htmlFor="taxNumber" className={labelClass}>
            SSN or EIN
          </label>
          <input
            id="taxNumber"
            type="password"
            autoComplete="off"
            className={inputClass}
            placeholder={hasTaxNumberOnFile ? "•••••••••  (on file - enter a new one to replace it)" : ""}
            value={form.taxNumber}
            onChange={(e) => update("taxNumber", e.target.value)}
          />
          <p className={hintClass}>
            {hasTaxNumberOnFile
              ? "A tax number is already on file for this record. It is never displayed here - leave this blank to keep it, or enter a new one to replace it."
              : "Stored in the CRM record to prepare year-end tax documents. Never shown here once saved."}
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="wireBankAccountNumber" className={labelClass}>
            Wire bank account number
          </label>
          <input
            id="wireBankAccountNumber"
            type="password"
            autoComplete="off"
            className={inputClass}
            placeholder={
              hasWireBankAccountOnFile ? "•••••••••  (on file - enter a new one to replace it)" : ""
            }
            value={form.wireBankAccountNumber}
            onChange={(e) => update("wireBankAccountNumber", e.target.value)}
          />
          {hasWireBankAccountOnFile && (
            <p className={hintClass}>
              An account number is already on file. Leave this blank to keep it, or enter a new one to
              replace it.
            </p>
          )}
        </div>
      </Fieldset>

      {error && (
        <p className="text-[13px] text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4 border-t border-neutral-border pt-5">
        <button
          type="submit"
          disabled={saving !== null}
          className="inline-flex items-center rounded-md bg-institutional-navy px-7 py-3 text-[15px] font-semibold text-white transition-[background-color,transform] duration-150 ease-out-soft hover:bg-navy-deep active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving === "save" ? "Saving…" : mode === "edit" ? "Save changes" : "Add investor"}
        </button>
        <button
          type="button"
          onClick={() => submit("prepare")}
          disabled={saving !== null}
          className="inline-flex items-center rounded-md border-[1.5px] border-institutional-navy px-6 py-2.5 text-[14px] font-semibold text-institutional-navy transition-colors duration-150 ease-out-soft hover:bg-navy-tint disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving === "prepare" ? "Saving…" : "Save and prepare documents"}
        </button>
        <Link
          href={mode === "edit" && recordId ? "/admin" : "/admin"}
          className="text-[14px] font-semibold text-neutral-slate transition-colors hover:text-institutional-navy"
        >
          Cancel
        </Link>
      </div>

      {mode === "edit" && recordId && (
        <div className="border-t border-neutral-border pt-5">
          {confirmingDelete ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-center">
              <p className="text-[13px] text-red-800">
                Permanently delete this investor and their Airtable record? This can&apos;t be undone.
              </p>
              {deleteError && <p className="mt-1.5 text-[12.5px] text-red-700">{deleteError}</p>}
              <div className="mt-2.5 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                  className="text-[13px] font-semibold text-neutral-slate hover:text-institutional-navy disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-[13px] font-semibold text-red-700 hover:text-red-900 disabled:opacity-60"
                >
                  {deleting ? "Deleting…" : "Confirm delete"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="text-center text-[12.5px] font-medium text-neutral-mist transition-colors hover:text-red-700"
            >
              Delete this investor
            </button>
          )}
        </div>
      )}
    </form>
  );
}
