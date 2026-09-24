"use client";

import Link from "next/link";
import { useState } from "react";
import { StatusTag } from "@/components/ui";
import { statusWith, type Threshold } from "@/lib/rules";

interface Row {
  id: string;
  code: string;
  action: number;
  label: string;
  target: string;
  method: string;
  prev: number | string | null;
  value: number | string | null;
  pct: number | null;
  narrative: string;
  evidence: string | null;
  feedback: string;
}

interface Sub {
  id: string;
  year: number;
  state: string;
  submitted: string;
  respondentRole: string;
  illustrative: boolean;
  returnReason: string;
  reviewNote: string;
  ministry: string;
  ministryShort: string;
}

const checks = [
  { id: "reasonable", label: "Reasonable progress: values make sense against 2025 and the 2027 target (a sudden 10× jump needs a query)" },
  { id: "consistent", label: "Internal consistency: each narrative matches its value" },
  { id: "evidence", label: "Evidence sufficiency: legible, signed where applicable, dated within the reporting year" },
  { id: "assignment", label: "Assignment correctness: the ministry only reported indicators it owns (no double counting)" },
];

const show = (v: number | string | null) =>
  v === null || v === "" ? "—" : typeof v === "string" ? ({ completed: "Completed", in_progress: "In progress", not_started: "Not yet started" } as Record<string, string>)[v] ?? v : v.toLocaleString("en-GB");

