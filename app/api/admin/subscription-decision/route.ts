import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "@/app/lib/adminAuth";
import { recordSubscriptionDecision, type SubscriptionDecision } from "@/app/lib/airtable";
import { sendDeclineEmail } from "@/app/lib/email";

type DecisionBody = {
  email?: string;
  decision?: string;
  note?: string;
};

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!isValidSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as DecisionBody | null;
  const email = body?.email?.trim();
  const decision = body?.decision;
  if (!email || (decision !== "accepted" && decision !== "declined")) {
    return NextResponse.json({ error: "A valid email and decision are required." }, { status: 422 });
  }

  // No create-if-missing path here any more: this route is only ever called
  // from a page scoped to an existing record, and adding an investor is its
  // own explicit action (/admin/investors/new). Creating records as a side
  // effect of accepting was what allowed a second record to be written for
  // someone who was already in the CRM at an earlier stage.
  try {
    const result = await recordSubscriptionDecision(
      email,
      decision as SubscriptionDecision,
      body?.note?.trim() || undefined,
    );

    // Best-effort, same pattern as the Airtable write it accompanies: the
    // decision is already recorded by this point, so an email failure is
    // surfaced as a flag on the response rather than an error.
    let emailSent: boolean | undefined;
    if (decision === "declined" && result.recorded && result.investorName) {
      try {
        emailSent = await sendDeclineEmail(result.investorName, email);
      } catch (err) {
        console.error("[admin] decline email failed", err);
        emailSent = false;
      }
    }

    return NextResponse.json({ ...result, emailSent });
  } catch (err) {
    console.error("[admin] subscription decision failed", err);
    return NextResponse.json({ error: "Could not record the decision." }, { status: 502 });
  }
}
