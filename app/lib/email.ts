// Outbound transactional email via Gmail / Google Workspace SMTP.
//
// SMTP_USER must be the sending mailbox (e.g. ir@stagepointcapital.com) and
// SMTP_APP_PASSWORD must be a 16-character Google App Password generated for
// this specific use — never the account's normal login password. App
// Passwords require 2-Step Verification to be enabled on the account, and
// are generated at https://myaccount.google.com/apppasswords.
//
// Both forms stay functional even before these are set: without credentials
// an email is logged and skipped rather than failing the calling action.

import nodemailer from "nodemailer";

const FROM_NAME = "Stage Point Capital";

function transporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS on 587, not implicit TLS
    auth: { user, pass },
  });
}

function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName.trim();
}

// Generic by design: does not state a reason. Keeps the decline
// professional and avoids the legal exposure of a poorly-worded specific
// reason going out to an external party. Staff's internal reason (if any)
// stays in Airtable Notes only.
export async function sendDeclineEmail(investorName: string, investorEmail: string): Promise<boolean> {
  const t = transporter();
  const user = process.env.SMTP_USER;
  if (!t || !user) {
    console.warn("[email] SMTP not configured; decline email not sent", {
      investorEmail,
      at: new Date().toISOString(),
    });
    return false;
  }

  const firstName = firstNameOf(investorName);
  const subject = "An update on your Stage Point Master subscription";
  const text = [
    `Dear ${firstName},`,
    "",
    "Thank you for your interest in Stage Point Master, LLC and for taking the time to " +
      "complete a subscription.",
    "",
    "After review, we are unable to move forward with your subscription at this time. " +
      "This decision does not necessarily reflect any deficiency on your part, and we " +
      "genuinely appreciate your interest in Stage Point.",
    "",
    "If you have any questions, please don't hesitate to reach out to us directly.",
    "",
    "Best regards,",
    "Stage Point Capital",
    "ir@stagepointcapital.com",
    "(401) 227-5775",
  ].join("\n");

  await t.sendMail({
    from: `"${FROM_NAME}" <${user}>`,
    to: investorEmail,
    subject,
    text,
  });
  return true;
}

export type BorrowerInquiry = {
  name: string;
  email: string;
  phone: string;
  company: string;
  propertyAddress: string;
  propertyType: string;
  loanAmount: string;
  purchasePrice: string;
  rehabBudget: string;
  afterRepairValue: string;
  exitStrategy: string;
  experience: string;
  timeline: string;
  notes: string;
};

const BORROWER_FIELD_LABELS: Array<[keyof BorrowerInquiry, string]> = [
  ["name", "Name"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["company", "Company / entity"],
  ["propertyAddress", "Property address"],
  ["propertyType", "Property type"],
  ["loanAmount", "Loan amount requested"],
  ["purchasePrice", "Purchase price"],
  ["rehabBudget", "Rehab budget"],
  ["afterRepairValue", "After-repair value"],
  ["exitStrategy", "Exit strategy"],
  ["experience", "Projects completed in the last 3 years"],
  ["timeline", "Timeline to close"],
  ["notes", "Additional detail"],
];

// Where borrower loan enquiries are delivered: the head of origination.
const BORROWER_INQUIRY_RECIPIENT = "clayton@stagepointcapital.com";

// Routes a borrower loan enquiry to the origination desk. Still sent *from* the
// mailbox the site authenticates as. Reply-To is the borrower, so hitting reply
// in the inbox reaches them directly rather than looping back to the site's own
// address.
export async function sendBorrowerInquiryEmail(inquiry: BorrowerInquiry): Promise<boolean> {
  const t = transporter();
  const user = process.env.SMTP_USER;
  if (!t || !user) {
    console.warn("[email] SMTP not configured; borrower inquiry not sent", {
      email: inquiry.email,
      at: new Date().toISOString(),
    });
    return false;
  }

  const lines = BORROWER_FIELD_LABELS.filter(([key]) => inquiry[key]?.trim()).map(
    ([key, label]) => `${label}: ${inquiry[key].trim()}`,
  );

  await t.sendMail({
    from: `"${FROM_NAME}" <${user}>`,
    to: BORROWER_INQUIRY_RECIPIENT,
    replyTo: inquiry.email,
    subject: `Loan intake: ${inquiry.name}${inquiry.propertyAddress ? ` - ${inquiry.propertyAddress}` : ""}`,
    text: ["New borrower loan intake submission.", "", ...lines].join("\n"),
  });
  return true;
}
