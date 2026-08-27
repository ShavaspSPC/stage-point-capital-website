import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "../components/site/SiteFooter";
import { RequestAccessFlow } from "../components/RequestAccessFlow";

export const metadata: Metadata = {
  title: "Request the Offering Memorandum | Stage Point Master, LLC",
  description:
    "Request the offering memorandum for the Stage Point Master secured promissory note offering. For accredited and qualified investors.",
  robots: { index: false, follow: false },
};

export default function RequestAccessPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-border bg-neutral-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/invest" className="flex items-center">
            <Image
              src="/images/logo-stage-point-capital.png"
              alt="Stage Point Capital"
              width={170}
              height={52}
              className="h-8 w-auto"
              priority
            />
            <span className="sr-only">Stage Point Master, LLC</span>
          </Link>
          <Link
            href="/invest"
            className="text-[13px] font-semibold tracking-[0.02em] text-neutral-slate transition-colors duration-150 hover:text-institutional-navy"
          >
            Back to overview
          </Link>
        </div>
      </header>

      <main className="flex-1 bg-neutral-paper">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <RequestAccessFlow />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
