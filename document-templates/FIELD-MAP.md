# Document merge fields

Three document templates were built from source documents by replacing every
investor-specific bracketed placeholder with a `{{merge_field}}` tag, then - as of
2026-08-16, see "Blank space, not visible placeholders" below - replacing those tags
with genuine blank space. The surrounding legal language is unchanged throughout. This
file is the **only** place that records where each field goes and what it's called;
the documents themselves no longer contain any visible marker at all. `{{snake_case}}`
names still appear throughout this file as location references (e.g. "where
`{{lender_name}}` used to be") purely for continuity with earlier notes and because
they're still what the field is called when building the Dropbox Sign template - not
because that text exists in the `.docx` files anymore.

## Field renamed: capacity clause (2026-08-21)

`{{secured_party_capacity_clause}}` is now **`{{office_or_residence_location}}`**, in
the Dropbox Sign template, in the admin's field sheet, and everywhere in this file.
The value it carries is unchanged: still the investor's address wrapped in the legal
capacity phrasing for their investor type (see "The capacity clause" below). Only the
name changed, to something the person assembling a packet can recognise. Any Dropbox
Sign template still carrying the old field name will not populate.

## Blank space, not visible placeholders (2026-08-16)

Dropbox Sign's fields do **not** paint an opaque background over whatever's beneath
them - a field placed over visible text doesn't hide that text, it just overlays the
typed-in value directly on top, producing jumbled, unreadable overlapping text. This
was discovered after the Note and part of the Pledge had already been built with
fields placed directly over `{{field}}` bracket text, which would have produced exactly
that problem in every real signed document.

The fix: every `{{field}}` placeholder across all three documents was replaced with
blank space (non-breaking spaces specifically - see below - not underscores or any
other visible character) instead of bracket text. The static label text before each
field (e.g. "Full legal name:", "Address:") is untouched - only the variable part
became blank.
This means the documents no longer show you where to click when building the Dropbox
Sign template; use this file's field tables and the printed labels as your guide
instead of looking for bracket text on the page.

Blank space width follows a simple rule:
- **Fields embedded in prose whose value can run long** - names and dollar amounts,
  since a formatted principal amount (`$10,000,000.00`) can run just as long as a
  name - got **double** width. Five fields qualify: `{{lender_name}}` in the Note's
  and the Pledge's opening paragraphs; and `{{principal_amount}}`, which appears
  inline in **all three** documents (Note opening paragraph, Pledge Recital A,
  Subscription Agreement Section 1).
- **`{{office_or_residence_location}}`** (Pledge) got extra-wide space beyond even
  the doubled width, since it's a full computed sentence (up to ~110 characters), not
  a single value.
- **Everything else** - dates, rates, entity types, `{{term_months}}`, standalone
  "Label: value" lines - got a standard width, since these have a bounded, predictable
  length.

Two further fixes (both 2026-08-16, both discovered after the fact and both apply to
every blank across all three documents, not just the wide ones):

1. **Every blank uses non-breaking spaces (Unicode U+00A0), not regular spaces.** A run of
   regular spaces left inline can land right at a natural word-wrap point, and when
   that happens the portion that wraps becomes leading whitespace on the new line,
   which Word collapses to nothing - the blank silently disappears with no visible gap
   at all. This first surfaced on `principal_amount` in the Note, but the same
   `term_months` blank in the Subscription Agreement did it too once looked for -
   it's a risk for any inline blank, not just wide ones. Non-breaking spaces can't be
   split mid-run: the whole blank either fits on the current line or moves as one
   unbroken block to the next, but it's never partially collapsed.

2. **Every field with real text immediately following it in the same sentence gets a
   manual line break inserted right after its blank**, pushing that trailing text to
   start fresh on the next line - the label and blank stay together on one line,
   only what comes after moves. This exists for a different reason than (1): Dropbox
   Sign's fields have **fixed width and don't wrap their typed content**, so however
   wide the field box gets drawn is a hard ceiling on the value length it can safely
   hold. If real text sits immediately to the right of a blank on the same line, the
   box can never be widened past that text without visually overlapping it - so any
   field whose value length isn't tightly bounded needs guaranteed open space to its
   right, not just a wide-looking blank that happens to butt up against more text a
   few characters later. Concretely: `{{lender_name}}` (Note, Pledge),
   `{{principal_amount}}` (all three documents), `{{maturity_date}}` (Note),
   `{{effective_date}}` (Pledge), and `{{term_months}}` (Subscription Agreement) all
   have a break inserted after their blank for this reason. `{{annual_rate}}` and
   `{{monthly_rate}}` (Note) were left inline despite having trailing text (a literal
   `%` immediately after) - their values are short and bounded (e.g. `8.30`), splitting
   the number from its `%` across a line would look worse than the low overflow risk
   it avoids, and hitting even the full remaining line width would take several times
   the longest realistic rate value.

   The paragraphs touched by either fix were switched from justified to left-aligned -
   manual breaks inside justified text stretch the preceding line's visible words
   apart into ugly gaps, since Word tries to fill the line width on every line except
   the paragraph's true last one.

## No Dropbox Sign API — sending is manual

As of 2026-08-16, SPM's Dropbox Sign account does not have API access (that's a
separate paid product from the app plan used to send documents by hand - see
`app/lib/dropboxSign.ts`'s header comment). Every `{{field}}` below should be
configured in the Dropbox Sign template editor as **"Me (when sending)"** - the field
type Dropbox Sign fills in by hand each time a document is sent from a saved template,
not one populated by an API call. `app/lib/dropboxSign.ts` has no network calls; it
only computes the values staff need to paste in (the capacity clause, the
%-stripped rates, etc.) and the admin tool at `/admin/send-for-signature` displays them
as a copy-paste field sheet. The `id` column in the field dictionary below is the
human-readable label to match against when placing each field in the editor - it is
not an API parameter name the way it would be if a paid API plan were added later.

The dashboard's "Select documents to be signed" screen has an **"Add template"**
button alongside "Upload" - confirmed (2026-08-16, screenshot) that it accepts more
than one saved template in the same "Selected documents" list. This means the
Subscription Agreement and Pledge Agreement can be sent together as **one** signature
request, not two - see "When each document is sent" below.

Templates:
- `SPM-Secured-Promissory-Note-TEMPLATE.docx` (from `Exhibit_A_Form_of_Secured_Promissory_Note (2).docx`)
- `SPM-Membership-Interest-Pledge-Agreement-TEMPLATE.docx` (from
  `Exhibit_B_Form_of_Membership_Interest_Pledge_Agreement (3).docx`)
- `SPM-Subscription-Agreement-TEMPLATE.docx` (from `SPM-Subscription-Agreement-DRAFT.docx`,
  which itself was drafted from the PPM's own subscription requirements - not from an
  Exhibit. Still marked "DRAFT — FOR REVIEW BY MOSS & MOSS LLP" and not to be used until
  counsel approves it. **See the "$250,000 discrepancy" section below — do not send
  this document to an investor until that is resolved.**)

These are the second generation of these three templates (2026-08-09), rebuilt from
freshly supplied source `.docx` files. Structurally identical field mapping to the
prior generation, with two substantive differences: the Note's `annual_rate`/
`monthly_rate` custom field values are now sent **without** a `%` character (the new
source document has a literal `%` printed immediately after the placeholder, so
including one in the value would double it up - see the field dictionary below), and
the Pledge's `{{office_or_residence_location}}` now has a real IRA-specific phrasing
instead of falling back to the individual phrasing (see "The capacity clause" below).

The previous templates, built from the executed Vahag d'Ambrosi documents, are kept
for reference in `_superseded-vahag-derived/`. They used a different field structure
(split address lines, no Secured Party signature) that does not match the current
form documents and should not be used.

## Resolved: $250,000 vs $200,000 minimum investment

The source `SPM-Subscription-Agreement-DRAFT.docx` supplied on 2026-08-09 stated a
$250,000 individual-investor minimum in Section 6, which conflicted with the PPM
(`SPM_PPM_v6_June 2026 (2).docx`, correctly $200,000 throughout) and the website
(already $200,000). This was flagged to the user rather than silently fixed, since the
instruction accompanying the new documents was to change nothing but merge-field
mapping and IRA phrasing. The user then explicitly authorized the correction. Section 6
of both `SPM-Subscription-Agreement-DRAFT.docx` and `SPM-Subscription-Agreement-
TEMPLATE.docx` now read **$200,000** for an individual Investor, consistent with the
PPM and the website. Verified via a targeted run-level edit (touching only the digit
that differed) plus a full Word→PDF visual re-render of the affected page - no other
text in the paragraph or document changed.

## When each document is sent

Per the PPM's own Subscription Process, these are sent at two different points in
time, not all at once (see `app/lib/dropboxSign.ts`):

- **Acceptance** (`buildAcceptanceFieldSheets`): Subscription Agreement + Pledge
  Agreement, sent together as **one signature request** from the Dropbox Sign
  dashboard - start "Use Template" on either document, then use "Add template" to add
  the other before sending, dual-signer (company + investor) across both. Clicking
  "Prepare fields for Dropbox Sign" in the staff tool computes both documents' field
  sheets; Dropbox Sign still prompts for each document's own fields separately even
  within the combined send, so staff pastes values from both cards. Staff does the
  actual sending in Dropbox Sign itself and comes back to confirm.
- **Note issuance** (`buildNoteFieldSheet`): the Note, sent alone, company-signer-only,
  and ONLY after staff has independently confirmed the investor's wire actually
  cleared. The PPM states Note issuance happens "upon receipt of cleared funds"
  (Step 5) — sending it at acceptance, before funds move, would mean SPM executes a
  debt instrument for money it hasn't received. There is no bank integration; a human
  confirms this, both for the wire and (now that sending is manual) for the send
  itself.

## Who signs what

- **Note**: signed only by Stage Point ("by: Whitney S. Quillen, CEO", one signature
  block). The Lender never signs the Note; it is a unilateral promise to pay, and the
  Lender's details appear only for identification and notice purposes.
- **Pledge**: signed by Stage Point **twice** ("Consent: Stage Point Fund, LLC" and
  "Stage Point Master, LLC (Pledgor)", both by Whitney S. Quillen) **and** by the
  **Secured Party** (the investor), who has their own signature block at the end.
- **Subscription Agreement**: signed once by the investor (one of three variant blocks
  in Section 8 - Individual / Entity / IRA Custodian, depending on investor type) and
  once by Stage Point ("Accepted by Issuer", Whitney S. Quillen). This Agreement states
  it is "not binding on SPM unless and until countersigned by SPM" - the Stage Point
  signature is the acceptance itself.

All three documents share the **same two signer roles** - name them identically
(e.g. "Company" and "Investor") across all three templates when building them in the
Dropbox Sign dashboard.

**Known template-design gap, not yet resolved**: the Subscription Agreement's Section 8
has three signature block *variants* (Individual/Entity/IRA) in the same document, but
only one applies per investor. This template does not hide the other two - they'll
render with blank/unfilled lines under headings that make clear they don't apply (e.g.
an individual investor's copy still shows the empty "Entity Investor" and "IRA /
Retirement Account Investor" blocks). This is functionally harmless but not polished.
If a cleaner result is wanted, the fix is three separate Dropbox Sign templates (one per
investor type) instead of one - a bigger setup lift in the Dropbox Sign dashboard, not
attempted here.

## Field dictionary

The Note and Pledge each use one Dropbox Sign field ID per `{{placeholder}}` name,
even where a placeholder repeats (e.g. `{{lender_name}}` twice in the Pledge - both
occurrences get the same field ID, since there's no ambiguity about which value goes
there). The Subscription Agreement is different - see the dedicated section below the
table for why its field IDs don't match its `{{placeholder}}` names 1:1.

| Placeholder | Meaning | Note | Pledge | Sub. Agmt | Source |
|---|---|---|---|---|---|
| `{{lender_name}}` | Exact legal name of the investor. Called "Lender" in the Note, "Secured Party" in the Pledge, and appears as the individual/entity/IRA-account-owner name across all three of the Subscription Agreement's Section 3 variants | yes | yes | yes* | Subscription (exact legal name, not the lead form's first/last) |
| `{{lender_address}}` | Full mailing address, single field (not split into lines) | yes | yes | yes* | Subscription |
| `{{lender_email}}` | Notice email | yes | no | no | Lead form captures this; confirm at subscription |
| `{{principal_amount}}` | Exact investment, currency formatted (e.g. `$500,000.00`) | yes | yes | yes | Subscription (lead form only captures a range) |
| `{{term_months}}` | Confirmed term, plain number (e.g. `12`); the surrounding text already says "months" | no | no | yes | Confirmed term |
| `{{annual_rate}}` | Annual interest rate, **plain number, no `%`** (e.g. `9.5` not `9.5%`) - the source document text has a literal `%` printed immediately after the placeholder | yes | no | no | From `app/lib/rates.ts` (`NOTE_TERMS`), by confirmed term; `%` stripped in `buildNoteFieldSheet()` before display |
| `{{monthly_rate}}` | Monthly equivalent, **plain number, no `%`**, same reason as `annual_rate` | yes | no | no | From `app/lib/rates.ts`, same source as `annual_rate`; `%` stripped in `buildNoteFieldSheet()` before display |
| `{{maturity_date}}` | Balloon maturity date | yes | no | no | Effective date + term (see Note Section 1.5: the Maturity Date auto-extends unless the Lender gives 60 days' notice; the value entered here is the *initial* Maturity Date only) |
| `{{effective_date}}` | Execution / "dated as of" date, same value across documents ("of even date herewith") | yes | yes | no | Set at issuance. The Subscription Agreement has no such field - its dates are all per-signature "Date Signed" fields, see below |
| `{{entity_state_or_country}}` | Entity's jurisdiction of formation (raw component, not the computed clause) | no | no | yes | Subscription, when investor type is entity |
| `{{entity_type}}` | Entity type, e.g. "limited liability company" (raw component) | no | no | yes | Subscription, when investor type is entity |
| `{{custodian_name}}` | IRA custodian's name | no | no | yes | Subscription, when investor type is IRA |
| `{{custodian_account_number}}` | IRA custodian account number | no | no | yes | Subscription, when investor type is IRA |
| `{{office_or_residence_location}}` | Full capacity clause, one of two forms (see below) | no | yes | no | Computed from investor type, not entered directly |
| `{{signatory_name_and_title}}` | The specific human signing on behalf of an entity or IRA custodian, e.g. "Jane Doe, Managing Member" | no | no | yes* | Subscription, when investor type is entity or IRA |

\* See "Subscription Agreement field IDs and the N/A convention" below - these
placeholders appear multiple times across the three investor-type variants, and each
occurrence gets its own distinct Dropbox Sign field ID, not one shared ID.

## Subscription Agreement field IDs and the N/A convention (2026-08-16)

Section 3 of the Subscription Agreement has three investor-type variants - 3.A
Individual, 3.B Entity, 3.C IRA - all in one shared template, plus a matching
signature-block variant for each. Only one variant applies per investor, but per the
"known template-design gap" noted above, this template doesn't hide the other two -
they print in every signed copy regardless of investor type.

Early in building this template, giving every occurrence of `{{lender_name}}` (and
`{{lender_address}}`, `{{signatory_name_and_title}}`) the same Dropbox Sign field ID
seemed simpler, but it's wrong: Dropbox Sign fills every field sharing one ID from a
single typed value, so typing the investor's real name would also overwrite the two
*inapplicable* sections with that same name, instead of leaving them blank or marked
N/A. Each occurrence needs its own ID so it can independently hold either the real
value or "N/A".

The actual Dropbox Sign field IDs used (see `app/lib/dropboxSign.ts`,
`buildAcceptanceFieldSheets`) - each gets a real value when it matches the current
investor's type, and the literal string `N/A` otherwise, computed automatically by the
admin tool's "Prepare fields" screen (staff never types "N/A" themselves, just copies
whatever the tool shows, same as every other field):

