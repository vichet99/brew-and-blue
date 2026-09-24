// Unit-aware number formatting shared by server pages and client charts.
// Kept free of data imports so client bundles stay small.

export function formatByUnit(unit: string, v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "No data";
  if (unit === "%") return `${(v * 100).toLocaleString("en-GB", { maximumFractionDigits: 1 })}%`;
  if (unit === "USD") return `$${(v / 1e6).toLocaleString("en-GB", { maximumFractionDigits: 0 })}m`;
  if (unit === "t/ha") return v.toLocaleString("en-GB", { maximumFractionDigits: 2 });
  return v.toLocaleString("en-GB", { maximumFractionDigits: 1 });
}
