"use client";

import { useState } from "react";
import type { ActionIndicator } from "@/lib/cashew";

export function LangToggle({ lang, setLang }: { lang: "en" | "km"; setLang: (l: "en" | "km") => void }) {
  return (
    <div className="lang-toggle" role="group" aria-label="Question language">
      <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>English</button>
      <button type="button" aria-pressed={lang === "km"} onClick={() => setLang("km")} lang="km" className="km">ខ្មែរ</button>
    </div>
  );
}

const typeLabel = (t: string) =>
  t.startsWith("select_one") ? "Select one: Completed / In progress / Not yet started" : t === "integer" ? "Whole number" : "Decimal number";

/** The Kobo XLSForm rows behind each indicator group, in English or Khmer. */
export function KoboQuestions({ indicators }: { indicators: ActionIndicator[] }) {
  const [lang, setLang] = useState<"en" | "km">("en");
  return (
    <>
      <div className="btn-row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <p className="small muted" style={{ margin: 0 }}>
          From CASHEW INDICATOR REPORT (Kobo XLSForm v10). Each indicator is one group of six fields.
        </p>
        <LangToggle lang={lang} setLang={setLang} />
      </div>
      {indicators.map((i) => (
        <section key={i.id} className="ind-group" aria-labelledby={`kq-${i.id}`}>
          <p className="small muted" style={{ marginBottom: 4 }}>
            Group <code>{i.kobo.group}</code> · {i.id} | Action {i.action}
          </p>
          <h3 id={`kq-${i.id}`} lang={lang} className={lang === "km" ? "km" : undefined}>
            {lang === "km" ? i.labelKm : i.label}
          </h3>
          <p className="small">2027 target: {i.targetText}</p>
          <div className="table-wrap" role="region" aria-label={`Kobo fields for ${i.id}`} tabIndex={0}>
            <table>
              <thead>
                <tr><th scope="col">Field</th><th scope="col">Type</th><th scope="col">Label / rule</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>{i.kobo.value}</code></td>
                  <td className="small">{typeLabel(i.answerType)}</td>
                  <td>
                    <span lang={lang} className={lang === "km" ? "km" : undefined}>{lang === "km" ? i.questionKm : i.question}</span>
                    <div className="small muted">
                      Required.{i.constraint ? ` Constraint: ${i.constraint} (${i.constraintMsg})` : ""} Hint: &ldquo;2025 reported progress: {String(i.y2025.value ?? "—")}&rdquo;.
                    </div>
                  </td>
                </tr>
                <tr>
                  <td><code>{i.kobo.percentage}</code></td>
                  <td className="small">calculate</td>
                  <td className="small"><code style={{ wordBreak: "break-all" }}>{i.calculation}</code></td>
                </tr>
                <tr>
                  <td><code>{i.kobo.followup}</code></td>
                  <td className="small">text (multiline)</td>
                  <td className="small" lang={lang}>{lang === "km" ? "សូមពិពណ៌នាដោយសង្ខេបអំពីវឌ្ឍនភាព និងសមិទ្ធផលសំខាន់ៗដែលពាក់ព័ន្ធនឹងសូចនាករនេះ" : "Please briefly describe progress and key achievements related to this indicator"} (required)</td>
                </tr>
                <tr>
                  <td><code>{i.kobo.evidence}</code></td>
                  <td className="small">file</td>
                  <td className="small" lang={lang}>{lang === "km" ? "សូមភ្ជាប់់ភស្តុតាង ឬរបាយការណ៍នានាបើមាន" : "Upload evidence or report if available"} (optional)</td>
                </tr>
                <tr>
                  <td><code>{i.kobo.feedback}</code></td>
                  <td className="small">text (multiline)</td>
                  <td className="small" lang={lang}>{lang === "km" ? "បញ្ហាប្រឈម និង ដំណោះស្រាយ" : "Any challenge faced during reporting period? What solution?"} (optional)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}