| Field ID | Appears | Applies to |
|---|---|---|
| `principal_amount` | Section 1 | Always - real value |
| `term_months` | Section 1 | Always - real value |
| `lender_name_individual` | "Full legal name" (3.A) and "Print name" (Individual signature block) | Individual only |
| `lender_address_individual` | "Residential address" (3.A) | Individual only |
| `joint_subscriber_name` | "If subscribing jointly..." (3.A) | Individual only - **exception to the N/A rule**: this one is genuinely optional data (not every Individual investor has a joint subscriber), so it's left blank rather than "N/A" when the investor didn't provide one, and only gets "N/A" for Entity/IRA investors where the whole section doesn't apply. Collected at `/subscribe` (Individual investors only) and in the admin tool as a fallback, same pattern as the other type-specific fields. |
| `lender_name_entity` | "Entity legal name" (3.B) and "Entity name" (Entity signature block) | Entity only |
| `entity_state_or_country` | 3.B | Entity only |
| `entity_type` | 3.B | Entity only |
| `lender_address_entity` | "Principal place of business" (3.B) | Entity only |
| `signatory_name_and_title_entity` | Entity signature block | Entity only |
| `custodian_name` | "Name of custodian" (3.C) and "Custodian name" (IRA signature block) | IRA only |
| `custodian_account_number` | 3.C | IRA only |
| `lender_name_ira` | "Name of account owner" (3.C) and "For the account of" (IRA signature block) | IRA only |
| `signatory_name_and_title_ira` | IRA signature block | IRA only |