export function ReviewPanel({ submission: s, rows, flags, threshold }: { submission: Sub; rows: Row[]; flags: { level: string; text: string }[]; threshold: Threshold }) {
  const [state, setState] = useState(s.state);
  const [actor, setActor] = useState<"reviewer" | "submitter">("reviewer");
  const [mode, setMode] = useState<null | "approve" | "return" | "reject">(null);
  const [reason, setReason] = useState("");
  const [ticked, setTicked] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const decidable = state === "Submitted" || state === "In review";
  const blocking = flags.filter((f) => f.level === "blocking");

  function act() {
    setError("");
    if (actor === "submitter" && mode === "approve") return setError("You entered this submission, so you cannot approve it. Another MoC reviewer must decide.");
    if ((mode === "return" || mode === "reject") && reason.trim().length < 10) return setError("Write a specific query of at least 10 characters so the ministry knows what to fix.");
    if (mode === "approve" && blocking.length) return setError(`${blocking.length} blocking flag(s) are open. Return the submission instead.`);
    if (mode === "approve" && ticked.length < checks.length) return setError("Complete all four verification checks before approving.");
    const next = mode === "approve" ? "Approved" : mode === "return" ? "Returned" : "Rejected";
    setState(next);
    setLog((l) => [`${new Date().toLocaleString("en-GB")} · ${next}${reason ? ` · “${reason}”` : ""}`, ...l]);
    setMode(null);
    setReason("");
  }

  return (
    <>
      <div className="page-head">
        <div>
          <span className="caption">UI-10 · Reporting year {s.year} · {s.respondentRole} · submitted {s.submitted}</span>
          <h1>Verify {s.ministryShort} submission</h1>
        </div>
        <p className="btn-row" style={{ margin: 0 }}>
          <StatusTag status={state} /> {s.illustrative && <StatusTag status="Illustrative" />}
        </p>
      </div>
      <p className="lead">{s.ministry} · {rows.length} assigned indicators · {s.id}</p>
      {s.illustrative && (
        <div className="notice notice--warning"><p><strong>Illustrative record.</strong> Reporting year 2026 has not been collected yet. These values are invented to demonstrate the review workflow.</p></div>
      )}

      <div className="two-col">
        <div>
          {s.returnReason && <div className="notice notice--warning"><p><strong>Query sent to the ministry:</strong> {s.returnReason}</p></div>}
          {s.reviewNote && <div className="notice"><p><strong>Review note:</strong> {s.reviewNote}</p></div>}
          {flags.length > 0 && (
            <div className={`notice ${blocking.length ? "notice--error" : "notice--warning"}`}>
              <p><strong>Automatic flags ({flags.length})</strong>. A flag is a prompt to check, not proof of error.</p>
              <ul className="small">{flags.slice(0, 15).map((f) => <li key={f.text}>{f.level === "blocking" ? "Blocking: " : ""}{f.text}</li>)}</ul>
              {flags.length > 15 && <p className="small">and {flags.length - 15} more.</p>}
            </div>
          )}
          <div className="table-wrap" role="region" aria-label="Reported values" tabIndex={0}>
            <table>
              <caption>Reported values</caption>
              <thead>
                <tr>
                  <th scope="col">Indicator</th>
                  {s.year > 2025 && <th scope="col" className="num">2025</th>}
                  <th scope="col" className="num">Reported</th>
                  <th scope="col" className="num">% of target</th>
                  <th scope="col">Status ({s.year} rule)</th>
                  <th scope="col">Narrative and evidence</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const st = statusWith(r.pct, threshold);
                  return (
                    <tr key={r.id}>
                      <td><Link href={`/indicators/${r.code}`}>{r.code}</Link> <span className="small muted">Action {r.action}</span><div className="small">{r.label.length > 90 ? r.label.slice(0, 90) + "…" : r.label}</div><div className="small muted">Target: {r.target}</div></td>
                      {s.year > 2025 && <td className="num">{show(r.prev)}</td>}
                      <td className="num"><strong>{show(r.value)}</strong></td>
                      <td className="num">{r.pct === null ? "—" : `${r.pct}%`}</td>
                      <td>{st ? <StatusTag status={st} /> : "—"}</td>
                      <td className="small">
                        {r.narrative || <span className="muted">No narrative</span>}
                        <div>{r.evidence ? <span>📎 {r.evidence}</span> : <span className="muted">No evidence file</span>}</div>
                        {r.feedback && <div className="muted">Challenge: {r.feedback}</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {log.length > 0 && (
            <>
              <h2>Audit events (this session)</h2>
              <ul className="small">{log.map((l) => <li key={l}>{l}</li>)}</ul>
            </>
          )}
        </div>

        <aside className="card" aria-labelledby="dec-h">
          <h2 id="dec-h" style={{ marginTop: 0 }}>Decision</h2>
          <fieldset className="field">
            <legend className="small">Simulate acting as</legend>
            <label className="choice"><input type="radio" name="actor" checked={actor === "reviewer"} onChange={() => setActor("reviewer")} /> MoC reviewer</label>
            <label className="choice"><input type="radio" name="actor" checked={actor === "submitter"} onChange={() => setActor("submitter")} /> The person who entered it</label>
          </fieldset>
          {!decidable ? (
            <div className="notice">
              <p>This submission is <strong>{state}</strong> and locked. Corrections create a new revision.</p>
              <Link href="/reviews">Back to reviews</Link>
            </div>
          ) : (
            <>
              <fieldset className="field">
                <legend>Verification checks</legend>
                {checks.map((c) => (
                  <label key={c.id} className="choice" style={{ alignItems: "flex-start", fontSize: "0.875rem" }}>
                    <input type="checkbox" checked={ticked.includes(c.id)} onChange={(e) => setTicked((t) => (e.target.checked ? [...t, c.id] : t.filter((x) => x !== c.id)))} style={{ marginTop: 2 }} />
                    {c.label}
                  </label>
                ))}
              </fieldset>
              <div className="btn-row" style={{ marginBottom: 16 }}>
                <button type="button" className="btn" onClick={() => setMode("approve")} aria-pressed={mode === "approve"}>Approve</button>
                <button type="button" className="btn btn--secondary" onClick={() => setMode("return")} aria-pressed={mode === "return"}>Return</button>
                <button type="button" className="btn btn--warning" onClick={() => setMode("reject")} aria-pressed={mode === "reject"}>Reject</button>
              </div>
              {mode && (
                <>
                  {mode !== "approve" && (
                    <div className="field">
                      <label htmlFor="reason">{mode === "return" ? "Query for the ministry (reply due in 5 working days)" : "Reason for rejecting"}</label>
                      <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
                    </div>
                  )}
                  {mode === "approve" && <p className="small">Approving locks this submission and feeds its values into the {s.year} dashboard.</p>}
                  {error && <p className="error-message" role="alert">{error}</p>}
                  <div className="btn-row">
                    <button type="button" className={`btn ${mode === "reject" ? "btn--warning" : ""}`} onClick={act}>Confirm {mode}</button>
                    <button type="button" className="btn btn--secondary" onClick={() => { setMode(null); setError(""); }}>Cancel</button>
                  </div>
                </>
              )}
            </>
          )}
          <p className="small muted" style={{ marginTop: 16 }}>Simulated in your browser. Reload to reset.</p>
        </aside>
      </div>
    </>
  );
}
