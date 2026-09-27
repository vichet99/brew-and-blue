"use client";

import { useMemo, useState } from "react";
import { PercentBars, StatusBars } from "@/components/charts";
import { StatusTag } from "@/components/ui";
import { statusWith, type Threshold } from "@/lib/rules";

interface A {
  code: string;
  no: number;
  cluster: "production" | "processing" | "export";
  ministries: string[];
  pct: number | null;
}
interface M {
  code: string;
  short: string;
  name: string;
  pcts: (number | null)[];
}

const CL = { production: "Production", processing: "Processing", export: "Export" };

function count(pcts: (number | null)[], t: Threshold) {
  const c = { fully: 0, largely: 0, limited: 0 };
  const v: number[] = [];
  for (const p of pcts) {
    const s = statusWith(p, t);
    if (s === "Fully Achieved") c.fully++;
    else if (s === "Largely Achieved") c.largely++;
    else if (s === "Limited Progress") c.limited++;
    if (p !== null) v.push(Math.min(p, 100));
  }
  return { ...c, completion: v.length ? v.reduce((a, b) => a + b, 0) / v.length : null };
}

export function ActionsDashboard({ actions, ministries, thresholds }: { actions: A[]; ministries: M[]; thresholds: Threshold[] }) {
  const [year, setYear] = useState(2025);
  const t = thresholds.find((x) => x.year === year)!;
  const all = useMemo(() => count(actions.map((a) => a.pct), t), [actions, t]);
  const clusters = (Object.keys(CL) as A["cluster"][]).map((k) => ({ k, ...count(actions.filter((a) => a.cluster === k).map((a) => a.pct), t) }));
  const byMinistry = ministries
    .map((m) => ({ m, ...count(m.pcts, t) }))
    .sort((a, b) => (b.completion ?? -1) - (a.completion ?? -1));

  return (
    <>
      <div className="card filters filters--split">
        <div className="field">
          <label htmlFor="thr">Grade the 2025 results with the thresholds of</label>
          <select id="thr" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {thresholds.filter((x) => x.year <= 2027).map((x) => (
              <option key={x.year} value={x.year}>{x.year}{x.year === 2025 ? " (official)" : " (what-if)"}: largely ≥ {x.largely}%</option>
            ))}
          </select>
        </div>
        <p className="small" style={{ margin: 0 }} role="status">
          {year === 2025
            ? "Official 2025 grading, as endorsed. Fully achieved = 100% of the 2027 target."
            : `What-if: the same 2025 values under the ${year} rule. This shows how much must still change to keep each grade.`}
        </p>
      </div>

      <div className="kpi-grid">
        <div className="kpi"><p className="stat">{actions.length}</p><p>Total actions</p></div>
        <div className="kpi kpi--fully"><p className="stat">{all.fully}</p><p><StatusTag status="Fully Achieved" /></p></div>
        <div className="kpi kpi--largely"><p className="stat">{all.largely}</p><p><StatusTag status="Largely Achieved" /></p></div>
        <div className="kpi kpi--limited"><p className="stat">{all.limited}</p><p><StatusTag status="Limited Progress" /></p></div>
        <div className="kpi"><p className="stat">{all.completion === null ? "—" : `${Math.round(all.completion)}%`}</p><p>Completion rate</p></div>
      </div>

      <div className="grid grid--2">
        <div className="card">
          <StatusBars caption={`Status by cluster (${year} rule)`} rows={clusters.map((c) => ({ label: CL[c.k], fully: c.fully, largely: c.largely, limited: c.limited }))} />
        </div>
        <div className="card">
          <PercentBars
            caption="Completion rate by cluster"
            markers={[{ at: t.largely, label: `${year} largely` }]}
            rows={clusters.map((c) => ({ label: CL[c.k], value: c.completion, sub: `${actions.filter((a) => a.cluster === c.k).length} actions` }))}
          />
        </div>
      </div>

      <h2>By ministry</h2>
      <div className="grid grid--2">
        <div className="card">
          <PercentBars
            caption="Completion rate by ministry (indicator average)"
            markers={[{ at: t.largely, label: `${year} largely` }]}
            rows={byMinistry.map((r) => ({ label: r.m.short, href: `/programmes/${r.m.code}`, value: r.completion, sub: `${r.m.pcts.length} indicators` }))}
          />
        </div>
        <div className="card">
          <StatusBars
            caption={`Indicator status by ministry (${year} rule)`}
            unit="indicators"
            rows={byMinistry.map((r) => ({ label: r.m.short, href: `/programmes/${r.m.code}`, fully: r.fully, largely: r.largely, limited: r.limited }))}
          />
        </div>
      </div>
    </>
  );
}
