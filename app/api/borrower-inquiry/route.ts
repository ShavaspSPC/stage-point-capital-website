import { NextResponse } from "next/server";
import { sendBorrowerInquiryEmail, type BorrowerInquiry } from "@/app/lib/email";

const FIELDS: Array<keyof BorrowerInquiry> = [
  "name",
  "email",
  "phone",
  "company",
  "propertyAddress",
  "propertyType",
  "loanAmount",
  "purchasePrice",
  "rehabBudget",
  "afterRepairValue",
  "exitStrategy",
  "experience",
  "timeline",
  "notes",
];

// Borrower loan enquiries go to the origination desk by email rather than into
// the investor CRM: these are counterparties on the lending side, not
// prospective noteholders, and mixing the two would pollute the investor
// pipeline the admin dashboard reports on.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Could not read the submission." }, { status: 400 });
  }

  const inquiry = Object.fromEntries(
    FIELDS.map((f) => [f, typeof body[f] === "string" ? (body[f] as string).trim() : ""]),
  ) as BorrowerInquiry;

  if (!inquiry.name) {
    return NextResponse.json({ error: "Enter your name." }, { status: 422 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiry.email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 422 });
  }
  if (!inquiry.propertyAddress) {
    return NextResponse.json({ error: "Enter the property address." }, { status: 422 });
  }
  if (!inquiry.loanAmount) {
    return NextResponse.json({ error: "Enter the loan amount you are seeking." }, { status: 422 });
  }

  try {
    const sent = await sendBorrowerInquiryEmail(inquiry);
    if (!sent) {
      return NextResponse.json(
        { error: "This form is not able to send right now. Please call the office instead." },
        { status: 503 },
      );
    }
    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("[borrower-inquiry] send failed", err);
    return NextResponse.json(
      { error: "Something went wrong sending this. Please try again or call the office." },
      { status: 502 },
    );
  }
}
