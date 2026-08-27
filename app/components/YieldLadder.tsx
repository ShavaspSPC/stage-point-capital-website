"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { DEFAULT_TERM_INDEX, NOTE_TERMS, YIELD_SCALE_MAX } from "../lib/rates";

// Interactive term ladder. Selecting a term is a state transition, so the
// numbers crossfade rather than swapping abruptly; bars rise once on entry to
// establish the shape of the curve. Bars are measured from zero so the spread
// between terms is never visually overstated.
export function YieldLadder() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(DEFAULT_TERM_INDEX);
  const selected = NOTE_TERMS[index];

  return (
    <div className="rounded-[10px] border border-neutral-border bg-neutral-paper p-6 sm:p-8">
      <div className="overflow-x-auto pb-1">
        <div
          role="group"
          aria-label="Select a note term"
          className="flex min-w-[440px] items-end gap-1.5 sm:min-w-0"
        >
          {NOTE_TERMS.map((term, i) => {
            const isSelected = i === index;
            return (
              <button
                key={term.months}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${term.full}, ${term.annual} annual rate`}
                onClick={() => setIndex(i)}
                className="group flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-md px-1 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal"
              >
                <span
                  className={`text-[11px] font-semibold tabular-nums transition-colors duration-[240ms] ease-out-soft ${
                    isSelected ? "text-institutional-navy" : "text-neutral-mist"
                  }`}
                >
                  {term.annual}
                </span>
                <span className="flex h-[132px] w-full items-end">
                  <motion.span
                    className={`block w-full rounded-t-[3px] transition-colors duration-[240ms] ease-out-soft ${
                      isSelected
                        ? "bg-steel-teal"
                        : "bg-institutional-navy/20 group-hover:bg-institutional-navy/40"
                    }`}
                    style={{ height: `${(term.annualValue / YIELD_SCALE_MAX) * 100}%` }}
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{
                      duration: reduce ? 0 : 0.28,
                      delay: reduce ? 0 : i * 0.04,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                </span>
                <span
                  className={`text-[11px] font-semibold whitespace-nowrap transition-colors duration-[240ms] ease-out-soft ${
                    isSelected ? "text-institutional-navy" : "text-neutral-mist"
                  }`}
                >
                  {term.short}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 border-t border-neutral-border pt-6">
        {/* Keyed so a term change remounts and fades in. Deliberately not using
            AnimatePresence: waiting on an exit animation would push the swap past
            the 300ms budget and leave stale figures on screen whenever the frame
            loop is throttled. The text updates immediately; only the fade animates. */}
        <div>
          <motion.div
            key={selected.months}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="grid items-end gap-6 sm:grid-cols-[auto_1fr]"
          >
            <div>
              <p className="text-[13px] font-semibold text-neutral-slate">{selected.full}</p>
              <p className="mt-1 font-[family-name:var(--font-sans)] text-[2.75rem] leading-none font-bold tabular-nums text-institutional-navy">
                {selected.annual}
              </p>
              <p className="mt-2 text-[13px] text-neutral-mist">
                Annual interest rate, compounded monthly
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-6 sm:justify-items-end">
              <div>
                <dt className="text-[12px] font-semibold text-neutral-mist">Monthly rate</dt>
                <dd className="mt-1 text-[17px] font-semibold tabular-nums text-institutional-navy">
                  {selected.monthly}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] font-semibold text-neutral-mist">
                  Annual, non-compounded
                </dt>
                <dd className="mt-1 text-[17px] font-semibold tabular-nums text-institutional-navy">
                  {selected.annualSimple}
                </dd>
              </div>
            </dl>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
