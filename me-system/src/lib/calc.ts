// Indicator calculation rules from the specification, section 6.
// Every function returns an explicit "unavailable" result instead of a
// fabricated zero, infinity or clipped value (FR-11, FR-12).

export type CalcResult =
  | { ok: true; value: number; note?: string }
  | { ok: false; reason: string };

const unavailable = (reason: string): CalcResult => ({ ok: false, reason });

/** Achievement against target, e.g. target 100, actual 80 -> 80 %. */
export function achievement(actual: number | null, target: number | null): CalcResult {
  if (actual === null) return unavailable("Not reported");
  if (target === null) return unavailable("No approved target for this period");
  if (target === 0) return unavailable("Target is zero; ratio not calculable");
  return { ok: true, value: (actual / target) * 100 };
}

export interface Fraction {
  numerator: number | null;
  denominator: number | null;
}

/** Pool compatible numerators and denominators; never average percentages. */
export function pooledPercentage(parts: Fraction[]): CalcResult {
  if (parts.length === 0) return unavailable("No data");
  if (parts.some((p) => p.numerator === null || p.denominator === null)) {
    return unavailable("A numerator or denominator is missing");
  }
  const num = parts.reduce((s, p) => s + (p.numerator as number), 0);
  const den = parts.reduce((s, p) => s + (p.denominator as number), 0);
  if (den === 0) return unavailable("Denominator is zero; rate not calculable");
  return { ok: true, value: (num / den) * 100, note: `${num} of ${den}` };
}

export interface Snapshot {
  periodEnd: string; // ISO date
  value: number;
  sourcePriority?: number;
}

/** Cumulative indicators use the latest approved snapshot, not a sum. */
export function latestSnapshot(snapshots: Snapshot[]): CalcResult {
  if (snapshots.length === 0) return unavailable("No data");
  const sorted = [...snapshots].sort((a, b) => b.periodEnd.localeCompare(a.periodEnd));
  const latest = sorted.filter((s) => s.periodEnd === sorted[0].periodEnd);
  if (latest.length > 1) {
    const withPriority = latest.filter((s) => s.sourcePriority !== undefined);
    if (withPriority.length !== latest.length) {
      return unavailable("Two snapshots share the latest date; needs source priority or review");
    }
    withPriority.sort((a, b) => (a.sourcePriority as number) - (b.sourcePriority as number));
    if (withPriority[0].sourcePriority === withPriority[1].sourcePriority) {
      return unavailable("Equal-date snapshots have equal priority; needs review");
    }
    return { ok: true, value: withPriority[0].value };
  }
  return { ok: true, value: latest[0].value };
}

/** Weighted mean from values and weights, e.g. 5 and 9 with weights 10 and 30 -> 8. */
export function weightedMean(items: { value: number; weight: number }[]): CalcResult {
  if (items.length === 0) return unavailable("No data");
  if (items.some((i) => i.weight < 0)) return unavailable("Negative weight");
  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  if (totalWeight === 0) return unavailable("Total weight is zero");
  const weightedSum = items.reduce((s, i) => s + i.value * i.weight, 0);
  return { ok: true, value: weightedSum / totalWeight, note: `${weightedSum} / ${totalWeight}` };
}

/**
 * Progress from baseline toward target. Direction decides the formula.
 * Values below 0 or above 100 stay visible; they are never clipped.
 */
export function baselineProgress(
  baseline: number | null,
  target: number | null,
  actual: number | null,
  direction: "increase" | "decrease",
): CalcResult {
  if (baseline === null) return unavailable("Baseline unknown");
  if (target === null) return unavailable("No approved target");
  if (actual === null) return unavailable("Not reported");
  if (direction === "decrease") {
    if (!(baseline > target)) return unavailable("Reduction method needs baseline above target");
    return { ok: true, value: ((baseline - actual) / (baseline - target)) * 100 };
  }
  if (!(target > baseline)) return unavailable("Increase method needs target above baseline");
  return { ok: true, value: ((actual - baseline) / (target - baseline)) * 100 };
}

export function formatResult(r: CalcResult, digits = 1, suffix = "%"): string {
  if (!r.ok) return r.reason;
  const rounded = Number(r.value.toFixed(digits));
  return `${rounded.toLocaleString("en-GB")}${suffix}`;
}
