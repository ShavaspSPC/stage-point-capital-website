"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

// Persistent chrome for the authenticated admin area: a top bar with a
// hamburger (mobile) and a sidebar of destinations (persistent on desktop,
// a slide-in drawer on mobile), plus Home (public site) and Sign out.
//
// Nav holds places, not tasks. Preparing documents, editing, and accepting
// are all actions taken against one investor, so they are reached from that
// investor's row rather than from a standing nav item that would have no
// object until you typed one in.
const NAV = [
  {
    href: "/admin",
    label: "Investors",
    match: (p: string) => p === "/admin" || p.startsWith("/admin/investors"),
  },
];

function NavIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="7" cy="6" r="2.75" />
      <path d="M2 15.5c0-2.5 2.2-4.25 5-4.25s5 1.75 5 4.25" strokeLinecap="round" />
      <path d="M12.5 4.4a2.6 2.6 0 010 4.2M14.2 11.6c1.4.7 2.3 2 2.3 3.9" strokeLinecap="round" />
    </svg>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Even if the request fails, send the user to login; the cookie is
      // httpOnly so there is nothing to clear client-side anyway.
    }
    router.push("/admin/login");
    router.refresh();
  }

  const sidebar = (
    <nav className="flex h-full flex-col">
      <div className="space-y-1 px-3">
        {NAV.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-semibold transition-colors duration-150 ease-out-soft ${
                active
                  ? "bg-navy-tint text-institutional-navy"
                  : "text-neutral-slate hover:bg-neutral-paper hover:text-institutional-navy"
              }`}
            >
              <NavIcon />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto space-y-1 border-t border-neutral-border px-3 pt-3">
        {/* Diagnostic rather than day-to-day, so it sits with the utility
            links at the bottom instead of in the main nav. */}
        <Link
          href="/admin/airtable"
          onClick={() => setOpen(false)}
          aria-current={pathname === "/admin/airtable" ? "page" : undefined}
          className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-semibold transition-colors duration-150 ease-out-soft ${
            pathname === "/admin/airtable"
              ? "bg-navy-tint text-institutional-navy"
              : "text-neutral-slate hover:bg-neutral-paper hover:text-institutional-navy"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <ellipse cx="9" cy="4.25" rx="6.25" ry="2.25" />
            <path d="M2.75 4.25v9.5c0 1.24 2.8 2.25 6.25 2.25s6.25-1.01 6.25-2.25v-9.5" strokeLinecap="round" />
            <path d="M2.75 9c0 1.24 2.8 2.25 6.25 2.25s6.25-1.01 6.25-2.25" strokeLinecap="round" />
          </svg>
          Airtable fields
        </Link>
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-semibold text-neutral-slate transition-colors duration-150 ease-out-soft hover:bg-neutral-paper hover:text-institutional-navy"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M2.5 8L9 2.5L15.5 8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 7v7.5h10V7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Public site
        </Link>
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-semibold text-neutral-slate transition-colors duration-150 ease-out-soft hover:bg-neutral-paper hover:text-red-700 disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M11 6V4a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h6a1 1 0 001-1v-2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 9h8m0 0l-2.5-2.5M16 9l-2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-[100dvh] bg-neutral-paper">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-neutral-border bg-neutral-white px-4">
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-institutional-navy transition-colors hover:bg-neutral-paper lg:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            {open ? <path d="M4 4l12 12M16 4L4 16" strokeLinecap="round" /> : <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />}
          </svg>
        </button>
        {/* Same mark, size and alt text as the public nav and the sign-in
            screen, so the admin reads as part of the same product rather than
            a separate tool. Links to the dashboard, the conventional home for
            a brand mark inside an app. */}
        <Link
          href="/admin"
          className="flex items-center rounded-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-steel-teal"
        >
          <Image
            src="/images/logo-stage-point-capital.png"
            alt="Stage Point Capital"
            width={170}
            height={52}
            className="h-8 w-auto"
            priority
          />
          <span className="sr-only">Stage Point Master, LLC — staff tools</span>
        </Link>
        <span className="rounded-full bg-navy-tint px-2 py-0.5 text-[11px] font-semibold tracking-[0.06em] text-institutional-navy uppercase">
          Staff
        </span>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        {/* Desktop sidebar */}
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 border-r border-neutral-border bg-neutral-white py-4 lg:block">
          {sidebar}
        </aside>

        {/* Mobile drawer */}
        {open && (
          <>
            <div
              className="fixed inset-0 top-14 z-30 bg-black/20 lg:hidden"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <aside className="fixed top-14 left-0 z-40 h-[calc(100dvh-3.5rem)] w-64 border-r border-neutral-border bg-neutral-white py-4 lg:hidden">
              {sidebar}
            </aside>
          </>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
