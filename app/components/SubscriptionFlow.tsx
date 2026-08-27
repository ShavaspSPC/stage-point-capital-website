"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { NOTE_TERMS } from "../lib/rates";
import { COUNTRIES, US_STATES } from "../lib/addressData";
import { StepIndicator, type FlowStep } from "./StepIndicator";

// NOTE FOR COUNSEL (Moss & Moss): this form collects the informational content
// of the Subscription Agreement (see document-templates/SPM-Subscription-
// Agreement-DRAFT.docx) but is not itself a signed legal instrument. Submitting
// it does not bind SPM or the investor; actual execution happens on the Note,
// Pledge Agreement, and Subscription Agreement via the signing packet. Language
// below must be reviewed and approved before launch.

type InvestorKind = "individual" | "entity" | "ira";

// Matches RequestAccessFlow.tsx's SUBSCRIBE_PREFILL_KEY — the write side of
// this same-tab, session-only handoff.
const PREFILL_KEY = "spm-subscribe-prefill";

type PrefillData = Partial<{
  investorKind: InvestorKind;
  lenderName: string;
  lenderEmail: string;
  lenderPhone: string;
  custodianName: string;
  accreditationCategories: string[];
  nonFinancingAcknowledged: boolean;
  termMonths: number;
}>;

const ACCREDITATION_OPTIONS = [
  { value: "net-worth", label: "Net Worth Test: individual net worth, or joint net worth with spouse or spousal equivalent, exceeds $1,000,000, excluding the value of the primary residence." },
  { value: "income", label: "Income Test: individual income exceeded $200,000 (or joint income with spouse or spousal equivalent exceeded $300,000) in each of the past two years, with a reasonable expectation of the same this year." },
  { value: "professional", label: "Professional Certification: holds in good standing a Series 7, Series 65, or Series 82 license, or other SEC-designated qualifying credential." },
  { value: "entity-assets", label: "Entity Test: an entity not formed for the specific purpose of acquiring the Note, with total assets exceeding $5,000,000." },
  { value: "all-equity-accredited", label: "All-Equity-Owner Test: an entity in which all equity owners are themselves Accredited Investors." },
  { value: "qualified-purchaser", label: "Qualified Purchaser, as defined in Section 2(a)(51)(A) of the Investment Company Act of 1940." },
  { value: "institutional", label: "Institutional Investor: a bank, insurance company, registered investment company, business development company, or similar institutional entity." },
];

const STEPS: FlowStep[] = [
  { n: 1, label: "Investor details" },
  { n: 2, label: "Eligibility" },
  { n: 3, label: "Investment" },
];

const inputClass =
  "w-full rounded-md border-[1.5px] border-neutral-border bg-neutral-white px-4 py-3 text-[15px] text-neutral-ink transition-colors duration-150 ease-out-soft placeholder:text-neutral-mist focus:border-institutional-navy focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-steel-teal";
const labelClass = "block text-[13px] font-semibold text-neutral-slate";

type FormState = {
  investorKind: InvestorKind;
  lenderName: string;
  lenderEmail: string;
  lenderPhone: string;
  addressLine1: string;
  addressLine2: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  addressCountry: string;
  entityStateOrCountry: string;
  entityType: string;
  custodianName: string;
  custodianAccountNumber: string;
  signatoryNameAndTitle: string;
  jointSubscriberName: string;
  accreditationCategories: string[];
  nonFinancingAcknowledged: boolean;
  principalAmount: string;
  termMonths: number;
  distributionElection: "distribute" | "reinvest" | "";
  restrictedSecuritiesAcknowledged: boolean;
  reviewedMemorandumAcknowledged: boolean;
};

const INITIAL: FormState = {
  investorKind: "individual",
  lenderName: "",
  lenderEmail: "",
  lenderPhone: "",
  addressLine1: "",
  addressLine2: "",
  addressCity: "",
  addressState: "",
  addressZip: "",
  addressCountry: "United States",
  entityStateOrCountry: "",
  entityType: "",
  custodianName: "",
  custodianAccountNumber: "",
  signatoryNameAndTitle: "",
  jointSubscriberName: "",
  accreditationCategories: [],
  nonFinancingAcknowledged: false,
  principalAmount: "",
  termMonths: NOTE_TERMS[3].months,
  distributionElection: "",
  restrictedSecuritiesAcknowledged: false,
  reviewedMemorandumAcknowledged: false,
};

