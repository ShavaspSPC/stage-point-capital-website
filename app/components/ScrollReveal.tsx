"use client";

import { motion } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { useArmedReveal } from "./useArmedReveal";

// Entry animation for section content, written as a progressive enhancement.
//
// The obvious implementation - render at opacity 0 and animate to 1 when the
// element scrolls into view - puts style="opacity:0" into the server-rendered
// HTML. Every section of the public site is wrapped in this, so anything that
// stops the animation from ever running (JavaScript disabled or failing to
// load, an unsupported IntersectionObserver, a tab that never composites)
// leaves a reader looking at a blank page rather than an unanimated one. The
// text is in the markup either way, so crawlers were fine; humans were not.
//
// So: nothing is hidden until the client has mounted and confirmed the element
// is far enough below the fold that hiding it cannot cause a visible flash.
// Content at or near the top of the page renders visible immediately, which
// also keeps it out of the way of LCP. Only content the reader has to scroll
// to is armed for animation.

// The arming rule itself lives in useArmedReveal, shared with the count-up
// stats and portfolio bars so every entrance animation follows the same one.

export function ScrollReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const armed = useArmedReveal(ref);

  if (!armed) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.28, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