That's 14 distinct field IDs across 18 physical placements in the document (four IDs -
`lender_name_individual`, `lender_name_entity`, `custodian_name`, `lender_name_ira` -
each appear twice: once in Section 3, once in the matching signature block; the rest,
including `joint_subscriber_name`, appear once).

**Signature and Date signed fields on this document must be marked "not required"** in
all three investor-type signature blocks (Individual/Entity/IRA), for the same
underlying reason - since all three exist in the shared template but only one applies
per investor, marking them required would force the investor to sign in blocks that
don't apply to them before Dropbox Sign would let them complete signing. The "N/A"
already printed via the fields above (right below each blank "by:" line) is what
signals to a human reader that a block doesn't apply; "not required" is what stops
Dropbox Sign from blocking completion over it.

## The capacity clause

Exhibit B's opening paragraph offers two alternate phrasings depending on whether the
investor is a natural person or an entity:

> "...and {{lender_name}}, **{{office_or_residence_location}}** ("Secured Party")."

- Individual: `an individual residing at {{lender_address}}`
- Entity: `a {{state_or_country}} {{entity_type}} with its principal place of business
  at {{lender_address}}`

Rather than template both bracketed alternatives literally (which Dropbox Sign cannot
conditionally render), this is a single merge field whose text is computed by the
sending code (`app/lib/dropboxSign.ts`) from the investor type, state/country, and
entity type, then sent as one plain custom field value.

