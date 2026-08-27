"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AdminContact, AdminStage, SpcContactOption } from "../../lib/airtable";

// ---- Stage + pipeline presentation ----------------------------------------

// Labels reuse the same words as the pipeline below ("Subscription",
// "Review", "Signature") rather than the raw Airtable status tags
// (Interested/Committed/Accepted), which read as internal jargon out of
// context. Each names the step the submission is actually waiting on.
const STAGE_META: Record<AdminStage, { label: string; badge: string }> = {
  interested: { label: "Awaiting subscription", badge: "bg-steel-teal-tint text-institutional-navy" },
  committed: { label: "Awaiting review", badge: "bg-amber-100 text-amber-800" },
  accepted: { label: "Awaiting signature", badge: "bg-emerald-100 text-emerald-800" },
  funded: { label: "Funded — Note issued", badge: "bg-institutional-navy text-white" },
  declined: { label: "Declined", badge: "bg-red-100 text-red-700" },
};

// The full pipeline, all five steps now reachable: Funded is set only by the
// "Wire received - issue Note" action (a human confirms the wire actually
// cleared; there is no bank integration to detect this automatically). The
// Note is deliberately never sent as part of accepting a subscription - see
// app/lib/dropboxSign.ts for why.
const PIPELINE = ["Lead", "Subscription", "Review", "Signature", "Funded"] as const;

// Index of the step currently in progress for each stage (0-based into PIPELINE).
function currentStepIndex(stage: AdminStage): number {
  switch (stage) {
    case "interested":
      return 1; // Lead done, subscription pending
    case "committed":
      return 2; // Awaiting review
    case "accepted":
      return 3; // Awaiting signature
    case "funded":
      return 5; // Past the last index - every step (including Funded) renders complete
    case "declined":
      return 2; // Stopped at review
  }
}

type NextAction = { text: string; owner: string; staffActionNeeded: boolean };

function nextAction(stage: AdminStage): NextAction {
  switch (stage) {
    case "interested":
      return { text: "Awaiting investor to complete the subscription form", owner: "Investor", staffActionNeeded: false };
    case "committed":
      return { text: "Awaiting your review — accept or decline this subscription", owner: "Staff", staffActionNeeded: true };
    case "accepted":
      return { text: "Pledge Agreement sent — awaiting signatures, then the wire", owner: "Investor", staffActionNeeded: false };
    case "funded":
      return { text: "Complete — wire received and Note issued", owner: "—", staffActionNeeded: false };
    case "declined":
      return { text: "Closed — subscription was declined", owner: "—", staffActionNeeded: false };
  }
}

// ---- Formatting helpers ----------------------------------------------------

function formatCurrency(n: number | undefined): string | undefined {
  if (n === undefined) return undefined;
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ---- Small building blocks -------------------------------------------------

const ALL_STAGES = Object.keys(STAGE_META) as AdminStage[];

// Shared stage-change behaviour for the row badge and the drawer field, so
// the two controls can't drift into behaving differently. On failure the
// parent state is left untouched, which makes the controlled <select> snap
// back to the real stage on its own.
function useStageChange(
  contactId: string,
  onStageChanged: (id: string, stage: AdminStage, tags: string[]) => void,
) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: AdminStage, current: AdminStage) {
    if (next === current) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/investors/${encodeURIComponent(contactId)}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: next }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Could not change the stage.");
        return;
      }
      onStageChanged(contactId, next, Array.isArray(data?.tags) ? data.tags : []);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  return { change, saving, error };
}

