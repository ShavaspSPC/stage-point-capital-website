"use client";

import { useEffect, useRef } from "react";
import { animate, useInView } from "framer-motion";
import { useArmedReveal } from "./useArmedReveal";

// The server-rendered text is always the real figure. The count-up only runs
// when the counter is armed (see useArmedReveal): the client resets it to zero
// while it is still below the fold, then counts up as it scrolls into view.
export function CountUpStat({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1.4,
  delay = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const armed = useArmedReveal(ref);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    const node = ref.current;
    if (!node || !armed) return;

    if (!inView) {
      node.textContent = `${prefix}${(0).toFixed(decimals)}${suffix}`;
      return;
    }

    const controls = animate(0, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(latest) {
        node.textContent = `${prefix}${latest.toFixed(decimals)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [armed, inView, value, prefix, suffix, decimals, duration, delay]);

  return (
    <span ref={ref}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
