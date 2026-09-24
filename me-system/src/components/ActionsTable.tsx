"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusTag } from "./ui";

export interface ActionRow {
  code: string;
  no: number;
  title: string;
  cluster: string;
  clusterLabel: string;
  lead: string;
  ministries: string[]; // short codes
  pct: number | null;
  status: string | null;
  mtrProgress: string;
  indicators: number;
}

export function ActionsTable({ rows, ministryOptions }: { rows: ActionRow[]; ministryOptions: { code: string; short: string }[] }) {
  const [cluster, setCluster] = useState("");
  const [ministry, setMinistry] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  const shown = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!cluster || r.cluster === cluster) &&
          (!ministry || r.ministries.includes(ministry)) &&
          (!status || r.status === status) &&
          (!q || `${r.no} ${r.title}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [rows, cluster, ministry, status, q],
  );

  return (
    <>
      <form className="card filters" onSubmit={(e) => e.preventDefault()} role="search" aria-label="Filter actions">
        <div className="field">
          <label htmlFor="a-q">Search</label>
          <input id="a-q" type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Number or words" />
        </div>
        <div className="field">
          <label htmlFor="a-cluster">Cluster</label>
          <select id="a-cluster" value={cluster} onChange={(e) => setCluster(e.target.value)}>
            <option value="">All clusters</option>
            <option value="production">Production</option>
            <option value="processing">Processing</option>
            <option value="export">Export</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="a-min">Ministry</label>
          <select id="a-min" value={ministry} onChange={(e) => setMinistry(e.target.value)}>
            <option value="">All ministries</option>
            {ministryOptions.map((m) => <option key={m.code} value={m.short}>{m.short}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="a-status">2025 status</label>
          <select id="a-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Any status</option>
            <option>Fully Achieved</option>
            <option>Largely Achieved</option>
            <option>Limited Progress</option>
          </select>
        </div>
      </form>
      <p className="small" role="status">{shown.length} of {rows.length} actions</p>
      {shown.length === 0 ? (
        <div className="notice"><p>No actions match these filters.</p></div>
      ) : (
        <div className="table-wrap" role="region" aria-label="Policy actions" tabIndex={0}>
          <table>
            <caption>Policy actions, reporting year 2025</caption>
            <thead>
              <tr>
                <th scope="col">Action</th>
                <th scope="col">Cluster</th>
                <th scope="col">Ministries</th>
                <th scope="col" className="num">2025 %</th>
                <th scope="col">Status</th>
                <th scope="col">MTR (mid-2025)</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.code}>
                  <td><strong className="nowrap">{r.no}.</strong> <Link href={`/projects/${r.code}`}>{r.title.length > 120 ? r.title.slice(0, 120) + "…" : r.title}</Link><div className="small muted">{r.indicators} indicator{r.indicators > 1 ? "s" : ""}</div></td>
                  <td><span className={`chip chip--${r.cluster}`}>{r.clusterLabel}</span></td>
                  <td className="small">{r.ministries.map((m, i) => (i === 0 ? <strong key={m}>{m}</strong> : <span key={m}>, {m}</span>))}</td>
                  <td className="num">{r.pct === null ? "—" : `${Math.round(r.pct)}%`}</td>
                  <td>{r.status && <StatusTag status={r.status} />}</td>
                  <td className="small nowrap">{r.mtrProgress || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
