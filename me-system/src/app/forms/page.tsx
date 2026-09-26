import type { Metadata } from "next";
import Link from "next/link";
import { RoleOnly } from "@/components/RoleProvider";
import { PageHead, StatusTag } from "@/components/ui";
import { actionIndicators, koboForm, ministries } from "@/lib/cashew";
import { forms, processorSurvey } from "@/lib/workflow";

export const metadata: Metadata = { title: "Data forms" };

export default function FormsPage() {
  const questions = { "cashew-indicator-report": `${actionIndicators.length} indicator groups in ${ministries.length} ministry sections (${koboForm.rows} XLSForm rows)`, "processor-survey": `${processorSurvey.questions.filter((q) => q.type !== "section" && q.type !== "note").length} questions` } as Record<string, string>;
  const version = { "cashew-indicator-report": `Version ${koboForm.version}`, "processor-survey": `Version ${processorSurvey.version}` } as Record<string, string>;
  return (
    <>
      <PageHead caption="Collection" title="Data forms" />
      <p className="lead">Two forms feed the two monitoring levels. Both are published once and reused every year.</p>
      <div className="grid grid--2">
        {forms.map((f) => (
          <article key={f.code} className="card card--accent">
            <p className="small muted" style={{ marginBottom: 4 }}>{f.tool} · {f.level} level</p>
            <h2 style={{ marginTop: 0, fontSize: "1.25rem" }}>{f.title}</h2>
            <p className="small">{questions[f.code]} · {version[f.code]}</p>
            <p className="small">Filled by: {f.who}</p>
            <p className="btn-row" style={{ margin: 0 }}>
              <StatusTag status="Published" />
              <RoleOnly any={[f.code === "processor-survey" ? "manage_setup" : "submit_report"]}>
                <Link className="btn" href={`/collect/${f.code}`}>Fill in</Link>
              </RoleOnly>
              {f.code === "processor-survey" ? (
                <RoleOnly any={["manage_setup"]} fallback={<span className="small muted">Designer: Administrator only</span>}>
                  <Link className="btn btn--secondary" href={`/forms/${f.code}`}>Open designer</Link>
                </RoleOnly>
              ) : (
                <Link className="btn btn--secondary" href={`/forms/${f.code}`}>View structure</Link>
              )}
            </p>
          </article>
        ))}
      </div>
      <h2>How the ministry form works</h2>
      <ol>
        <li>The respondent picks their ministry. The form shows only that ministry&apos;s section (for MAFF, 15 indicators).</li>
        <li>For each indicator: a value, the % of the 2027 target (calculated automatically), a progress narrative, an evidence file and optional challenges.</li>
        <li>MoC exports one wide row per ministry (about 775 columns). This system replaces the Excel paste: each answer is stored against its indicator directly.</li>
      </ol>
      <p className="small muted">
        Kobo remains the collection channel in the pilot. A read-only import connector (R2) would pull submissions automatically instead of exporting and pasting.
      </p>
    </>
  );
}
