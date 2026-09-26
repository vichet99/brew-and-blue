import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RoleOnly } from "@/components/RoleProvider";
import { Breadcrumbs, PageHead, Table } from "@/components/ui";
import { actionIndicators, getMinistry, koboForm } from "@/lib/cashew";
import { forms, processorSurvey } from "@/lib/workflow";
import { FormDesigner } from "./FormDesigner";

export function generateStaticParams() {
  return forms.map((f) => ({ code: f.code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return { title: forms.find((f) => f.code === code)?.title ?? "Form" };
}

function XlsFormStructure() {
  const byId = new Map(actionIndicators.map((i) => [i.id, i]));
  return (
    <>
      <Breadcrumbs items={[{ label: "Kobo forms", href: "/forms" }, { label: koboForm.title }]} />
      <PageHead caption={`XLSForm · form_id ${koboForm.formId} · version ${koboForm.version} · default language ${koboForm.defaultLanguage}`} title={koboForm.title}>
        <RoleOnly any={["submit_report"]}>
          <Link className="btn" href="/collect/cashew-indicator-report">Fill in</Link>
        </RoleOnly>
      </PageHead>

      <h2>Page 1: respondent information</h2>
      <Table caption="Respondent fields">
        <thead><tr><th scope="col">Field</th><th scope="col">Type</th><th scope="col">English</th><th scope="col">ខ្មែរ</th></tr></thead>
        <tbody>
          {koboForm.respondentFields.map((f) => (
            <tr key={f.name}>
              <td><code>{f.name}</code></td><td className="small">{f.type}</td>
              <td>{f.en}{f.hint && <div className="small muted">{f.hint}</div>}</td>
              <td className="km" lang="km">{f.km}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <h2>Fields repeated for every indicator</h2>
      <Table caption="Six fields per indicator group (g_ind_001 … g_ind_108)">
        <thead><tr><th scope="col">Field</th><th scope="col">Type</th><th scope="col">English</th><th scope="col">ខ្មែរ</th></tr></thead>
        <tbody>
          <tr><td><code>ind_xxx_header</code></td><td className="small">note</td><td>Indicator label and 2027 target</td><td /></tr>
          {koboForm.perIndicatorFields.map((f) => (
            <tr key={f.suffix}>
              <td><code>ind_xxx{f.suffix}</code></td><td className="small">{f.type}</td>
              <td>{f.en}{f.required ? " (required)" : ""}{f.hint && <div className="small muted">{f.hint}</div>}</td>
              <td className="km" lang="km">{f.km}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <h2>Ministry sections ({koboForm.sections.length})</h2>
      <p>Each section is shown only when the respondent selects that ministry (or Admin). Open a section to see its indicator groups.</p>
      {koboForm.sections.map((s) => {
        const m = getMinistry(s.ministry);
        return (
          <details key={s.name} className="card" style={{ marginBottom: 8 }}>
            <summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <strong>{m?.short ?? s.ministry}</strong> <span className="small">{s.indicators.length} indicators</span> <code className="small">{s.name}</code>
            </summary>
            <p className="small muted">relevant: <code>{s.relevant}</code></p>
            <ul className="small">
              {s.indicators.map((id) => {
                const i = byId.get(id)!;
                return (
                  <li key={id}>
                    <Link href={`/indicators/${i.code}`}>{id}</Link> | Action {i.action}: {i.question}
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}

      <h2>Choice lists</h2>
      <Table caption="choices sheet">
        <thead><tr><th scope="col">List</th><th scope="col">Value</th><th scope="col">English</th><th scope="col">ខ្មែរ</th></tr></thead>
        <tbody>
          {koboForm.choices.map((c) => (
            <tr key={c.list + c.name}><td>{c.list}</td><td><code>{c.name}</code></td><td>{c.en}</td><td className="km" lang="km">{c.km}</td></tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

export default async function FormPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (code === "cashew-indicator-report") return <XlsFormStructure />;
  if (code !== processorSurvey.code) notFound();
  return (
    <>
      <Breadcrumbs items={[{ label: "Kobo forms", href: "/forms" }, { label: processorSurvey.title }]} />
      <PageHead caption={`UI-07 · Designer · draft of v${processorSurvey.version + 1}`} title={processorSurvey.title} />
      <div className="notice small">
        <p>Rebuilt from the column headers of the processor-survey export (outcome workbook sheet 08_RAW_KOBO); wording is illustrative.</p>
      </div>
      <FormDesigner form={processorSurvey} />
    </>
  );
}