// A native <select> deliberately, not a custom popup: the table it sits in
// scrolls horizontally (overflow-x-auto), which would clip an absolutely
// positioned menu. A native control's popup escapes that entirely, and comes
// with keyboard and screen-reader support already correct.
//
// `compact` renders it as the stage pill itself for the table row; otherwise
// it renders as a normal form field for the drawer.
function StageSelect({
  stage,
  investorName,
  saving,
  error,
  onChange,
  compact = false,
  id,
}: {
  stage: AdminStage;
  investorName: string;
  saving: boolean;
  error: string | null;
  onChange: (next: AdminStage) => void;
  compact?: boolean;
  id?: string;
}) {
  const meta = STAGE_META[stage];
  const options = ALL_STAGES.map((s) => (
    <option key={s} value={s}>
      {STAGE_META[s].label}
    </option>
  ));

  const shared =
    "cursor-pointer appearance-none transition-colors duration-150 ease-out-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal disabled:cursor-wait disabled:opacity-60";

  if (compact) {
    return (
      // Stops a click on the control from also opening the row's drawer.
      <span
        className="relative inline-flex items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <select
          aria-label={`Stage for ${investorName}`}
          title={error ?? "Change stage"}
          value={stage}
          disabled={saving}
          onChange={(e) => onChange(e.target.value as AdminStage)}
          className={`${shared} rounded-full py-0.5 pr-7 pl-2.5 text-[12px] font-semibold ${meta.badge} ${
            error ? "outline outline-2 outline-offset-1 outline-red-500" : ""
          }`}
        >
          {options}
        </select>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden
          className={`pointer-events-none absolute right-2.5 opacity-70 ${meta.badge.split(" ").find((c) => c.startsWith("text-")) ?? ""}`}
        >
          <path d="M2.5 4L5 6.5L7.5 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  return (
    <select
      id={id}
      aria-label={`Stage for ${investorName}`}
      value={stage}
      disabled={saving}
      onChange={(e) => onChange(e.target.value as AdminStage)}
      className={`${shared} w-full rounded-md border-[1.5px] border-neutral-border bg-neutral-white px-3.5 py-2.5 text-[14px] text-neutral-ink focus:border-institutional-navy`}
    >
      {options}
    </select>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone?: "action" }) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        tone === "action" ? "border-amber-300 bg-amber-50" : "border-neutral-border bg-neutral-white"
      }`}
    >
      <p className="text-[12px] font-semibold tracking-[0.04em] text-neutral-mist uppercase">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone === "action" ? "text-amber-800" : "text-institutional-navy"}`}>
        {value}
      </p>
    </div>
  );
}

