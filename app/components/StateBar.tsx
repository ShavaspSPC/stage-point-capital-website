"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CountUpStat } from "./CountUpStat";

const DURATION = 1.1;
const EASE = [0.16, 1, 0.3, 1] as const;

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
  const reduce = useReducedMotion();

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-neutral-slate">{state}</span>
        <span className="text-sm font-semibold text-institutional-navy tabular-nums">
          <CountUpStat value={value} suffix="%" duration={DURATION} delay={delay} />
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-border/60">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={reduce ? { width: `${value}%` } : { width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: DURATION, delay, ease: EASE }}
        />
      </div>
    </div>
  );
}
