import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdminLoginForm } from "@/app/components/admin/AdminLoginForm";

// The tab previously inherited the public marketing title, which read oddly
// on an internal door. noindex because this should never appear in search
// results alongside the offering pages.
export const metadata: Metadata = {
  title: "Staff sign-in | Stage Point Master, LLC",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-neutral-paper px-6 py-12">
      <div className="w-full max-w-[400px]">
        {/* The real mark, not a text stand-in: this is the first screen staff
            see, and it should look like the company it belongs to. Doubles as
            the way back out to the public site. */}
        <Link
          href="/"
          className="inline-flex rounded-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-steel-teal"
        >
          <Image
            src="/images/logo-stage-point-capital.png"
            alt="Stage Point Capital"
            width={170}
            height={52}
            className="h-8 w-auto"
            priority
          />
        </Link>

        <div className="mt-7 rounded-lg border border-neutral-border bg-neutral-white p-7 sm:p-8">
          <h1 className="font-[family-name:var(--font-display)] text-2xl leading-tight font-medium text-institutional-navy">
            Staff sign-in
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-neutral-slate">
            Internal tools for Stage Point Master, LLC. Investor submissions, subscription review,
            and document preparation.
          </p>

          <AdminLoginForm />

          {/* Matches the 12-hour cookie the login route actually sets, so
              being signed out later reads as expected rather than as a fault. */}
          <p className="mt-5 border-t border-neutral-border pt-4 text-[12.5px] leading-relaxed text-neutral-slate">
            Sessions last 12 hours. Sign in again after that, or if you switch browsers.
          </p>
        </div>

        <p className="mt-6 text-center text-[13px] text-neutral-slate">
          Not staff?{" "}
          <Link
            href="/"
            className="font-semibold text-institutional-navy underline underline-offset-2 transition-colors hover:text-navy-deep"
          >
            Return to the public site
          </Link>
        </p>
      </div>
    </main>
  );
}
