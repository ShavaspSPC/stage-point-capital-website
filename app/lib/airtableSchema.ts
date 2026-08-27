// Reads the live shape of the Contact table so staff (and whoever is editing
// this code) can see exactly what columns exist, what type each one is, and
// which select options are valid.
//
// This exists because writes degrade silently: writeWithFieldFallback drops a
// column Airtable does not recognise so the rest of the record still saves,
// which is the right behaviour for a form submission but means a typo in a
// field name looks like "the data just never arrived". This page turns that
// into something you can look at.

import { AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID, MAPPED_FIELD_NAMES } from "./airtable";

export type AirtableFieldInfo = {
  name: string;
  type: string;
  /** Choice names, for single/multi select fields. */
  options?: string[];
};

export type SchemaResult =
  | {
      ok: true;
      /** "meta" is the real schema. "sample" is inferred from records and cannot see unused columns or select options. */
      source: "meta" | "sample";
      fields: AirtableFieldInfo[];
      /** Names this codebase writes to that the base does not have. */
      missing: string[];
      note?: string;
    }
  | { ok: false; error: string };

type MetaField = {
  name: string;
  type: string;
  options?: { choices?: Array<{ name: string }> };
};

export async function fetchContactSchema(): Promise<SchemaResult> {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return { ok: false, error: "AIRTABLE_TOKEN is not set in this environment." };

  // Preferred path: the metadata API, which is the only way to see a column
  // that exists but has never been filled in, and the only way to read the
  // valid choices for a select.
  const metaUrl = `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`;
  const metaRes = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (metaRes.ok) {
    const data = (await metaRes.json()) as {
      tables?: Array<{ id: string; name: string; fields?: MetaField[] }>;
    };
    const table = data.tables?.find((t) => t.id === AIRTABLE_TABLE_ID);
    if (table) {
      const fields: AirtableFieldInfo[] = (table.fields ?? []).map((f) => ({
        name: f.name,
        type: f.type,
        options: f.options?.choices?.map((c) => c.name),
      }));
      const present = new Set(fields.map((f) => f.name));
      return {
        ok: true,
        source: "meta",
        fields,
        missing: MAPPED_FIELD_NAMES.filter((n) => !present.has(n)),
      };
    }
  }

  // Fallback: the token has no schema scope, so infer the columns from the
  // records themselves. This can only see columns that hold a value on at
  // least one of the sampled records, and never sees select options.
  const detail = metaRes.ok ? "table not found in base" : `${metaRes.status} ${await metaRes.text().catch(() => "")}`;
  const sampleUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?pageSize=100`;
  const sampleRes = await fetch(sampleUrl, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!sampleRes.ok) {
    return {
      ok: false,
      error: `Could not read the schema (${detail}) and could not read records either (${sampleRes.status}).`,
    };
  }

  const sample = (await sampleRes.json()) as {
    records?: Array<{ fields: Record<string, unknown> }>;
  };
  const seen = new Map<string, string>();
  const optionValues = new Map<string, Set<string>>();
  for (const record of sample.records ?? []) {
    for (const [key, value] of Object.entries(record.fields)) {
      if (!seen.has(key)) seen.set(key, describeValue(value));
      if (Array.isArray(value)) {
        const set = optionValues.get(key) ?? new Set<string>();
        for (const v of value) if (typeof v === "string") set.add(v);
        optionValues.set(key, set);
      }
    }
  }

  const fields: AirtableFieldInfo[] = [...seen.entries()]
    .map(([name, type]) => ({
      name,
      type,
      options: optionValues.has(name) ? [...optionValues.get(name)!].sort() : undefined,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    ok: true,
    source: "sample",
    fields,
    missing: MAPPED_FIELD_NAMES.filter((n) => !seen.has(n)),
    note:
      "The token cannot read this base's schema, so this list was inferred from the first 100 records. " +
      "A column that is empty on all of them will not appear here, and the values shown for a select are " +
      "only the ones actually in use, not the full list of valid choices.",
  };
}

function describeValue(value: unknown): string {
  if (Array.isArray(value)) {
    const first = value[0];
    if (typeof first === "string" && /^rec[A-Za-z0-9]{14}$/.test(first)) return "link to another record";
    return "multiple select";
  }
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "checkbox";
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return "date";
    return "text";
  }
  return typeof value;
}
