"use client";

export type FlowStep = { n: number; label: string };

// Visual progress through a multi-step flow: a numbered marker per step with a
// connecting track that fills as steps complete. The track fill uses scaleX so
// the motion stays on the compositor; it is disabled under reduced motion.
// Shared by RequestAccessFlow and SubscriptionFlow.
export function StepIndicator({
  steps,
  current,
  reduce,
}: {
  steps: FlowStep[];
  current: number;
  reduce: boolean | null;
}) {
  return (
    <nav className="mt-6" aria-label="Progress">
      <ol className="flex items-center">
        {steps.map((s, i) => {
          const complete = current > s.n;
          const isCurrent = current === s.n;
          return (
            <li
              key={s.n}
              aria-current={isCurrent ? "step" : undefined}
              className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}
            >
              <span
                aria-hidden
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] text-[12px] font-semibold transition-colors duration-[240ms] ease-out-soft ${
                  complete
                    ? "border-institutional-navy bg-institutional-navy text-white"
                    : isCurrent
                      ? "border-steel-teal bg-steel-teal-tint text-institutional-navy"
                      : "border-neutral-border bg-neutral-white text-neutral-mist"
                }`}
              >
                {complete ? (
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M3 7.5L6 10.5L11 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  s.n
                )}
              </span>
              <span
                className={`ml-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors duration-[240ms] ease-out-soft ${
                  complete || isCurrent ? "text-institutional-navy" : "text-neutral-mist"
                }`}
              >
                {s.label}
                <span className="sr-only">
                  {complete ? " (completed)" : isCurrent ? " (current step)" : " (not started)"}
                </span>
              </span>
              {i < steps.length - 1 && (
                <span aria-hidden className="mx-3 h-px flex-1 bg-neutral-border">
                  <span
                    className={`block h-px origin-left bg-institutional-navy ${
                      reduce ? "" : "transition-transform duration-[240ms] ease-out-soft"
                    }`}
                    style={{ transform: `scaleX(${complete ? 1 : 0})` }}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
