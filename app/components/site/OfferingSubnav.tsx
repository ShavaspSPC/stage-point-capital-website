"use client";

import { useEffect, useState } from "react";

// The offering page is long and single-scroll, so it carries its own section
// rail beneath the site header. It highlights the section you are actually
// looking at, which the old anchor-only nav could not do.

const SECTIONS = [
  { id: "opportunity", label: "Opportunity" },
  { id: "offering", label: "Offering" },
  { id: "calculator", label: "Calculator" },
  { id: "track-record", label: "Track Record" },
  { id: "protection", label: "Protection" },
  { id: "team", label: "Team" },
];

export function OfferingSubnav() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const targets = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (targets.length === 0) return;

    // rootMargin pulls the detection line up near the header so a section counts
    // as current once its heading sits under the chrome, not when it first
    // peeks in from the bottom of the viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-140px 0px -55% 0px", threshold: 0 },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="sticky top-[72px] z-40 border-b border-neutral-border bg-neutral-white/90 backdrop-blur-sm">
      <nav aria-label="Offering sections" className="mx-auto max-w-[1400px] px-6">
        <ul className="flex gap-1 overflow-x-auto py-1">
          {SECTIONS.map((s) => {
            const current = active === s.id;
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  aria-current={current ? "true" : undefined}
                  className={`inline-block border-b-2 px-3 py-3 text-[13px] font-medium whitespace-nowrap transition-colors duration-150 ease-out-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-steel-teal ${
                    current
                      ? "border-steel-teal text-institutional-navy"
                      : "border-transparent text-neutral-mist hover:text-institutional-navy"
                  }`}
                >
                  {s.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
