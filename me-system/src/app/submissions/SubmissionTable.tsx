"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRole } from "@/components/RoleProvider";
import { StatusTag } from "@/components/ui";
import { canSeeSubmission } from "@/lib/roles";

interface Row {
  id: string;
  year: number;
  ministry: string;
  ministryCode: string;
  state: string;
  submitted: string;
  indicators: number;
  reported: number;
  evidence: number;
  blocking: number;
  warnings: number;
  illustrative: boolean;
}

function csvCell(v: string) {
  // Neutralise spreadsheet formula injection (FR-32) and quote.
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function SubmissionTable({ rows: allRows }: { rows: Row[] }) {
  const { role, ministry } = useRole();
  const rows = useMemo(() => allRows.filter((r) => canSeeSubmission(role, ministry, r.ministryCode)), [allRows, role, ministry]);
  const [year, setYear] = useState("");
  const [state, setState] = useState("");
  const [q, setQ] = useState("");
  const shown = useMemo(
    () => rows.filter((r) => (!year || String(r.year) === year) && (!state || r.state === state) && (!q || `${r.id} ${r.ministry}`.toLowerCase().includes(q.toLowerCase()))),
    [rows, year, state, q],
  );

  function exportCsv() {
    const header = ["submission_id", "reporting_year", "ministry", "state", "submitted", "indicators", "reported", "evidence_files", "blocking_flags", "warnings", "illustrative"];
    const lines = shown.map((r) => [r.id, r.year, r.ministry, r.state, r.submitted, r.indicators, r.reported, r.evidence, r.blocking, r.warnings, r.illustrative].map((v) => csvCell(String(v))).join(","));
    const manifest = `# generated ${new Date().toISOString()}; filters year=${year || "any"} state=${state || "any"} search=${q || "none"}; rows=${shown.length}`;
    const url = URL.createObjectURL(new Blob([manifest + "\n" + header.join(",") + "\n" + lines.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "cashew-submissions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <form className="card filters" onSubmit={(e) => e.preventDefault()} role="search" aria-label="Filter submissions">
        <div className="field">
          <label htmlFor="s-q">Search</label>
          <input id="s-q" type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ID or ministry" />
        </div>
        <div className="field">
          <label htmlFor="s-year">Reporting year</label>
          <select id="s-year" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">Any</option>
            <option>2025</option>
            <option>2026</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="s-state">State</label>
          <select id="s-state" value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">Any</option>
            {["Draft", "Submitted", "In review", "Returned", "Approved", "Rejected"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </form>
      {role === "focal" && <p className="notice small">You are a focal point: only your ministry&apos;s submissions are shown.</p>}
      <div className="btn-row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <p className="small" role="status" style={{ margin: 0 }}>{shown.length} of {rows.length} submissions</p>
        <button type="button" className="btn btn--secondary" onClick={exportCsv} disabled={!shown.length}>Export filtered CSV</button>
      </div>
      {shown.length === 0 ? (
        <div className="notice"><p>No submissions match these filters.</p></div>
      ) : (
        <div className="table-wrap" role="region" aria-label="Submissions" tabIndex={0}>
          <table>
            <caption>Ministry submissions</caption>
            <thead>
              <tr>
                <th scope="col">ID</th><th scope="col">Year</th><th scope="col">Ministry</th><th scope="col">Submitted</th>
                <th scope="col" className="num">Reported</th><th scope="col" className="num">Evidence</th><th scope="col">Flags</th><th scope="col">State</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id}>
                  <td className="nowrap"><Link href={`/reviews/${r.id}`}>{r.id}</Link>{r.illustrative && <div><StatusTag status="Illustrative" /></div>}</td>
                  <td>{r.year}</td>
                  <td>{r.ministry}</td>
                  <td className="nowrap">{r.submitted}</td>
                  <td className="num">{r.reported}/{r.indicators}</td>
                  <td className="num">{r.evidence}/{r.indicators}</td>
                  <td className="small">
                    {r.blocking > 0 && <StatusTag status="Rejected" label={`${r.blocking} blocking`} />} {r.warnings > 0 && <StatusTag status="Returned" label={`${r.warnings} warnings`} />}
                    {r.blocking + r.warnings === 0 && "—"}
                  </td>
                  <td><StatusTag status={r.state} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
