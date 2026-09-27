"use client";

// Small accessible charts. Every chart has a legend or title naming the
// series, text labels (status colours are never the only cue), a hover
// tooltip, and a "Show data table" alternative.

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { formatByUnit } from "@/lib/format";

export const STATUS_COLOURS = {
  fully: "#0f7a52",
  largely: "#f47738",
  limited: "#ca3535",
  noData: "#cecece",
};

const STATUS_LABELS = { fully: "Fully achieved", largely: "Largely achieved", limited: "Limited progress", noData: "No data" };
type StatusKey = keyof typeof STATUS_COLOURS;

function Tooltip({ children, x }: { children: ReactNode; x: number }) {
  return (
    <div className="chart-tip" style={{ left: `${Math.min(Math.max(x, 8), 92)}%` }} role="status">
      {children}
    </div>
  );
}

function TableToggle({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="chart-table">
      <summary>Show data table: {label}</summary>
      <div className="table-wrap" role="region" aria-label={label} tabIndex={0}>
        <table>{children}</table>
      </div>
    </details>
  );
}

export function StatusLegend({ keys = ["fully", "largely", "limited"] as StatusKey[] }) {
  return (
    <ul className="chart-legend" aria-label="Legend">
      {keys.map((k) => (
        <li key={k}>
          <span className="chart-swatch" style={{ background: STATUS_COLOURS[k] }} aria-hidden="true" />
          {STATUS_LABELS[k]}
        </li>
      ))}
    </ul>
  );
}

export interface StatusRow {
  label: string;
  href?: string;
  fully: number;
  largely: number;
  limited: number;
  noData?: number;
  note?: string;
}

/** 100% stacked horizontal bars of status counts, one row per group. */
export function StatusBars({ rows, unit = "actions", caption }: { rows: StatusRow[]; unit?: string; caption: string }) {
  const [hover, setHover] = useState<{ row: number; key: StatusKey; x: number } | null>(null);
  const keys: StatusKey[] = rows.some((r) => r.noData) ? ["fully", "largely", "limited", "noData"] : ["fully", "largely", "limited"];
  return (
    <figure className="chart">
      <figcaption className="chart-caption">{caption}</figcaption>
      <StatusLegend keys={keys} />
      <div className="sbars" onMouseLeave={() => setHover(null)}>
        {rows.map((r, ri) => {
          const total = keys.reduce((s, k) => s + (r[k as keyof StatusRow] as number || 0), 0);
          let acc = 0;
          return (
            <div className="sbar-row" key={r.label}>
              <span className="sbar-label">{r.href ? <Link href={r.href}>{r.label}</Link> : r.label}</span>
              <span className="sbar-track" aria-hidden="true">
                {keys.map((k) => {
                  const v = (r[k as keyof StatusRow] as number) || 0;
                  if (!v || !total) return null;
                  const left = (acc / total) * 100;
                  const width = (v / total) * 100;
                  acc += v;
                  return (
                    <span
                      key={k}
                      className="sbar-seg"
                      style={{ left: `${left}%`, width: `calc(${width}% - 2px)`, background: STATUS_COLOURS[k] }}
                      onMouseEnter={() => setHover({ row: ri, key: k, x: left + width / 2 })}
                    >
                      {width >= 9 && <span className={`sbar-num ${k === "largely" || k === "noData" ? "sbar-num--dark" : ""}`}>{v}</span>}
                    </span>
                  );
                })}
                {hover?.row === ri && (
                  <Tooltip x={hover.x}>
                    <strong>{r.label}</strong>
                    <br />
                    {STATUS_LABELS[hover.key]}: {(r[hover.key as keyof StatusRow] as number) || 0} of {total} {unit}
                  </Tooltip>
                )}
              </span>
              <span className="sbar-total">{total}</span>
            </div>
          );
        })}
      </div>
      <TableToggle label={caption}>
        <thead>
          <tr>
            <th scope="col">Group</th>
            {keys.map((k) => <th key={k} scope="col" className="num">{STATUS_LABELS[k]}</th>)}
            <th scope="col" className="num">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td>{r.label}</td>
              {keys.map((k) => <td key={k} className="num">{(r[k as keyof StatusRow] as number) || 0}</td>)}
              <td className="num">{keys.reduce((s, k) => s + ((r[k as keyof StatusRow] as number) || 0), 0)}</td>
            </tr>
          ))}
        </tbody>
      </TableToggle>
    </figure>
  );
}

export interface BarRow {
  label: string;
  value: number | null;
  href?: string;
  sub?: string;
  tone?: StatusKey | "brand";
}