**IRA investors get a third, newly drafted phrasing** (the source Exhibit B form only
offers the two alternatives above - there is no IRA/custodian option in the executed
precedent this template was built from):

- IRA: `{{custodian_name}}, solely in its capacity as custodian for the benefit of
  {{lender_name}}, and not in its individual capacity, with a mailing address at
  {{lender_address}}`

This wording was drafted to be consistent with how the Subscription Agreement's own
Section 3.C frames an IRA custodian's role ("solely as custodian... for the account
of..., not in its individual capacity"), but it is **not sourced from an executed
Exhibit B precedent**. **FLAG FOR COUNSEL**: this is new legal phrasing, not a
mapping/formatting change - it should be reviewed on its own merits before an IRA
investor's Pledge Agreement is sent, independent of the rest of this document-refresh
pass.

## Layout fixes for field-box room (2026-08-16)

Two spots were reformatted with manual line breaks - no words changed, only where
lines break - because the field boxes drawn in Dropbox Sign's editor need open space
to expand into, and dense inline text left none:

- **Pledge, opening paragraph**: `{{office_or_residence_location}}` sits between
  `{{lender_name}}` and `("Secured Party")` on one line. Its filled-in value is a full
  sentence (up to ~110 characters for the IRA phrasing - see "The capacity clause"
  above), far longer than the placeholder text itself, so it now gets its own line:
  `...and {{lender_name}},` / `{{office_or_residence_location}}` / `("Secured
  Party").`
