// Pure scoring rules shared by server pages and client forms (no data imports).

export type ActionStatus = "Fully Achieved" | "Largely Achieved" | "Limited Progress";
export type Method = "count_to_target" | "percent_complete" | "milestone" | "inverse_time";

export interface Threshold {
  year: number;
  largely: number;
  fully: number;
}

/**
 * Status from a percentage of the 2027 target. Values above 100% count as
 * 100% for status only; the actual percentage stays visible elsewhere.
 */
export function statusWith(pct: number | null | undefined, t: Threshold): ActionStatus | null {
  if (pct === null || pct === undefined || !Number.isFinite(pct)) return null;
  const capped = Math.min(pct, 100);
  if (capped >= t.fully) return "Fully Achieved";
  if (capped >= t.largely) return "Largely Achieved";
  return "Limited Progress";
}

/** Percentage of target as the Kobo form computes it (mirrors each indicator's calculation). */
export function koboPercentage(i: { method: Method; target: number | null }, value: string | number | null): number | null {
  if (value === null || value === "") return null;
  if (i.method === "milestone") return ({ completed: 100, in_progress: 50, not_started: 0 } as Record<string, number>)[String(value)] ?? null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (i.method === "percent_complete") return Math.min(n, 100);
  if (i.method === "inverse_time") return n > 0 && i.target ? Math.round((i.target / n) * 100) : null;
  return i.target ? Math.round((n / i.target) * 100) : null;
}
