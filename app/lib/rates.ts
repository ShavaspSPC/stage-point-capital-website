// Canonical note rate schedule. This is the single source of truth for every
// rate shown on the site (hero, offering ladder, metadata). Do not restate these
// figures inline anywhere else.
//
// `annual` is the annual interest rate compounded monthly and is the headline
// yield. `annualSimple` is the annual non-compounded figure over 12 months.

export type NoteTerm = {
  months: number;
  short: string;
  full: string;
  monthly: string;
  annualSimple: string;
  annual: string;
  annualValue: number;
  // Option name in the CRM's "Current Note Term" select field.
  airtableOption: string;
};

export const NOTE_TERMS: NoteTerm[] = [
  { months: 3, short: "3 mo", full: "3 months", monthly: "0.48676%", annualSimple: "5.8411%", annual: "6.00%", annualValue: 6.0, airtableOption: "3 Mo." },
  { months: 6, short: "6 mo", full: "6 months", monthly: "0.56541%", annualSimple: "6.7849%", annual: "7.00%", annualValue: 7.0, airtableOption: "6 Mo." },
  { months: 9, short: "9 mo", full: "9 months", monthly: "0.62786%", annualSimple: "7.5343%", annual: "7.80%", annualValue: 7.8, airtableOption: "9 Mo." },
  { months: 12, short: "12 mo", full: "1 year (12 months)", monthly: "0.66667%", annualSimple: "8.0000%", annual: "8.30%", annualValue: 8.3, airtableOption: "1 Yr." },
  { months: 18, short: "18 mo", full: "1.5 years (18 months)", monthly: "0.70146%", annualSimple: "8.4175%", annual: "8.75%", annualValue: 8.75, airtableOption: "18 Mo." },
  { months: 24, short: "24 mo", full: "2 years (24 months)", monthly: "0.73996%", annualSimple: "8.8795%", annual: "9.25%", annualValue: 9.25, airtableOption: "2 Yr." },
  { months: 36, short: "36 mo", full: "3 years (36 months)", monthly: "0.75915%", annualSimple: "9.1098%", annual: "9.50%", annualValue: 9.5, airtableOption: "3 Yr." },
  { months: 60, short: "60 mo", full: "5 years (60 months)", monthly: "0.79741%", annualSimple: "9.5689%", annual: "10.00%", annualValue: 10.0, airtableOption: "5 Yr." },
];

// Label shown in the request form's term dropdown. This exact string is what a
// lead submits, so it is also the lookup key used to resolve the CRM option in
// lib/airtable.ts. Both sides derive from here, so they cannot drift apart.
export function termFormLabel(term: NoteTerm): string {
  return `${term.full} at ${term.annual}`;
}

export const YIELD_LOW = NOTE_TERMS[0].annual;
export const YIELD_HIGH = NOTE_TERMS[NOTE_TERMS.length - 1].annual;

// Bars are scaled from a zero baseline so the visual never overstates the
// spread between terms.
export const YIELD_SCALE_MAX = 10;

// Index of the term selected by default: the 12 month note.
export const DEFAULT_TERM_INDEX = 3;
