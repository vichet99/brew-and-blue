import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MiniLine } from "@/components/charts";
import { KoboQuestions } from "@/components/KoboQuestions";
import { Breadcrumbs, LevelTag, Meta, PageHead, StatusTag, Table } from "@/components/ui";
import {
  actionByNo,
  actionIndicators,
  firstValueYear,
  formatOutcome,
  formatValue,
  getActionIndicator,
  getMinistry,
  getOutcomeIndicator,
  OUTCOME_YEARS,
  outcomeIndicators,
  outcomeTrend,
  pct,
  statusFor,
  thresholds,
  type ActionIndicator,
  type OutcomeIndicator,
} from "@/lib/cashew";

export function generateStaticParams() {
  return [...outcomeIndicators.map((o) => ({ code: o.code })), ...actionIndicators.map((i) => ({ code: i.code }))];
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return { title: getOutcomeIndicator(code)?.title ?? getActionIndicator(code)?.code ?? "Indicator" };
}

const methodText: Record<string, string> = {
  count_to_target: "Count against the 2027 target: % = round(value ÷ target × 100).",
  percent_complete: "Percent complete reported directly; values above 100 are capped at 100.",
  milestone: "Milestone: Completed = 100%, In progress = 50%, Not yet started = 0%.",
  inverse_time: "Time indicator (lower is better): % = round(target ÷ value × 100).",
};

function OutcomeView({ o }: { o: OutcomeIndicator }) {
  const t = outcomeTrend(o, 2025);
  const first = firstValueYear(o);
  return (
    <>
      <Breadcrumbs items={[{ label: "Indicators", href: "/indicators" }, { label: o.code }]} />
      <PageHead caption={`${o.code} · Outcome indicator · ${o.area}`} title={o.title} />
      <Meta
        items={[
          ["Level", <LevelTag key="l" level="outcome" />],
          ["Unit", o.unit],
          ["Better when", o.direction === "increase" ? "Higher" : "Lower"],
          ["Trend vs 2022", <StatusTag key="t" status={t.trend} />],
        ]}
      />
      {o.testData && (
        <div className="notice notice--warning">
          <p><StatusTag status="Test data" /> The 2025 value comes from Kobo processor-survey rows that the outcome workbook marks as testing/demo data. Treat it as indicative only.</p>
        </div>
      )}
      <div className="two-col">
        <div>
          <MiniLine title={o.title} unit={o.unit} highlight={2025} points={OUTCOME_YEARS.map((y) => ({ x: y, y: o.series[String(y)] }))} />
          <Table caption={`${o.title} by year (${o.unit})`}>
            <thead><tr><th scope="col">Year</th><th scope="col" className="num">Value</th><th scope="col">Note</th></tr></thead>
            <tbody>
              {OUTCOME_YEARS.map((y) => (
                <tr key={y}>
                  <td>{y}{y === 2022 ? " (baseline)" : ""}</td>
                  <td className="num">{formatOutcome(o, o.series[String(y)])}</td>
                  <td className="small muted">{o.series[String(y)] === null ? "Not reported yet (blank is not zero)" : ""}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <p>
            {t.trend === "No data"
              ? `No 2022 baseline${first ? `; first value ${first}` : ""}. Trend cannot be judged yet.`
              : `Change 2022 → 2025: ${formatOutcome(o, t.change!)}${t.pctChange !== null ? ` (${t.pctChange > 0 ? "+" : ""}${t.pctChange.toFixed(1)}%)` : ""}.`}
          </p>
        </div>
        <aside>
          <h2 style={{ marginTop: 0 }}>Definition</h2>
          <dl className="small">
            {[
              ["Formula", o.definition],
              ["Note", o.note],
              ["Frequency", o.frequency],
              ["Disaggregation", o.disaggregation],
              ["Primary reporter", o.source],
              ["Data tool", o.tool === "Kobo" ? "Kobo Processor Survey" : "Administrative data"],
              ["Targets", "None: monitoring against the 2022 baseline"],
            ].map(([k, v]) => (
              <div key={k} style={{ marginBottom: 8 }}><dt style={{ fontWeight: 700 }}>{k}</dt><dd style={{ margin: 0 }}>{v}</dd></div>
            ))}
          </dl>
        </aside>
      </div>
    </>
  );
}

function ActionIndicatorView({ i }: { i: ActionIndicator }) {
  const a = actionByNo(i.action)!;
  const m = getMinistry(i.ministry)!;
  return (
    <>
      <Breadcrumbs items={[{ label: "Indicators", href: "/indicators" }, { label: `Action ${a.no}`, href: `/projects/${a.code}` }, { label: i.code }]} />
      <PageHead caption={`${i.code} (${i.id}) · Action indicator · Action ${a.no}`} title={i.label} />
      <p className="km muted" lang="km">{i.labelKm}</p>
      <Meta
        items={[
          ["Reported by", <Link key="m" href={`/programmes/${m.code}`}>{m.name}</Link>],
          ["2027 target", i.targetText],
          ["2025 value", formatValue(i)],
          ["2025 status", i.y2025.status ? <StatusTag key="s" status={i.y2025.status} /> : "No data"],
        ]}
      />
      <h2>How the % is calculated</h2>
      <p>{methodText[i.method]} In 2025 this gave <strong>{pct(i.y2025.actualPct)}</strong>{(i.y2025.actualPct ?? 0) > 100 ? " (above target; 100% is used for status)" : ""}.</p>
      <Table caption="Status this value would get in each year">
        <thead><tr><th scope="col">Year</th><th scope="col">Largely achieved from</th><th scope="col">Fully achieved from</th><th scope="col">Status of the 2025 value</th></tr></thead>
        <tbody>
          {thresholds.filter((t) => t.year <= 2027).map((t) => {
            const s = statusFor(i.y2025.cappedPct, t.year);
            return (
              <tr key={t.year}>
                <td>{t.year}</td><td>{t.largely}%</td><td>{t.fully}%</td><td>{s ? <StatusTag status={s} /> : "No data"}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <h2>Kobo question</h2>
      <KoboQuestions indicators={[i]} />
    </>
  );
}

export default async function IndicatorPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const o = getOutcomeIndicator(code);
  if (o) return <OutcomeView o={o} />;
  const i = getActionIndicator(code);
  if (i) return <ActionIndicatorView i={i} />;
  notFound();
}

