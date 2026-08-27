"use client";

import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { DEFAULT_TERM_INDEX, NOTE_TERMS } from "../lib/rates";
import { ScrollReveal } from "./ScrollReveal";

// A projection tool, not a promise: every figure here is derived live from the
// note's own published rate schedule (lib/rates.ts), never restated or
// hand-tuned, so it can never drift out of step with the actual offering.

type Point = { m: number; value: number };

const EASE = [0.16, 1, 0.3, 1] as const;
const VIEWBOX_W = 680;
const VIEWBOX_H = 280;
const PAD_L = 56;
const PAD_R = 12;
const PAD_T = 16;
const PAD_B = 28;
const PLOT_X0 = PAD_L;
const PLOT_X1 = VIEWBOX_W - PAD_R;
const PLOT_Y0 = PAD_T;
const PLOT_Y1 = VIEWBOX_H - PAD_B;

const PRINCIPAL_MIN = 200_000;
const PRINCIPAL_MAX_SLIDER = 2_000_000;
const PRINCIPAL_MAX = 50_000_000;

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

function computeXTicks(months: number): number[] {
  const step = months <= 12 ? 3 : months <= 24 ? 6 : 12;
  const ticks = [0];
  for (let m = step; m < months; m += step) ticks.push(m);
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

function areaPathD(lineD: string, endX: number): string {
  return `${lineD} L ${endX},${PLOT_Y1} L ${PLOT_X0},${PLOT_Y1} Z`;
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

export function NoteCalculator() {
  const reduce = useReducedMotion();
  const gradientId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

  const [termIndex, setTermIndex] = useState(DEFAULT_TERM_INDEX);
  const [principal, setPrincipal] = useState(PRINCIPAL_MIN);
  const [reinvest, setReinvest] = useState(true);
  const [hoverM, setHoverM] = useState<number | null>(null);

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

  const { axisMax, ticks: yTicks } = useMemo(() => computeAxis(endingValue), [endingValue]);
  const xTicks = useMemo(() => computeXTicks(months), [months]);

  const xScale = (m: number) => PLOT_X0 + (m / months) * (PLOT_X1 - PLOT_X0);
  const yScale = (v: number) => PLOT_Y1 - (v / axisMax) * (PLOT_Y1 - PLOT_Y0);

  const lineD = reinvest ? smoothPathD(points, xScale, yScale) : stepPathD(points, xScale, yScale);
  const areaD = areaPathD(lineD, xScale(months));

  const hoverValue =
    hoverM === null
      ? 0
      : reinvest
        ? principal * (1 + monthlyRate) ** hoverM
        : principal + Math.floor(hoverM / 3) * (principal * ((1 + monthlyRate) ** 3 - 1));

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const fraction = (e.clientX - rect.left) / rect.width;
    const svgX = fraction * VIEWBOX_W;
    const m = Math.round(((svgX - PLOT_X0) / (PLOT_X1 - PLOT_X0)) * months);
    setHoverM(Math.min(Math.max(m, 0), months));
  }

  function handlePrincipalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/[^0-9]/g, "");
    setPrincipal(digits === "" ? 0 : Math.min(parseInt(digits, 10), PRINCIPAL_MAX));
  }

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
                          className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-150 ease-out-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal ${
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
                      type="text"
                      inputMode="numeric"
                      value={principal === 0 ? "" : principal.toLocaleString("en-US")}
                      onChange={handlePrincipalChange}
                      placeholder="200,000"
                      className="w-full border-b-2 border-neutral-border bg-transparent font-[family-name:var(--font-sans)] text-2xl font-bold text-institutional-navy outline-none transition-colors duration-150 ease-out-soft focus:border-steel-teal"
                    />
                  </div>
                  <input
                    type="range"
                    aria-label="Initial investment"
                    min={PRINCIPAL_MIN}
                    max={PRINCIPAL_MAX_SLIDER}
                    step={25_000}
                    value={Math.min(Math.max(principal, PRINCIPAL_MIN), PRINCIPAL_MAX_SLIDER)}
                    onChange={(e) => setPrincipal(Number(e.target.value))}
                    className="mt-3 h-1.5 w-full cursor-pointer accent-institutional-navy"
                  />
                  <p className="mt-1.5 text-[12px] text-neutral-mist">
                    {principal > 0 && principal < PRINCIPAL_MIN
                      ? "Below the $200,000 individual investor minimum."
                      : "$200,000 minimum for individual investors, $1,000,000 for entities."}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2.5 text-[13px] font-semibold tracking-[0.06em] text-neutral-mist uppercase">
                  Interest
                </p>
                <div className="relative inline-flex rounded-full border border-neutral-border bg-neutral-paper p-1">
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
                        className="relative z-10 rounded-full px-4 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors duration-150 ease-out-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal"
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

            <div className="mt-10 grid grid-cols-2 gap-6 border-t border-neutral-border pt-8 sm:grid-cols-4">
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
            </div>

            <motion.div
              className="relative mt-10 w-full select-none"
              style={{ aspectRatio: `${VIEWBOX_W} / ${VIEWBOX_H}` }}
              initial={reduce ? false : { opacity: 0, scaleY: 0.9 }}
              whileInView={{ opacity: 1, scaleY: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <div
                ref={wrapRef}
                className="absolute inset-0"
                onPointerMove={handlePointerMove}
                onPointerLeave={() => setHoverM(null)}
              >
                <svg
                  viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
                  preserveAspectRatio="none"
                  className="block h-full w-full overflow-visible"
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
                        x1={PLOT_X0}
                        x2={PLOT_X1}
                        y1={yScale(t)}
                        y2={yScale(t)}
                        stroke="var(--color-neutral-border)"
                        strokeWidth="1"
                      />
                      <text
                        x={PLOT_X0 - 8}
                        y={yScale(t)}
                        textAnchor="end"
                        dominantBaseline="middle"
                        fontSize="10"
                        fontWeight="600"
                        fill="var(--color-neutral-mist)"
                      >
                        {formatCompact(t)}
                      </text>
                    </g>
                  ))}

                  <line
                    x1={PLOT_X0}
                    x2={PLOT_X1}
                    y1={yScale(principal)}
                    y2={yScale(principal)}
                    stroke="var(--color-neutral-mist)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />

                  {xTicks.map((m) => (
                    <text
                      key={m}
                      x={xScale(m)}
                      y={VIEWBOX_H - 8}
                      textAnchor={m === 0 ? "start" : m === months ? "end" : "middle"}
                      fontSize="10"
                      fontWeight="600"
                      fill="var(--color-neutral-mist)"
                    >
                      {m === 0 ? "Start" : `Mo ${m}`}
                    </text>
                  ))}

                  <g key={`${termIndex}-${reinvest}`}>
                    <motion.path
                      d={areaD}
                      fill={`url(#${gradientId})`}
                      stroke="none"
                      initial={reduce ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, ease: EASE }}
                    />
                    <motion.path
                      d={lineD}
                      fill="none"
                      stroke="var(--color-institutional-navy)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={reduce ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, ease: EASE }}
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

                  {hoverM !== null && (
                    <g>
                      <line
                        x1={xScale(hoverM)}
                        x2={xScale(hoverM)}
                        y1={PLOT_Y0}
                        y2={PLOT_Y1}
                        stroke="var(--color-neutral-mist)"
                        strokeWidth="1"
                        strokeDasharray="2 3"
                      />
                      <circle
                        cx={xScale(hoverM)}
                        cy={yScale(hoverValue)}
                        r="5"
                        fill="var(--color-steel-teal-deep)"
                        stroke="var(--color-neutral-white)"
                        strokeWidth="2"
                      />
                    </g>
                  )}
                </svg>

                <AnimatePresence>
                  {hoverM !== null && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-md border border-neutral-border bg-neutral-white px-2.5 py-1.5 shadow-card-hover"
                      style={{
                        left: `${(xScale(hoverM) / VIEWBOX_W) * 100}%`,
                        top: `${(yScale(hoverValue) / VIEWBOX_H) * 100}%`,
                      }}
                    >
                      <p className="text-[11px] font-semibold text-neutral-mist">
                        {hoverM === 0 ? "Start" : `Month ${hoverM}`}
                      </p>
                      <p className="text-[13px] font-bold tabular-nums text-institutional-navy">
                        {formatCurrency(hoverValue)}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

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
