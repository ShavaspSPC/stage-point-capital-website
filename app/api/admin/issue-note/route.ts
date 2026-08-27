import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "@/app/lib/adminAuth";
import { recordFundedAndNoteIssued } from "@/app/lib/airtable";

// Staff-only. Called after staff has manually sent the Note through the
// Dropbox Sign dashboard (see app/lib/dropboxSign.ts - there is no API call
// here) AND independently confirmed the wire actually cleared. This route's
// only job is the Airtable bookkeeping; there is no bank integration, so wire
// confirmation is a human judgment call this route cannot verify itself.
export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!isValidSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { lenderEmail?: string } | null;
  if (!body?.lenderEmail?.trim()) {
    return NextResponse.json({ error: "lenderEmail is required." }, { status: 422 });
  }

  let recorded = false;
  try {
    const decisionResult = await recordFundedAndNoteIssued(body.lenderEmail.trim());
    recorded = decisionResult.recorded;
  } catch (err) {
    console.error("[admin] recording Note issuance failed", err);
    return NextResponse.json({ error: "Could not update Airtable." }, { status: 502 });
  }

  return NextResponse.json({ recorded });
}