- **Subscription Agreement, Section 3.B**: `{{entity_state_or_country}}` and
  `{{entity_type}}` sat on one line separated only by a space - two independent field
  boxes with no room between them. Each now gets its own line under the shared label:
  `Jurisdiction of formation and entity type:` / `{{entity_state_or_country}}` /
  `{{entity_type}}`.

Both paragraphs were also switched from justified to left-aligned. Word stretches
non-final lines of a justified paragraph to fill the line width - including lines that
end in a manual break rather than natural wrapping - which produced ugly, widely-spaced
text on the newly-broken lines. Left alignment avoids that.

Every other field across all three documents was checked and found not to need this -
they're short, fixed-format values (dates, currency, single words) that fit a normal
field box even inline, or already sit alone on their own line with a full line's worth
of room. The Note needed no changes at all.

A third layout fix (2026-08-16): the Pledge's "Secured Party:" signature block (heading,
`by:` line, `{{lender_name}}`, `Address: {{lender_address}}`) was landing split across
a page break - the heading alone on one page, its own signature line and fields on the
next. Fixed with Word's "keep with next" paragraph setting, chained through all four
paragraphs, so the whole block now moves together as one unit (it ended up on its own
page as a result, which is expected and fine).

## Signature blocks have no per-signature date on the Pledge

