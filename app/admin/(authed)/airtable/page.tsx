import type { Metadata } from "next";
import Link from "next/link";
import { fetchContactSchema } from "@/app/lib/airtableSchema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Airtable fields | Stage Point staff",
  robots: { index: false, follow: false },
};

// A read-only view of the Contact table's real shape. Nothing here writes.
// It answers two questions that are otherwise invisible: what is this column
// actually called, and what values is this select allowed to hold.

export default async function AirtableFieldsPage() {
  const schema = await fetchContactSchema();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] text-institutional-navy">
            Airtable fields
          </h1>
          <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-neutral-slate">
            The live columns on the Contact table. Use this to confirm a field name or a
            select&apos;s valid options before wiring anything to it.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-[13px] font-semibold text-neutral-slate transition-colors duration-150 hover:text-institutional-navy"
        >
          Back to investors
        </Link>
      </div>

      {!schema.ok ? (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-[14px] font-semibold text-red-800">Could not read the schema</p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-red-700">{schema.error}</p>
        </div>
      ) : (
        <>
          {schema.note && (
            <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-[13px] leading-relaxed text-amber-900">
              {schema.note}
            </p>
          )}

          {schema.missing.length > 0 && (
            <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-5">
              <p className="text-[14px] font-semibold text-amber-900">
                {schema.missing.length} name{schema.missing.length === 1 ? "" : "s"} this app writes
                to {schema.missing.length === 1 ? "does" : "do"} not exist on the base
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-amber-800">
                Anything written to these is dropped so the rest of the record still saves. Either
                add the column in Airtable or correct the name in app/lib/airtable.ts.
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {schema.missing.map((name) => (
                  <li
                    key={name}
                    className="rounded border border-amber-300 bg-neutral-white px-2.5 py-1 font-mono text-[12.5px] text-amber-900"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-8 text-[13px] text-neutral-mist">
            {schema.fields.length} fields, read from the {schema.source === "meta" ? "base schema" : "records"}.
          </p>

          <div className="mt-3 overflow-hidden rounded-lg border border-neutral-border">
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-neutral-border bg-neutral-paper text-[12px] tracking-[0.04em] text-neutral-mist uppercase">
                  <th className="px-4 py-3 font-semibold">Field name</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Options</th>
                </tr>
              </thead>
              <tbody>
                {schema.fields.map((field) => (
                  <tr key={field.name} className="border-b border-neutral-border last:border-0">
                    <td className="px-4 py-3 align-top font-mono text-[12.5px] font-medium text-institutional-navy">
                      {field.name}
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap text-neutral-mist">
                      {field.type}
                    </td>
                    <td className="px-4 py-3 align-top text-neutral-slate">
                      {field.options?.length ? (
                        <span className="flex flex-wrap gap-1.5">
                          {field.options.map((o) => (
                            <span
                              key={o}
                              className="rounded border border-neutral-border bg-neutral-paper px-2 py-0.5 text-[12px]"
                            >
                              {o}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-neutral-mist">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
