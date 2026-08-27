"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CaretDownIcon, ListIcon, XIcon } from "@phosphor-icons/react";
import { INVEST_HREF, INVEST_LABEL, NAV_ITEMS } from "./siteNavigation";

// The header stays solid white at every scroll position rather than starting
// transparent over the hero: the wordmark is navy and steel-teal on a clear
// background, so it disappears against photography. Contrast wins over the
// overlay effect.

export function SiteHeader() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  // Tracks the pointer-leave timer so moving diagonally from the trigger into
  // the panel does not close the menu out from under the cursor.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Any navigation should leave the chrome closed behind it.
  useEffect(() => {
    setOpenMenu(null);
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setDrawerOpen(false);
      }
    }
    function onPointerDown(e: PointerEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  function openNow(label: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(label);
  }
  function closeSoon() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 120);
  }

  function isCurrent(item: (typeof NAV_ITEMS)[number]) {
    if (pathname === item.href) return true;
    return item.children?.some((c) => c.href === pathname) ?? false;
  }

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-neutral-border bg-neutral-white"
    >
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between gap-6 px-6">
        <Link href="/" className="flex shrink-0 items-center rounded-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-steel-teal">
          <Image
            src="/images/logo-stage-point-capital.png"
            alt="Stage Point Capital"
            width={340}
            height={104}
            className="h-9 w-auto"
            priority
          />
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const current = isCurrent(item);
              const linkClass = `inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[14px] font-medium transition-colors duration-150 ease-out-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal ${
                current
                  ? "text-institutional-navy"
                  : "text-neutral-slate hover:text-institutional-navy"
              }`;

              if (!item.children) {
                return (
                  <li key={item.label}>
                    <Link href={item.href} className={linkClass}>
                      {item.label}
                    </Link>
                  </li>
                );
              }

              const open = openMenu === item.label;
              return (
                <li
                  key={item.label}
                  className="relative"
                  onPointerEnter={() => openNow(item.label)}
                  onPointerLeave={closeSoon}
                >
                  {/* The trigger is a real link to the section's own landing
                      page, not a toggle. A toggle that also opens on hover
                      closes itself the moment a mouse user clicks it, and it
                      left "Vehicles" and "Team" as dead labels. Hover and
                      focus reveal the children; clicking goes somewhere. */}
                  <Link
                    href={item.href}
                    className={linkClass}
                    aria-expanded={open}
                    aria-haspopup="true"
                    onFocus={() => openNow(item.label)}
                  >
                    {item.label}
                    <CaretDownIcon
                      size={12}
                      weight="bold"
                      aria-hidden
                      className={`transition-transform duration-150 ease-out-soft ${open ? "rotate-180" : ""}`}
                    />
                  </Link>

                  {open && (
                    <div className="absolute top-full left-0 w-[320px] pt-2">
                      <ul className="overflow-hidden rounded-lg border border-neutral-border bg-neutral-white py-2 shadow-[0_16px_40px_rgba(0,32,96,0.12)]">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={`block px-4 py-3 transition-colors duration-150 ease-out-soft hover:bg-navy-tint focus-visible:bg-navy-tint focus-visible:outline-none ${
                                pathname === child.href ? "bg-navy-tint" : ""
                              }`}
                            >
                              <span className="block text-[14px] font-semibold text-institutional-navy">
                                {child.label}
                              </span>
                              <span className="mt-0.5 block text-[12.5px] leading-snug text-neutral-mist">
                                {child.blurb}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden shrink-0 lg:block">
          <Link
            href={INVEST_HREF}
            className="inline-flex items-center rounded-md bg-institutional-navy px-6 py-2.5 text-[14px] font-semibold whitespace-nowrap text-white transition-[background-color,transform] duration-150 ease-out-soft hover:bg-navy-deep active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal"
          >
            {INVEST_LABEL}
          </Link>
        </div>

        <button
          type="button"
          aria-label={drawerOpen ? "Close menu" : "Open menu"}
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen((v) => !v)}
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md text-institutional-navy transition-transform duration-150 ease-out-soft active:scale-[0.92] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal lg:hidden"
        >
          {drawerOpen ? <XIcon size={24} /> : <ListIcon size={24} />}
        </button>
      </div>

      {drawerOpen && (
        <div className="max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-neutral-border bg-neutral-white px-6 py-6 lg:hidden">
          <nav aria-label="Primary mobile">
            <ul className="flex flex-col divide-y divide-neutral-border">
              {NAV_ITEMS.map((item) => (
                <li key={item.label} className="py-4 first:pt-0">
                  {item.children ? (
                    <>
                      <p className="text-[12px] font-semibold tracking-[0.08em] text-neutral-mist uppercase">
                        {item.label}
                      </p>
                      <ul className="mt-3 flex flex-col gap-3">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className="block text-[16px] font-medium text-institutional-navy"
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className="block text-[16px] font-medium text-institutional-navy"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <Link
            href={INVEST_HREF}
            className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-institutional-navy px-6 py-3.5 text-[15px] font-semibold text-white transition-transform duration-150 ease-out-soft active:scale-[0.98]"
          >
            {INVEST_LABEL}
          </Link>
        </div>
      )}
    </header>
  );
}
