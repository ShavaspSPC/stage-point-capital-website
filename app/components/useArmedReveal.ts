"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState, type RefObject } from "react";

// Progressive enhancement for entrance animations.
//
// Anything that animates in from a "before" state (opacity 0, a bar at zero
// width, a counter at 0) must not ship that before-state in the server HTML:
// with JavaScript disabled, failing to load, or read by a crawler, link
// preview, or print stylesheet, the reader would see the empty state instead of
// the content. So the server always renders the real, final state, and this
// hook reports `armed` only once the client has confirmed the element sits far
// enough below the fold that switching it to its before-state cannot cause a
// visible flash. Content at or near the top of the page is never armed.

/** How far below the fold an element must sit before it is worth animating. */
export const ARM_THRESHOLD = 0.9;

export function useArmedReveal(ref: RefObject<HTMLElement | null>): boolean {
  const reduce = useReducedMotion();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (reduce || typeof IntersectionObserver === "undefined") return;
    const el = ref.current;
    if (!el) return;
    if (el.getBoundingClientRect().top > window.innerHeight * ARM_THRESHOLD) {
      setArmed(true);
    }
  }, [reduce, ref]);

  return armed;
}
