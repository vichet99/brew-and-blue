"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusTag } from "@/components/ui";

interface Row {
  code: string;
  label: string;
  action: number;
  ministry: string;
  target: string;
  method: string;
  value: string | null;
  pct: number | null;
  status: string | null;
}

const methodLabel: Record<string, string> = {
  count_to_target: "Count vs target",
  percent_complete: "% complete",
  milestone: "Milestone",
  inverse_time: "Time (target ÷ value)",
};

export function IndicatorFilterTable({ rows }: { rows: Row[] }) {
  const [ministry, setMinistry] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const ministries = useMemo(() => [...new Set(rows.map((r) => r.ministry))].sort(), [rows]);
  const shown = rows.filter((r) => (!ministry || r.ministry === ministry) && (!status || r.status === status) && (!method || r.method === method));
  return (
    <>
      <form className="card filters" onSubmit={(e) => e.preventDefault()} aria-label="Filter action indicators">
        <div className="field">
          <label htmlFor="i-min">Reporting ministry</label>
          <select id="i-min" value={ministry} onChange={(e) => setMinistry(e.target.value)}>
            <option value="">All</option>
            {ministries.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="i-status">2025 status</label>
          <select id="i-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Any</option>
            <option>Fully Achieved</option>
            <option>Largely Achieved</option>
            <option>Limited Progress</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="i-method">Calculation</label>
          <select id="i-method" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="">Any</option>
            {Object.entries(methodLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </form>
      <p className="small" role="status">{shown.length} of {rows.length} indicators</p>
      <div className="table-wrap" role="region" aria-label="Action indicators" tabIndex={0}>
        <table>
          <caption>Action indicators, reporting year 2025</caption>
          <thead>
            <tr>
              <th scope="col">Indicator</th><th scope="col" className="num">Action</th><th scope="col">Ministry</th>
              <th scope="col">2027 target</th><th scope="col">Calculation</th><th scope="col" className="num">2025 %</th><th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.code}>
                <td><Link href={`/indicators/${r.code}`} className="nowrap">{r.code}</Link><div className="small">{r.label.length > 110 ? r.label.slice(0, 110) + "…" : r.label}</div></td>
                <td className="num"><Link href={`/projects/ACT-${String(r.action).padStart(2, "0")}`}>{r.action}</Link></td>
                <td>{r.ministry}</td>
                <td className="small">{r.target}</td>
                <td className="small">{methodLabel[r.method]}</td>
                <td className="num">{r.pct === null ? "—" : `${r.pct}%`}</td>
                <td>{r.status && <StatusTag status={r.status} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
