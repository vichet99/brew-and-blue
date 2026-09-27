"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/ui";
import type { FormDef, FormQuestion } from "@/lib/workflow";

type Answer = string | string[] | boolean | undefined;
type SaveState = "idle" | "unsaved" | "saving" | "saved" | "sending";
interface Upload { name: string; size: number; progress: number; state: "Uploading" | "Pending scan" | "Clean" | "Rejected"; reason?: string }

const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "application/pdf", "text/csv"];

function isVisible(q: FormQuestion, answers: Record<string, Answer>) {
  if (!q.visibleWhen) return true;
  return answers[q.visibleWhen.field] === q.visibleWhen.value;
}

function isAnswered(a: Answer) {
  return !(a === undefined || a === "" || (Array.isArray(a) && a.length === 0));
}

export function CollectForm({ form }: { form: FormDef }) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [save, setSave] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<string>("");
  const [receipt, setReceipt] = useState<string>("");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [pendingHide, setPendingHide] = useState<null | { field: string; value: Answer; hides: FormQuestion[] }>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const clientId = useRef<string>("");

  useEffect(() => {
    clientId.current = crypto.randomUUID();
  }, []);

  const inputs = form.questions.filter((q) => q.type !== "section" && q.type !== "note");
  const visibleInputs = inputs.filter((q) => isVisible(q, answers));
  const answered = visibleInputs.filter((q) => isAnswered(answers[q.id])).length;

  function set(id: string, value: Answer) {
    const hides = form.questions.filter(
      (q) => q.visibleWhen?.field === id && isVisible(q, answers) && q.visibleWhen.value !== value && isAnswered(answers[q.id]),
    );
    if (hides.length > 0) {
      setPendingHide({ field: id, value, hides });
      return;
    }
    apply(id, value);
  }

  function apply(id: string, value: Answer, clear: string[] = []) {
    setAnswers((a) => {
      const next = { ...a, [id]: value };
      clear.forEach((c) => delete next[c]);
      return next;
    });
    setSave("unsaved");
    if (errors[id]) setErrors((e) => ({ ...e, [id]: "" }));
  }

  function saveDraft() {
    setSave("saving");
    setTimeout(() => {
      setSave("saved");
      setSavedAt(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
    }, 700);
  }

  function validate() {
    const e: Record<string, string> = {};
    for (const q of visibleInputs) {
      const a = answers[q.id];
      if (q.required && !isAnswered(a)) {
        e[q.id] = q.type === "boolean" || q.type === "single_choice" ? `Select an answer for “${q.label}”` : `Enter “${q.label}”`;
        continue;
      }
      if ((q.type === "integer" || q.type === "decimal") && isAnswered(a)) {
        const n = Number(a);
        if (!Number.isFinite(n) || (q.type === "integer" && !Number.isInteger(n))) e[q.id] = `“${q.label}” must be a ${q.type === "integer" ? "whole number" : "number"}`;
        else if (q.min !== undefined && n < q.min) e[q.id] = `“${q.label}” must be ${q.min} or more`;
        else if (q.max !== undefined && n > q.max) e[q.id] = `“${q.label}” must be ${q.max} or less`;
      }
    }
    if (form.code === "processor-survey") {
      // MoC data-quality rules for the processor survey (manual section 7.3).
      const n = (k: string) => (isAnswered(answers[k]) ? Number(answers[k]) : NaN);
      if (n("managers_female") > n("managers_total")) e.managers_female = "Female managers cannot be more than total managers";
      const util = n("rcn_processed_t") / n("installed_capacity_tpy");
      if (Number.isFinite(util) && util > 1.1) e.rcn_processed_t = `Capacity utilisation would be ${Math.round(util * 100)}%. MoC accepts up to 110%; check both figures`;
      const outturn = n("sample_kernel_kg") / n("sample_raw_kg");
      if (Number.isFinite(outturn) && (outturn < 0.18 || outturn > 0.32))
        e.sample_kernel_kg = `Outturn would be ${Math.round(outturn * 100)}%. Expected 18–32%; check the sample weights`;
    }
    if (uploads.some((u) => u.state === "Uploading" || u.state === "Pending scan")) e._evidence = "Wait for evidence uploads to finish scanning";
    return e;
  }

  function submit(ev: FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      setTimeout(() => summaryRef.current?.focus(), 0);
      return;
    }
    setSave("sending");
    setTimeout(() => {
      // Simulated durable receipt: shown only after the (simulated) commit.
      setReceipt(`RCPT-${clientId.current.slice(0, 8).toUpperCase()}`);
      setSave("saved");
    }, 1000);
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const incoming = Array.from(files).slice(0, Math.max(0, MAX_FILES - uploads.length));
    const next: Upload[] = incoming.map((f) => {
      if (f.size > MAX_BYTES) return { name: f.name, size: f.size, progress: 0, state: "Rejected", reason: "File is larger than 10 MB" };
      if (!ALLOWED.includes(f.type)) return { name: f.name, size: f.size, progress: 0, state: "Rejected", reason: "Only JPG, PNG, PDF or CSV files are accepted" };
      return { name: f.name, size: f.size, progress: 0, state: "Uploading" };
    });
    setUploads((u) => [...u, ...next]);
    next.forEach((up) => {
      if (up.state !== "Uploading") return;
      let p = 0;
      const t = setInterval(() => {
        p += 25;
        setUploads((list) => list.map((x) => (x.name === up.name ? { ...x, progress: Math.min(p, 100), state: p >= 100 ? "Pending scan" : "Uploading" } : x)));
        if (p >= 100) {
          clearInterval(t);
          setTimeout(() => setUploads((list) => list.map((x) => (x.name === up.name ? { ...x, state: "Clean" } : x))), 1200);
        }
      }, 300);
    });
    setSave("unsaved");
  }

  if (receipt) {
    return (
      <div className="notice notice--success" role="status">
        <h2 style={{ marginTop: 0 }}>Report submitted</h2>
        <p>
          Your receipt number is <strong style={{ fontSize: "1.25rem" }}>{receipt}</strong>
        </p>
        <p>
          Form version {form.version} · client ID <code>{clientId.current}</code>. Sending the same report again will return this same receipt,
          not a duplicate.
        </p>
        <p>An M&E reviewer will check it. You will be notified if it is returned for correction.</p>
        <p className="small muted">Simulated: nothing was sent to a server in this prototype.</p>
        <div className="btn-row">
          <Link className="btn btn--secondary" href="/submissions">View submissions</Link>
          <button className="btn btn--secondary" type="button" onClick={() => { setReceipt(""); setAnswers({}); setUploads([]); setSave("idle"); clientId.current = crypto.randomUUID(); }}>
            Start another report
          </button>
        </div>
      </div>
    );
  }

  const errorList = Object.entries(errors).filter(([, v]) => v);

  return (
    <form onSubmit={submit} noValidate>
      <div className="card" style={{ position: "sticky", top: 0, zIndex: 5, marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ flex: "1 1 220px" }}>
          <div className="small">{answered} of {visibleInputs.length} visible questions answered</div>
          <div className="progress" aria-hidden="true"><span style={{ width: `${visibleInputs.length ? (answered / visibleInputs.length) * 100 : 0}%` }} /></div>
        </div>
        <span className="save-state" role="status" aria-live="polite">
          {save === "idle" && <><Icon name="dot" /> Not started</>}
          {save === "unsaved" && <span className="tag tag--orange"><Icon name="edit" />Unsaved changes</span>}
          {save === "saving" && <span className="tag tag--blue"><Icon name="clock" />Saving…</span>}
          {save === "saved" && <span className="tag tag--green"><Icon name="check" />Saved to server {savedAt && `at ${savedAt}`} (simulated)</span>}
          {save === "sending" && <span className="tag tag--blue"><Icon name="send" />Sending…</span>}
        </span>
      </div>

      {errorList.length > 0 && (
        <div className="notice notice--error" role="alert" tabIndex={-1} ref={summaryRef}>
          <h2 style={{ marginTop: 0, fontSize: "1.125rem" }}>There is a problem</h2>
          <ul>
            {errorList.map(([k, v]) => (
              <li key={k}><a href={`#q-${k === "_evidence" ? "evidence" : k}`}>{v}</a></li>
            ))}
          </ul>
        </div>
      )}

      {pendingHide && (
        <div className="notice notice--warning" role="alertdialog" aria-labelledby="hide-h">
          <h2 id="hide-h" style={{ marginTop: 0, fontSize: "1.125rem" }}>This change will clear an answer</h2>
          <p>
            Changing this answer hides {pendingHide.hides.map((h) => `“${h.label}”`).join(", ")}. Hidden answers are removed from the submitted data.
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn--warning" onClick={() => { apply(pendingHide.field, pendingHide.value, pendingHide.hides.map((h) => h.id)); setPendingHide(null); }}>
              Change and clear
            </button>
            <button type="button" className="btn btn--secondary" onClick={() => setPendingHide(null)}>Keep my answer</button>
          </div>
        </div>
      )}

      {form.questions.map((q) => {
        if (!isVisible(q, answers)) return null;
        if (q.type === "section") return <h2 key={q.id} className="section-heading">{q.label}</h2>;
        if (q.type === "note") return <p key={q.id} className="notice small">{q.label}</p>;
        const err = errors[q.id];
        const id = `q-${q.id}`;
        const describedBy = [q.hint ? `${id}-hint` : "", err ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
        const label = (
          <>
            {q.label}
            {!q.required && <span className="muted" style={{ fontWeight: 400 }}> (optional)</span>}
          </>
        );
        const a = answers[q.id];

        if (q.type === "boolean" || q.type === "single_choice" || q.type === "multiple_choice") {
          const opts = q.type === "boolean" ? ["Yes", "No"] : q.choices ?? [];
          return (
            <div key={q.id} className={`field ${err ? "field--error" : ""}`}>
              <fieldset aria-describedby={describedBy} id={id}>
                <legend>{label}</legend>
                {q.hint && <p className="hint" id={`${id}-hint`}>{q.hint}</p>}
                {err && <p className="error-message" id={`${id}-err`}>{err}</p>}
                {opts.map((o) => {
                  const value = q.type === "boolean" ? o === "Yes" : o;
                  const checked = q.type === "multiple_choice" ? Array.isArray(a) && a.includes(o) : a === value;
                  return (
                    <label key={o} className="choice">
                      <input
                        type={q.type === "multiple_choice" ? "checkbox" : "radio"}
                        name={q.id}
                        checked={checked}
                        onChange={(e) => {
                          if (q.type === "multiple_choice") {
                            const cur = Array.isArray(a) ? a : [];
                            set(q.id, e.target.checked ? [...cur, o] : cur.filter((x) => x !== o));
                          } else set(q.id, value);
                        }}
                      />
                      {o}
                    </label>
                  );
                })}
              </fieldset>
            </div>
          );
        }

        return (
          <div key={q.id} className={`field ${err ? "field--error" : ""}`}>
            <label htmlFor={id}>{label}</label>
            {q.hint && <p className="hint" id={`${id}-hint`}>{q.hint}</p>}
            {(q.min !== undefined || q.max !== undefined) && (
              <p className="hint">{q.min !== undefined && q.max !== undefined ? `Between ${q.min} and ${q.max}` : q.min !== undefined ? `${q.min} or more` : `${q.max} or less`}</p>
            )}
            {err && <p className="error-message" id={`${id}-err`}>{err}</p>}
            {q.type === "long_text" ? (
              <textarea id={id} value={(a as string) ?? ""} maxLength={2000} onChange={(e) => set(q.id, e.target.value)} aria-describedby={describedBy} />
            ) : (
              <input
                id={id}
                type={q.type === "date" ? "date" : "text"}
                inputMode={q.type === "integer" ? "numeric" : q.type === "decimal" ? "decimal" : undefined}
                value={(a as string) ?? ""}
                onChange={(e) => set(q.id, e.target.value)}
                aria-describedby={describedBy}
                style={q.type === "integer" || q.type === "decimal" ? { maxWidth: "10em" } : undefined}
              />
            )}
          </div>
        );
      })}

      <h2 className="section-heading" id="q-evidence">Evidence</h2>
      <div className={`field ${errors._evidence ? "field--error" : ""}`}>
        <label htmlFor="evidence-input">Upload files</label>
        <p className="hint">JPG, PNG, PDF or CSV. Up to {MAX_FILES} files, 10 MB each. Files are scanned before anyone can download them.</p>
        {errors._evidence && <p className="error-message">{errors._evidence}</p>}
        <input id="evidence-input" type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.csv" onChange={(e) => addFiles(e.target.files)} disabled={uploads.length >= MAX_FILES} />
        {uploads.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
            {uploads.map((u) => (
              <li key={u.name} className="q-item">
                <div className="q-item__body">
                  <strong>{u.name}</strong> <span className="small muted">{(u.size / 1024).toFixed(0)} KB</span>
                  {u.state === "Uploading" && <div className="progress" style={{ marginTop: 4 }}><span style={{ width: `${u.progress}%` }} /></div>}
                  {u.reason && <div className="error-message small" style={{ margin: 0 }}>{u.reason}</div>}
                </div>
                <span className={`tag ${u.state === "Clean" ? "tag--green" : u.state === "Rejected" ? "tag--red" : u.state === "Pending scan" ? "tag--yellow" : "tag--blue"}`}>
                  <Icon name={u.state === "Clean" ? "check" : u.state === "Rejected" ? "cross" : "clock"} />
                  {u.state === "Uploading" ? `Uploading ${u.progress}%` : u.state}
                </span>
                <button type="button" className="icon-btn" aria-label={`Remove ${u.name}`} onClick={() => setUploads((l) => l.filter((x) => x.name !== u.name))}>✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="btn-row" style={{ marginTop: 32 }}>
        <button className="btn" type="submit" disabled={save === "sending"}>Submit report</button>
        <button className="btn btn--secondary" type="button" onClick={saveDraft} disabled={save === "saving" || save === "sending"}>Save draft</button>
      </div>
      <p className="small muted" style={{ marginTop: 16 }}>
        Online only. This pilot does not work offline; keep the page open until you see a receipt number.
      </p>
    </form>
  );
}
