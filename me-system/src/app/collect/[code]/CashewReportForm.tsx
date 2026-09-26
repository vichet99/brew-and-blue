"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { LangToggle } from "@/components/KoboQuestions";
import { useRole } from "@/components/RoleProvider";
import { Icon, StatusTag } from "@/components/ui";
import { koboPercentage, statusWith, type Method, type Threshold } from "@/lib/rules";

export interface ReportIndicator {
  id: string;
  code: string;
  action: number;
  ministry: string;
  label: string;
  labelKm: string;
  targetText: string;
  target: number | null;
  method: Method;
  answerType: string;
  question: string;
  questionKm: string;
  prev: number | string | null;
}

interface Answer {
  value: string;
  narrative: string;
  feedback: string;
  file: string;
}

type Save = "idle" | "unsaved" | "saving" | "saved" | "sending";

const EMPTY: Answer = { value: "", narrative: "", feedback: "", file: "" };

const T = {
  en: {
    ministry: "Which ministry/institution are you responding for?",
    ministryHint: "Only indicators assigned to the selected ministry/institution will appear.",
    year: "Reporting year",
    target: "2027 target",
    prev: "2025 reported progress",
    narrative: "Please briefly describe progress and key achievements related to this indicator",
    narrativeHint: "Short, factual: location, date, quantity and key activity.",
    evidence: "Upload evidence or report if available",
    feedback: "Any challenge faced during reporting period? What solution?",
    optional: "optional",
  },
  km: {
    ministry: "តើអ្នករាយការណ៍សម្រាប់ក្រសួង ឬស្ថាប័នណាដែរ?",
    ministryHint: "សូចនាករដែលពាក់ព័ន្ធនឹងក្រសួង/ស្ថាប័នដែលបានជ្រើសរើសប៉ុណ្ណោះនឹងបង្ហាញ។",
    year: "ឆ្នាំដែលផ្តល់របាយការណ៍",
    target: "គោលដៅឆ្នាំ ២០២៧",
    prev: "វឌ្ឍនភាពដែលបានរាយការណ៍ឆ្នាំ២០២៥",
    narrative: "សូមពិពណ៌នាដោយសង្ខេបអំពីវឌ្ឍនភាព និងសមិទ្ធផលសំខាន់ៗដែលពាក់ព័ន្ធនឹងសូចនាករនេះ",
    narrativeHint: "សូមសរសេរជាសង្ខេប ។ ប្រសិនបើពាក់ព័ន្ធ សូមបញ្ជាក់ទីតាំង កាលបរិច្ឆេទ បរិមាណ និងសកម្មភាពសំខាន់ៗ។",
    evidence: "សូមភ្ជាប់់ភស្តុតាង ឬរបាយការណ៍នានាបើមាន",
    feedback: "បញ្ហាប្រឈម និង ដំណោះស្រាយ",
    optional: "មិនបង្ខំ",
  },
};

const milestoneOptions = [
  { v: "completed", en: "Completed", km: "បានបញ្ចប់" },
  { v: "in_progress", en: "In progress", km: "កំពុងអនុវត្ត" },
  { v: "not_started", en: "Not yet started", km: "មិនទាន់ចាប់ផ្តើម" },
];

