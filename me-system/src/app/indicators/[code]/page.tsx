import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeriesChart, progressText } from "@/components/IndicatorCard";
import { Breadcrumbs, fmtDate, fmtNum, LevelTag, Meta, PageHead, StatusTag, Table } from "@/components/ui";
import { achievement, formatResult, pooledPercentage } from "@/lib/calc";
import { getIndicator, getProject, indicators, orgName } from "@/lib/data";

export function generateStaticParams() {
  return indicators.map((i) => ({ code: i.code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return { title: getIndicator(code)?.title ?? "Indicator" };
}

export default async function IndicatorPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const ind = getIndicator(code);
  if (!ind) notFound();
  const project = getProject(ind.project);
  const approved = ind.observations.filter((o) => o.status === "Approved");
  const pooled =
    ind.method === "percentage"
      ? pooledPercentage(approved.map((o) => ({ numerator: o.numerator ?? null, denominator: o.denominator ?? null })))
      : null;

  return (
    <>
      <Breadcrumbs items={[{ label: "Indicators", href: "/indicators" }, { label: ind.code }]} />
      <PageHead caption={`${ind.code} · version ${ind.version} · effective ${fmtDate(ind.effectiveFrom)}`} title={ind.title} />
      <Meta
        items={[
          ["Level", <LevelTag key="l" level={ind.level} />],
          ["Unit", ind.unit],
          ["Direction", ind.direction === "increase" ? "Higher is better" : "Lower is better"],
          ["Project", project ? <Link key="p" href={`/projects/${project.code}`}>{project.name}</Link> : ind.project],
        ]}
      />
      <p className="lead">{ind.definition}</p>

      <div className="two-col">
        <div>
          <h2 style={{ marginTop: 0 }}>Series</h2>
          {ind.method === "milestone" ? (
            <Table caption="Milestone stages">
              <thead>
                <tr><th scope="col">Stage</th><th scope="col">Completion criteria</th><th scope="col">Status</th></tr>
              </thead>
              <tbody>
                {ind.milestones?.map((m) => (
                  <tr key={m.stage}>
                    <td>{m.stage}</td>
                    <td>{m.criteria}</td>
                    <td>{m.done ? <StatusTag status="Completed" /> : <StatusTag status="Not started" label="Not yet" />}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <>
              <SeriesChart ind={ind} />
              <Table caption={`Observations and targets (${ind.unit})`}>
                <thead>
                  <tr>
                    <th scope="col">Period</th>
                    <th scope="col" className="num">Actual</th>
                    {ind.method === "percentage" && <th scope="col" className="num">Numerator / denominator</th>}
                    <th scope="col" className="num">Target</th>
                    <th scope="col" className="num">Achievement</th>
                    <th scope="col">State</th>
                    <th scope="col">Source revisions</th>
                  </tr>
                </thead>
                <tbody>
                  {ind.observations.map((o) => (
                    <tr key={o.period}>
                      <td className="nowrap">{o.period}</td>
                      <td className="num">{fmtNum(o.value)}</td>
                      {ind.method === "percentage" && (
                        <td className="num">{o.numerator !== undefined ? `${o.numerator} / ${o.denominator}` : "—"}</td>
                      )}
                      <td className="num">{fmtNum(o.target)}</td>
                      <td className="num">{ind.direction === "decrease" ? "See progress" : formatResult(achievement(o.value, o.target))}</td>
                      <td>
                        <span className="btn-row">
                          <StatusTag status={o.status} />
                          {o.stale && <StatusTag status="Stale" />}
                        </span>
                      </td>
                      <td className="small">{o.sources?.join(", ") ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}

          <div className="notice">
            <p>
              <strong>{progressText(ind).label}:</strong> {progressText(ind).text}
            </p>
            {pooled && (
              <p>
                <strong>Year to date (pooled):</strong> {formatResult(pooled, 2)}
                {pooled.ok && pooled.note ? ` — ${pooled.note} graded lots. Not the average of the quarterly percentages.` : ""}
              </p>
            )}
            {ind.method === "latest_snapshot" && (
              <p>Cumulative indicator: the year-to-date value is the latest approved snapshot, not the sum of quarters.</p>
            )}
            {ind.method === "weighted_mean" && ind.baseline.value !== null && (
              <p>
                Progress = (baseline − actual) ÷ (baseline − target) × 100. Values above 100% or below 0% are shown as they are, never clipped.
              </p>
            )}
            {ind.observations.some((o) => o.stale) && (
              <p>
                <StatusTag status="Stale" /> A source for an approved value was corrected. The last approved value stays visible until the recalculated
                value is approved.
              </p>
            )}
          </div>
        </div>

        <aside>
          <h2 style={{ marginTop: 0 }}>Definition (v{ind.version})</h2>
          <dl className="small">
            {[
              ["Method", ind.method.replace("_", " ")],
              ["Combine locations", ind.spatialRule],
              ["Combine periods", ind.temporalRule],
              ["Frequency", ind.frequency],
              ["Data source", ind.source],
              ["Collection", ind.collection],
              ["Responsible", orgName(ind.responsible)],
              ["Reviewer", ind.reviewer],
              ["Disaggregation", ind.disaggregation.join("; ")],
              ["Evidence required", ind.evidence],
              ["Limitations", ind.limitations],
            ].map(([k, v]) => (
              <div key={k} style={{ marginBottom: 8 }}>
                <dt style={{ fontWeight: 700 }}>{k}</dt>
                <dd style={{ margin: 0 }}>{v}</dd>
              </div>
            ))}
          </dl>
          <h3>Baseline</h3>
          {ind.baseline.value === null ? (
            <p className="small">
              <StatusTag status="No data" label="Unknown" /> {ind.baseline.missingReason}. Unknown is not zero.
            </p>
          ) : (
            <p className="small">
              {fmtNum(ind.baseline.value, ind.unit)} ({ind.baseline.period}). Source: {ind.baseline.source}
            </p>
          )}
          <h3>Version history</h3>
          <ul className="small">
            <li>v{ind.version} effective {fmtDate(ind.effectiveFrom)} (current)</li>
            {ind.version > 1 && <li>v1 — counted certificates issued, not valid certificates held. Historic reports keep v1.</li>}
          </ul>
        </aside>
      </div>
    </>
  );
}
