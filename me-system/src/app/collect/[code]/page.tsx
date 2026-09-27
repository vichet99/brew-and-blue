import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveNote } from "@/components/LiveNote";
import { Breadcrumbs, fmtDate } from "@/components/ui";
import { stateLabel } from "@/lib/access";
import { actionIndicators, getMinistry, koboForm, ministries, thresholdFor } from "@/lib/cashew";
import { getAnswers, getLive, getSubmission, type Live } from "@/lib/live";
import { forms, processorSurvey } from "@/lib/workflow";
import { CashewReportForm, type LiveReport } from "./CashewReportForm";
import { CollectForm } from "./CollectForm";

export const dynamic = "force-dynamic";

async function loadLive(live: Live, ministryParam: string | undefined, yearParam: string | undefined): Promise<LiveReport> {
  const account = live.account!;
  const { data: yearRows } = await live.supabase.from("reporting_years").select("year, status").order("year");
  const years = (yearRows ?? []).map((y) => ({ year: y.year as number, status: y.status as string }));
  const open = years.find((y) => y.status !== "closed")?.year ?? new Date().getFullYear();
  const year = years.some((y) => String(y.year) === yearParam) ? Number(yearParam) : open;
  const ministry = account.role === "focal" ? account.ministry : ministries.some((m) => m.code === ministryParam) ? ministryParam! : "";
  const base: LiveReport = { year, years, ministry, report: null, answers: {} };
  if (!ministry) return base;
  const short = getMinistry(ministry)!.short.toUpperCase();
  const sub = await getSubmission(live, `RY${year}-${short}`);
  if (!sub || !sub.revision_id) return base;
  const answers = await getAnswers(live, sub.revision_id);
  return {
    ...base,
    report: {
      code: sub.code,
      revisionId: sub.revision_id,
      revisionNo: sub.revision_no ?? 1,
      state: stateLabel(sub.revision_state),
      editable: sub.revision_state === "draft",
    },
    answers: Object.fromEntries(
      answers.map((a) => [a.external_id ?? a.indicator_code, {
        value: a.value_number !== null ? String(a.value_number) : a.value_choice ?? "",
        narrative: a.narrative ?? "",
        feedback: a.challenges ?? "",
        file: a.evidence ?? "",
      }]),
    ),
  };
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return { title: forms.find((f) => f.code === code)?.title ?? "Collect" };
}

export default async function CollectPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ ministry?: string; year?: string }>;
}) {
  const { code } = await params;
  if (code === "cashew-indicator-report") {
    const live = await getLive();
    if (live && !live.account) return <LiveNote noAccess />;
    const q = await searchParams;
    const liveReport = live ? await loadLive(live, q.ministry, q.year) : undefined;
    return (
      <>
        <Breadcrumbs items={[{ label: "Data forms", href: "/forms" }, { label: koboForm.title }]} />
        <span className="caption">UI-08 · Annual ministry report · Kobo form version {koboForm.version}</span>
        <h1>{koboForm.title}</h1>
        <p className="lead">One submission per ministry per year. Deadline 31 March. The percentage is calculated as you type, using the same formula as the Kobo form.</p>
        {live && <LiveNote />}
        <CashewReportForm
          key={liveReport ? `${liveReport.ministry}-${liveReport.year}-${liveReport.report?.revisionId ?? "new"}` : "demo"}
          live={liveReport}
          ministries={ministries.map(({ code, short, name, nameKm }) => ({ code, short, name, nameKm }))}
          threshold={thresholdFor(liveReport?.year ?? 2026)}
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
      <Breadcrumbs items={[{ label: "Data forms", href: "/forms" }, { label: processorSurvey.title }]} />
      <span className="caption">UI-08 · Version {processorSurvey.version}, published {fmtDate(processorSurvey.published)} · one submission per plant per year</span>
      <h1>{processorSurvey.title}</h1>
      <CollectForm form={processorSurvey} />
    </>
  );
}
