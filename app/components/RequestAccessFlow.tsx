"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { NOTE_TERMS, termFormLabel } from "../lib/rates";
import { StepIndicator } from "./StepIndicator";

// NOTE FOR COUNSEL (Moss & Moss): this step branches by investor type and
// collects category-specific substantiation (not a bare checkbox) so the
// answers, together with the non-waivable minimum investment amount, are
// intended to constitute SPM's Rule 506(c) "reasonable steps to verify" at
// intake, consistent with the PPM's Verification Method section. All
// question wording and the certification language below must be reviewed
// and approved before launch.

const INVESTOR_TYPES = [
  "Individual",
  "Joint (with spouse or spousal equivalent)",
  "Entity (LLC, trust, corporation, or partnership)",
  "Retirement account (IRA or other)",
];

const INVESTMENT_RANGES = [
  "$200,000 to $500,000",
  "$500,000 to $1,000,000",
  "$1,000,000 to $2,500,000",
  "$2,500,000 or more",
];

// Derived from the canonical rate schedule so the terms and rates offered here
// always match the offering section.
const PREFERRED_TERMS = [...NOTE_TERMS.map(termFormLabel), "Undecided"];

type InvestorCategory = "individual" | "entity" | "ira";

function investorCategory(investorType: string): InvestorCategory {
  if (investorType === "Entity (LLC, trust, corporation, or partnership)") return "entity";
  if (investorType === "Retirement account (IRA or other)") return "ira";
  return "individual";
}

// Branched by investor type so each person only answers the category their
// investor type can actually qualify under (Rule 501(a) / PPM Section VI).
const INDIVIDUAL_ACCREDITATION_OPTIONS = [
  {
    value: "income",
    label:
      "My income exceeded $200,000 individually, or $300,000 jointly with my spouse or spousal equivalent, in each of the past two years, and I expect the same this year.",
  },
  {
    value: "net-worth",
    label:
      "My net worth, alone or together with my spouse or spousal equivalent, exceeds $1,000,000, excluding my primary residence.",
  },
  {
    value: "professional",
    label: "I hold a Series 7, Series 65, or Series 82 license in good standing.",
  },
  {
    value: "unsure",
    label: "I am not certain, and I would like to discuss my eligibility with the team.",
  },
];

const ENTITY_ACCREDITATION_OPTIONS = [
  {
    value: "entity-assets",
    label: "The entity was not formed for the purpose of this investment and holds more than $5,000,000 in assets.",
  },
  {
    value: "all-equity-accredited",
    label: "All equity owners of the entity are themselves accredited investors.",
  },
  {
    value: "institutional",
    label:
      "The entity is a bank, insurance company, registered investment company, business development company, or similar institutional investor.",
  },
  {
    value: "unsure",
    label: "I am not certain, and I would like to discuss eligibility with the team.",
  },
];

const HOW_HEARD_OPTIONS = [
  { value: "referral", label: "Referral or existing investor" },
  { value: "advisor", label: "Financial advisor or attorney" },
  { value: "website", label: "Website or search" },
  { value: "event", label: "Event or conference" },
  { value: "other", label: "Other" },
];

const STEPS = [
  { n: 1, label: "Your details" },
  { n: 2, label: "Eligibility" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Handoff to SubscriptionFlow's pre-fill read (app/components/SubscriptionFlow.tsx).
// sessionStorage keeps this client-side and same-tab only — no PII in a URL,
// and it's read once and cleared so a later, unrelated /subscribe visit on a
// shared machine never inherits stale data.
const SUBSCRIBE_PREFILL_KEY = "spm-subscribe-prefill";

// Categories this flow and SubscriptionFlow's eligibility step share a slug
// for; "unsure" has no subscription-stage equivalent so it is left unset.
const SUBSCRIBE_COMPATIBLE_CATEGORIES = [
  "income",
  "net-worth",
  "professional",
  "entity-assets",
  "all-equity-accredited",
  "institutional",
];

const inputClass =
  "w-full rounded-md border-[1.5px] border-neutral-border bg-neutral-white px-4 py-3 text-[15px] text-neutral-ink transition-colors duration-150 ease-out-soft placeholder:text-neutral-mist focus:border-institutional-navy focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-steel-teal";

const labelClass = "block text-[13px] font-semibold text-neutral-slate";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  investorType: string;
  investmentRange: string;
  preferredTerm: string;
  accreditationBasis: string;
  incomeDocsAvailable: string;
  netWorthDocsAvailable: string;
  licenseType: string;
  licenseActive: string;
  entityAssetRange: string;
  entityEquityOwnerCount: string;
  entityAllOwnersAccredited: string;
  institutionType: string;
  entityFormationDate: string;
  custodianName: string;
  thirdPartyFinancing: string;
  howHeard: string;
  verificationAcknowledged: boolean;
  noOfferAcknowledged: boolean;
};

const INITIAL: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  investorType: "",
  investmentRange: "",
  preferredTerm: "",
  accreditationBasis: "",
  incomeDocsAvailable: "",
  netWorthDocsAvailable: "",
  licenseType: "",
  licenseActive: "",
  entityAssetRange: "",
  entityEquityOwnerCount: "",
  entityAllOwnersAccredited: "",
  institutionType: "",
  entityFormationDate: "",
  custodianName: "",
  thirdPartyFinancing: "",
  howHeard: "",
  verificationAcknowledged: false,
  noOfferAcknowledged: false,
};

