"use client";

import Link from "next/link";
import { useState } from "react";
import { StatusTag, Table } from "@/components/ui";
import type { FormDef, Submission, SubmissionState } from "@/lib/data";

type Actor = "reviewer" | "submitter";

export function ReviewPanel({ sub, form }: { sub: Submission; form: FormDef }) {
  const [state, setState] = useState<SubmissionState>(sub.state);
  const [actor, setActor] = useState<Actor>("reviewer");
  const [mode, setMode] = useState<null | "return" | "reject" | "approve">(null);
  const [reason, setReason] = useState("");
  const [fields, setFields] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [log, setLog] = useState<string[]>([]);

  const decidable = state === "Submitted" || state === "In review";
  const blocking = sub.flags.some((f) => f.includes("blocking"));
  const labelOf = (id: string) => form.questions.find((q) => q.id === id)?.label ?? id;

  function act() {
    setError("");
    if (actor === "submitter" && mode === "approve") {
      setError("You submitted this revision, so you cannot approve it. Another reviewer must decide.");
      return;
    }
    if ((mode === "return" || mode === "reject") && reason.trim().length < 10) {
      setError("Give a specific reason of at least 10 characters so the collector knows what to fix.");
      return;
    }
    if (mode === "approve" && blocking) {
      setError("A blocking quality flag is open. Resolve it before approving.");
      return;
    }
    const now = new Date().toLocaleString("en-GB");
    const next: SubmissionState = mode === "approve" ? "Approved" : mode === "return" ? "Returned" : "Rejected";
    setState(next);
    setLog((l) => [`${now} · ${next} revision r${sub.revision}${reason ? ` · “${reason}”` : ""}${fields.length ? ` · fields: ${fields.join(", ")}` : ""}`, ...l]);
    setMode(null);
    setReason("");
    setFields([]);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <span className="caption">UI-10 · {form.title} v{form.version} · revision r{sub.revision} · {sub.period}</span>
          <h1>Review {sub.id}</h1>
        </div>
        <StatusTag status={state} />
      </div>

      <div className="two-col">
        <div>
          {sub.returnReason && sub.state !== "Rejected" && (
            <div className="notice notice--warning">
              <p><strong>Previous return reason:</strong> {sub.returnReason}</p>
            </div>
          )}
          {sub.flags.length > 0 && (
            <div className={`notice ${blocking ? "notice--error" : "notice--warning"}`}>
              <p><strong>Quality flags</strong> (a flag is not proof of error):</p>
              <ul>{sub.flags.map((f) => <li key={f}>{f}</li>)}</ul>
            </div>
          )}
          <Table caption={`Answers, revision r${sub.revision}`}>
            <thead>
              <tr><th scope="col">Question</th><th scope="col">Answer</th>{sub.previous && <th scope="col">Change from r{sub.revision - 1}</th>}</tr>
            </thead>
            <tbody>
              {Object.entries(sub.answers).map(([k, v]) => {
                const prev = sub.previous?.[k];
                const changed = sub.previous && prev !== undefined && prev !== v;
                return (
                  <tr key={k}>
                    <td>{labelOf(k)} <div className="small muted"><code>{k}</code></div></td>
                    <td>{typeof v === "boolean" ? (v ? "Yes" : "No") : String(v)}</td>
                    {sub.previous && (
                      <td>{changed ? <><span className="diff-old">{String(prev)}</span> → <span className="diff-new">{String(v)}</span></> : <span className="muted">No change</span>}</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </Table>

          <h2>Evidence</h2>
          {sub.evidence.length === 0 ? (
            <p><StatusTag status="Not reported" label="No evidence attached" /></p>
          ) : (
            <ul>
              {sub.evidence.map((e) => (
                <li key={e.name}>
                  {e.scan === "Clean" ? <a href="#download" onClick={(ev) => ev.preventDefault()}>{e.name}</a> : <span>{e.name}</span>}{" "}
                  <span className="small muted">{e.size}</span> <StatusTag status={e.scan} />
                  {e.scan !== "Clean" && <span className="small muted"> Download unavailable until the scan is clean.</span>}
                </li>
              ))}
            </ul>
          )}

          {log.length > 0 && (
            <>
              <h2>Audit events (this session)</h2>
              <ul className="small">{log.map((l) => <li key={l}>{l}</li>)}</ul>
            </>
          )}
        </div>

        <aside className="card" aria-labelledby="decision-h">
          <h2 id="decision-h" style={{ marginTop: 0 }}>Decision</h2>
          <fieldset className="field">
            <legend className="small">Simulate acting as</legend>
            <label className="choice"><input type="radio" name="actor" checked={actor === "reviewer"} onChange={() => setActor("reviewer")} /> Reviewer Demo (M&E reviewer)</label>
            <label className="choice"><input type="radio" name="actor" checked={actor === "submitter"} onChange={() => setActor("submitter")} /> {sub.owner.split(" (")[0]} (original submitter)</label>
          </fieldset>

          {!decidable ? (
            <div className="notice">
              <p>This revision is <strong>{state}</strong>. It is locked; any correction creates a new revision.</p>
              {state === "Approved" && <p className="small">Downstream: IND-01 observation for {sub.period} recalculates and waits for observation approval.</p>}
              <Link href="/reviews">Back to review queue</Link>
            </div>
          ) : (
            <>
              <div className="btn-row" style={{ marginBottom: 16 }}>
                <button type="button" className="btn" onClick={() => setMode("approve")} aria-pressed={mode === "approve"}>Approve</button>
                <button type="button" className="btn btn--secondary" onClick={() => setMode("return")} aria-pressed={mode === "return"}>Return</button>
                <button type="button" className="btn btn--warning" onClick={() => setMode("reject")} aria-pressed={mode === "reject"}>Reject</button>
              </div>
              {mode && (
                <div>
                  {mode === "approve" ? (
                    <p className="small">
                      Approving applies to revision r{sub.revision} only. It will update the {sub.period} candidate observation for the linked indicator.
                    </p>
                  ) : (
                    <>
                      <div className="field">
                        <label htmlFor="reason">{mode === "return" ? "What needs correcting?" : "Why reject?"}</label>
                        <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
                      </div>
                      {mode === "return" && (
                        <fieldset className="field">
                          <legend>Affected fields</legend>
                          {Object.keys(sub.answers).map((k) => (
                            <label key={k} className="choice">
                              <input type="checkbox" checked={fields.includes(k)} onChange={(e) => setFields((f) => (e.target.checked ? [...f, k] : f.filter((x) => x !== k)))} />
                              {labelOf(k)}
                            </label>
                          ))}
                        </fieldset>
                      )}
                    </>
                  )}
                  {error && <p className="error-message" role="alert">{error}</p>}
                  <div className="btn-row">
                    <button type="button" className={`btn ${mode === "reject" ? "btn--warning" : ""}`} onClick={act}>
                      Confirm {mode}
                    </button>
                    <button type="button" className="btn btn--secondary" onClick={() => { setMode(null); setError(""); }}>Cancel</button>
                  </div>
                </div>
              )}
            </>
          )}
          <p className="small muted" style={{ marginTop: 16 }}>Simulated in your browser. Reload to reset.</p>
        </aside>
      </div>
    </>
  );
}