export function CashewReportForm({
  ministries,
  indicators,
  threshold,
}: {
  ministries: { code: string; short: string; name: string; nameKm: string }[];
  indicators: ReportIndicator[];
  threshold: Threshold;
}) {
  const [lang, setLang] = useState<"en" | "km">("en");
  const [ministry, setMinistry] = useState("");
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [save, setSave] = useState<Save>("idle");
  const [receipt, setReceipt] = useState("");
  const summaryRef = useRef<HTMLDivElement>(null);
  const t = T[lang];
  const km = lang === "km" ? "km" : undefined;

  const { role, ministry: myMinistry, ready } = useRole();
  const locked = role === "focal";

  useEffect(() => {
    if (!ready) return;
    if (locked) {
      setMinistry(myMinistry); // a focal point reports for their own ministry only
      return;
    }
    const m = new URLSearchParams(window.location.search).get("ministry");
    if (m && ministries.some((x) => x.code === m)) setMinistry(m);
  }, [ministries, ready, locked, myMinistry]);

  const mine = useMemo(() => indicators.filter((i) => i.ministry === ministry), [indicators, ministry]);
  const done = mine.filter((i) => answers[i.id]?.value).length;

  function set(id: string, patch: Partial<Answer>) {
    setAnswers((a) => ({ ...a, [id]: { ...(a[id] ?? EMPTY), ...patch } }));
    setSave("unsaved");
    if (errors[id]) setErrors((e) => ({ ...e, [id]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    for (const i of mine) {
      const a = answers[i.id];
      if (!a?.value) {
        e[i.id] = `${i.id}: enter a value`;
        continue;
      }
      if (i.method !== "milestone") {
        const n = Number(a.value);
        if (!Number.isFinite(n) || n < 0) e[i.id] = `${i.id}: enter a number of 0 or more`;
        else if (i.answerType === "integer" && !Number.isInteger(n)) e[i.id] = `${i.id}: enter a whole number`;
        else if (i.method === "percent_complete" && n > 100) e[i.id] = `${i.id}: percent complete must be between 0 and 100`;
      }
      if (!a.narrative.trim()) e[`${i.id}-n`] = `${i.id}: describe progress and key achievements`;
    }
    return e;
  }

  function submit(ev: FormEvent) {
    ev.preventDefault();
    if (!ministry) {
      setErrors({ ministry: "Select your ministry or institution" });
      return;
    }
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      setTimeout(() => summaryRef.current?.focus(), 0);
      return;
    }
    setSave("sending");
    setTimeout(() => {
      setReceipt(`RY2026-${ministries.find((m) => m.code === ministry)!.short.toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`);
      setSave("saved");
    }, 900);
  }

  if (receipt) {
    return (
      <div className="notice notice--success" role="status">
        <h2 style={{ marginTop: 0 }}>Annual report submitted (simulated)</h2>
        <p>Receipt <strong style={{ fontSize: "1.25rem" }}>{receipt}</strong> · {done} indicators.</p>
        <p>MoC verifies submissions in the two weeks after 31 March. You will be contacted if something needs correcting; reply within 5 working days.</p>
        <p className="small muted">Nothing was sent to a server. One submission per ministry per year: a second submission would be flagged as a duplicate.</p>
        <Link className="btn btn--secondary" href="/submissions">View submissions</Link>
      </div>
    );
  }

  const errorList = Object.entries(errors).filter(([, v]) => v);

  return (
    <form onSubmit={submit} noValidate>
      <div className="btn-row" style={{ justifyContent: "flex-end", marginBottom: 16 }}>
        <LangToggle lang={lang} setLang={setLang} />
      </div>

      {errorList.length > 0 && (
        <div className="notice notice--error" role="alert" tabIndex={-1} ref={summaryRef}>
          <h2 style={{ marginTop: 0, fontSize: "1.125rem" }}>There is a problem</h2>
          <ul>{errorList.slice(0, 12).map(([k, v]) => <li key={k}><a href={`#f-${k}`}>{v}</a></li>)}</ul>
          {errorList.length > 12 && <p className="small">and {errorList.length - 12} more.</p>}
        </div>
      )}

      <div className="card" style={{ marginBottom: 24 }}>
        <div className={`field ${errors.ministry ? "field--error" : ""}`}>
          <label htmlFor="f-ministry" lang={lang} className={km}>{t.ministry}</label>
          <p className="hint" lang={lang}>{t.ministryHint}</p>
          {errors.ministry && <p className="error-message">{errors.ministry}</p>}
          <select id="f-ministry" value={ministry} disabled={locked} aria-describedby={locked ? "f-ministry-lock" : undefined} onChange={(e) => { setMinistry(e.target.value); setErrors({}); }}>
            <option value="">Select…</option>
            {ministries.map((m) => <option key={m.code} value={m.code}>{m.short}: {lang === "km" ? m.nameKm : m.name}</option>)}
          </select>
          {locked && <p className="hint" id="f-ministry-lock" style={{ marginTop: 4 }}>Locked to your ministry (focal point). The Administrator can report for any ministry.</p>}
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="f-year" lang={lang} className={km}>{t.year}</label>
          <select id="f-year" defaultValue="2026">
            <option>2026</option>
            <option>2027</option>
          </select>
          <p className="hint" style={{ marginTop: 4 }}>Status preview uses the {threshold.year} thresholds: largely achieved from {threshold.largely}%, fully achieved at {threshold.fully}%.</p>
        </div>
      </div>

      {ministry && (
        <div className="card" style={{ position: "sticky", top: 0, zIndex: 5, marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ flex: "1 1 200px" }}>
            <div className="small">{done} of {mine.length} indicators answered</div>
            <div className="progress" aria-hidden="true"><span style={{ width: `${mine.length ? (done / mine.length) * 100 : 0}%` }} /></div>
          </div>
          <span className="save-state" role="status" aria-live="polite">
            {save === "unsaved" && <span className="tag tag--orange"><Icon name="edit" />Unsaved changes</span>}
            {save === "saving" && <span className="tag tag--blue"><Icon name="clock" />Saving…</span>}
            {save === "saved" && <span className="tag tag--green"><Icon name="check" />Saved to server (simulated)</span>}
            {save === "sending" && <span className="tag tag--blue"><Icon name="send" />Sending…</span>}
            {save === "idle" && <span className="muted">Not started</span>}
          </span>
        </div>
      )}

      {mine.map((i) => {
        const a = answers[i.id] ?? EMPTY;
        const p = koboPercentage(i, a.value);
        const s = statusWith(p, threshold);
        return (
          <fieldset key={i.id} className="ind-group" id={`f-${i.id}`}>
            <legend className="visually-hidden">{i.id}</legend>
            <p className="small muted" style={{ marginBottom: 4 }}>{i.id} | Action {i.action}</p>
            <h3 lang={lang} className={km}>{lang === "km" ? i.labelKm : i.label}</h3>
            <p className="small"><span lang={lang}>{t.target}</span>: {i.targetText}</p>

            <div className={`field ${errors[i.id] ? "field--error" : ""}`}>
              <label htmlFor={`v-${i.id}`} lang={lang} className={km}>{lang === "km" ? i.questionKm : i.question}</label>
              <p className="hint"><span lang={lang}>{t.prev}</span>: {String(i.prev ?? "—")}</p>
              {errors[i.id] && <p className="error-message">{errors[i.id]}</p>}
              {i.method === "milestone" ? (
                <select id={`v-${i.id}`} value={a.value} onChange={(e) => set(i.id, { value: e.target.value })}>
                  <option value="">Select…</option>
                  {milestoneOptions.map((o) => <option key={o.v} value={o.v}>{lang === "km" ? o.km : o.en}</option>)}
                </select>
              ) : (
                <input
                  id={`v-${i.id}`}
                  type="text"
                  inputMode={i.answerType === "integer" ? "numeric" : "decimal"}
                  value={a.value}
                  onChange={(e) => set(i.id, { value: e.target.value })}
                  style={{ maxWidth: "12em" }}
                />
              )}
              <p className="small" style={{ marginTop: 8 }} aria-live="polite">
                % of 2027 target: <strong>{p === null ? "—" : `${p}%`}</strong> {s && <StatusTag status={s} label={`${s} (${threshold.year} rule)`} />}
              </p>
            </div>

            <div className={`field ${errors[`${i.id}-n`] ? "field--error" : ""}`} id={`f-${i.id}-n`}>
              <label htmlFor={`n-${i.id}`} lang={lang} className={km}>{t.narrative}</label>
              <p className="hint" lang={lang}>{t.narrativeHint}</p>
              {errors[`${i.id}-n`] && <p className="error-message">{errors[`${i.id}-n`]}</p>}
              <textarea id={`n-${i.id}`} value={a.narrative} onChange={(e) => set(i.id, { narrative: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor={`e-${i.id}`} lang={lang} className={km}>{t.evidence} <span className="muted" style={{ fontWeight: 400 }}>({t.optional})</span></label>
              <p className="hint">Official report, signed letter, attendance sheet, contract, dated photo or certified statistics, dated within the reporting year.</p>
              <input id={`e-${i.id}`} type="file" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx" onChange={(e) => set(i.id, { file: e.target.files?.[0]?.name ?? "" })} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor={`fb-${i.id}`} lang={lang} className={km}>{t.feedback} <span className="muted" style={{ fontWeight: 400 }}>({t.optional})</span></label>
              <textarea id={`fb-${i.id}`} value={a.feedback} onChange={(e) => set(i.id, { feedback: e.target.value })} style={{ minHeight: 70 }} />
            </div>
          </fieldset>
        );
      })}

      {ministry && (
        <div className="btn-row" style={{ marginTop: 24 }}>
          <button className="btn" type="submit" disabled={save === "sending"}>Submit annual report</button>
          <button
            className="btn btn--secondary"
            type="button"
            onClick={() => { setSave("saving"); setTimeout(() => setSave("saved"), 600); }}
            disabled={save === "saving" || save === "sending"}
          >
            Save draft
          </button>
        </div>
      )}
      {!ministry && <p className="muted">Select a ministry to see its indicators.</p>}
    </form>
  );
}
