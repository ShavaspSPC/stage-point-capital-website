"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

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

/** How far below the fold an element must sit before it is worth animating. */
const ARM_THRESHOLD = 0.9;

export function ScrollReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (reduce || typeof IntersectionObserver === "undefined") return;
    const el = ref.current;
    if (!el) return;
    if (el.getBoundingClientRect().top > window.innerHeight * ARM_THRESHOLD) {
      setArmed(true);
    }
  }, [reduce]);

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