function Pipeline({ stage }: { stage: AdminStage }) {
  const current = currentStepIndex(stage);
  const declined = stage === "declined";
  return (
    <ol className="flex items-center">
      {PIPELINE.map((step, i) => {
        const complete = i < current;
        const isCurrent = i === current && !declined;
        const stopped = declined && i === current;
        return (
          <li key={step} className={`flex items-center ${i < PIPELINE.length - 1 ? "flex-1" : ""}`}>
            <div className="flex flex-col items-center">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] text-[11px] font-semibold ${
                  stopped
                    ? "border-red-400 bg-red-100 text-red-700"
                    : complete
                      ? "border-institutional-navy bg-institutional-navy text-white"
                      : isCurrent
                        ? "border-steel-teal bg-steel-teal-tint text-institutional-navy"
                        : "border-neutral-border bg-neutral-white text-neutral-mist"
                }`}
              >
                {stopped ? "✕" : complete ? "✓" : i + 1}
              </span>
              <span
                className={`mt-1.5 text-[11px] font-medium whitespace-nowrap ${
                  complete || isCurrent ? "text-institutional-navy" : "text-neutral-mist"
                }`}
              >
                {step}
              </span>
            </div>
            {i < PIPELINE.length - 1 && (
              <span className={`mx-1 mb-4 h-px flex-1 ${complete ? "bg-institutional-navy" : "bg-neutral-border"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// Own component because each row needs its own hook state, and hooks can't be
// called inside the rows' .map().
function StageCell({
  contact,
  onStageChanged,
}: {
  contact: AdminContact;
  onStageChanged: (id: string, stage: AdminStage, tags: string[]) => void;
}) {
  const { change, saving, error } = useStageChange(contact.id, onStageChanged);
  return (
    <StageSelect
      compact
      stage={contact.stage}
      investorName={contact.name}
      saving={saving}
      error={error}
      onChange={(next) => change(next, contact.stage)}
    />
  );
}

// A checkbox that can show the native indeterminate ("some, not all") state,
// which only exists as a DOM property, not an HTML attribute or React prop -
// it has to be set imperatively on the element.
function TriStateCheckbox({
  checked,
  indeterminate = false,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={ariaLabel}
      className="h-4 w-4 cursor-pointer accent-institutional-navy"
    />
  );
}

// ---- Detail drawer ---------------------------------------------------------

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[12px] font-semibold tracking-[0.04em] text-neutral-mist uppercase">{label}</dt>
      <dd className="mt-0.5 text-[14px] leading-relaxed break-words text-neutral-slate">{value}</dd>
    </div>
  );
}

function Drawer({
  contact,
  owners,
  onClose,
  onDeleted,
  onStageChanged,
}: {
  contact: AdminContact;
  owners: SpcContactOption[];
  onClose: () => void;
  onDeleted: (id: string) => void;
  onStageChanged: (id: string, stage: AdminStage, tags: string[]) => void;
}) {
  const action = nextAction(contact.stage);
  const amount = formatCurrency(contact.principalAmount);
  const canOpenStaffTool = contact.stage === "committed" || contact.stage === "accepted";
  // Falls back to the raw id if the owner list couldn't be loaded, so the
  // field still tells you something rather than silently disappearing.
  const ownerName = contact.spcContactId
    ? (owners.find((o) => o.id === contact.spcContactId)?.name ?? contact.spcContactId)
    : undefined;

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { change: changeStage, saving: savingStage, error: stageError } = useStageChange(
    contact.id,
    onStageChanged,
  );

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/investors/${encodeURIComponent(contact.id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.deleted) {
        setDeleteError(data?.error ?? "Could not delete this submission. Check that Airtable is configured.");
        setDeleting(false);
        return;
      }
      onDeleted(contact.id);
    } catch {
      setDeleteError("Could not reach the server.");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-label={`Submission detail for ${contact.name}`}
        className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-neutral-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-neutral-border px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-[family-name:var(--font-display)] text-xl font-medium text-institutional-navy">
                {contact.name}
              </h2>
              {/* The badge is the control - one stage affordance in the app,
                  in the place the eye already goes for status. */}
              <StageSelect
                compact
                stage={contact.stage}
                investorName={contact.name}
                saving={savingStage}
                error={stageError}
                onChange={(next) => changeStage(next, contact.stage)}
              />
            </div>
            <p className="mt-0.5 truncate text-[13px] text-neutral-mist">{contact.email}</p>
            {stageError && (
              <p className="mt-1 text-[12.5px] text-red-600" role="alert">
                {stageError}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-mist transition-colors hover:bg-neutral-paper hover:text-institutional-navy"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <path d="M4 4l10 10M14 4L4 14" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section>
            <p className="mb-3 text-[12px] font-semibold tracking-[0.04em] text-neutral-mist uppercase">Pipeline</p>
            <Pipeline stage={contact.stage} />
          </section>

          <section
            className={`rounded-lg border p-4 ${
              action.staffActionNeeded ? "border-amber-300 bg-amber-50" : "border-neutral-border bg-neutral-paper"
            }`}
          >
            <p className="text-[12px] font-semibold tracking-[0.04em] text-neutral-mist uppercase">Next action</p>
            <p className={`mt-1 text-[14px] font-medium ${action.staffActionNeeded ? "text-amber-900" : "text-institutional-navy"}`}>
              {action.text}
            </p>
            <p className="mt-1 text-[13px] text-neutral-slate">
              Waiting on: <span className="font-semibold">{action.owner}</span>
            </p>
          </section>

          <section>
            <p className="mb-3 text-[12px] font-semibold tracking-[0.04em] text-neutral-mist uppercase">Details</p>
            <dl className="grid grid-cols-2 gap-4">
              <DetailRow label="Investor type" value={contact.investorType} />
              <DetailRow label="Phone" value={contact.phone} />
              <DetailRow label="Committed amount" value={amount} />
              <DetailRow label="Intended amount" value={contact.intendedInvestment} />
              <DetailRow label="Note term" value={contact.noteTermOption} />
              <DetailRow
                label="Distribution"
                value={contact.distribution ? (contact.distribution === "distribute" ? "Quarterly cash" : "Reinvest") : undefined}
              />
              <DetailRow label="Address" value={contact.address} />
              <DetailRow label="Third-party financing" value={contact.thirdPartyFinancing} />
              <DetailRow label="Accreditation" value={contact.accreditation} />
              <DetailRow label="Submitted" value={formatDate(contact.submittedAt)} />
              <DetailRow label="Whose prospect" value={ownerName} />
            </dl>
          </section>

          {/* The raw Airtable multi-select, shown here rather than anywhere in
              the main UI. Stage above is derived from these and is what staff
              works from; these are worth seeing because they can carry things
              the derived stage hides - "Note Issued", or a tag added directly
              in Airtable - which would otherwise be invisible in this app. */}
          <section>
            <p className="mb-2 text-[12px] font-semibold tracking-[0.04em] text-neutral-mist uppercase">
              CRM status tags
            </p>
            {contact.statusTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {contact.statusTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-neutral-border bg-neutral-paper px-2 py-0.5 text-[12px] text-neutral-slate"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[12.5px] text-neutral-mist">None set on this record.</p>
            )}
            <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-mist">
              The raw multi-select on the Airtable record. Stage is derived from these, taking the
              furthest one along.
            </p>
          </section>

          <section>
            <p className="mb-2 text-[12px] font-semibold tracking-[0.04em] text-neutral-mist uppercase">Full record notes</p>
            <pre className="max-h-56 overflow-y-auto rounded-md border border-neutral-border bg-neutral-paper p-3 text-[12.5px] leading-relaxed whitespace-pre-wrap text-neutral-slate">
              {contact.notes || "(no notes)"}
            </pre>
          </section>
        </div>

        <div className="space-y-3 border-t border-neutral-border px-6 py-4">
          {canOpenStaffTool ? (
            <Link
              href={`/admin/investors/${encodeURIComponent(contact.id)}/prepare`}
              className="inline-flex w-full items-center justify-center rounded-md bg-institutional-navy px-7 py-3 text-[15px] font-semibold text-white transition-[background-color,transform] duration-150 ease-out-soft hover:bg-navy-deep active:scale-[0.98]"
            >
              Prepare documents →
            </Link>
          ) : (
            <p className="text-center text-[13px] text-neutral-mist">
              {contact.stage === "interested"
                ? "Not ready for documents yet — move them to Committed once they confirm an amount and term."
                : contact.stage === "funded"
                  ? "Complete — the wire was received and the Note has been issued."
                  : "This subscription was declined. No further action."}
            </p>
          )}

          <Link
            href={`/admin/investors/${encodeURIComponent(contact.id)}/edit`}
            className="inline-flex w-full items-center justify-center rounded-md border-[1.5px] border-neutral-border px-7 py-2.5 text-[14px] font-semibold text-institutional-navy transition-colors duration-150 ease-out-soft hover:border-steel-teal hover:bg-steel-teal-tint"
          >
            Edit details
          </Link>

          {confirmingDelete ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-center">
              <p className="text-[13px] text-red-800">
                Permanently delete this submission and its Airtable record? This can&apos;t be undone.
              </p>
              {deleteError && <p className="mt-1.5 text-[12.5px] text-red-700">{deleteError}</p>}
              <div className="mt-2.5 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="text-[13px] font-semibold text-neutral-slate hover:text-institutional-navy"
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
              className="w-full text-center text-[12.5px] font-medium text-neutral-mist transition-colors hover:text-red-700"
            >
              Delete this submission
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Dashboard -------------------------------------------------------------

type StageFilter = "all" | AdminStage;
type KindFilter = "all" | "individual" | "entity" | "ira";

export function AdminDashboard({
  contacts: initialContacts,
  owners = [],
  loadError,
}: {
  contacts: AdminContact[];
  owners?: SpcContactOption[];
  loadError?: string | null;
}) {
  // Owned locally (seeded from the server-fetched prop) so a delete can
  // remove a row immediately without a full page reload/refetch.
  const [contacts, setContacts] = useState(initialContacts);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [needsActionOnly, setNeedsActionOnly] = useState(false);
  const [selected, setSelected] = useState<AdminContact | null>(null);

  // Multi-select for bulk delete. Kept separate from `selected` (the open
  // drawer), which is one record at a time for viewing detail - these are two
  // different selections that happen to both use checkboxes/rows.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);

  function handleDeleted(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setSelected(null);
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function toggleRowSelected(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  // Selecting "all" only ever acts on the rows currently visible under the
  // active filters - not the whole CRM - but ids picked under one filter stay
  // selected if you then narrow the filter further, so filter-then-select,
  // change filter, select-more composes rather than resetting.
  function toggleSelectAllFiltered(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const c of filtered) {
        if (checked) next.add(c.id);
        else next.delete(c.id);
      }
      return next;
    });
  }

  async function handleBulkDelete() {
    setBulkDeleting(true);
    setBulkDeleteError(null);
    const ids = Array.from(selectedIds);
    try {
      const res = await fetch("/api/admin/investors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = (await res.json().catch(() => null)) as
        | { deletedIds?: string[]; failedIds?: string[]; error?: string }
        | null;
      if (!res.ok) {
        setBulkDeleteError(data?.error ?? "Could not delete the selected records.");
        setBulkDeleting(false);
        return;
      }
      const deletedIds = new Set(data?.deletedIds ?? []);
      setContacts((prev) => prev.filter((c) => !deletedIds.has(c.id)));
      setSelected((prev) => (prev && deletedIds.has(prev.id) ? null : prev));

      const failedIds = data?.failedIds ?? [];
      if (failedIds.length > 0) {
        // Partial success: keep the ones that failed selected so it's obvious
        // which rows still need attention, rather than silently clearing them
        // along with the ones that actually deleted.
        setSelectedIds(new Set(failedIds));
        setBulkDeleteError(
          `Deleted ${deletedIds.size} of ${ids.length}. ${failedIds.length} could not be deleted - try again or check Airtable.`,
        );
      } else {
        setSelectedIds(new Set());
        setConfirmingBulkDelete(false);
      }
    } catch {
      setBulkDeleteError("Could not reach the server.");
    } finally {
      setBulkDeleting(false);
    }
  }

  // Updates the row and the open drawer in place, so the badge, stepper,
  // next-action text and status tags all reflect the new stage without a page
  // reload. The tags come back from the write itself rather than being
  // guessed here, so what's displayed is what was actually stored.
  function handleStageChanged(id: string, stage: AdminStage, tags: string[]) {
    const apply = (c: AdminContact): AdminContact =>
      c.id === id ? { ...c, stage, statusTags: tags.length ? tags : c.statusTags } : c;
    setContacts((prev) => prev.map(apply));
    setSelected((prev) => (prev ? apply(prev) : prev));
  }

  const counts = useMemo(() => {
    const c = { total: contacts.length, interested: 0, committed: 0, accepted: 0, funded: 0, declined: 0 };
    for (const x of contacts) c[x.stage] += 1;
    return c;
  }, [contacts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (stageFilter !== "all" && c.stage !== stageFilter) return false;
      if (kindFilter !== "all" && c.investorKind !== kindFilter) return false;
      if (needsActionOnly && !nextAction(c.stage).staffActionNeeded) return false;
      if (q && !(`${c.name} ${c.email}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [contacts, search, stageFilter, kindFilter, needsActionOnly]);

  const filteredSelectedCount = useMemo(
    () => filtered.reduce((n, c) => n + (selectedIds.has(c.id) ? 1 : 0), 0),
    [filtered, selectedIds],
  );
  const allFilteredSelected = filtered.length > 0 && filteredSelectedCount === filtered.length;
  const someFilteredSelected = filteredSelectedCount > 0 && !allFilteredSelected;

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-institutional-navy">
            Investors
          </h1>
          <p className="mt-1 text-[14px] text-neutral-slate">
            Everyone who came through the website, plus anyone you have added yourself.
          </p>
        </div>
        <Link
          href="/admin/investors/new"
          className="inline-flex items-center gap-2 rounded-md bg-institutional-navy px-5 py-2.5 text-[14px] font-semibold text-white transition-[background-color,transform] duration-150 ease-out-soft hover:bg-navy-deep active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M7.5 3v9M3 7.5h9" strokeLinecap="round" />
          </svg>
          Add investor
        </Link>
      </div>

      {loadError ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-[14px] text-red-700">{loadError}</div>
      ) : (
        <>
          {/* One card per pipeline stage, labelled with the same words the
              stage badges and the stepper use. "Total" is deliberately absent:
              it isn't a stage, and the row count below already states it. */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <SummaryCard label="Awaiting review" value={counts.committed} tone="action" />
            <SummaryCard label="Awaiting subscription" value={counts.interested} />
            <SummaryCard label="Awaiting signature" value={counts.accepted} />
            <SummaryCard label="Funded" value={counts.funded} />
            <SummaryCard label="Declined" value={counts.declined} />
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email"
              className="min-w-[200px] flex-1 rounded-md border-[1.5px] border-neutral-border bg-neutral-white px-3.5 py-2.5 text-[14px] text-neutral-ink transition-colors placeholder:text-neutral-mist focus:border-institutional-navy focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-steel-teal"
            />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as StageFilter)}
              className="rounded-md border-[1.5px] border-neutral-border bg-neutral-white px-3.5 py-2.5 text-[14px] text-neutral-ink focus:border-institutional-navy focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-steel-teal"
            >
              <option value="all">All stages</option>
              <option value="interested">Awaiting subscription</option>
              <option value="committed">Awaiting review</option>
              <option value="accepted">Awaiting signature</option>
              <option value="funded">Funded — Note issued</option>
              <option value="declined">Declined</option>
            </select>
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value as KindFilter)}
              className="rounded-md border-[1.5px] border-neutral-border bg-neutral-white px-3.5 py-2.5 text-[14px] text-neutral-ink focus:border-institutional-navy focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-steel-teal"
            >
              <option value="all">All types</option>
              <option value="individual">Individual</option>
              <option value="entity">Entity</option>
              <option value="ira">IRA</option>
            </select>
            <label className="flex cursor-pointer items-center gap-2 text-[14px] font-medium text-neutral-slate">
              <input
                type="checkbox"
                checked={needsActionOnly}
                onChange={(e) => setNeedsActionOnly(e.target.checked)}
                className="h-4 w-4 accent-institutional-navy"
              />
              Needs my action
            </label>
          </div>

          {/* Bulk action bar - only takes up room once something is selected,
              so it doesn't compete with the filter row the rest of the time. */}
          {selectedIds.size > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-institutional-navy bg-navy-tint px-4 py-3">
              <p className="text-[13.5px] font-semibold text-institutional-navy">
                {selectedIds.size} selected
              </p>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-[13px] font-semibold text-institutional-navy underline underline-offset-2 hover:text-navy-deep"
              >
                Clear
              </button>
              <div className="ml-auto flex flex-wrap items-center gap-3">
                {confirmingBulkDelete ? (
                  <>
                    <span className="text-[13px] text-institutional-navy">
                      Delete {selectedIds.size} record{selectedIds.size === 1 ? "" : "s"}? This can&apos;t be
                      undone.
                    </span>
                    <button
                      type="button"
                      onClick={() => setConfirmingBulkDelete(false)}
                      disabled={bulkDeleting}
                      className="text-[13px] font-semibold text-neutral-slate hover:text-institutional-navy disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkDelete}
                      disabled={bulkDeleting}
                      className="inline-flex items-center rounded-md border-[1.5px] border-red-700 bg-neutral-white px-4 py-1.5 text-[13px] font-semibold text-red-700 transition-colors duration-150 ease-out-soft hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {bulkDeleting ? "Deleting…" : "Confirm delete"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingBulkDelete(true)}
                    className="inline-flex items-center rounded-md border-[1.5px] border-red-700 px-4 py-1.5 text-[13px] font-semibold text-red-700 transition-colors duration-150 ease-out-soft hover:bg-red-50"
                  >
                    Delete selected
                  </button>
                )}
              </div>
              {bulkDeleteError && (
                <p className="w-full text-[13px] text-red-700" role="alert">
                  {bulkDeleteError}
                </p>
              )}
            </div>
          )}

          {/* Table */}
          <div className="mt-4 overflow-hidden rounded-lg border border-neutral-border bg-neutral-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="border-b border-neutral-border bg-neutral-paper text-[12px] tracking-[0.04em] text-neutral-mist uppercase">
                    <th className="w-10 px-4 py-3">
                      <TriStateCheckbox
                        checked={allFilteredSelected}
                        indeterminate={someFilteredSelected}
                        onChange={toggleSelectAllFiltered}
                        ariaLabel={allFilteredSelected ? "Deselect all" : "Select all"}
                      />
                    </th>
                    <th className="px-4 py-3 font-semibold">Investor</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Stage</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Next action</th>
                    <th className="px-4 py-3 font-semibold">Submitted</th>
                    {/* `relative` is load-bearing: sr-only is position:absolute,
                        so without a positioned ancestor its containing block is
                        the page itself. Sitting past the right edge of a table
                        wider than the viewport, it escaped the table's
                        overflow container and gave the whole page a horizontal
                        scrollbar on mobile. */}
                    <th className="relative px-4 py-3 font-semibold">
                      <span className="sr-only">Prepare for signature</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center">
                        {contacts.length === 0 ? (
                          <>
                            <p className="text-[14px] font-semibold text-institutional-navy">
                              No investors yet
                            </p>
                            <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-neutral-mist">
                              Anyone who requests the memorandum or subscribes on the website lands
                              here automatically. You can also add someone you met directly.
                            </p>
                            <Link
                              href="/admin/investors/new"
                              className="mt-4 inline-flex items-center rounded-md border-[1.5px] border-institutional-navy px-5 py-2 text-[13.5px] font-semibold text-institutional-navy transition-colors duration-150 ease-out-soft hover:bg-navy-tint"
                            >
                              Add an investor
                            </Link>
                          </>
                        ) : (
                          <p className="text-[14px] text-neutral-mist">
                            No investors match these filters.
                          </p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => {
                      const action = nextAction(c.stage);
                      const amount = formatCurrency(c.principalAmount) ?? c.intendedInvestment ?? "—";
                      const canPrepare = c.stage === "committed" || c.stage === "accepted";
                      return (
                        <tr
                          key={c.id}
                          onClick={() => setSelected(c)}
                          className="cursor-pointer border-b border-neutral-border transition-colors last:border-0 hover:bg-neutral-paper"
                        >
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <TriStateCheckbox
                              checked={selectedIds.has(c.id)}
                              onChange={(checked) => toggleRowSelected(c.id, checked)}
                              ariaLabel={`Select ${c.name}`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-institutional-navy">{c.name}</p>
                            <p className="text-[12.5px] text-neutral-mist">{c.email}</p>
                          </td>
                          <td className="px-4 py-3 text-neutral-slate capitalize">{c.investorKind ?? c.investorType ?? "—"}</td>
                          <td className="px-4 py-3">
                            <StageCell contact={c} onStageChanged={handleStageChanged} />
                          </td>
                          <td className="px-4 py-3 text-neutral-slate">{amount}</td>
                          <td className="px-4 py-3">
                            {/* The action itself, not just who owns it - the
                                column header promises the former. */}
                            <span className="flex items-start gap-1.5 text-[13px] text-neutral-slate">
                              {action.staffActionNeeded && (
                                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
                              )}
                              <span>
                                {action.text}
                                {action.owner !== "—" && (
                                  <span className="block text-[12px] text-neutral-mist">{action.owner}</span>
                                )}
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-neutral-mist">{formatDate(c.submittedAt)}</td>
                          <td className="px-4 py-3 text-right">
                            {canPrepare && (
                              <Link
                                href={`/admin/investors/${encodeURIComponent(c.id)}/prepare`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center rounded-md border-[1.5px] border-neutral-border px-3 py-1.5 text-[12.5px] font-semibold whitespace-nowrap text-institutional-navy transition-colors duration-150 ease-out-soft hover:border-steel-teal hover:bg-steel-teal-tint"
                              >
                                Prepare →
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-3 text-[12.5px] text-neutral-mist">
            Showing {filtered.length} of {contacts.length}. Click any row for full detail and next steps.
          </p>
        </>
      )}

      {selected && (
        <Drawer
          contact={selected}
          owners={owners}
          onClose={() => setSelected(null)}
          onDeleted={handleDeleted}
          onStageChanged={handleStageChanged}
        />
      )}
    </div>
  );
}