type Step = 1 | 2 | "success";

export function RequestAccessFlow() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const category = investorCategory(form.investorType);

  // Move focus to the current step heading for screen-reader and keyboard users.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateStepOne(): string | null {
    if (!form.firstName.trim() || !form.lastName.trim()) return "Please enter your first and last name.";
    if (!EMAIL_RE.test(form.email.trim())) return "Please enter a valid email address.";
    if (!form.investorType) return "Please select an investor type.";
    if (!form.investmentRange) return "Please select an intended investment amount.";
    return null;
  }

  function goToStepTwo() {
    const err = validateStepOne();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep(2);
  }

  // Each branch requires substantiation for the specific category claimed,
  // not just the top-level self-attestation, so the answers collected here
  // are real facts-and-circumstances diligence under Rule 506(c) rather than
  // a bare checkbox.
  function validateStepTwo(): string | null {
    if (!form.accreditationBasis) return "Please indicate the basis for your eligibility.";
    if (category === "ira" && !form.custodianName.trim()) return "Please provide the custodian name.";
    if (category === "entity" && !form.entityFormationDate) return "Please provide the entity's formation date.";
    if (form.accreditationBasis === "income" && !form.incomeDocsAvailable) {
      return "Please answer whether income documentation is available on request.";
    }
    if (form.accreditationBasis === "net-worth" && !form.netWorthDocsAvailable) {
      return "Please answer whether net worth documentation is available on request.";
    }
    if (form.accreditationBasis === "professional" && (!form.licenseType || !form.licenseActive)) {
      return "Please provide your license type and confirm it is active.";
    }
    if (form.accreditationBasis === "entity-assets" && !form.entityAssetRange) {
      return "Please select the entity's approximate total assets.";
    }
    if (form.accreditationBasis === "all-equity-accredited" && (!form.entityEquityOwnerCount || !form.entityAllOwnersAccredited)) {
      return "Please provide the number of equity owners and confirm their accredited status.";
    }
    if (form.accreditationBasis === "institutional" && !form.institutionType) {
      return "Please select the type of institution.";
    }
    if (!form.thirdPartyFinancing) return "Please answer the third-party financing question.";
    if (!form.verificationAcknowledged) return "Please acknowledge the verification certification.";
    if (!form.noOfferAcknowledged) return "Please acknowledge the information-only notice.";
    return null;
  }

  async function handleSubmit() {
    const err = validateStepTwo();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      try {
        const matchedTerm = NOTE_TERMS.find((t) => termFormLabel(t) === form.preferredTerm);
        sessionStorage.setItem(
          SUBSCRIBE_PREFILL_KEY,
          JSON.stringify({
            investorKind: category,
            lenderName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
            lenderEmail: form.email.trim(),
            lenderPhone: form.phone.trim() || undefined,
            custodianName: form.custodianName.trim() || undefined,
            accreditationCategories: SUBSCRIBE_COMPATIBLE_CATEGORIES.includes(form.accreditationBasis)
              ? [form.accreditationBasis]
              : [],
            nonFinancingAcknowledged: form.thirdPartyFinancing === "no",
            termMonths: matchedTerm?.months,
          }),
        );
      } catch {
        // Pre-fill is a convenience only; never block submission on it.
      }
      setStep("success");
    } catch {
      setError("We could not reach the server. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const transition = reduce
    ? { duration: 0 }
    : { duration: 0.24, ease: [0.16, 1, 0.3, 1] as const };
  const variants = reduce
    ? {}
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="mx-auto w-full max-w-xl">
      {step !== "success" && (
        <div className="mb-8">
          <p className="text-[13px] font-semibold tracking-[0.08em] text-steel-teal-deep uppercase">
            Request the Offering Memorandum
          </p>
          <h1
            className="mt-3 font-[family-name:var(--font-display)] text-3xl leading-[1.15] font-medium text-institutional-navy outline-none md:text-4xl"
            tabIndex={-1}
            ref={step === 1 ? headingRef : undefined}
          >
            {step === 1 ? "Explore our offerings today." : "Confirm your eligibility."}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-neutral-slate">
            {step === 1
              ? "Discover our note offerings in just a few simple steps."
              : "This offering is available only to accredited investors. The questions below are how Stage Point evaluates and documents eligibility under Rule 506(c)."}
          </p>
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
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="firstName" className={labelClass}>First name</label>
                  <input id="firstName" className={inputClass} value={form.firstName}
                    onChange={(e) => update("firstName", e.target.value)} autoComplete="given-name" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="lastName" className={labelClass}>Last name</label>
                  <input id="lastName" className={inputClass} value={form.lastName}
                    onChange={(e) => update("lastName", e.target.value)} autoComplete="family-name" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className={labelClass}>Email</label>
                <input id="email" type="email" className={inputClass} value={form.email}
                  onChange={(e) => update("email", e.target.value)} autoComplete="email" />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="phone" className={labelClass}>
                  Phone <span className="font-normal text-neutral-mist">(optional)</span>
                </label>
                <input id="phone" type="tel" className={inputClass} value={form.phone}
                  onChange={(e) => update("phone", e.target.value)} autoComplete="tel" />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="investorType" className={labelClass}>Investor type</label>
                <select id="investorType" className={inputClass} value={form.investorType}
                  onChange={(e) => update("investorType", e.target.value)}>
                  <option value="" disabled>Select one</option>
                  {INVESTOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="investmentRange" className={labelClass}>Intended investment</label>
                <select id="investmentRange" className={inputClass} value={form.investmentRange}
                  onChange={(e) => update("investmentRange", e.target.value)}>
                  <option value="" disabled>Select a range</option>
                  {INVESTMENT_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="preferredTerm" className={labelClass}>
                  Preferred note term <span className="font-normal text-neutral-mist">(optional)</span>
                </label>
                <select id="preferredTerm" className={inputClass} value={form.preferredTerm}
                  onChange={(e) => update("preferredTerm", e.target.value)}>
                  <option value="">No preference yet</option>
                  {PREFERRED_TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {error && <p className="text-[13px] text-red-600" role="alert">{error}</p>}

              <div className="flex items-center justify-between pt-2">
                <Link href="/" className="text-[14px] font-semibold text-neutral-slate transition-colors hover:text-institutional-navy">
                  Back to overview
                </Link>
                <button type="button" onClick={goToStepTwo}
                  className="inline-flex items-center rounded-md bg-institutional-navy px-7 py-3 text-[15px] font-semibold text-white transition-[background-color,transform] duration-150 ease-out-soft hover:bg-navy-deep active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal">
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step-2" {...variants} transition={transition} className="space-y-6">
              {category === "ira" && (
                <div className="space-y-1.5">
                  <label htmlFor="custodianName" className={labelClass}>Custodian name</label>
                  <input id="custodianName" className={inputClass} value={form.custodianName}
                    onChange={(e) => update("custodianName", e.target.value)}
                    placeholder="e.g. Equity Trust Company" />
                </div>
              )}

              {category === "entity" && (
                <div className="space-y-1.5">
                  <label htmlFor="entityFormationDate" className={labelClass}>Entity formation date</label>
                  <input id="entityFormationDate" type="month" className={inputClass} value={form.entityFormationDate}
                    onChange={(e) => update("entityFormationDate", e.target.value)} />
                </div>
              )}

              <fieldset className="space-y-3">
                <legend className={`${labelClass} mb-1`}>
                  {category === "ira"
                    ? "Which of the following best describes the account owner?"
                    : category === "entity"
                      ? "Which of the following best describes the entity?"
                      : "Which of the following best describes you?"}
                </legend>
                {(category === "entity" ? ENTITY_ACCREDITATION_OPTIONS : INDIVIDUAL_ACCREDITATION_OPTIONS).map((opt) => (
                  <div key={opt.value}>
                    <label
                      className={`flex cursor-pointer gap-3 rounded-md border p-4 text-[14px] leading-relaxed transition-colors duration-150 ease-out-soft ${
                        form.accreditationBasis === opt.value
                          ? "border-steel-teal bg-steel-teal-tint text-neutral-ink"
                          : "border-neutral-border bg-neutral-white text-neutral-slate hover:border-steel-teal"
                      }`}>
                      <input type="radio" name="accreditationBasis" value={opt.value}
                        checked={form.accreditationBasis === opt.value}
                        onChange={(e) => update("accreditationBasis", e.target.value)}
                        className="mt-1 h-4 w-4 shrink-0 accent-institutional-navy" />
                      <span>{opt.label}</span>
                    </label>

                    {/* Branch-specific substantiation, shown inline under the
                        selected category so the diligence collected matches
                        the specific claim, not just the category label. */}
                    {opt.value === "income" && form.accreditationBasis === "income" && (
                      <div className="mt-2 ml-1 space-y-1.5 border-l-2 border-steel-teal pl-4">
                        <label htmlFor="incomeDocsAvailable" className={labelClass}>
                          Can you provide IRS documentation (W-2, 1099, Schedule K-1, or Form 1040) substantiating this if requested?
                        </label>
                        <select id="incomeDocsAvailable" className={inputClass} value={form.incomeDocsAvailable}
                          onChange={(e) => update("incomeDocsAvailable", e.target.value)}>
                          <option value="" disabled>Select one</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    )}
                    {opt.value === "net-worth" && form.accreditationBasis === "net-worth" && (
                      <div className="mt-2 ml-1 space-y-1.5 border-l-2 border-steel-teal pl-4">
                        <label htmlFor="netWorthDocsAvailable" className={labelClass}>
                          Do you have supporting documentation (bank/brokerage statements, tax assessment, or credit report, dated within the last 3 months) available if requested?
                        </label>
                        <select id="netWorthDocsAvailable" className={inputClass} value={form.netWorthDocsAvailable}
                          onChange={(e) => update("netWorthDocsAvailable", e.target.value)}>
                          <option value="" disabled>Select one</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    )}
                    {opt.value === "professional" && form.accreditationBasis === "professional" && (
                      <div className="mt-2 ml-1 grid gap-3 border-l-2 border-steel-teal pl-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label htmlFor="licenseType" className={labelClass}>Which license do you hold?</label>
                          <select id="licenseType" className={inputClass} value={form.licenseType}
                            onChange={(e) => update("licenseType", e.target.value)}>
                            <option value="" disabled>Select one</option>
                            <option value="Series 7">Series 7</option>
                            <option value="Series 65">Series 65</option>
                            <option value="Series 82">Series 82</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="licenseActive" className={labelClass}>Active and in good standing?</label>
                          <select id="licenseActive" className={inputClass} value={form.licenseActive}
                            onChange={(e) => update("licenseActive", e.target.value)}>
                            <option value="" disabled>Select one</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                      </div>
                    )}
                    {opt.value === "entity-assets" && form.accreditationBasis === "entity-assets" && (
                      <div className="mt-2 ml-1 space-y-1.5 border-l-2 border-steel-teal pl-4">
                        <label htmlFor="entityAssetRange" className={labelClass}>Approximate total assets of the entity</label>
                        <select id="entityAssetRange" className={inputClass} value={form.entityAssetRange}
                          onChange={(e) => update("entityAssetRange", e.target.value)}>
                          <option value="" disabled>Select a range</option>
                          <option value="$5,000,000 to $10,000,000">$5,000,000 to $10,000,000</option>
                          <option value="$10,000,000 to $25,000,000">$10,000,000 to $25,000,000</option>
                          <option value="$25,000,000 or more">$25,000,000 or more</option>
                        </select>
                      </div>
                    )}
                    {opt.value === "all-equity-accredited" && form.accreditationBasis === "all-equity-accredited" && (
                      <div className="mt-2 ml-1 grid gap-3 border-l-2 border-steel-teal pl-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label htmlFor="entityEquityOwnerCount" className={labelClass}>Number of equity owners</label>
                          <input id="entityEquityOwnerCount" type="number" min="1" className={inputClass}
                            value={form.entityEquityOwnerCount}
                            onChange={(e) => update("entityEquityOwnerCount", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="entityAllOwnersAccredited" className={labelClass}>All independently accredited?</label>
                          <select id="entityAllOwnersAccredited" className={inputClass} value={form.entityAllOwnersAccredited}
                            onChange={(e) => update("entityAllOwnersAccredited", e.target.value)}>
                            <option value="" disabled>Select one</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                      </div>
                    )}
                    {opt.value === "institutional" && form.accreditationBasis === "institutional" && (
                      <div className="mt-2 ml-1 space-y-1.5 border-l-2 border-steel-teal pl-4">
                        <label htmlFor="institutionType" className={labelClass}>Type of institution</label>
                        <select id="institutionType" className={inputClass} value={form.institutionType}
                          onChange={(e) => update("institutionType", e.target.value)}>
                          <option value="" disabled>Select one</option>
                          <option value="Bank">Bank</option>
                          <option value="Insurance company">Insurance company</option>
                          <option value="Registered investment company">Registered investment company</option>
                          <option value="Business development company">Business development company</option>
                          <option value="Other similar institutional entity">Other similar institutional entity</option>
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </fieldset>

              <div className="space-y-5 border-t border-neutral-border pt-5">
                <div className="space-y-1.5">
                  <label htmlFor="thirdPartyFinancing" className={labelClass}>
                    Will any portion of this investment be financed by a loan, gift, or contribution from a third party specifically for the purpose of making this investment?
                  </label>
                  <select id="thirdPartyFinancing" className={inputClass} value={form.thirdPartyFinancing}
                    onChange={(e) => update("thirdPartyFinancing", e.target.value)}>
                    <option value="" disabled>Select one</option>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                  {form.thirdPartyFinancing === "yes" && (
                    <p className="text-[13px] leading-relaxed text-amber-700">
                      Investments financed by a third party for this specific purpose generally cannot be
                      accepted under this offering&apos;s verification method. A member of the team will
                      follow up to discuss.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="howHeard" className={labelClass}>
                    How did you learn about this offering? <span className="font-normal text-neutral-mist">(optional)</span>
                  </label>
                  <select id="howHeard" className={inputClass} value={form.howHeard}
                    onChange={(e) => update("howHeard", e.target.value)}>
                    <option value="">Prefer not to say</option>
                    {HOW_HEARD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-3 border-t border-neutral-border pt-5">
                <label className="flex cursor-pointer gap-3 text-[13px] leading-relaxed text-neutral-slate">
                  <input type="checkbox" checked={form.verificationAcknowledged}
                    onChange={(e) => update("verificationAcknowledged", e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-institutional-navy" />
                  <span>I certify that my answers above are accurate and complete, and I understand Stage Point relies on them, together with my subscription amount, to satisfy its verification obligations under Rule 506(c). Stage Point may request supporting documentation before accepting my subscription.</span>
                </label>
                <label className="flex cursor-pointer gap-3 text-[13px] leading-relaxed text-neutral-slate">
                  <input type="checkbox" checked={form.noOfferAcknowledged}
                    onChange={(e) => update("noOfferAcknowledged", e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-institutional-navy" />
                  <span>I understand this is a request for information only. It is not an offer to sell or a solicitation to buy securities. Any offer is made only through the offering memorandum and subscription documents.</span>
                </label>
              </div>

              {error && <p className="text-[13px] text-red-600" role="alert">{error}</p>}

              <div className="flex items-center justify-between pt-1">
                <button type="button" onClick={() => { setError(null); setStep(1); }}
                  className="text-[14px] font-semibold text-neutral-slate transition-colors hover:text-institutional-navy">
                  Back
                </button>
                <button type="button" onClick={handleSubmit} disabled={submitting}
                  className="inline-flex items-center rounded-md bg-institutional-navy px-7 py-3 text-[15px] font-semibold text-white transition-[background-color,transform] duration-150 ease-out-soft hover:bg-navy-deep active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal disabled:cursor-not-allowed disabled:opacity-60">
                  {submitting ? "Submitting..." : "Submit request"}
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
                Your offering memorandum is ready.
              </h1>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-neutral-slate">
                Thank you for completing eligibility screening. Download the offering memorandum
                below, and continue to subscribe when you&apos;re ready. A member of the Stage Point
                team may also follow up directly. You can reach us at{" "}
                <a href="mailto:ir@stagepointcapital.com" className="font-semibold text-institutional-navy underline">
                  ir@stagepointcapital.com
                </a>{" "}
                or (401) 227-5775.
              </p>

              <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
                <a href="/documents/Stage-Point-Master-PPM.pdf" download
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-institutional-navy px-7 py-3 text-[15px] font-semibold text-white transition-[background-color,transform] duration-150 ease-out-soft hover:bg-navy-deep active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                    <path d="M8 1.5v9M4.5 7l3.5 3.5L11.5 7M2 13.5h12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Download the memorandum
                </a>
                <Link href="/subscribe"
                  className="inline-flex items-center justify-center rounded-md border-[1.5px] border-institutional-navy px-7 py-3 text-[15px] font-semibold text-institutional-navy transition-colors duration-150 ease-out-soft hover:bg-navy-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal">
                  Continue to subscribe
                </Link>
              </div>

              <Link href="/"
                className="mt-6 inline-block text-[14px] font-semibold text-neutral-slate transition-colors hover:text-institutional-navy">
                Return to overview
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
