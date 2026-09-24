import type { Metadata } from "next";
import Link from "next/link";
import { IndicatorCard, SeriesChart } from "@/components/IndicatorCard";
import { fmtDate, PageHead, StatusTag, Table } from "@/components/ui";
import { indicators, obligations, reports } from "@/lib/data";
import { SnapshotButton } from "./SnapshotButton";

export const metadata: Metadata = { title: "Dashboard and reports" };

export default function ReportsPage() {
  const expected = obligations.filter((o) => o.period === "2026-Q2" && o.state !== "Waived" && o.state !== "Not applicable");
  const approved = expected.filter((o) => o.state === "Approved");
  return (
    <>
      <PageHead caption="UI-11 · Official mode: approved values only" title="Dashboard and reports">
        <SnapshotButton />
      </PageHead>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="grid grid--4">
          <div><div className="small muted">Scope</div><strong>Policy POL-01 (all programmes)</strong></div>
          <div><div className="small muted">Period</div><strong>2026-Q1 to 2026-Q3</strong></div>
          <div><div className="small muted">Approval state</div><strong>Approved only</strong></div>
          <div><div className="small muted">Last refresh</div><strong>24 Sep 2026, 08:00</strong></div>
        </div>
        <p className="small muted" style={{ margin: "12px 0 0" }}>
          Filters for geography and organisation arrive with real data in M5. Draft work view is hidden from viewers.
        </p>
      </div>

      <div className="notice notice--warning">
        <p>
          <strong>Reporting coverage 2026-Q2:</strong> {approved.length} of {expected.length} expected reports approved (1 overdue, 1 waived with reason).
          Missing values are shown as “No data”, never as zero.
        </p>
      </div>

      <h2>Indicators</h2>
      <div className="grid grid--3">
        {indicators.map((i) => (
          <IndicatorCard key={i.code} ind={i} />
        ))}
      </div>

      <h2>Trends</h2>
      <div className="grid grid--2">
        {indicators.filter((i) => i.method !== "milestone").map((i) => (
          <div key={i.code} className="card">
            <h3><Link href={`/indicators/${i.code}`}>{i.title}</Link></h3>
            <SeriesChart ind={i} />
            <p className="small" style={{ margin: 0 }}><Link href={`/indicators/${i.code}`}>View data table, definition and sources</Link></p>
          </div>
        ))}
      </div>

      <h2>Published reports</h2>
      <Table caption="Internal reports (immutable snapshots)">
        <thead>
          <tr><th scope="col">Report</th><th scope="col" className="num">Version</th><th scope="col">Data as of</th><th scope="col">Published</th><th scope="col">State</th></tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id}>
              <td>{r.title}<div className="small muted">{r.id}</div></td>
              <td className="num">v{r.version}</td>
              <td className="nowrap">{r.asOf}</td>
              <td className="nowrap">{fmtDate(r.published)}</td>
              <td><StatusTag status={r.state === "Superseded" ? "Superseded" : "Published"} label={r.state} /></td>
            </tr>
          ))}
        </tbody>
      </Table>
      <p className="small muted">
        A published report keeps its original values, targets and definitions. Corrections create a superseding version; older versions stay readable
        with a notice.
      </p>
    </>
  );
}
