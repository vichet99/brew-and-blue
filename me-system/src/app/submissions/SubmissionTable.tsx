"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusTag } from "@/components/ui";
import { forms, submissions, type SubmissionState } from "@/lib/data";

const states: SubmissionState[] = ["Draft", "Submitted", "In review", "Returned", "Approved", "Rejected", "Superseded"];

function csvCell(v: string) {
  // Neutralise spreadsheet formula injection (FR-32) and quote.
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function SubmissionTable() {
  const [state, setState] = useState("");
  const [form, setForm] = useState("");
  const [period, setPeriod] = useState("");
  const [q, setQ] = useState("");

  const rows = useMemo(
    () =>
      submissions.filter(
        (s) =>
          (!state || s.state === state) &&
          (!form || s.form === form) &&
          (!period || s.period === period) &&
          (!q || `${s.id} ${s.owner}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [state, form, period, q],
  );

  function exportCsv() {
    const header = ["submission_id", "form_code", "project_code", "period", "state", "revision", "owner", "submitted_at"];
    const lines = rows.map((s) => [s.id, s.form, s.project, s.period, s.state, String(s.revision), s.owner, s.submitted].map(csvCell).join(","));
    const manifest = `# export generated ${new Date().toISOString()}; filters state=${state || "any"} form=${form || "any"} period=${period || "any"} search=${q || "none"}; rows=${rows.length}; FICTIONAL DATA`;
    const blob = new Blob([manifest + "\n" + header.join(",") + "\n" + lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "submissions-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <form className="card" style={{ marginBottom: 16, display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", alignItems: "end" }} onSubmit={(e) => e.preventDefault()} role="search" aria-label="Filter submissions">
        <div className="field" style={{ margin: 0 }}>
          <label htmlFor="f-q">Search</label>
          <input id="f-q" type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ID or collector" />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label htmlFor="f-state">State</label>
          <select id="f-state" value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">Any state</option>
            {states.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label htmlFor="f-form">Form</label>
          <select id="f-form" value={form} onChange={(e) => setForm(e.target.value)}>
            <option value="">Any form</option>
            {forms.map((f) => <option key={f.code} value={f.code}>{f.title}</option>)}
          </select>
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label htmlFor="f-period">Period</label>
          <select id="f-period" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="">Any period</option>
            <option>2026-Q2</option>
            <option>2026-Q3</option>
          </select>
        </div>
      </form>

      <div className="btn-row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <p className="small" role="status" style={{ margin: 0 }}>{rows.length} of {submissions.length} submissions</p>
        <button type="button" className="btn btn--secondary" onClick={exportCsv} disabled={rows.length === 0}>Export filtered CSV</button>
      </div>

      {rows.length === 0 ? (
        <div className="notice"><p>No submissions match these filters. <button type="button" className="btn btn--secondary" onClick={() => { setQ(""); setState(""); setForm(""); setPeriod(""); }}>Clear filters</button></p></div>
      ) : (
        <div className="table-wrap" role="region" aria-label="Submissions table" tabIndex={0}>
          <table>
            <caption>Submissions</caption>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Form</th>
                <th scope="col">Collector</th>
                <th scope="col">Period</th>
                <th scope="col" className="num">Rev.</th>
                <th scope="col">Submitted</th>
                <th scope="col">State</th>
                <th scope="col">Quality flags</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td className="nowrap"><Link href={`/reviews/${s.id}`}>{s.id}</Link></td>
                  <td>{forms.find((f) => f.code === s.form)?.title}</td>
                  <td>{s.owner}</td>
                  <td className="nowrap">{s.period}</td>
                  <td className="num">r{s.revision}</td>
                  <td className="nowrap">{s.submitted}</td>
                  <td><StatusTag status={s.state} /></td>
                  <td className="small">{s.flags.length ? s.flags.join("; ") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
