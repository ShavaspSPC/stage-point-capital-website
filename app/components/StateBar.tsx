"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CountUpStat } from "./CountUpStat";
import { useArmedReveal } from "./useArmedReveal";

const DURATION = 1.1;
const EASE = [0.16, 1, 0.3, 1] as const;

// The bar is always rendered at its true width, so the server HTML, print, and
// no-JS readers all see the real proportion. The fill animation is a transform
// (scaleX from the left edge) rather than a width change, and only runs once
// the bar is armed (see useArmedReveal): it is collapsed while still below the
// fold, then grows to its true width as it scrolls into view.
export function StateBar({
  state,
  value,
  color,
  delay = 0,
}: {
  state: string;
  value: number;
  color: string;
  delay?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const armed = useArmedReveal(trackRef);
  const inView = useInView(trackRef, { once: true, amount: 0.5 });
  const collapsed = armed && !inView;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-neutral-slate">{state}</span>
        <span className="text-sm font-semibold text-institutional-navy tabular-nums">
          <CountUpStat value={value} suffix="%" duration={DURATION} delay={delay} />
        </span>
      </div>
      <div
        ref={trackRef}
        className="h-2 w-full overflow-hidden rounded-full bg-neutral-border/60"
      >
        <motion.div
          className="h-full origin-left rounded-full"
          style={{ width: `${value}%`, backgroundColor: color }}
          initial={false}
          animate={{ scaleX: collapsed ? 0 : 1 }}
          transition={collapsed ? { duration: 0 } : { duration: DURATION, delay, ease: EASE }}
        />
      </div>
    </div>
  );
}
