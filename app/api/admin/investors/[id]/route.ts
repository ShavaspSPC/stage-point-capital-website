import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "@/app/lib/adminAuth";
import { deleteContactRecord, updateInvestorRecord } from "@/app/lib/airtable";
import { parseInvestorBody } from "../parse";

async function requireStaff(): Promise<boolean> {
  const cookieStore = await cookies();
  return isValidSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

// Edits an existing investor record. Targets the record id rather than the
// email, since the email itself may be what is being corrected.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireStaff())) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing record id." }, { status: 400 });

  const parsed = parseInvestorBody(await request.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 422 });
  }

  try {
    const result = await updateInvestorRecord(id, parsed.data);
    if (!result.saved) {
      return NextResponse.json(
        { error: "Airtable is not configured, so the changes were not saved." },
        { status: 503 },
      );
    }
    return NextResponse.json({ saved: true, id });
  } catch (err) {
    console.error("[admin] update investor failed", err);
    return NextResponse.json({ error: "Could not save the changes." }, { status: 502 });
  }
}

// Permanently removes the record from the CRM.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireStaff())) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing record id." }, { status: 400 });

  try {
    const result = await deleteContactRecord(id);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[admin] delete investor failed", err);
    return NextResponse.json({ error: "Could not delete this record." }, { status: 502 });
  }
}