/** Ranked horizontal bars on a 0–100 scale with optional threshold markers. */
export function PercentBars({
  rows,
  caption,
  markers = [],
  valueLabel = "Completion",
}: {
  rows: BarRow[];
  caption: string;
  markers?: { at: number; label: string }[];
  valueLabel?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <figure className="chart">
      <figcaption className="chart-caption">{caption}</figcaption>
      {markers.length > 0 && (
        <p className="chart-note">
          Dashed lines: {markers.map((m) => `${m.label} (${m.at}%)`).join(" · ")}
        </p>
      )}
      <div className="pbars" onMouseLeave={() => setHover(null)}>
        {rows.map((r, i) => (
          <div className="pbar-row" key={r.label} onMouseEnter={() => setHover(i)}>
            <span className="pbar-label">
              {r.href ? <Link href={r.href}>{r.label}</Link> : r.label}
              {r.sub && <span className="pbar-sub">{r.sub}</span>}
            </span>
            <span className="pbar-track" aria-hidden="true">
              {r.value !== null && (
                <span
                  className="pbar-fill"
                  style={{ width: `${Math.min(r.value, 100)}%`, background: r.tone && r.tone !== "brand" ? STATUS_COLOURS[r.tone] : "var(--brand)" }}
                />
              )}
              {markers.map((m) => (
                <span key={m.label} className="pbar-marker" style={{ left: `${m.at}%` }} />
              ))}
              {hover === i && (
                <Tooltip x={Math.min(r.value ?? 0, 100)}>
                  <strong>{r.label}</strong>
                  <br />
                  {valueLabel}: {r.value === null ? "No data" : `${r.value.toFixed(1)}%`}
                  {r.sub ? <><br />{r.sub}</> : null}
                </Tooltip>
              )}
            </span>
            <span className="pbar-value">{r.value === null ? "No data" : `${Math.round(r.value)}%`}</span>
          </div>
        ))}
      </div>
      <TableToggle label={caption}>
        <thead>
          <tr><th scope="col">Name</th><th scope="col" className="num">{valueLabel} (%)</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}><td>{r.label}{r.sub ? ` (${r.sub})` : ""}</td><td className="num">{r.value === null ? "No data" : r.value.toFixed(1)}</td></tr>
          ))}
        </tbody>
      </TableToggle>
    </figure>
  );
}

/** Small single-series line chart (years on x). Missing years break the line; they are never drawn as zero. */
export function MiniLine({
  title,
  points,
  highlight,
  unit,
}: {
  title: string;
  points: { x: number; y: number | null }[];
  highlight?: number;
  unit: string;
}) {
  const format = (v: number) => formatByUnit(unit, v);
  const [hover, setHover] = useState<number | null>(null);
  const W = 300, H = 120, P = { l: 8, r: 8, t: 14, b: 22 };
  const vals = points.map((p) => p.y).filter((v): v is number => v !== null);
  const min = vals.length ? Math.min(0, ...vals) : 0;
  const max = vals.length ? Math.max(...vals) * 1.12 || 1 : 1;
  const x = (i: number) => P.l + (i * (W - P.l - P.r)) / Math.max(1, points.length - 1);
  const y = (v: number) => H - P.b - ((v - min) / (max - min)) * (H - P.t - P.b);
  const segs: string[] = [];
  let cur = "";
  points.forEach((p, i) => {
    if (p.y === null) {
      if (cur) segs.push(cur);
      cur = "";
    } else cur += `${cur ? "L" : "M"}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`;
  });
  if (cur) segs.push(cur);
  const last = [...points].reverse().find((p) => p.y !== null);

  return (
    <figure className="chart mini">
      <figcaption className="chart-caption">
        {title} <span className="muted">({unit})</span>
      </figcaption>
      {vals.length === 0 ? (
        <p className="muted small">No data yet.</p>
      ) : (
        <div className="mini-wrap" onMouseLeave={() => setHover(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}: ${points.map((p) => `${p.x} ${p.y === null ? "no data" : format(p.y)}`).join(", ")}`}>
            <line x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} stroke="var(--black-tint-80)" strokeWidth="1" />
            {segs.map((d) => <path key={d} d={d} fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinejoin="round" />)}
            {points.map((p, i) => (
              <g key={p.x}>
                <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--text-secondary)">{p.x}</text>
                {p.y !== null && (
                  <circle cx={x(i)} cy={y(p.y)} r={p.x === highlight || hover === i ? 5 : 4} fill={p.x === highlight ? "var(--brand)" : "#fff"} stroke="var(--brand)" strokeWidth="2" />
                )}
                <rect x={x(i) - 20} y={0} width={40} height={H} fill="transparent" onMouseEnter={() => setHover(i)} />
              </g>
            ))}
            {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={P.t - 6} y2={H - P.b} stroke="var(--black-tint-50)" strokeDasharray="3 3" />}
            {last && hover === null && (
              <text x={x(points.indexOf(last))} y={y(last.y!) - 9} textAnchor={points.indexOf(last) > points.length / 2 ? "end" : "middle"} fontSize="11" fontWeight="700" fill="var(--text)">
                {format(last.y!)}
              </text>
            )}
          </svg>
          {hover !== null && (
            <Tooltip x={(x(hover) / W) * 100}>
              <strong>{points[hover].x}</strong>: {points[hover].y === null ? "No data" : format(points[hover].y!)}
            </Tooltip>
          )}
        </div>
      )}
    </figure>
  );
}