Unlike the Note (`{{effective_date}}` on its own "Dated:" line) and the Subscription
Agreement (native "Date signed" fields in each signature variant), the Pledge's three
signature blocks - Consent (Stage Point Fund), Pledgor (Stage Point Master), and Secured
Party - have **no printed "Date:" line at all**. This was confirmed by reading the
actual paragraph text, not assumed. The Pledge instead carries one date for the whole
document: `{{effective_date}}` in the opening paragraph ("dated as of {{effective_date}}").
Do **not** add "Date signed" fields to any of the Pledge's three signature blocks -
place Signature fields only (3 total: 2 for Company, 1 for Investor). Adding a printed
"Date:" line to accommodate a Date signed field would mean adding new words to the
document, which is out of scope for this mapping/layout work.

## Fields intentionally left as investor-fillable or native Dropbox Sign fields

Not everything in the Subscription Agreement became a `{{merge_field}}`. These are
configured as either a Dropbox-Sign-native field type or a blank fillable field
assigned to the investor's signer role when the template is placed in the Dropbox
Sign editor:

- **All checkbox selections** (distribution election, investor type, the 7 Accredited
  Investor categories) are left as fillable checkboxes for the investor to tick
  themselves during signing - not pre-filled by this system. This is deliberate: these
  are self-certifications, and the investor's own affirmative click (captured in
  Dropbox Sign's audit trail) is more legally sound than staff pre-selecting them.
