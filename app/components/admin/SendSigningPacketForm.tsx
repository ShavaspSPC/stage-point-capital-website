"use client";

import { useMemo, useState } from "react";
import { NOTE_TERMS } from "../../lib/rates";
import {
  buildAcceptanceFieldSheets,
  buildNoteFieldSheet,
  type FieldSheet,
  type LenderKind,
  type SigningPacketInput,
} from "../../lib/dropboxSign";

const inputClass =
  "w-full rounded-md border-[1.5px] border-neutral-border bg-neutral-white px-4 py-3 text-[15px] text-neutral-ink transition-colors duration-150 ease-out-soft placeholder:text-neutral-mist focus:border-institutional-navy focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-steel-teal";
const labelClass = "block text-[13px] font-semibold text-neutral-slate";

function formatLongDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// Suggested convention observed in the source documents: effective date plus
// the term, less one day. This is the *initial* Maturity Date only; the Note's
// Section 1.5 auto-extends it unless the Lender gives 60 days' notice. Always
// editable below.
function suggestMaturityDate(isoEffectiveDate: string, months: number): string {
  const d = new Date(`${isoEffectiveDate}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  d.setDate(d.getDate() - 1);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}.${dd}.${d.getFullYear()}`;
}

// Optional pre-fill supplied when the form is opened from a specific
// investor (via /admin/investors/[id]/prepare). Every field stays
// editable; these are only initial values, and staff must confirm before sending.
export type SigningPrefill = Partial<{
  lenderName: string;
  lenderEmail: string;
  lenderAddress: string;
  lenderKind: LenderKind;
  entityStateOrCountry: string;
  entityType: string;
  custodianName: string;
  custodianAccountNumber: string;
  signatoryNameAndTitle: string;
  jointSubscriberName: string;
  principalAmount: string;
  termMonths: number;
}>;

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard access can fail (permissions, non-secure context); the
          // value is still visible and selectable, so this is a soft failure.
        }
      }}
      className={`shrink-0 rounded-md border-[1.5px] px-2.5 py-1 text-[12px] font-semibold transition-colors duration-150 ease-out-soft ${
        copied
          ? "border-institutional-navy bg-institutional-navy text-white"
          : "border-neutral-border text-neutral-slate hover:border-steel-teal"
      }`}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function FieldSheetCard({ sheet }: { sheet: FieldSheet }) {
  return (
    <div className="rounded-lg border border-neutral-border bg-neutral-white p-5">
      <p className="text-[15px] font-semibold text-institutional-navy">{sheet.documentLabel}</p>
      <p className="mt-1 text-[12.5px] text-neutral-mist">
        Template file: <code className="text-neutral-slate">{sheet.templateFile}</code>
      </p>

      <div className="mt-4 space-y-2">
        <p className="text-[12px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">Signers to add</p>
        {sheet.signers.map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-3 rounded-md border border-neutral-border bg-neutral-paper px-3 py-2">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-neutral-ink">
                {s.role} <span className="font-normal text-neutral-mist">— {s.name || "(name not set)"}</span>
              </p>
              <p className="truncate text-[12.5px] text-neutral-slate">{s.email || "(email not set)"}</p>
            </div>
            <CopyButton value={s.email} />
          </div>
        ))}
      </div>

      {sheet.fields.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-[12px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
            &quot;Me (when sending)&quot; fields to fill in
          </p>
          {sheet.fields.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-3 rounded-md border border-neutral-border bg-neutral-paper px-3 py-2">
              <div className="min-w-0">
                <p className="text-[12px] text-neutral-mist">
                  {f.label} <span className="text-neutral-mist">({f.id})</span>
                </p>
                <p className="truncate text-[13.5px] font-medium text-neutral-ink">{f.value || "(empty)"}</p>
              </div>
              <CopyButton value={f.value} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// `investorEmail` is the email on the CRM record this form was opened from.
// It, not the editable field below, is what the Airtable write is keyed on:
// staff may correct the email that goes onto the documents without meaning to
// re-point which CRM record the acceptance is recorded against.
export function SendSigningPacketForm({
  prefill,
  investorEmail,
}: {
  prefill?: SigningPrefill;
  investorEmail: string;
}) {
  const [lenderName, setLenderName] = useState(prefill?.lenderName ?? "");
  const [lenderEmail, setLenderEmail] = useState(prefill?.lenderEmail ?? "");
  const [lenderAddress, setLenderAddress] = useState(prefill?.lenderAddress ?? "");
  const [lenderKind, setLenderKind] = useState<LenderKind>(prefill?.lenderKind ?? "individual");
  const [entityStateOrCountry, setEntityStateOrCountry] = useState(prefill?.entityStateOrCountry ?? "");
  const [entityType, setEntityType] = useState(prefill?.entityType ?? "");
  const [custodianName, setCustodianName] = useState(prefill?.custodianName ?? "");
  const [custodianAccountNumber, setCustodianAccountNumber] = useState(prefill?.custodianAccountNumber ?? "");
  const [signatoryNameAndTitle, setSignatoryNameAndTitle] = useState(prefill?.signatoryNameAndTitle ?? "");
  const [jointSubscriberName, setJointSubscriberName] = useState(prefill?.jointSubscriberName ?? "");
  const [principalAmount, setPrincipalAmount] = useState(prefill?.principalAmount ?? "");
  const [termMonths, setTermMonths] = useState<number>(prefill?.termMonths ?? NOTE_TERMS[3].months);
  const [effectiveDateIso, setEffectiveDateIso] = useState("");
  const [maturityDate, setMaturityDate] = useState("");
  const [maturityTouched, setMaturityTouched] = useState(false);
  const [showSignatoryOverride, setShowSignatoryOverride] = useState(false);
  const [companySignatoryName, setCompanySignatoryName] = useState("");
  const [companySignatoryEmail, setCompanySignatoryEmail] = useState("");
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [acceptanceSheets, setAcceptanceSheets] = useState<FieldSheet[] | null>(null);
  const [recording, setRecording] = useState(false);
  const [acceptanceRecorded, setAcceptanceRecorded] = useState<{ recorded: boolean; created: boolean } | null>(
    null,
  );

  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [declining, setDeclining] = useState(false);
  const [declineError, setDeclineError] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);
  const [declineEmailSent, setDeclineEmailSent] = useState<boolean | undefined>(undefined);

  const [showIssueNote, setShowIssueNote] = useState(false);
  const [noteSheet, setNoteSheet] = useState<FieldSheet | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [confirmingNote, setConfirmingNote] = useState(false);
  const [noteConfirmed, setNoteConfirmed] = useState<{ recorded: boolean } | null>(null);

  const selectedTerm = useMemo(
    () => NOTE_TERMS.find((t) => t.months === termMonths)!,
    [termMonths],
  );

  function onEffectiveDateChange(value: string) {
    setEffectiveDateIso(value);
    if (!maturityTouched && value) {
      setMaturityDate(suggestMaturityDate(value, termMonths));
    }
  }

  function onTermChange(months: number) {
    setTermMonths(months);
    if (!maturityTouched && effectiveDateIso) {
      setMaturityDate(suggestMaturityDate(effectiveDateIso, months));
    }
  }

  function currentInput(): SigningPacketInput {
    return {
      lenderName,
      lenderEmail,
      lenderAddress,
      lenderKind,
      entityStateOrCountry: lenderKind === "entity" ? entityStateOrCountry : undefined,
      entityType: lenderKind === "entity" ? entityType : undefined,
      custodianName: lenderKind === "ira" ? custodianName : undefined,
      custodianAccountNumber: lenderKind === "ira" ? custodianAccountNumber : undefined,
      signatoryNameAndTitle: lenderKind !== "individual" ? signatoryNameAndTitle : undefined,
      jointSubscriberName: lenderKind === "individual" ? jointSubscriberName : undefined,
      principalAmount,
      termMonths,
      effectiveDate: effectiveDateIso ? formatLongDate(effectiveDateIso) : "",
      maturityDate,
      companySignatoryName: companySignatoryName || undefined,
      companySignatoryEmail: companySignatoryEmail || undefined,
    };
  }

  function handlePrepareAcceptance(e: React.FormEvent) {
    e.preventDefault();
    setPrepareError(null);
    const result = buildAcceptanceFieldSheets(currentInput());
    if (!result.ok) {
      setPrepareError(result.reason);
      return;
    }
    setAcceptanceSheets(result.sheets);
  }

  // Records that this subscription was accepted, once staff confirms the
  // Subscription Agreement and Pledge Agreement have actually been sent
  // through the Dropbox Sign dashboard. This form is always opened against an
  // existing record, so there is nothing to create here - adding an investor
  // is its own action (/admin/investors/new).
  async function handleRecordAcceptance() {
    setRecording(true);
    try {
      const decisionRes = await fetch("/api/admin/subscription-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: investorEmail, decision: "accepted" }),
      });
      const decisionData = await decisionRes.json().catch(() => null);
      setAcceptanceRecorded({
        recorded: Boolean(decisionData?.recorded),
        created: Boolean(decisionData?.created),
      });
    } catch {
      setAcceptanceRecorded({ recorded: false, created: false });
    } finally {
      setRecording(false);
    }
  }

  async function handleDecline() {
    setDeclineError(null);
    setDeclining(true);
    try {
      const res = await fetch("/api/admin/subscription-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: investorEmail, decision: "declined", note: declineReason.trim() || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setDeclineError(data?.error ?? "Could not record the decision.");
        return;
      }
      if (!data?.recorded) {
        setDeclineError(
          "No matching Committed subscription was found in Airtable for this email — nothing was recorded.",
        );
        return;
      }
      setDeclineEmailSent(data?.emailSent);
      setDeclined(true);
    } catch {
      setDeclineError("Could not reach the server.");
    } finally {
      setDeclining(false);
    }
  }

  // Computes the Note's field sheet - deliberately separate from
  // handlePrepareAcceptance above, which covers only the Pledge and
  // Subscription Agreement. Use this after independently confirming the wire
  // actually cleared; nothing in this app verifies that automatically.
  function handlePrepareNote() {
    setNoteError(null);
    const result = buildNoteFieldSheet(currentInput());
    if (!result.ok) {
      setNoteError(result.reason);
      return;
    }
    setNoteSheet(result.sheets[0]);
  }

  async function handleConfirmNoteIssued() {
    setConfirmingNote(true);
    try {
      const res = await fetch("/api/admin/issue-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lenderEmail: investorEmail }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setNoteError(data?.error ?? "Something went wrong.");
        return;
      }
      setNoteConfirmed({ recorded: Boolean(data?.recorded) });
    } catch {
      setNoteError("Could not reach the server.");
    } finally {
      setConfirmingNote(false);
    }
  }

  if (acceptanceSheets) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-steel-teal bg-steel-teal-tint p-5">
          <p className="text-[14px] leading-relaxed text-institutional-navy">
            In Dropbox Sign, start from <strong>Use Template</strong> on either document,
            then use <strong>Add template</strong> to add the other one to the same
            send — both go out together as one signature request. Add the signers and
            paste in the fields shown below for each document, then send. Once it&apos;s
            actually sent, come back and confirm below.
          </p>
        </div>

        {acceptanceSheets.map((sheet) => (
          <FieldSheetCard key={sheet.documentLabel} sheet={sheet} />
        ))}

        {!acceptanceRecorded ? (
          <div className="rounded-lg border border-neutral-border bg-neutral-white p-5">
            <p className="text-[13px] leading-relaxed text-neutral-slate">
              Marks this investor Accepted in the CRM. Do this once both documents are actually
              out for signature, not before.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <button type="button" onClick={handleRecordAcceptance} disabled={recording}
                className="inline-flex items-center rounded-md bg-institutional-navy px-6 py-2.5 text-[14px] font-semibold text-white transition-colors duration-150 ease-out-soft hover:bg-navy-deep disabled:cursor-not-allowed disabled:opacity-60">
                {recording ? "Recording..." : "Sent — record acceptance"}
              </button>
              <button type="button" onClick={() => setAcceptanceSheets(null)}
                className="text-[14px] font-semibold text-neutral-slate transition-colors hover:text-institutional-navy">
                Back to form
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-neutral-border bg-neutral-paper p-6">
            <p className="text-[15px] font-semibold text-institutional-navy">Acceptance recorded.</p>
            {acceptanceRecorded.created && (
              <p className="mt-3 text-[13px] text-institutional-navy">
                A new tracked record was created in Airtable for this investor and marked Accepted —
                they will now appear in the dashboard.
              </p>
            )}
            {!acceptanceRecorded.recorded && (
              <p className="mt-3 text-[13px] text-amber-700">
                Note: the acceptance could not be written to Airtable. This happens when the record
                has not reached Committed yet — set their stage to Committed from{" "}
                <strong>Edit their details</strong> and record the acceptance again. The documents
                above were unaffected.
              </p>
            )}
            <button
              type="button"
              onClick={() => { setAcceptanceSheets(null); setAcceptanceRecorded(null); }}
              className="mt-4 text-[14px] font-semibold text-institutional-navy underline"
            >
              Send another
            </button>
          </div>
        )}
      </div>
    );
  }

  if (noteSheet) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-5">
          <p className="text-[14px] leading-relaxed text-amber-900">
            Send this from Dropbox Sign&apos;s dashboard with only the Company signer added —
            the investor never signs the Note. <strong>Only do this after independently
            confirming the wire has actually cleared.</strong>
          </p>
        </div>

        <FieldSheetCard sheet={noteSheet} />

        {!noteConfirmed ? (
          <div className="rounded-lg border border-neutral-border bg-neutral-white p-5">
            {noteError && <p className="mb-3 text-[13px] text-red-600" role="alert">{noteError}</p>}
            <div className="flex flex-wrap items-center gap-4">
              <button type="button" onClick={handleConfirmNoteIssued} disabled={confirmingNote}
                className="inline-flex items-center rounded-md bg-institutional-navy px-6 py-2.5 text-[14px] font-semibold text-white transition-colors duration-150 ease-out-soft hover:bg-navy-deep disabled:cursor-not-allowed disabled:opacity-60">
                {confirmingNote ? "Recording..." : "Sent — mark Note issued"}
              </button>
              <button type="button" onClick={() => setNoteSheet(null)}
                className="text-[14px] font-semibold text-neutral-slate transition-colors hover:text-institutional-navy">
                Back to form
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-neutral-border bg-neutral-paper p-6">
            <p className="text-[15px] font-semibold text-institutional-navy">Note issuance recorded.</p>
            {!noteConfirmed.recorded && (
              <p className="mt-3 text-[13px] text-amber-700">
                Note: could not find a matching record in Airtable for this email to mark
                Funded/Note Issued.
              </p>
            )}
            <button
              type="button"
              onClick={() => { setNoteSheet(null); setNoteConfirmed(null); }}
              className="mt-4 text-[14px] font-semibold text-institutional-navy underline"
            >
              Back to form
            </button>
          </div>
        )}
      </div>
    );
  }

  if (declined) {
    return (
      <div className="rounded-lg border border-neutral-border bg-neutral-paper p-6">
        <p className="text-[15px] font-semibold text-institutional-navy">Subscription declined.</p>
        <p className="mt-2 text-[13px] text-neutral-slate">
          Recorded in Airtable for {investorEmail}. No documents were prepared or sent.
        </p>
        <p className="mt-2 text-[13px] text-neutral-slate">
          {declineEmailSent
            ? "A decline notice was emailed to the investor."
            : "No decline email was sent (SMTP not configured) — you may want to follow up manually."}
        </p>
        <button
          type="button"
          onClick={() => { setDeclined(false); setShowDecline(false); setDeclineReason(""); setDeclineEmailSent(undefined); }}
          className="mt-4 text-[14px] font-semibold text-institutional-navy underline"
        >
          Back to form
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handlePrepareAcceptance} className="space-y-5 rounded-lg border border-neutral-border bg-neutral-white p-6 sm:p-8">
      <div className="space-y-3">
        <p className={labelClass}>Investor type</p>
        <div className="flex gap-3">
          {(["individual", "entity", "ira"] as const).map((kind) => (
            <label
              key={kind}
              className={`flex-1 cursor-pointer rounded-md border-[1.5px] px-4 py-2.5 text-center text-[14px] font-medium transition-colors duration-150 ease-out-soft ${
                lenderKind === kind
                  ? "border-institutional-navy bg-navy-tint text-institutional-navy"
                  : "border-neutral-border text-neutral-slate hover:border-steel-teal"
              }`}
            >
              <input type="radio" name="lenderKind" value={kind} checked={lenderKind === kind}
                onChange={() => setLenderKind(kind)} className="sr-only" />
              {kind === "individual" ? "Individual" : kind === "entity" ? "Entity" : "IRA"}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="lenderName" className={labelClass}>
            {lenderKind === "individual" ? "Investor legal name" : lenderKind === "entity" ? "Entity legal name" : "Account owner full legal name"}
          </label>
          <input id="lenderName" className={inputClass} value={lenderName}
            onChange={(e) => setLenderName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="lenderEmail" className={labelClass}>Investor email</label>
          <input id="lenderEmail" type="email" className={inputClass} value={lenderEmail}
            onChange={(e) => setLenderEmail(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="lenderAddress" className={labelClass}>
          {lenderKind === "entity" ? "Principal place of business" : "Residential address"}
        </label>
        <input id="lenderAddress" className={inputClass} value={lenderAddress}
          onChange={(e) => setLenderAddress(e.target.value)} required />
      </div>

      {lenderKind === "individual" && (
        <div className="space-y-1.5">
          <label htmlFor="jointSubscriberName" className={labelClass}>
            Joint subscriber name <span className="font-normal text-neutral-mist">(optional)</span>
          </label>
          <input id="jointSubscriberName" className={inputClass}
            placeholder="If subscribing jointly with a spouse or spousal equivalent"
            value={jointSubscriberName} onChange={(e) => setJointSubscriberName(e.target.value)} />
        </div>
      )}

      {lenderKind === "entity" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="entityStateOrCountry" className={labelClass}>State or country of formation</label>
            <input id="entityStateOrCountry" className={inputClass} placeholder="Delaware"
              value={entityStateOrCountry} onChange={(e) => setEntityStateOrCountry(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="entityType" className={labelClass}>Entity type</label>
            <input id="entityType" className={inputClass} placeholder="limited liability company"
              value={entityType} onChange={(e) => setEntityType(e.target.value)} required />
          </div>
        </div>
      )}

      {lenderKind === "ira" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="custodianName" className={labelClass}>Custodian name</label>
            <input id="custodianName" className={inputClass} placeholder="e.g. Equity Trust Company"
              value={custodianName} onChange={(e) => setCustodianName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="custodianAccountNumber" className={labelClass}>Custodian account number</label>
            <input id="custodianAccountNumber" className={inputClass}
              value={custodianAccountNumber} onChange={(e) => setCustodianAccountNumber(e.target.value)} required />
          </div>
        </div>
      )}

      {lenderKind !== "individual" && (
        <div className="space-y-1.5">
          <label htmlFor="signatoryNameAndTitle" className={labelClass}>Signatory name and title</label>
          <input id="signatoryNameAndTitle" className={inputClass} placeholder="e.g. Jane Doe, Managing Member"
            value={signatoryNameAndTitle} onChange={(e) => setSignatoryNameAndTitle(e.target.value)} required />
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="principalAmount" className={labelClass}>Principal amount</label>
          <input id="principalAmount" className={inputClass} placeholder="$500,000.00"
            value={principalAmount} onChange={(e) => setPrincipalAmount(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="termMonths" className={labelClass}>Confirmed term</label>
          <select id="termMonths" className={inputClass} value={termMonths}
            onChange={(e) => onTermChange(Number(e.target.value))}>
            {NOTE_TERMS.map((t) => (
              <option key={t.months} value={t.months}>{t.full} at {t.annual}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="effectiveDate" className={labelClass}>Effective date</label>
          <input id="effectiveDate" type="date" className={inputClass} value={effectiveDateIso}
            onChange={(e) => onEffectiveDateChange(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="maturityDate" className={labelClass}>
            Initial maturity date <span className="font-normal text-neutral-mist">(suggested, confirm before sending)</span>
          </label>
          <input id="maturityDate" className={inputClass} placeholder="MM.DD.YYYY"
            value={maturityDate}
            onChange={(e) => { setMaturityDate(e.target.value); setMaturityTouched(true); }}
            required />
        </div>
      </div>
      <p className="text-[12.5px] text-neutral-mist">
        Per Note Section 1.5, this Maturity Date automatically extends by the same term
        unless the Lender gives 60 days&apos; written notice beforehand. This field is the
        initial date only.
      </p>

      <div className="rounded-md border border-neutral-border bg-neutral-paper p-4">
        <p className="text-[13px] text-neutral-slate">
          Rate for {selectedTerm.full}: <strong>{selectedTerm.annual}</strong> annual
          ({selectedTerm.monthly} monthly), from the site&apos;s current rate schedule.
        </p>
      </div>

      <div className="border-t border-neutral-border pt-5">
        <button
          type="button"
          onClick={() => setShowSignatoryOverride((v) => !v)}
          className="text-[13px] font-semibold text-institutional-navy underline"
        >
          {showSignatoryOverride ? "Use default company signatory" : "Send on behalf of a different company signatory"}
        </button>
        {showSignatoryOverride && (
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="companySignatoryName" className={labelClass}>Company signatory name</label>
              <input id="companySignatoryName" className={inputClass} value={companySignatoryName}
                onChange={(e) => setCompanySignatoryName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="companySignatoryEmail" className={labelClass}>Company signatory email</label>
              <input id="companySignatoryEmail" type="email" className={inputClass} value={companySignatoryEmail}
                onChange={(e) => setCompanySignatoryEmail(e.target.value)} />
            </div>
          </div>
        )}
        <p className="mt-3 text-[12.5px] text-neutral-mist">
          Shown below as the Company signer to add in Dropbox Sign — leave blank and use
          whoever your account defaults to when sending.
        </p>
      </div>

      {prepareError && <p className="text-[13px] text-red-600" role="alert">{prepareError}</p>}

      <div className="flex flex-wrap items-center gap-4 border-t border-neutral-border pt-5">
        <button type="submit"
          className="inline-flex items-center rounded-md bg-institutional-navy px-7 py-3 text-[15px] font-semibold text-white transition-[background-color,transform] duration-150 ease-out-soft hover:bg-navy-deep active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal">
          Prepare fields for Dropbox Sign
        </button>
        <button type="button" onClick={() => setShowDecline((v) => !v)}
          className="text-[14px] font-semibold text-neutral-slate transition-colors hover:text-institutional-navy">
          Decline this subscription instead
        </button>
      </div>

      {showDecline && (
        <div className="rounded-md border border-neutral-border bg-neutral-paper p-4 space-y-3">
          <p className="text-[13px] leading-relaxed text-neutral-slate">
            Records a decline against <strong>{investorEmail}</strong> in Airtable, and emails them a
            short, generic decline notice. Nothing above is sent.
          </p>
          <div className="space-y-1.5">
            <label htmlFor="declineReason" className={labelClass}>
              Reason <span className="font-normal text-neutral-mist">(optional, kept in Notes)</span>
            </label>
            <textarea id="declineReason" rows={2} className={inputClass} value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)} />
          </div>
          {declineError && <p className="text-[13px] text-red-600" role="alert">{declineError}</p>}
          <button type="button" onClick={handleDecline} disabled={declining}
            className="inline-flex items-center rounded-md border-[1.5px] border-red-700 px-6 py-2.5 text-[14px] font-semibold text-red-700 transition-colors duration-150 ease-out-soft hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
            {declining ? "Recording..." : "Confirm decline"}
          </button>
        </div>
      )}

      <div className="border-t border-neutral-border pt-5">
        <button type="button" onClick={() => setShowIssueNote((v) => !v)}
          className="text-[14px] font-semibold text-neutral-slate transition-colors hover:text-institutional-navy">
          Wire received — issue Note instead
        </button>
      </div>

      {showIssueNote && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 space-y-3">
          <p className="text-[13px] leading-relaxed text-amber-900">
            Prepares the Secured Promissory Note&apos;s fields for a Dropbox Sign send with only
            the company signatory. <strong>Only do this after you have independently confirmed
            the investor&apos;s wire has actually cleared</strong> — nothing in this app verifies
            that automatically. This is separate from the Pledge Agreement above and does not
            require it to have been sent first.
          </p>
          {noteError && <p className="text-[13px] text-red-600" role="alert">{noteError}</p>}
          <button type="button" onClick={handlePrepareNote}
            className="inline-flex items-center rounded-md bg-institutional-navy px-6 py-2.5 text-[14px] font-semibold text-white transition-colors duration-150 ease-out-soft hover:bg-navy-deep">
            Prepare Note fields
          </button>
        </div>
      )}
    </form>
  );
}
