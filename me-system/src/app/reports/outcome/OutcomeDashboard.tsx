"use client";

import Link from "next/link";
import { useState } from "react";
import { MiniLine } from "@/components/charts";
import { StatusTag } from "@/components/ui";
import { formatByUnit } from "@/lib/format";

interface O {
  code: string;
  title: string;
  unit: string;
  direction: "increase" | "decrease";
  area: string;
  source: string;
  series: Record<string, number | null>;
  testData: boolean;
}
interface Market {
  destination: string;
  kernel_t: number;
  kernel_usd: number;
  processed_t: number;
  processed_usd: number;
  rcn_eq_t: number;
}

function trend(o: O, year: number) {
  const b = o.series["2022"], c = o.series[String(year)];
  if (b === null || b === undefined || c === null || c === undefined) return { t: "No data", change: null as number | null, pc: null as number | null };
  const ch = c - b;
  const better = o.direction === "increase" ? ch > 0 : ch < 0;
  return { t: Math.abs(ch) < 1e-9 ? "No change" : better ? "Improving" : "Declining", change: ch, pc: b ? (ch / b) * 100 : null };
}

const YEARS = [2022, 2023, 2024, 2025];
const t0 = (n: number) => n.toLocaleString("en-GB", { maximumFractionDigits: 1 });

export function OutcomeDashboard({ indicators, markets }: { indicators: O[]; markets: Record<string, Market[]> }) {
  const [year, setYear] = useState(2025);
  const get = (c: string) => indicators.find((o) => o.code === c)!;
  const headline = ["P2", "P3", "M2", "S1"].map(get);
  const top = markets[String(year)] ?? [];
  const totalEq = top.reduce((s, m) => s + m.kernel_t * 4 + m.processed_t * 4.1, 0);

  return (
    <>
      <div className="card filters filters--split">
        <div className="field">
          <label htmlFor="yr">Year</label>
          <select id="yr" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {YEARS.map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>
        <p className="small" style={{ margin: 0 }} role="status">Compared with the 2022 baseline. Improving/declining depends on each indicator&apos;s direction (for nut count and top-destination share, lower is better).</p>
      </div>

      <div className="kpi-grid">
        {headline.map((o) => {
          const tr = trend(o, year);
          return (
            <div className="kpi" key={o.code}>
              <p className="small muted" style={{ marginBottom: 4 }}>{o.code} · {o.title}</p>
              <p className="stat">{formatByUnit(o.unit, o.series[String(year)])} <small>{o.unit === "USD" || o.unit === "%" ? "" : o.unit}</small></p>
              <p className="small"><StatusTag status={tr.t} />{tr.pc !== null && year !== 2022 ? ` ${tr.pc > 0 ? "+" : ""}${tr.pc.toFixed(0)}% vs 2022` : ""}</p>
            </div>
          );
        })}
      </div>

      <h2>All 13 outcome indicators</h2>
      <div className="table-wrap" role="region" aria-label="Outcome indicators" tabIndex={0}>
        <table>
          <caption>Outcome indicators, {year} against the 2022 baseline</caption>
          <thead>
            <tr>
              <th scope="col">Code</th><th scope="col">Indicator</th><th scope="col">Unit</th><th scope="col" className="num">2022</th>
              <th scope="col" className="num">{year}</th><th scope="col" className="num">Change</th><th scope="col">Trend</th><th scope="col">Better when</th><th scope="col">Area</th>
            </tr>
          </thead>
          <tbody>
            {indicators.map((o) => {
              const tr = trend(o, year);
              return (
                <tr key={o.code}>
                  <td>{o.code}</td>
                  <td><Link href={`/indicators/${o.code}`}>{o.title}</Link>{o.testData && <div><StatusTag status="Test data" /></div>}</td>
                  <td>{o.unit}</td>
                  <td className="num">{formatByUnit(o.unit, o.series["2022"])}</td>
                  <td className="num">{formatByUnit(o.unit, o.series[String(year)])}</td>
                  <td className="num">{tr.pc === null ? "—" : `${tr.pc > 0 ? "+" : ""}${tr.pc.toFixed(1)}%`}</td>
                  <td><StatusTag status={tr.t} /></td>
                  <td>{o.direction === "increase" ? "Higher" : "Lower"}</td>
                  <td>{o.area}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2>Trends</h2>
      <div className="grid grid--3">
        {["P1", "P2", "P3", "M2", "M3", "S1"].map((c) => {
          const o = get(c);
          return (
            <div className="card" key={c}>
              <MiniLine title={`${o.code} ${o.title}`} unit={o.unit} highlight={year} points={YEARS.map((y) => ({ x: y, y: o.series[String(y)] }))} />
              <p className="small muted" style={{ margin: 0 }}>Source: {o.source}</p>
            </div>
          );
        })}
      </div>

      <h2>Top 10 export markets for kernels and processed cashew, {year}</h2>
      {top.length === 0 ? (
        <div className="notice"><p>No customs data for {year}.</p></div>
      ) : (
        <div className="table-wrap" role="region" aria-label="Top export markets" tabIndex={0}>
          <table>
            <caption>Ranked by RCN-equivalent tonnes (kernel × 4, processed × 4.1). Source: GDCE customs records.</caption>
            <thead>
              <tr>
                <th scope="col" className="num">Rank</th><th scope="col">Destination</th><th scope="col" className="num">Kernel (t)</th><th scope="col" className="num">Kernel (USD)</th>
                <th scope="col" className="num">Processed (t)</th><th scope="col" className="num">Processed (USD)</th><th scope="col" className="num">RCN-eq. (t)</th><th scope="col" className="num">Share</th>
              </tr>
            </thead>
            <tbody>
              {top.map((m, i) => {
                const eq = m.kernel_t * 4 + m.processed_t * 4.1;
                return (
                  <tr key={m.destination}>
                    <td className="num">{i + 1}</td><td>{m.destination}</td>
                    <td className="num">{t0(m.kernel_t)}</td><td className="num">{Math.round(m.kernel_usd).toLocaleString("en-GB")}</td>
                    <td className="num">{t0(m.processed_t)}</td><td className="num">{Math.round(m.processed_usd).toLocaleString("en-GB")}</td>
                    <td className="num">{t0(eq)}</td><td className="num">{totalEq ? `${((eq / totalEq) * 100).toFixed(1)}%` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="small muted">Share is within the top 10 shown. Raw cashew nut (RCN) exports are excluded from this ranking; indicator M1 tracks RCN destination concentration.</p>
    </>
  );
}
