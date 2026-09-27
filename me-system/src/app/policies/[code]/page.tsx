import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBars } from "@/components/charts";
import { Breadcrumbs, fmtDate, Meta, PageHead, StatusTag, Table } from "@/components/ui";
import {
  actionCounts,
  actions,
  actionsLedBy,
  clusterLabel,
  formatOutcome,
  getOutcomeIndicator,
  goalOutcomeCodes,
  indicatorsOfMinistry,
  ministries,
  ministryCompletion,
  mtr,
  outcomeTrend,
  pct,
  policy,
} from "@/lib/cashew";

export function generateStaticParams() {
  return [{ code: policy.code }];
}

export const metadata: Metadata = { title: policy.name };

export default async function PolicyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (code !== policy.code) notFound();
  const all = actionCounts(actions);

  return (
    <>
      <Breadcrumbs items={[{ label: "Policies", href: "/policies" }, { label: policy.code }]} />
      <PageHead caption={`${policy.code} · Policy`} title={policy.name}>
        <Link className="btn btn--secondary" href="/reports/outcome">Outcome dashboard</Link>
        <Link className="btn btn--secondary" href="/reports/progress-2025">2025 progress report</Link>
      </PageHead>
      <Meta
        items={[
          ["Approved", `${fmtDate(policy.approved)}, ${policy.approvedBy}`],
          ["Period", "2022 – 2027"],
          ["Owner", policy.owner],
          ["M&E body", "Inter-Ministerial M&E Committee"],
        ]}
      />
      <p className="lead">{policy.vision}</p>
      <p className="small muted">Aligned with the {policy.alignment}. Technical support: {policy.partners}.</p>

      <h2>Goals and results</h2>
      <div className="grid grid--3">
        {policy.goals.map((g) => {
          const acts = actions.filter((a) => a.cluster === g.cluster);
          const c = actionCounts(acts);
          return (
            <article key={g.code} className="card card--accent">
              <p className="small muted" style={{ marginBottom: 4 }}>
                {g.code} · <span className={`chip chip--${g.cluster}`}>{clusterLabel[g.cluster]} cluster</span>
              </p>
              <h3>{g.text}</h3>
              <p className="small" style={{ marginBottom: 8 }}>
                <strong>{acts.length} actions:</strong> {c.fully} fully, {c.largely} largely, {c.limited} limited · completion {pct(c.completion)}
              </p>
              <ul className="small" style={{ paddingLeft: 18, marginBottom: 0 }}>
                {goalOutcomeCodes[g.code].map((oc) => {
                  const o = getOutcomeIndicator(oc)!;
                  const t = outcomeTrend(o, 2025);
                  return (
                    <li key={oc}>
                      <Link href={`/indicators/${oc}`}>{o.title}</Link>: {formatOutcome(o, o.series["2025"])} <StatusTag status={t.trend} />
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>

      <h2>Where the policy stands (reporting year 2025)</h2>
      <p>
        {all.fully} of 44 actions fully achieved, {all.largely} largely achieved, {all.limited} limited. The MTR (situation mid-2025, 50% cut-off)
        counted {mtr.clusterCounts.all.fully} / {mtr.clusterCounts.all.largely} / {mtr.clusterCounts.all.limited}.
      </p>
      <StatusBars
        caption="Action status by cluster, 2025 (workbook thresholds: largely ≥ 40%)"
        rows={(["production", "processing", "export"] as const).map((cl) => {
          const c = actionCounts(actions.filter((a) => a.cluster === cl));
          return { label: clusterLabel[cl], fully: c.fully, largely: c.largely, limited: c.limited };
        })}
      />

      <h2>Ministry programmes</h2>
      <p>Each ministry or institution has one programme. It owns the actions it leads and contributes to joint actions.</p>
      <Table caption="Programmes by ministry, 2025">
        <thead>
          <tr>
            <th scope="col">Ministry / institution</th>
            <th scope="col" className="num">Actions led</th>
            <th scope="col" className="num">Indicators</th>
            <th scope="col" className="num">Completion</th>
            <th scope="col">Status counts (F / L / Lim.)</th>
          </tr>
        </thead>
        <tbody>
          {ministries.map((m) => {
            const c = ministryCompletion(m.code);
            return (
              <tr key={m.code}>
                <td><Link href={`/programmes/${m.code}`}>{m.name}</Link> <span className="small muted">{m.short}</span></td>
                <td className="num">{actionsLedBy(m.code).length}</td>
                <td className="num">{indicatorsOfMinistry(m.code).length}</td>
                <td className="num">{pct(c.completion)}</td>
                <td className="nowrap">{c.fully} / {c.largely} / {c.limited}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <h2>Governance</h2>
      <ul>
        <li><strong>Committee:</strong> {policy.committee}</li>
        <li><strong>Secretariat:</strong> {policy.secretariat}</li>
        <li><strong>Monitoring:</strong> action level (44 actions, 108 indicators, annual Kobo report by 17 ministries) and outcome level (13 indicators, 2022 baseline, no targets).</li>
      </ul>
    </>
  );
}