- **All `[DATE]` / `[DATE accepted]` lines** (every signature block, both
  investor-side and the Issuer's "Date accepted") - configure these as Dropbox Sign's
  native "Date Signed" field type, tied to each signer's actual signing action. These
  are not investor-supplied data we know in advance. The `[DATE]` bracket text itself
  was replaced with blank space (2026-08-16, same reasoning as every other field - see
  "Blank space, not visible placeholders" above: a native Date Signed field doesn't
  paint an opaque background either, so it would have jumbled with the bracket text
  the same way a Sender textbox would have).

## Consistent naming across all three documents

`{{lender_name}}`, `{{lender_address}}`, and `{{principal_amount}}` are deliberately
named identically across all three templates even though the Note calls the investor
"Lender," the Pledge calls them "Secured Party," and the Subscription Agreement calls
them "Investor," "Account Owner," or similar depending on the section - all the same
person. This also matters now that Subscription and Pledge are sent together as one
Dropbox Sign request added via "Add template": the two documents share the same
"Company" and "Investor" role names, so their signer roles line up as one signing
across both documents rather than two independent ones. Dropbox Sign still prompts for
each document's "Me (when sending)" fields separately, so staff pastes the same value
into both prompts when a field like `lender_name` appears in both.

## Fixed (not templated)

- Maker (Stage Point Master, LLC), the c/o Stage Point Capital address, the Stage
  Point signatory (Whitney S. Quillen, CEO), the SPF recitals and 9/19/2014
  LLC-agreement date, the Schedule 1 rate table (matches `app/lib/rates.ts` exactly),
  and the governing-law clauses (Note = Delaware, Pledge = Delaware, Subscription
  Agreement = Delaware) are the same for every investor and were left as static text.
- **`[DATE OF LATEST REVISION]`** in the Pledge (Recital C, the SPF LLC Agreement's own
  revision date) - originally planned to be resolved once as static text when
  finalizing the template, but neither the author of this document nor the person
  building the Dropbox Sign template had the actual date on hand at build time (it has
  to come from whoever maintains SPF's LLC Agreement, e.g. Moss & Moss). As a practical
  workaround (2026-08-16), this became a real field instead - Textbox, Signer
  **Sender**, label `date_of_latest_revision` - so it can be filled in at send time
  rather than blocking the template build. Its bracket text was replaced with blank
  space too (2026-08-16), same as every other field, with a line break pushing the
  trailing sentence ("SPF has issued SPF membership interests...") onto a fresh line
  since real text immediately followed it. Unlike every other Sender field, this one is
  **not** computed or shown by the admin tool's "Prepare fields" list, since it isn't
  investor data and our code has no source of truth for it - whoever sends this
  template needs to know the correct date independently each time. If the actual date
  is ever confirmed, the better long-term fix is to resolve it to static text (as
  originally planned) so staff stops having to supply it manually.

## Data gap, closed

The on-site `/request-access` form is a **lead** form: it captures name, email, and an
investment **range** and preferred term - not enough for these documents. The
`/subscribe` intake form is where an investor actually provides everything these
templates need: custodian name/account number for IRA investors, and (added
2026-08-11) the entity/IRA signatory's own name and title via
`signatoryNameAndTitle`, required whenever investor type is Entity or IRA - the
investor is the one who knows who will sign on their entity's or custodian's behalf,
so this is collected at intake rather than guessed by staff later.

The internal `/admin/send-for-signature` staff tool also has this field (and the
other entity/IRA fields), because - as of this writing - values submitted at
`/subscribe` are stored in the Airtable Notes text but are **not yet auto-populated**
into the staff tool's form (see the comment in `app/admin/(authed)/send-for-
signature/page.tsx` next to `AdminContact`). Staff currently re-enters/confirms these
fields manually before sending, matching how `custodianName` and `entityType` already
worked before this change. Wiring `AdminContact` to parse and prefill all of these
from the stored Notes (instead of staff retyping them) would close that remaining gap,
but is a separate, not-yet-scoped improvement.

## Notes for counsel (Moss & Moss)

- The templated versions should be reviewed and approved before use. Parameterizing
  did not change any legal language, only the variable values, except that
  `{{office_or_residence_location}}` replaces bracketed instructional alternatives
  with one computed field; confirm the three computed phrasings (individual / entity /
  IRA custodian) match what was intended. **The IRA phrasing is newly drafted for this
  refresh and has no precedent in the executed Exhibit B - see "The capacity clause"
  above.**
- Exhibit A's automatic Maturity Date extension (Section 1.5) is a substantive term:
  the initial `{{maturity_date}}` value is not final unless the Lender gives 60 days'
  notice before each Maturity Date. Confirm this is properly understood by staff
  operating the signing tool, since the field only captures the initial date.
- The Subscription Agreement is still marked DRAFT and has never been reviewed by
  counsel. It should not be sent to a real investor until that review is complete,
  independent of the merge-field work in this document. (Its $250,000-vs-$200,000
  minimum-investment discrepancy was found and corrected to $200,000 on 2026-08-09 with
  the user's authorization - see "Resolved: $250,000 vs $200,000 minimum investment"
  above - but the document as a whole still needs full counsel review.)
