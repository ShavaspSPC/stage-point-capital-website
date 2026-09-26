"use client";

import { AnimatePresence, animate, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { DEFAULT_TERM_INDEX, NOTE_TERMS } from "../lib/rates";
import { ScrollReveal } from "./ScrollReveal";
import { useArmedReveal } from "./useArmedReveal";

// A projection tool, not a promise: every figure here is derived live from the
// note's own published rate schedule (lib/rates.ts), never restated or
// hand-tuned, so it can never drift out of step with the actual offering.

type Point = { m: number; value: number };

const EASE = [0.16, 1, 0.3, 1] as const;

const PRINCIPAL_MIN = 200_000;
const PRINCIPAL_MAX_SLIDER = 2_000_000;
const PRINCIPAL_MAX = 50_000_000;

// Used until the chart has been measured (server render, first paint).
const DEFAULT_CHART_WIDTH = 680;
// Tick labels closer together than this start to collide.
const MIN_TICK_GAP_PX = 64;
const TOOLTIP_HALF_WIDTH = 64;

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function formatCompact(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

function parseMonthlyRate(monthly: string): number {
  return parseFloat(monthly.replace("%", "")) / 100;
}

/**
 * The chart is drawn in real pixels, sized from its container, rather than in
 * a fixed coordinate space that gets scaled. Scaling a 680-unit drawing down to
 * a phone shrinks its axis text to about 5px; measuring keeps text at its true
 * size at every width.
 */
function chartLayout(width: number) {
  const height = width < 420 ? 240 : width < 640 ? 264 : 296;
  const padL = 54;
  const padR = 14;
  const padT = 18;
  const padB = 34;
  return { width, height, x0: padL, x1: width - padR, y0: padT, y1: height - padB };
}

/** Rounds an axis ceiling up to a "nice" step (1 / 2 / 5 x a power of ten). */
function computeAxis(maxValue: number) {
  const safeMax = Math.max(maxValue, 1000);
  const target = safeMax / 4;
  const exp = Math.floor(Math.log10(target));
  const base = 10 ** exp;
  const frac = target / base;
  const niceFrac = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  const step = niceFrac * base;
  const axisMax = Math.ceil(safeMax / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= axisMax + step / 2; v += step) ticks.push(Math.round(v));
  return { axisMax, ticks };
}

/** Month ticks spaced by what fits: the roomier the chart, the more of them. */
function computeXTicks(months: number, plotWidth: number): number[] {
  const pxPerMonth = plotWidth / months;
  const step = [3, 6, 12, 24].find((s) => pxPerMonth * s >= MIN_TICK_GAP_PX) ?? 24;
  const ticks = [0];
  for (let m = step; m < months; m += step) ticks.push(m);
  // The final month is always labelled; drop the tick before it if they crowd.
  while (ticks.length > 1 && (months - ticks[ticks.length - 1]) * pxPerMonth < MIN_TICK_GAP_PX) {
    ticks.pop();
  }
  ticks.push(months);
  return ticks;
}

/** Monthly-resolution compounding curve, for the "reinvest" scenario. */
function buildReinvestPoints(months: number, monthlyRate: number, principal: number): Point[] {
  const pts: Point[] = [];
  for (let m = 0; m <= months; m++) pts.push({ m, value: principal * (1 + monthlyRate) ** m });
  return pts;
}

/** Quarter-resolution flat-principal curve, for the "cash distribution" scenario. */
function buildCashPoints(months: number, monthlyRate: number, principal: number): Point[] {
  const quarterlyPayment = principal * ((1 + monthlyRate) ** 3 - 1);
  const pts: Point[] = [];
  for (let m = 0; m <= months; m += 3) pts.push({ m, value: principal + (m / 3) * quarterlyPayment });
  if (pts[pts.length - 1]?.m !== months) {
    pts.push({ m: months, value: principal + Math.floor(months / 3) * quarterlyPayment });
  }
  return pts;
}

function smoothPathD(points: Point[], xScale: (m: number) => number, yScale: (v: number) => number): string {
  if (points.length < 2) return "";
  const coords = points.map((p) => [xScale(p.m), yScale(p.value)] as const);
  let d = `M ${coords[0][0]},${coords[0][1]}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i - 1] ?? coords[i];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] ?? p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** Horizontal-then-vertical staircase, so discrete quarterly payments read as jumps. */
function stepPathD(points: Point[], xScale: (m: number) => number, yScale: (v: number) => number): string {
  if (points.length < 2) return "";
  let d = `M ${xScale(points[0].m)},${yScale(points[0].value)}`;
  for (let i = 1; i < points.length; i++) {
    const prevY = yScale(points[i - 1].value);
    const x = xScale(points[i].m);
    const y = yScale(points[i].value);
    d += ` L ${x},${prevY} L ${x},${y}`;
  }
  return d;
}

/** Tracks an element's rendered width, so the chart can be drawn to fit it. */
function useElementWidth(ref: React.RefObject<HTMLElement | null>): number | null {
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.getBoundingClientRect().width || null);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

/** Ticks up (or down) from its previous value each time `value` changes. */
function AnimatedCurrency({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  const reduce = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduce) {
      node.textContent = formatCurrency(value);
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, {
      duration: 0.5,
      ease: EASE,
      onUpdate(latest) {
        node.textContent = formatCurrency(latest);
      },
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, reduce]);

  return (
    <span ref={ref} className={className}>
      {formatCurrency(value)}
    </span>
  );
}

/**
 * The growth chart. Its own component, rather than inline in the calculator,
 * because its hooks (measuring, in-view, arming) must live inside the subtree
 * that ScrollReveal remounts when it arms; hooks held by a parent above it would
 * be left observing the old, detached element.
 */
function ProjectionChart({
  points,
  reinvest,
  principal,
  months,
  monthlyRate,
  endingValue,
  resetKey,
  summary,
}: {
  points: Point[];
  reinvest: boolean;
  principal: number;
  months: number;
  monthlyRate: number;
  endingValue: number;
  /** Changes when the shape of the chart changes; a hover from before is stale. */
  resetKey: string;
  /** Plain-language description of the whole curve, for screen readers. */
  summary: string;
}) {
  const gradientId = useId();
  const chartRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ m: number; key: string } | null>(null);
  // Spoken only for keyboard use, so a mouse passing over the chart is silent.
  const [announcement, setAnnouncement] = useState("");

  const armed = useArmedReveal(chartRef);
  const inView = useInView(chartRef, { once: true, amount: 0.4 });
  const collapsed = armed && !inView;

  const measuredWidth = useElementWidth(chartRef);
  const { width: chartW, height: chartH, x0, x1, y0, y1 } = chartLayout(
    measuredWidth ?? DEFAULT_CHART_WIDTH,
  );

  const { axisMax, ticks: yTicks } = useMemo(() => computeAxis(endingValue), [endingValue]);
  const xTicks = useMemo(() => computeXTicks(months, x1 - x0), [months, x0, x1]);

  const xScale = (m: number) => x0 + (m / months) * (x1 - x0);
  const yScale = (v: number) => y1 - (v / axisMax) * (y1 - y0);

  const lineD = reinvest ? smoothPathD(points, xScale, yScale) : stepPathD(points, xScale, yScale);
  const areaD = `${lineD} L ${xScale(months)},${y1} L ${x0},${y1} Z`;

  const activeM = hover && hover.key === resetKey ? Math.min(hover.m, months) : null;
  const valueAt = (m: number) =>
    reinvest
      ? principal * (1 + monthlyRate) ** m
      : principal + Math.floor(m / 3) * (principal * ((1 + monthlyRate) ** 3 - 1));
  const activeValue = activeM === null ? 0 : valueAt(activeM);
  const tooltipLeft = Math.min(
    Math.max(activeM === null ? 0 : xScale(activeM), TOOLTIP_HALF_WIDTH),
    chartW - TOOLTIP_HALF_WIDTH,
  );

  function handlePointer(e: React.PointerEvent<HTMLDivElement>) {
    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    // Map the pointer into the chart's own drawing space (one unit = one px).
    const x = ((e.clientX - rect.left) / rect.width) * chartW;
    const m = Math.round(((x - x0) / (x1 - x0)) * months);
    setHover({ m: Math.min(Math.max(m, 0), months), key: resetKey });
  }

  function moveTo(m: number) {
    const clamped = Math.min(Math.max(m, 0), months);
    setHover({ m: clamped, key: resetKey });
    setAnnouncement(`${clamped === 0 ? "Start" : `Month ${clamped}`}: ${formatCurrency(valueAt(clamped))}`);
  }

  // The chart is the only way to read the value at an intermediate month, so it
  // has to be reachable without a pointer: arrows step by a month, Page keys by
  // a half-year, Home and End jump to the ends, Escape dismisses.
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const from = activeM;
    let next: number | null = null;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        next = from === null ? 0 : from + 1;
        break;
      case "ArrowLeft":
      case "ArrowDown":
        next = from === null ? months : from - 1;
        break;
      case "PageUp":
        next = (from ?? 0) + 6;
        break;
      case "PageDown":
        next = (from ?? months) - 6;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = months;
        break;
      case "Escape":
        setHover(null);
        setAnnouncement("");
        e.preventDefault();
        return;
      default:
        return;
    }
    e.preventDefault();
    moveTo(next);
  }

  return (
    // Rendered at its final state in the server HTML; the entrance only arms
    // once the client confirms the chart sits below the fold.
    <motion.div
      ref={chartRef}
      className="relative mt-10 w-full select-none"
      style={{ height: chartH }}
      initial={false}
      animate={{ opacity: collapsed ? 0 : 1, scaleY: collapsed ? 0.92 : 1 }}
      transition={collapsed ? { duration: 0 } : { duration: 0.5, ease: EASE }}
    >
      <div
        role="group"
        aria-label="Growth over time. Use the arrow keys to read the value at each month."
        tabIndex={0}
        className="absolute inset-0 touch-pan-y rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-steel-teal"
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Tapping or tabbing away is what dismisses a touched or keyed value.
          setHover(null);
          setAnnouncement("");
        }}
        onPointerDown={handlePointer}
        onPointerMove={handlePointer}
        onPointerLeave={(e) => {
          // A finger lifting is not "leaving"; leave a touched value on screen
          // until the reader touches elsewhere.
          if (e.pointerType === "mouse") setHover(null);
        }}
        onPointerCancel={() => setHover(null)}
      >
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
        <svg
          role="img"
          aria-label={summary}
          width={chartW}
          height={chartH}
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="block"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-steel-teal)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--color-steel-teal)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {yTicks.map((t) => (
            <g key={t}>
              <line
                x1={x0}
                x2={x1}
                y1={yScale(t)}
                y2={yScale(t)}
                stroke="var(--color-neutral-border)"
                strokeWidth="1"
              />
              <text
                x={x0 - 8}
                y={yScale(t)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="12"
                fontWeight="600"
                fill="var(--color-neutral-mist)"
              >
                {formatCompact(t)}
              </text>
            </g>
          ))}

          <line
            x1={x0}
            x2={x1}
            y1={yScale(principal)}
            y2={yScale(principal)}
            stroke="var(--color-neutral-mist)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          {/* Names the dashed line, which is otherwise left for the reader to
              decode. Slate rather than mist: it sits over the tinted area fill. */}
          {principal > 0 && (
            <text
              x={x1 - 6}
              y={yScale(principal) + 16}
              textAnchor="end"
              fontSize="12"
              fontWeight="600"
              fill="var(--color-neutral-slate)"
            >
              Initial investment
            </text>
          )}

          {xTicks.map((m) => (
            <text
              key={m}
              x={xScale(m)}
              y={chartH - 10}
              textAnchor={m === 0 ? "start" : m === months ? "end" : "middle"}
              fontSize="12"
              fontWeight="600"
              fill="var(--color-neutral-mist)"
            >
              {m === 0 ? "Start" : `${m} mo`}
            </text>
          ))}

          <g key={resetKey} className="animate-fade-in">
            <path d={areaD} fill={`url(#${gradientId})`} stroke="none" />
            <path
              d={lineD}
              fill="none"
              stroke="var(--color-institutional-navy)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          <circle
            cx={xScale(months)}
            cy={yScale(endingValue)}
            r="5"
            fill="var(--color-institutional-navy)"
            stroke="var(--color-neutral-white)"
            strokeWidth="2"
          />

          {activeM !== null && (
            <g>
              <line
                x1={xScale(activeM)}
                x2={xScale(activeM)}
                y1={y0}
                y2={y1}
                stroke="var(--color-neutral-mist)"
                strokeWidth="1"
                strokeDasharray="2 3"
              />
              <circle
                cx={xScale(activeM)}
                cy={yScale(activeValue)}
                r="5"
                fill="var(--color-steel-teal-deep)"
                stroke="var(--color-neutral-white)"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        <AnimatePresence>
          {activeM !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-md border border-neutral-border bg-neutral-white px-2.5 py-1.5 shadow-card-hover"
              style={{ left: tooltipLeft, top: yScale(activeValue) }}
            >
              <p className="text-[11px] font-semibold text-neutral-mist">
                {activeM === 0 ? "Start" : `Month ${activeM}`}
              </p>
              <p className="text-[13px] font-bold tabular-nums text-institutional-navy">
                {formatCurrency(activeValue)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function NoteCalculator() {
  const reduce = useReducedMotion();

  const [termIndex, setTermIndex] = useState(DEFAULT_TERM_INDEX);
  const [principal, setPrincipal] = useState(PRINCIPAL_MIN);
  const [reinvest, setReinvest] = useState(true);

  const term = NOTE_TERMS[termIndex];
  const months = term.months;
  const monthlyRate = useMemo(() => parseMonthlyRate(term.monthly), [term.monthly]);

  const points = useMemo(
    () =>
      reinvest
        ? buildReinvestPoints(months, monthlyRate, principal)
        : buildCashPoints(months, monthlyRate, principal),
    [reinvest, months, monthlyRate, principal],
  );

  const endingValue = points[points.length - 1].value;
  const totalEarned = endingValue - principal;

  const amountRef = useRef<HTMLInputElement>(null);

  function handlePrincipalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    // The field reformats with thousands separators on every keystroke, which
    // would throw the caret to the end while editing mid-number. Remember how
    // many digits sat left of it, and put it back after the reformat.
    const digitsLeftOfCaret = raw.slice(0, e.target.selectionStart ?? raw.length).replace(/\D/g, "").length;
    requestAnimationFrame(() => {
      const el = amountRef.current;
      if (!el || document.activeElement !== el) return;
      let seen = 0;
      let pos = digitsLeftOfCaret === 0 ? 0 : el.value.length;
      for (let i = 0; i < el.value.length && digitsLeftOfCaret > 0; i++) {
        if (/\d/.test(el.value[i])) seen++;
        if (seen === digitsLeftOfCaret) {
          pos = i + 1;
          break;
        }
      }
      el.setSelectionRange(pos, pos);
    });

    const digits = raw.replace(/[^0-9]/g, "");
    setPrincipal(digits === "" ? 0 : Math.min(parseInt(digits, 10), PRINCIPAL_MAX));
  }

  const amountHint =
    principal === 0
      ? "Enter an amount to see a projection."
      : principal < PRINCIPAL_MIN
        ? "Below the $200,000 individual investor minimum."
        : principal >= PRINCIPAL_MAX
          ? "Estimates are capped at $50,000,000."
          : "$200,000 minimum for individual investors, $1,000,000 for entities.";

  const chartSummary = `Projected value of ${formatCurrency(principal)} over ${term.full} at ${term.annual}, ${
    reinvest ? "with interest reinvested monthly" : "with interest paid in cash each quarter"
  }. It grows to ${formatCurrency(endingValue)}, earning ${formatCurrency(totalEarned)}.`;

  return (
    <section id="calculator" className="bg-neutral-paper">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <ScrollReveal className="max-w-2xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl leading-[1.15] font-medium text-institutional-navy md:text-4xl">
            See what your note could earn.
          </h2>
          <p className="mt-5 max-w-[65ch] text-[1.0625rem] leading-relaxed text-neutral-slate">
            Choose a term, an investment amount, and how you'd like interest paid, to see the
            note's fixed contractual rate carried out to maturity.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.06} className="mt-12">
          <div className="rounded-[10px] border border-neutral-border bg-neutral-white p-6 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start lg:gap-12">
              <div className="space-y-7">
                <div>
                  <p className="mb-2.5 text-[13px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
                    Note term
                  </p>
                  <div role="group" aria-label="Select a note term" className="flex flex-wrap gap-2">
                    {NOTE_TERMS.map((t, i) => {
                      const isSelected = i === termIndex;
                      return (
                        <button
                          key={t.months}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setTermIndex(i)}
                          className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-150 ease-out-soft pointer-coarse:min-h-11 pointer-coarse:px-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal ${
                            isSelected
                              ? "border-institutional-navy bg-institutional-navy text-neutral-white"
                              : "border-neutral-border text-neutral-slate hover:border-steel-teal hover:text-institutional-navy"
                          }`}
                        >
                          {t.short}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="calc-principal"
                    className="mb-2.5 block text-[13px] font-semibold tracking-[0.06em] text-neutral-mist uppercase"
                  >
                    Initial investment
                  </label>
                  <div className="flex items-baseline gap-2">
                    <span className="font-[family-name:var(--font-sans)] text-2xl font-bold text-institutional-navy">
                      $
                    </span>
                    <input
                      id="calc-principal"
                      ref={amountRef}
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      aria-describedby="calc-principal-hint"
                      value={principal === 0 ? "" : principal.toLocaleString("en-US")}
                      onChange={handlePrincipalChange}
                      placeholder="200,000"
                      className="w-full border-b-2 border-neutral-border bg-transparent font-[family-name:var(--font-sans)] text-2xl font-bold text-institutional-navy outline-none transition-colors duration-150 ease-out-soft focus:border-steel-teal"
                    />
                  </div>
                  <input
                    type="range"
                    aria-label="Adjust initial investment"
                    aria-describedby="calc-principal-hint"
                    min={PRINCIPAL_MIN}
                    max={PRINCIPAL_MAX_SLIDER}
                    step={25_000}
                    value={Math.min(Math.max(principal, PRINCIPAL_MIN), PRINCIPAL_MAX_SLIDER)}
                    onChange={(e) => setPrincipal(Number(e.target.value))}
                    className="mt-3 h-6 w-full cursor-pointer accent-institutional-navy pointer-coarse:h-11"
                  />
                  <p id="calc-principal-hint" className="mt-1.5 text-[12px] text-neutral-mist">
                    {amountHint}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2.5 text-[13px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
                  Interest
                </p>
                <div
                  role="group"
                  aria-label="How interest is paid"
                  className="relative inline-flex rounded-full border border-neutral-border bg-neutral-paper p-1"
                >
                  {(
                    [
                      { key: true, label: "Reinvest" },
                      { key: false, label: "Quarterly cash" },
                    ] as const
                  ).map((opt) => {
                    const active = reinvest === opt.key;
                    return (
                      <button
                        key={String(opt.key)}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setReinvest(opt.key)}
                        className="relative z-10 rounded-full px-4 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors duration-150 ease-out-soft pointer-coarse:min-h-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal"
                        style={{ color: active ? "var(--color-neutral-white)" : "var(--color-neutral-slate)" }}
                      >
                        {active && (
                          <motion.span
                            layoutId="calc-reinvest-pill"
                            className="absolute inset-0 -z-10 rounded-full bg-institutional-navy"
                            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                          />
                        )}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2.5 max-w-[22ch] text-[12px] text-neutral-mist">
                  {reinvest
                    ? "Interest compounds monthly and appreciates the principal."
                    : "Interest is paid out in cash every quarter instead."}
                </p>
              </div>
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-neutral-border pt-8 sm:grid-cols-4">
              <div>
                <dt className="text-[13px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
                  Annual rate
                </dt>
                <dd className="mt-1.5 font-[family-name:var(--font-sans)] text-2xl font-bold text-institutional-navy">
                  {term.annual}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
                  Initial investment
                </dt>
                <dd className="mt-1.5 font-[family-name:var(--font-sans)] text-2xl font-bold text-institutional-navy">
                  <AnimatedCurrency value={principal} />
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
                  Total earned
                </dt>
                <dd className="mt-1.5 font-[family-name:var(--font-sans)] text-2xl font-bold text-steel-teal-deep">
                  <AnimatedCurrency value={totalEarned} />
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
                  Value at maturity
                </dt>
                <dd className="mt-1.5 font-[family-name:var(--font-sans)] text-2xl font-bold text-institutional-navy">
                  <AnimatedCurrency value={endingValue} />
                </dd>
              </div>
            </dl>

            <ProjectionChart
              points={points}
              reinvest={reinvest}
              principal={principal}
              months={months}
              monthlyRate={monthlyRate}
              endingValue={endingValue}
              resetKey={`${termIndex}-${reinvest}`}
              summary={chartSummary}
            />

            <p className="mt-5 text-[12px] leading-relaxed text-neutral-mist">
              Illustrative only, based on the note's fixed contractual rate.{" "}
              {reinvest
                ? "Assumes interest compounds monthly and remains invested through maturity."
                : "Assumes interest is distributed in cash each quarter rather than reinvested."}{" "}
              Not a guarantee of future returns.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
