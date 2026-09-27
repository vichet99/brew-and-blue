import type { Metadata } from "next";
import Link from "next/link";
import { ActionsTable } from "@/components/ActionsTable";
import { Breadcrumbs, PageHead, Table } from "@/components/ui";
import { actionCounts, actions, indicatorsOfMinistry, ministries, mtr, pct, thresholds } from "@/lib/cashew";
import { actionRows, ministryOptions } from "@/lib/rows";
import { ActionsDashboard } from "./ActionsDashboard";

export const metadata: Metadata = { title: "Policy Actions Dashboard" };

export default function ActionsDashboardPage() {
  const c = actionCounts(actions);
  return (
    <>
      <Breadcrumbs items={[{ label: "Dashboards and reports", href: "/reports" }, { label: "Policy Actions Dashboard" }]} />
      <PageHead caption="Action level · reporting year 2025 · official mode: approved values" title="Policy Actions Dashboard">
        <Link className="btn btn--secondary" href="/reports/progress-2025">2025 progress report</Link>
      </PageHead>
      <p className="lead">
        The page the Committee reviews. Brief it in three minutes: read the completion rate, name the weakest cluster, name the three lowest ministries,
        list the actions with limited progress, and ask those ministries to comment.
      </p>

      <ActionsDashboard
        thresholds={thresholds}
        actions={actions.map((a) => ({ code: a.code, no: a.no, cluster: a.cluster, ministries: a.ministries, pct: a.y2025.avgCappedPct }))}
        ministries={ministries.map((m) => ({ code: m.code, short: m.short, name: m.name, pcts: indicatorsOfMinistry(m.code).map((i) => i.y2025.cappedPct) }))}
      />

      <h2>Status by year</h2>
      <Table caption="Status by reporting year (each year graded with its own threshold)">
        <thead>
          <tr><th scope="col">Year</th><th scope="col" className="num">Fully</th><th scope="col" className="num">Largely</th><th scope="col" className="num">Limited</th><th scope="col" className="num">Completion</th><th scope="col">Note</th></tr>
        </thead>
        <tbody>
          <tr><td>2025</td><td className="num">{c.fully}</td><td className="num">{c.largely}</td><td className="num">{c.limited}</td><td className="num">{pct(c.completion)}</td><td className="small">Endorsed May 2026</td></tr>
          <tr><td>2026</td><td className="num">—</td><td className="num">—</td><td className="num">—</td><td className="num">—</td><td className="small">Due 31 March 2027 (largely ≥ 70%)</td></tr>
          <tr><td>2027</td><td className="num">—</td><td className="num">—</td><td className="num">—</td><td className="num">—</td><td className="small">Final year (largely ≥ 90%)</td></tr>
          <tr><td>MTR, mid-2025</td><td className="num">{mtr.clusterCounts.all.fully}</td><td className="num">{mtr.clusterCounts.all.largely}</td><td className="num">{mtr.clusterCounts.all.limited}</td><td className="num">—</td><td className="small">MTR method: 50% cut-off, completed = fully</td></tr>
        </tbody>
      </Table>

      <h2>All 44 actions</h2>
      <ActionsTable rows={actionRows()} ministryOptions={ministryOptions()} />
      <p className="small muted">
        Clusters follow the MTR (1–17, 18–28, 29–44). Workbook v5 groups actions 1–16 / 17–32 / 33–44, so its pillar counts differ from this page.
      </p>
    </>
  );
}