type Step = 1 | 2 | 3 | "success";

export function SubscriptionFlow() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  // Whether to show the full checklist on step 2 instead of the compact
  // pre-filled summary. Starts false; flips true if the investor asks to
  // change what they already told us in /request-access.
  const [editingCategories, setEditingCategories] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  // One-time read of details carried over from a completed /request-access
  // submission, if the investor arrived via its "Continue to subscribe" link
  // in this same tab/session. Cleared immediately so a later, unrelated visit
  // never inherits stale data.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PREFILL_KEY);
      if (!raw) return;
      sessionStorage.removeItem(PREFILL_KEY);
      const prefill = JSON.parse(raw) as PrefillData;
      setForm((prev) => ({
        ...prev,
        ...(prefill.investorKind ? { investorKind: prefill.investorKind } : {}),
        ...(prefill.lenderName ? { lenderName: prefill.lenderName } : {}),
        ...(prefill.lenderEmail ? { lenderEmail: prefill.lenderEmail } : {}),
        ...(prefill.lenderPhone ? { lenderPhone: prefill.lenderPhone } : {}),
        ...(prefill.custodianName ? { custodianName: prefill.custodianName } : {}),
        ...(prefill.accreditationCategories?.length
          ? { accreditationCategories: prefill.accreditationCategories }
          : {}),
        ...(typeof prefill.nonFinancingAcknowledged === "boolean"
          ? { nonFinancingAcknowledged: prefill.nonFinancingAcknowledged }
          : {}),
        ...(prefill.termMonths ? { termMonths: prefill.termMonths } : {}),
      }));
      setPrefilled(true);
    } catch {
      // Pre-fill is a convenience only; ignore malformed or unavailable storage.
    }
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // The backend and downstream documents (Airtable Notes, the signing
  // packet's capacity clause) still expect a single formatted address
  // string; the structured fields above are a data-entry improvement only,
  // composed here rather than changing that contract.
  function composeAddress(f: FormState): string {
    const stateZip = [f.addressCountry === "United States" ? f.addressState : "", f.addressZip.trim()]
      .filter(Boolean)
      .join(" ");
    return [
      f.addressLine1.trim(),
      f.addressLine2.trim() || undefined,
      f.addressCity.trim(),
      stateZip || undefined,
      f.addressCountry.trim(),
    ]
      .filter(Boolean)
      .join(", ");
  }

  function toggleCategory(value: string) {
    setForm((prev) => ({
      ...prev,
      accreditationCategories: prev.accreditationCategories.includes(value)
        ? prev.accreditationCategories.filter((c) => c !== value)
        : [...prev.accreditationCategories, value],
    }));
  }

  function validateStepOne(): string | null {
    if (!form.lenderName.trim()) {
      return form.investorKind === "entity"
        ? "Please enter the entity's legal name."
        : "Please enter the full legal name.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.lenderEmail.trim())) {
      return "Please enter a valid email address.";
    }
    if (!form.addressLine1.trim()) return "Please enter the first line of the address.";
    if (!form.addressCity.trim()) return "Please enter a city.";
    if (!form.addressCountry.trim()) return "Please select a country.";
    if (form.addressCountry === "United States" && !form.addressState) {
      return "Please select a state.";
    }
    if (!form.addressZip.trim()) return "Please enter a ZIP or postal code.";
    if (form.investorKind === "entity" && (!form.entityStateOrCountry.trim() || !form.entityType.trim())) {
      return "Please provide the entity's state or country of formation and entity type.";
    }
    if (form.investorKind === "ira" && (!form.custodianName.trim() || !form.custodianAccountNumber.trim())) {
      return "Please provide the custodian name and account number.";
    }
    if (
      (form.investorKind === "entity" || form.investorKind === "ira") &&
      !form.signatoryNameAndTitle.trim()
    ) {
      return "Please provide the name and title of the person who will sign on behalf of your entity or custodian.";
    }
    return null;
  }

  function goToStep(n: 1 | 2 | 3) {
    if (n === 2) {
      const err = validateStepOne();
      if (err) {
        setError(err);
        return;
      }
    }
    if (n === 3 && form.accreditationCategories.length === 0) {
      setError("Please select at least one accredited investor category.");
      return;
    }
    if (n === 3 && !form.nonFinancingAcknowledged) {
      setError("Please acknowledge the third-party financing representation.");
      return;
    }
    setError(null);
    setStep(n);
  }

  async function handleSubmit() {
    if (!form.principalAmount.trim()) return setError("Please enter the exact investment amount.");
    if (!form.distributionElection) return setError("Please select a distribution election.");
    if (!form.restrictedSecuritiesAcknowledged) return setError("Please acknowledge the restricted securities notice.");
    if (!form.reviewedMemorandumAcknowledged) return setError("Please acknowledge that you have reviewed the Memorandum.");

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, lenderAddress: composeAddress(form) }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      setStep("success");
    } catch {
      setError("We could not reach the server. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const transition = reduce ? { duration: 0 } : { duration: 0.24, ease: [0.16, 1, 0.3, 1] as const };
  const variants = reduce
    ? {}
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

  const nameLabel =
    form.investorKind === "entity" ? "Entity legal name" : form.investorKind === "ira" ? "Account owner full legal name" : "Full legal name";
  const addressLabel = form.investorKind === "entity" ? "Principal place of business" : "Residential address";

  return (
    <div className="mx-auto w-full max-w-xl">
      {step !== "success" && (
        <div className="mb-8">
          <p className="text-[13px] font-semibold tracking-[0.08em] text-steel-teal-deep uppercase">
            Complete Your Subscription
          </p>
          <h1
            className="mt-3 font-[family-name:var(--font-display)] text-3xl leading-[1.15] font-medium text-institutional-navy md:text-4xl"
            tabIndex={-1}
            ref={step === 1 ? headingRef : undefined}
          >
            {step === 1 ? "Tell us who is investing." : step === 2 ? "Confirm your eligibility." : "Set your investment terms."}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-neutral-slate">
            This information is used to prepare your Subscription Agreement, Secured
            Promissory Note, and Pledge Agreement. It is not itself a signed commitment;
            our team will follow up with the signing documents for execution.
          </p>
          {prefilled && step === 1 && (
            <p className="mt-3 text-[13px] leading-relaxed text-steel-teal-deep">
              We&apos;ve carried over the details from your offering memorandum request — please
              review them below before continuing.
            </p>
          )}
          <StepIndicator steps={STEPS} current={step} reduce={reduce} />
        </div>
      )}

      {/* Not wrapped in AnimatePresence: waiting on an exit animation before
          mounting the next step can leave stale content on screen whenever the
          frame loop is throttled (backgrounded tab, low-power mode). Each step
          is keyed so it remounts and fades in; the previous step unmounts
          immediately rather than waiting to animate out. */}
      <div className="rounded-lg border border-neutral-border bg-neutral-white p-6 sm:p-8">
        <div>
          {step === 1 && (
            <motion.div key="step-1" {...variants} transition={transition} className="space-y-5">
              <div className="space-y-3">
                <p className={labelClass}>Investor type</p>
                <div className="flex gap-2">
                  {([
                    ["individual", "Individual"],
                    ["entity", "Entity"],
                    ["ira", "IRA"],
                  ] as const).map(([kind, label]) => (
                    <label
                      key={kind}
                      className={`flex-1 cursor-pointer rounded-md border-[1.5px] px-3 py-2.5 text-center text-[14px] font-medium transition-colors duration-150 ease-out-soft ${
                        form.investorKind === kind
                          ? "border-institutional-navy bg-navy-tint text-institutional-navy"
                          : "border-neutral-border text-neutral-slate hover:border-steel-teal"
                      }`}
                    >
                      <input type="radio" name="investorKind" value={kind} checked={form.investorKind === kind}
                        onChange={() => update("investorKind", kind)} className="sr-only" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="lenderName" className={labelClass}>{nameLabel}</label>
                <input id="lenderName" className={inputClass} value={form.lenderName}
                  onChange={(e) => update("lenderName", e.target.value)} />
              </div>

              {form.investorKind === "individual" && (
                <div className="space-y-1.5">
                  <label htmlFor="jointSubscriberName" className={labelClass}>
                    Joint subscriber name <span className="font-normal text-neutral-mist">(optional)</span>
                  </label>
                  <input id="jointSubscriberName" className={inputClass}
                    placeholder="If subscribing jointly with a spouse or spousal equivalent"
                    value={form.jointSubscriberName} onChange={(e) => update("jointSubscriberName", e.target.value)} />
                </div>
              )}

              {form.investorKind === "entity" && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="entityStateOrCountry" className={labelClass}>State or country of formation</label>
                    <input id="entityStateOrCountry" className={inputClass} placeholder="Delaware"
                      value={form.entityStateOrCountry} onChange={(e) => update("entityStateOrCountry", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="entityType" className={labelClass}>Entity type</label>
                    <input id="entityType" className={inputClass} placeholder="limited liability company"
                      value={form.entityType} onChange={(e) => update("entityType", e.target.value)} />
                  </div>
                </div>
              )}

              {form.investorKind === "ira" && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="custodianName" className={labelClass}>Custodian name</label>
                    <input id="custodianName" className={inputClass} value={form.custodianName}
                      onChange={(e) => update("custodianName", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="custodianAccountNumber" className={labelClass}>Custodian account number</label>
                    <input id="custodianAccountNumber" className={inputClass} value={form.custodianAccountNumber}
                      onChange={(e) => update("custodianAccountNumber", e.target.value)} />
                  </div>
                </div>
              )}

              {(form.investorKind === "entity" || form.investorKind === "ira") && (
                <div className="space-y-1.5">
                  <label htmlFor="signatoryNameAndTitle" className={labelClass}>Signatory name and title</label>
                  <input id="signatoryNameAndTitle" className={inputClass}
                    placeholder={form.investorKind === "entity" ? "e.g. Jane Doe, Managing Member" : "e.g. Jane Doe, Authorized Signer"}
                    value={form.signatoryNameAndTitle} onChange={(e) => update("signatoryNameAndTitle", e.target.value)} />
                  <p className="text-[12.5px] text-neutral-mist">
                    The person who will sign the Subscription Agreement and Pledge Agreement on
                    behalf of {form.investorKind === "entity" ? "the entity" : "the custodian"}, printed
                    exactly as it should appear on the signature block.
                  </p>
                </div>
              )}

              <div className="space-y-5 rounded-md border border-neutral-border bg-neutral-paper p-4">
                <p className={labelClass}>{addressLabel}</p>

                <div className="space-y-1.5">
                  <label htmlFor="addressCountry" className={labelClass}>Country</label>
                  <select id="addressCountry" className={inputClass} value={form.addressCountry}
                    onChange={(e) => update("addressCountry", e.target.value)}>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="addressLine1" className={labelClass}>Address line 1</label>
                  <input id="addressLine1" className={inputClass} value={form.addressLine1}
                    onChange={(e) => update("addressLine1", e.target.value)} autoComplete="address-line1" />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="addressLine2" className={labelClass}>
                    Address line 2 <span className="font-normal text-neutral-mist">(optional)</span>
                  </label>
                  <input id="addressLine2" className={inputClass} value={form.addressLine2}
                    onChange={(e) => update("addressLine2", e.target.value)} autoComplete="address-line2" />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="addressCity" className={labelClass}>City</label>
                  <input id="addressCity" className={inputClass} value={form.addressCity}
                    onChange={(e) => update("addressCity", e.target.value)} autoComplete="address-level2" />
                </div>

                <div className={`grid gap-5 ${form.addressCountry === "United States" ? "sm:grid-cols-2" : ""}`}>
                  {form.addressCountry === "United States" && (
                    <div className="space-y-1.5">
                      <label htmlFor="addressState" className={labelClass}>State</label>
                      <select id="addressState" className={inputClass} value={form.addressState}
                        onChange={(e) => update("addressState", e.target.value)}>
                        <option value="" disabled>Select a state</option>
                        {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label htmlFor="addressZip" className={labelClass}>ZIP / postal code</label>
                    <input id="addressZip" className={inputClass} value={form.addressZip}
                      onChange={(e) => update("addressZip", e.target.value)} autoComplete="postal-code" />
                  </div>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="lenderEmail" className={labelClass}>Email</label>
                  <input id="lenderEmail" type="email" className={inputClass} value={form.lenderEmail}
                    onChange={(e) => update("lenderEmail", e.target.value)} autoComplete="email" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="lenderPhone" className={labelClass}>
                    Phone <span className="font-normal text-neutral-mist">(optional)</span>
                  </label>
                  <input id="lenderPhone" type="tel" className={inputClass} value={form.lenderPhone}
                    onChange={(e) => update("lenderPhone", e.target.value)} autoComplete="tel" />
                </div>
              </div>

              {error && <p className="text-[13px] text-red-600" role="alert">{error}</p>}

              <div className="flex items-center justify-between pt-2">
                <Link href="/" className="text-[14px] font-semibold text-neutral-slate transition-colors hover:text-institutional-navy">
                  Back to overview
                </Link>
                <button type="button" onClick={() => goToStep(2)}
                  className="inline-flex items-center rounded-md bg-institutional-navy px-7 py-3 text-[15px] font-semibold text-white transition-[background-color,transform] duration-150 ease-out-soft hover:bg-navy-deep active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal">
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step-2" {...variants} transition={transition} className="space-y-6">
              {prefilled && form.accreditationCategories.length > 0 && !editingCategories ? (
                <div className="space-y-3 rounded-md border border-steel-teal bg-steel-teal-tint p-4">
                  <p className={labelClass}>
                    {form.investorKind === "ira"
                      ? "Based on your earlier answers, the account owner certifies:"
                      : "Based on your earlier answers, you certify:"}
                  </p>
                  <ul className="space-y-1.5 text-[14px] leading-relaxed text-neutral-ink">
                    {form.accreditationCategories.map((value) => {
                      const opt = ACCREDITATION_OPTIONS.find((o) => o.value === value);
                      return <li key={value}>• {opt?.label ?? value}</li>;
                    })}
                  </ul>
                  <button type="button" onClick={() => setEditingCategories(true)}
                    className="text-[13px] font-semibold text-institutional-navy underline">
                    This isn&apos;t right — let me choose again
                  </button>
                </div>
              ) : (
                <fieldset className="space-y-3">
                  <legend className={`${labelClass} mb-1`}>
                    {form.investorKind === "ira"
                      ? "The account owner satisfies at least one of the following (check all that apply):"
                      : "I certify that I satisfy at least one of the following (check all that apply):"}
                  </legend>
                  {ACCREDITATION_OPTIONS.map((opt) => {
                    const checked = form.accreditationCategories.includes(opt.value);
                    return (
                      <label key={opt.value}
                        className={`flex cursor-pointer gap-3 rounded-md border p-4 text-[14px] leading-relaxed transition-colors duration-150 ease-out-soft ${
                          checked
                            ? "border-steel-teal bg-steel-teal-tint text-neutral-ink"
                            : "border-neutral-border bg-neutral-white text-neutral-slate hover:border-steel-teal"
                        }`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleCategory(opt.value)}
                          className="mt-1 h-4 w-4 shrink-0 accent-institutional-navy" />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </fieldset>
              )}

              <label className="flex cursor-pointer gap-3 border-t border-neutral-border pt-5 text-[13px] leading-relaxed text-neutral-slate">
                <input type="checkbox" checked={form.nonFinancingAcknowledged}
                  onChange={(e) => update("nonFinancingAcknowledged", e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-institutional-navy" />
                <span>
                  I represent that this investment is not financed in whole or in part by any
                  third party for the specific purpose of making this investment, and I agree to
                  provide additional documentation to verify Accredited Investor status if
                  requested.
                </span>
              </label>

              {error && <p className="text-[13px] text-red-600" role="alert">{error}</p>}

              <div className="flex items-center justify-between pt-1">
                <button type="button" onClick={() => { setError(null); setStep(1); }}
                  className="text-[14px] font-semibold text-neutral-slate transition-colors hover:text-institutional-navy">
                  Back
                </button>
                <button type="button" onClick={() => goToStep(3)}
                  className="inline-flex items-center rounded-md bg-institutional-navy px-7 py-3 text-[15px] font-semibold text-white transition-[background-color,transform] duration-150 ease-out-soft hover:bg-navy-deep active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal">
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step-3" {...variants} transition={transition} className="space-y-6">
              <div className="space-y-1.5">
                <label htmlFor="principalAmount" className={labelClass}>Exact investment amount</label>
                <input id="principalAmount" className={inputClass} placeholder="$500,000"
                  value={form.principalAmount} onChange={(e) => update("principalAmount", e.target.value)} />
                <p className="text-[12.5px] text-neutral-mist">
                  Minimum $200,000 for an individual investor, $1,000,000 for an entity investor.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="termMonths" className={labelClass}>Note term</label>
                <select id="termMonths" className={inputClass} value={form.termMonths}
                  onChange={(e) => update("termMonths", Number(e.target.value))}>
                  {NOTE_TERMS.map((t) => (
                    <option key={t.months} value={t.months}>{t.full} at {t.annual}</option>
                  ))}
                </select>
              </div>

              <fieldset className="space-y-3">
                <legend className={labelClass}>How would you like to receive interest?</legend>
                {([
                  ["distribute", "Quarterly cash distribution"],
                  ["reinvest", "Reinvest for principal appreciation"],
                ] as const).map(([value, label]) => (
                  <label key={value}
                    className={`flex cursor-pointer gap-3 rounded-md border p-4 text-[14px] transition-colors duration-150 ease-out-soft ${
                      form.distributionElection === value
                        ? "border-steel-teal bg-steel-teal-tint text-neutral-ink"
                        : "border-neutral-border bg-neutral-white text-neutral-slate hover:border-steel-teal"
                    }`}>
                    <input type="radio" name="distributionElection" value={value}
                      checked={form.distributionElection === value}
                      onChange={() => update("distributionElection", value)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-institutional-navy" />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>

              <div className="space-y-3 border-t border-neutral-border pt-5">
                <label className="flex cursor-pointer gap-3 text-[13px] leading-relaxed text-neutral-slate">
                  <input type="checkbox" checked={form.restrictedSecuritiesAcknowledged}
                    onChange={(e) => update("restrictedSecuritiesAcknowledged", e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-institutional-navy" />
                  {/* "may be required to hold it indefinitely" is the standard
                      Reg D phrasing, written for equity and other instruments
                      with no repayment date. This Note matures on a fixed date
                      between 3 and 60 months, so "indefinitely" misdescribed it.
                      The two facts that actually bind the investor - no
                      registration, no market to sell into - are unchanged. */}
                  <span>
                    I understand the Note has not been registered under the Securities Act,
                    there is no public market for it, and I must be prepared to hold it
                    until maturity.
                  </span>
                </label>
                <label className="flex cursor-pointer gap-3 text-[13px] leading-relaxed text-neutral-slate">
                  <input type="checkbox" checked={form.reviewedMemorandumAcknowledged}
                    onChange={(e) => update("reviewedMemorandumAcknowledged", e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-institutional-navy" />
                  <span>
                    I have received and reviewed the Private Placement Memorandum, including its
                    Risk Factors, and understand that misrepresenting my Accredited Investor
                    status may subject the Note to rescission.
                  </span>
                </label>
              </div>

              {error && <p className="text-[13px] text-red-600" role="alert">{error}</p>}

              <div className="flex items-center justify-between pt-1">
                <button type="button" onClick={() => { setError(null); setStep(2); }}
                  className="text-[14px] font-semibold text-neutral-slate transition-colors hover:text-institutional-navy">
                  Back
                </button>
                <button type="button" onClick={handleSubmit} disabled={submitting}
                  className="inline-flex items-center rounded-md bg-institutional-navy px-7 py-3 text-[15px] font-semibold text-white transition-[background-color,transform] duration-150 ease-out-soft hover:bg-navy-deep active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal disabled:cursor-not-allowed disabled:opacity-60">
                  {submitting ? "Submitting..." : "Submit subscription"}
                </button>
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div key="success" {...variants} transition={transition} className="py-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-steel-teal-tint">
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="#002060" strokeWidth="2" aria-hidden>
                  <path d="M6 13.5l4.5 4.5L20 8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 ref={headingRef} tabIndex={-1}
                className="mt-6 font-[family-name:var(--font-display)] text-3xl leading-[1.15] font-medium text-institutional-navy outline-none">
                Your subscription details have been received.
              </h1>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-neutral-slate">
                This is not yet a completed subscription. A member of the Stage Point team will
                review the information provided and follow up with your Subscription Agreement,
                Secured Promissory Note, and Pledge Agreement for signature. You can also reach
                us directly at{" "}
                <a href="mailto:ir@stagepointcapital.com" className="font-semibold text-institutional-navy underline">
                  ir@stagepointcapital.com
                </a>{" "}
                or (401) 227-5775.
              </p>
              <Link href="/"
                className="mt-8 inline-flex items-center rounded-md border-[1.5px] border-institutional-navy px-7 py-3 text-[15px] font-semibold text-institutional-navy transition-colors duration-150 ease-out-soft hover:bg-navy-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal">
                Return to overview
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
