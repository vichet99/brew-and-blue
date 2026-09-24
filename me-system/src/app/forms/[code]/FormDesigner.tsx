"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormDef, FormQuestion } from "@/lib/workflow";

const palette: { type: FormQuestion["type"]; label: string }[] = [
  { type: "short_text", label: "Short text" },
  { type: "long_text", label: "Long text" },
  { type: "integer", label: "Integer" },
  { type: "decimal", label: "Decimal" },
  { type: "date", label: "Date" },
  { type: "single_choice", label: "Single choice" },
  { type: "multiple_choice", label: "Multiple choice" },
  { type: "boolean", label: "Yes / no" },
  { type: "section", label: "Section" },
  { type: "note", label: "Note" },
];

const typeLabel = (t: FormQuestion["type"]) => palette.find((p) => p.type === t)?.label ?? t;

function validate(qs: FormQuestion[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  qs.forEach((q, i) => {
    if (!/^[a-z][a-z0-9_]{0,39}$/.test(q.id)) errors.push(`Question ${i + 1}: ID "${q.id}" must start with a letter and use only a–z, 0–9 and _`);
    if (ids.has(q.id)) errors.push(`Question ${i + 1}: ID "${q.id}" is used twice`);
    ids.add(q.id);
    if (!q.label.trim()) errors.push(`Question ${i + 1}: add a label`);
    if ((q.type === "single_choice" || q.type === "multiple_choice") && !(q.choices && q.choices.length >= 2))
      errors.push(`Question ${i + 1} (${q.id}): add at least two choices`);
    if (q.min !== undefined && q.max !== undefined && q.min > q.max) errors.push(`Question ${i + 1} (${q.id}): minimum is above maximum`);
    if (q.visibleWhen) {
      const ctrlIndex = qs.findIndex((c) => c.id === q.visibleWhen!.field);
      if (ctrlIndex === -1) errors.push(`Question ${i + 1} (${q.id}): visibility rule refers to missing field "${q.visibleWhen.field}"`);
      else if (ctrlIndex >= i) errors.push(`Question ${i + 1} (${q.id}): visibility rule must refer to an earlier question`);
    }
  });
  return errors;
}

export function FormDesigner({ form }: { form: FormDef }) {
  const [questions, setQuestions] = useState<FormQuestion[]>(form.questions);
  const [selected, setSelected] = useState(0);
  const [published, setPublished] = useState<null | { version: number }>(null);
  const [showCheck, setShowCheck] = useState(false);
  const [announce, setAnnounce] = useState("");
  const errors = useMemo(() => validate(questions), [questions]);
  const changed = useMemo(() => {
    const before = new Map(form.questions.map((q) => [q.id, JSON.stringify(q)]));
    const added = questions.filter((q) => !before.has(q.id)).map((q) => q.id);
    const edited = questions.filter((q) => before.has(q.id) && before.get(q.id) !== JSON.stringify(q)).map((q) => q.id);
    const removed = form.questions.filter((q) => !questions.some((n) => n.id === q.id)).map((q) => q.id);
    return { added, edited, removed };
  }, [questions, form.questions]);

  const q = questions[selected];

  function update(patch: Partial<FormQuestion>) {
    setQuestions((qs) => qs.map((x, i) => (i === selected ? { ...x, ...patch } : x)));
    setPublished(null);
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= questions.length) return;
    setQuestions((qs) => {
      const next = [...qs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setSelected(j);
    setAnnounce(`${questions[i].label} moved to position ${j + 1} of ${questions.length}`);
    setPublished(null);
  }
  function add(type: FormQuestion["type"]) {
    let n = questions.length + 1;
    while (questions.some((x) => x.id === `question_${n}`)) n++;
    const nq: FormQuestion = { id: `question_${n}`, type, label: `New ${typeLabel(type).toLowerCase()}` };
    if (type === "single_choice" || type === "multiple_choice") nq.choices = ["Option 1", "Option 2"];
    setQuestions((qs) => [...qs, nq]);
    setSelected(questions.length);
    setAnnounce(`${typeLabel(type)} added at position ${questions.length + 1}`);
    setPublished(null);
  }
  function duplicate(i: number) {
    const src = questions[i];
    let n = 2;
    while (questions.some((x) => x.id === `${src.id}_${n}`)) n++;
    setQuestions((qs) => [...qs.slice(0, i + 1), { ...src, id: `${src.id}_${n}` }, ...qs.slice(i + 1)]);
    setSelected(i + 1);
    setPublished(null);
  }
  function remove(i: number) {
    if (!window.confirm(`Remove "${questions[i].label}" (${questions[i].id}) from this draft? Published versions are not affected.`)) return;
    setQuestions((qs) => qs.filter((_, k) => k !== i));
    setSelected(Math.max(0, i - 1));
    setPublished(null);
  }

  return (
    <>
      <p className="visually-hidden" aria-live="polite">{announce}</p>
      {published && (
        <div className="notice notice--success" role="status">
          <p>
            <strong>Version {published.version} published (simulated).</strong> Existing submissions keep version {form.version}.{" "}
            <Link href={`/collect/${form.code}`}>Open the collection link</Link> to test it.
          </p>
        </div>
      )}
      <div className="designer">
        <section aria-labelledby="palette-h">
          <h2 id="palette-h" style={{ marginTop: 0, fontSize: "1.125rem" }}>Add a question</h2>
          <ul className="palette-list">
            {palette.map((p) => (
              <li key={p.type}>
                <button type="button" className="btn btn--secondary" style={{ width: "100%", justifyContent: "flex-start" }} onClick={() => add(p.type)}>
                  + {p.label}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="canvas-h">
          <h2 id="canvas-h" style={{ marginTop: 0, fontSize: "1.125rem" }}>Questions ({questions.length})</h2>
          <p className="small muted">Reorder with the ↑ ↓ buttons; no dragging needed.</p>
          <ol style={{ listStyle: "none", padding: 0 }}>
            {questions.map((item, i) => (
              <li key={item.id + i} className="q-item" aria-selected={i === selected}>
                <div className="q-item__body">
                  <button
                    type="button"
                    onClick={() => setSelected(i)}
                    style={{ all: "unset", cursor: "pointer", display: "block" }}
                    aria-label={`Edit question ${i + 1}: ${item.label}`}
                  >
                    <strong style={item.type === "section" ? { textTransform: "uppercase", fontSize: "0.875rem" } : undefined}>{item.label}</strong>
                    <br />
                    <span className="small muted">
                      {typeLabel(item.type)} · <code>{item.id}</code>
                      {item.required ? " · required" : ""}
                      {item.visibleWhen ? ` · shown when ${item.visibleWhen.field} = ${String(item.visibleWhen.value)}` : ""}
                    </span>
                  </button>
                </div>
                <button type="button" className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${item.label} up`}>↑</button>
                <button type="button" className="icon-btn" onClick={() => move(i, 1)} disabled={i === questions.length - 1} aria-label={`Move ${item.label} down`}>↓</button>
                <button type="button" className="icon-btn" onClick={() => duplicate(i)} aria-label={`Duplicate ${item.label}`}>⧉</button>
                <button type="button" className="icon-btn" onClick={() => remove(i)} aria-label={`Remove ${item.label}`}>✕</button>
              </li>
            ))}
          </ol>
          <div className="btn-row">
            <button type="button" className="btn" onClick={() => setShowCheck(true)}>Check and publish</button>
            <Link className="btn btn--secondary" href={`/collect/${form.code}`}>Preview current version</Link>
          </div>

          {showCheck && (
            <div className={`notice ${errors.length ? "notice--error" : ""}`} style={{ marginTop: 16 }} role="region" aria-label="Publish checks">
              <h3>Publish checks for version {form.version + 1}</h3>
              {errors.length > 0 ? (
                <>
                  <p><strong>{errors.length} problem(s) must be fixed before publishing:</strong></p>
                  <ul>{errors.map((e) => <li key={e}>{e}</li>)}</ul>
                </>
              ) : (
                <p>No errors found.</p>
              )}
              <p className="small">
                Added: {changed.added.join(", ") || "none"} · Changed: {changed.edited.join(", ") || "none"} · Removed: {changed.removed.join(", ") || "none"}
              </p>
              <p className="small">Affected outcome indicators: PR1 uses <code>installed_capacity_tpy</code> and <code>rcn_processed_t</code>; S3 uses the manager counts. Changing a question&apos;s meaning needs a new ID.</p>
              <div className="btn-row">
                <button
                  type="button"
                  className="btn"
                  disabled={errors.length > 0}
                  onClick={() => {
                    setPublished({ version: form.version + 1 });
                    setShowCheck(false);
                  }}
                >
                  Publish version {form.version + 1}
                </button>
                <button type="button" className="btn btn--secondary" onClick={() => setShowCheck(false)}>Cancel</button>
              </div>
            </div>
          )}
        </section>

        <section aria-labelledby="props-h" className="card">
          <h2 id="props-h" style={{ marginTop: 0, fontSize: "1.125rem" }}>Properties</h2>
          {!q ? (
            <p className="muted">Add a question to edit its properties.</p>
          ) : (
            <>
              <div className="field">
                <label htmlFor="p-label">Label</label>
                <input id="p-label" type="text" value={q.label} onChange={(e) => update({ label: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="p-id">Question ID</label>
                <p className="hint">Stable key used in data and exports.</p>
                <input id="p-id" type="text" value={q.id} onChange={(e) => update({ id: e.target.value })} spellCheck={false} />
              </div>
              <p className="small">Type: <strong>{typeLabel(q.type)}</strong></p>
              {q.type !== "section" && q.type !== "note" && (
                <label className="choice">
                  <input type="checkbox" checked={!!q.required} onChange={(e) => update({ required: e.target.checked })} />
                  Required (only when visible)
                </label>
              )}
              {(q.type === "integer" || q.type === "decimal") && (
                <div className="grid grid--2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div className="field">
                    <label htmlFor="p-min">Min</label>
                    <input id="p-min" type="number" value={q.min ?? ""} onChange={(e) => update({ min: e.target.value === "" ? undefined : Number(e.target.value) })} />
                  </div>
                  <div className="field">
                    <label htmlFor="p-max">Max</label>
                    <input id="p-max" type="number" value={q.max ?? ""} onChange={(e) => update({ max: e.target.value === "" ? undefined : Number(e.target.value) })} />
                  </div>
                </div>
              )}
              {(q.type === "single_choice" || q.type === "multiple_choice") && (
                <div className="field">
                  <label htmlFor="p-choices">Choices (one per line)</label>
                  <textarea id="p-choices" value={(q.choices ?? []).join("\n")} onChange={(e) => update({ choices: e.target.value.split("\n").filter(Boolean) })} />
                </div>
              )}
              {q.visibleWhen && (
                <p className="small">
                  Visibility rule: shown when <code>{q.visibleWhen.field}</code> {q.visibleWhen.operator} <code>{String(q.visibleWhen.value)}</code>.
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
