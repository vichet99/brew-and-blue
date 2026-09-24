import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, fmtDate } from "@/components/ui";
import { actionIndicators, koboForm, ministries, thresholdFor } from "@/lib/cashew";
import { forms, processorSurvey } from "@/lib/workflow";
import { CashewReportForm } from "./CashewReportForm";
import { CollectForm } from "./CollectForm";

export function generateStaticParams() {
  return forms.map((f) => ({ code: f.code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return { title: forms.find((f) => f.code === code)?.title ?? "Collect" };
}

export default async function CollectPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (code === "cashew-indicator-report") {
    return (
      <>
        <Breadcrumbs items={[{ label: "Kobo forms", href: "/forms" }, { label: koboForm.title }]} />
        <span className="caption">UI-08 · Annual ministry report · Kobo form version {koboForm.version}</span>
        <h1>{koboForm.title}</h1>
        <p className="lead">One submission per ministry per year. Deadline 31 March. The percentage is calculated as you type, using the same formula as the Kobo form.</p>
        <CashewReportForm
          ministries={ministries.map(({ code, short, name, nameKm }) => ({ code, short, name, nameKm }))}
          threshold={thresholdFor(2026)}
          indicators={actionIndicators.map((i) => ({
            id: i.id,
            code: i.code,
            action: i.action,
            ministry: i.ministry,
            label: i.label,
            labelKm: i.labelKm,
            targetText: i.targetText,
            target: i.target,
            method: i.method,
            answerType: i.answerType,
            question: i.question,
            questionKm: i.questionKm,
            prev: i.y2025.value,
          }))}
        />
      </>
    );
  }
  if (code !== processorSurvey.code) notFound();
  return (
    <>
      <Breadcrumbs items={[{ label: "Kobo forms", href: "/forms" }, { label: processorSurvey.title }]} />
      <span className="caption">UI-08 · Version {processorSurvey.version}, published {fmtDate(processorSurvey.published)} · one submission per plant per year</span>
      <h1>{processorSurvey.title}</h1>
      <CollectForm form={processorSurvey} />
    </>
  );
}
