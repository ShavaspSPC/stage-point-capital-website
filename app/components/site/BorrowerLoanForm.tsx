"use client";

import { useState } from "react";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { OFFICE } from "./siteNavigation";

// Field styling matches the admin's InvestorForm so every form in the project
// looks and behaves like the same form. Labels sit above their control and
// nothing uses a placeholder in place of a label.
const inputClass =
  "w-full rounded-md border-[1.5px] border-neutral-border bg-neutral-white px-4 py-3 text-[15px] text-neutral-ink transition-colors duration-150 ease-out-soft placeholder:text-neutral-mist focus:border-institutional-navy focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-steel-teal";
const labelClass = "block text-[13px] font-semibold text-neutral-slate";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  company: "",
  propertyAddress: "",
  propertyType: "",
  loanAmount: "",
  purchasePrice: "",
  rehabBudget: "",
  afterRepairValue: "",
  exitStrategy: "",
  experience: "",
  timeline: "",
  notes: "",
};

const PROPERTY_TYPES = [
  "Single-family",
  "Multi-family, 2 to 4 units",
  "Multi-family, 5+ units",
  "Mixed use",
  "Other",
];
const EXIT_STRATEGIES = ["Sale after renovation", "Refinance and hold as a rental", "Undecided"];
const TIMELINES = ["Under contract, closing within 30 days", "30 to 60 days", "60 to 90 days", "Still searching"];

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {hint && <p className="text-[12.5px] leading-relaxed text-neutral-mist">{hint}</p>}
    </div>
  );
}

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-neutral-border pt-6">
      <legend className="pr-3 text-[12px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
        {legend}
      </legend>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function BorrowerLoanForm() {
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function update(key: keyof typeof EMPTY, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) return setError("Enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      return setError("Enter a valid email address.");
    if (!form.propertyAddress.trim()) return setError("Enter the property address.");
    if (!form.loanAmount.trim()) return setError("Enter the loan amount you are seeking.");

    setSending(true);
    try {
      const res = await fetch("/api/borrower-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? "Could not send this. Please try again.");
        setSending(false);
        return;
      }
      setSent(true);
    } catch {
      setError("Could not reach the server. Please try again.");
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-neutral-border bg-neutral-white p-8 lg:p-10">
        <CheckCircleIcon size={40} weight="fill" className="text-steel-teal-deep" aria-hidden />
        <h2 className="mt-5 font-[family-name:var(--font-display)] text-[1.5rem] leading-tight font-semibold tracking-[-0.015em] text-institutional-navy">
          Your enquiry is with the origination desk
        </h2>
        <p className="mt-3 max-w-[58ch] text-[15.5px] leading-relaxed text-neutral-slate">
          Clayton Rice heads origination and will follow up on the details you sent. If it is
          time-sensitive, call the office at{" "}
          <a
            href={OFFICE.phoneHref}
            className="font-semibold text-institutional-navy underline underline-offset-2"
          >
            {OFFICE.phone}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-8 rounded-lg border border-neutral-border bg-neutral-white p-6 sm:p-8 lg:p-10"
    >
      <Fieldset legend="About you">
        <Field id="name" label="Full name">
          <input
            id="name"
            className={inputClass}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            autoComplete="name"
            required
          />
        </Field>
        <Field id="email" label="Email">
          <input
            id="email"
            type="email"
            className={inputClass}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            autoComplete="email"
            required
          />
        </Field>
        <Field id="phone" label="Phone">
          <input
            id="phone"
            type="tel"
            className={inputClass}
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            autoComplete="tel"
          />
        </Field>
        <Field id="company" label="Company or entity" hint="If you borrow through an LLC.">
          <input
            id="company"
            className={inputClass}
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
            autoComplete="organization"
          />
        </Field>
      </Fieldset>

      <Fieldset legend="The property">
        <div className="sm:col-span-2">
          <Field id="propertyAddress" label="Property address">
            <input
              id="propertyAddress"
              className={inputClass}
              value={form.propertyAddress}
              onChange={(e) => update("propertyAddress", e.target.value)}
              autoComplete="street-address"
              required
            />
          </Field>
        </div>
        <Field id="propertyType" label="Property type">
          <select
            id="propertyType"
            className={inputClass}
            value={form.propertyType}
            onChange={(e) => update("propertyType", e.target.value)}
          >
            <option value="">Select a type</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field id="purchasePrice" label="Purchase price">
          <input
            id="purchasePrice"
            className={inputClass}
            value={form.purchasePrice}
            onChange={(e) => update("purchasePrice", e.target.value)}
            inputMode="numeric"
          />
        </Field>
        <Field id="rehabBudget" label="Rehab budget">
          <input
            id="rehabBudget"
            className={inputClass}
            value={form.rehabBudget}
            onChange={(e) => update("rehabBudget", e.target.value)}
            inputMode="numeric"
          />
        </Field>
        <Field id="afterRepairValue" label="After-repair value">
          <input
            id="afterRepairValue"
            className={inputClass}
            value={form.afterRepairValue}
            onChange={(e) => update("afterRepairValue", e.target.value)}
            inputMode="numeric"
          />
        </Field>
      </Fieldset>

      <Fieldset legend="The loan">
        <Field id="loanAmount" label="Loan amount requested">
          <input
            id="loanAmount"
            className={inputClass}
            value={form.loanAmount}
            onChange={(e) => update("loanAmount", e.target.value)}
            inputMode="numeric"
            required
          />
        </Field>
        <Field id="timeline" label="Timeline to close">
          <select
            id="timeline"
            className={inputClass}
            value={form.timeline}
            onChange={(e) => update("timeline", e.target.value)}
          >
            <option value="">Select a timeline</option>
            {TIMELINES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field id="exitStrategy" label="Exit strategy">
          <select
            id="exitStrategy"
            className={inputClass}
            value={form.exitStrategy}
            onChange={(e) => update("exitStrategy", e.target.value)}
          >
            <option value="">Select an exit</option>
            {EXIT_STRATEGIES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id="experience"
          label="Projects completed in the last 3 years"
          hint="Roughly how many fix and flip projects you have taken through to exit."
        >
          <input
            id="experience"
            className={inputClass}
            value={form.experience}
            onChange={(e) => update("experience", e.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field id="notes" label="Anything else we should know">
            <textarea
              id="notes"
              rows={4}
              className={`${inputClass} resize-y`}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </Field>
        </div>
      </Fieldset>

      {error && (
        <p className="text-[14px] text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-5 border-t border-neutral-border pt-6">
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center rounded-md bg-institutional-navy px-8 py-3.5 text-[15px] font-semibold text-white transition-[background-color,transform] duration-150 ease-out-soft hover:bg-navy-deep active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? "Sending…" : "Submit enquiry"}
        </button>
        <p className="text-[13px] text-neutral-mist">
          Or call the office at{" "}
          <a href={OFFICE.phoneHref} className="font-medium text-neutral-slate underline underline-offset-2">
            {OFFICE.phone}
          </a>
          .
        </p>
      </div>
    </form>
  );
}
