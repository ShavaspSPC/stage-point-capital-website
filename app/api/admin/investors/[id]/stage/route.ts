import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "@/app/lib/adminAuth";
import { setInvestorStage, type ManualInvestorStage } from "@/app/lib/airtable";

const STAGES: ManualInvestorStage[] = ["interested", "committed", "accepted", "funded", "declined"];

// Stage-only update, so correcting where someone sits doesn't mean
// re-submitting their whole record. Deliberately does not send any email:
// unlike the decline action on the prepare page, this is a bookkeeping
// correction, not a decision being communicated to the investor.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!isValidSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing record id." }, { status: 400 });

  const body = (await request.json().catch(() => null)) as { stage?: string } | null;
  const stage = body?.stage as ManualInvestorStage | undefined;
  if (!stage || !STAGES.includes(stage)) {
    return NextResponse.json({ error: "Pick a valid stage." }, { status: 422 });
  }

  try {
    const result = await setInvestorStage(id, stage);
    if (!result.saved) {
      return NextResponse.json(
        { error: "Airtable is not configured, so the stage was not changed." },
        { status: 503 },
      );
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("[admin] stage change failed", err);
    return NextResponse.json({ error: "Could not change the stage." }, { status: 502 });
  }
}
