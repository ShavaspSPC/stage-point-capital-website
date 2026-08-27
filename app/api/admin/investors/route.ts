import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "@/app/lib/adminAuth";
import { createInvestorRecord, deleteContactRecords, findAdminContactIdByEmail } from "@/app/lib/airtable";
import { parseInvestorBody } from "./parse";

// Creates a staff-entered investor record. The write itself de-duplicates by
// email (see createInvestorRecord), so posting someone who already came
// through the website enriches their existing record instead of adding a
// second one.
export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!isValidSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const parsed = parseInvestorBody(await request.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 422 });
  }

  try {
    const result = await createInvestorRecord(parsed.data);
    if (!result.saved) {
      return NextResponse.json(
        { error: "Airtable is not configured, so this investor was not saved." },
        { status: 503 },
      );
    }
    // The caller may want to go straight to preparing this investor's
    // documents, which needs the record id. Look it up by the email we just
    // wrote, which is the same key the upsert used.
    const id = await findAdminContactIdByEmail(parsed.data.email).catch(() => undefined);
    return NextResponse.json({ saved: true, id });
  } catch (err) {
    console.error("[admin] create investor failed", err);
    return NextResponse.json({ error: "Could not save this investor." }, { status: 502 });
  }
}

// Deletes multiple investor records at once (the dashboard's multi-select
// action). Body is `{ ids: string[] }` rather than a route param, since this
// targets the collection, not one record - see [id]/route.ts for deleting a
// single one.
export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  if (!isValidSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids)
    ? body.ids.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "No records selected." }, { status: 422 });
  }

  try {
    const result = await deleteContactRecords(ids);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[admin] bulk delete investors failed", err);
    return NextResponse.json({ error: "Could not delete the selected records." }, { status: 502 });
  }
}
