import type { Metadata } from "next";
import Link from "next/link";
import { StatusBars } from "@/components/charts";
import { Breadcrumbs, fmtDate, PageHead, StatusTag } from "@/components/ui";
import {
  actionCounts,
  actionStatus,
  actions,
  clusterLabel,
  dataNotes,
  ministryShort,
  mtr,
  pct,
  policy,
  type Cluster,
} from "@/lib/cashew";

export const metadata: Metadata = { title: "Progress report 2025" };

const clusters: Cluster[] = ["production", "processing", "export"];

export default function ProgressReportPage() {
  const all = actionCounts(actions);
  return (
    <>
      <Breadcrumbs items={[{ label: "Dashboards and reports", href: "/reports" }, { label: "Progress report 2025" }]} />
      <PageHead caption={`Previous period · ${policy.name}`} title="Progress report 2025 and mid-term review" />
      <p className="lead">
        Results of the first annual reporting cycle (reporting year 2025) and the findings of the mid-term review ({mtr.status.toLowerCase()},{" "}
        {fmtDate(mtr.date)}), which assessed the situation as of {mtr.asOf}.
      </p>

      <h2>1. Progress toward the three goals</h2>
      {mtr.goalProgress.map((p) => (
        <p key={p.slice(0, 30)}>{p}</p>
      ))}

      <h2>2. Delivery of the 44 actions</h2>
      <p>
        <strong>Annual report (reporting year 2025, 40% threshold):</strong> {all.fully} fully achieved, {all.largely} largely achieved, {all.limited}{" "}
        limited; completion {pct(all.completion)}. <strong>MTR (mid-2025, 50% cut-off):</strong> {mtr.clusterCounts.all.fully} fully,{" "}
        {mtr.clusterCounts.all.largely} largely, {mtr.clusterCounts.all.limited} limited. The two differ in method and date, not in data source.
      </p>
      <div className="grid grid--2">
        <div className="card">
          <StatusBars
            caption="Annual report 2025, by cluster"
            rows={clusters.map((c) => {
              const x = actionCounts(actions.filter((a) => a.cluster === c));
              return { label: clusterLabel[c], fully: x.fully, largely: x.largely, limited: x.limited };
            })}
          />
        </div>
        <div className="card">
          <StatusBars
            caption="MTR assessment (mid-2025), by cluster"
            rows={clusters.map((c) => ({ label: clusterLabel[c], ...mtr.clusterCounts[c] }))}
          />
        </div>
      </div>

      {clusters.map((c) => (
        <section key={c}>
          <h3 style={{ marginTop: 32 }}>{clusterLabel[c]} cluster</h3>
          <div className="table-wrap" role="region" aria-label={`${clusterLabel[c]} actions`} tabIndex={0}>
            <table>
              <caption>{clusterLabel[c]} actions: MTR progress summary and 2025 result</caption>
              <thead>
                <tr><th scope="col" className="num">#</th><th scope="col">Action and progress summary (MTR)</th><th scope="col">Responsible</th><th scope="col">MTR</th><th scope="col" className="num">2025 %</th><th scope="col">2025 status</th></tr>
              </thead>
              <tbody>
                {actions.filter((a) => a.cluster === c).map((a) => {
                  const s = actionStatus(a);
                  return (
                    <tr key={a.code}>
                      <td className="num"><Link href={`/projects/${a.code}`}>{a.no}</Link></td>
                      <td><div className="small" style={{ fontWeight: 600 }}>{a.title.length > 140 ? a.title.slice(0, 140) + "…" : a.title}</div><div className="small">{a.mtrSummary}</div></td>
                      <td className="small">{a.responsible || a.ministries.map(ministryShort).join(", ")}</td>
                      <td className="small nowrap">{a.mtrProgress}</td>
                      <td className="num">{pct(a.y2025.avgCappedPct)}</td>
                      <td>{s && <StatusTag status={s} />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <h2>3. Findings by evaluation criterion (OECD-DAC)</h2>
      <dl>
        {Object.entries(mtr.criteria).map(([k, v]) => (
          <div key={k} style={{ marginBottom: 16 }}>
            <dt style={{ fontWeight: 700 }}>{k}</dt>
            <dd style={{ margin: 0 }}>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="small muted">Method: {mtr.method}</p>

      <h2>4. Priorities for 2025–2027</h2>
      <p>{mtr.priorities[0]}</p>
      <ol type="A">
        {mtr.priorities.slice(1).map((p) => <li key={p.slice(0, 30)} style={{ marginBottom: 8 }}>{p.replace(/^[A-D]\.\s*/, "")}</li>)}
      </ol>

      <h2>5. Recommendations</h2>
      {Object.entries(mtr.recommendations).map(([k, list]) => (
        <details key={k} className="card" style={{ marginBottom: 8 }}>
          <summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}><strong>{k}</strong>&nbsp;<span className="small muted">({list.length} points)</span></summary>
          <ul className="small">{list.map((r) => <li key={r.slice(0, 40)} style={{ marginBottom: 6 }}>{r}</li>)}</ul>
        </details>
      ))}

      <h2>6. Immediate next steps (first three months after the MTR)</h2>
      <ol>{mtr.nextSteps.map((s) => <li key={s}>{s}</li>)}</ol>

      <h2>About the data</h2>
      <ul className="small">{dataNotes.map((n) => <li key={n}>{n}</li>)}</ul>
    </>
  );
}
