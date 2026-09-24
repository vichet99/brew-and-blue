import type { Metadata } from "next";
import Link from "next/link";
import { fmtDate, PageHead, StatusTag, Table } from "@/components/ui";
import { mtr } from "@/lib/cashew";
import { SnapshotButton } from "./SnapshotButton";

export const metadata: Metadata = { title: "Dashboards and reports" };

const cards = [
  { href: "/reports/actions", title: "Policy Actions Dashboard", level: "Action level", text: "44 actions and 108 indicators: status by cluster, ministry and action. Threshold what-if for 2026 and 2027." },
  { href: "/reports/outcome", title: "Outcome dashboard", level: "Outcome level", text: "13 sector indicators against 2022 with trend direction, charts and the top 10 export markets." },
  { href: "/reports/progress-2025", title: "Progress report 2025 and MTR", level: "Previous period", text: "Goal progress, action-by-action summaries, OECD-DAC findings and recommendations." },
];

export default function ReportsPage() {
  return (
    <>
      <PageHead caption="UI-11" title="Dashboards and reports">
        <SnapshotButton />
      </PageHead>
      <div className="grid grid--3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="card card--link card--accent" style={{ textDecoration: "none", color: "inherit" }}>
            <p className="small muted" style={{ marginBottom: 4 }}>{c.level}</p>
            <h2 style={{ marginTop: 0, fontSize: "1.25rem", color: "var(--link)", textDecoration: "underline" }}>{c.title}</h2>
            <p style={{ margin: 0 }}>{c.text}</p>
          </Link>
        ))}
      </div>

      <h2>Published reports</h2>
      <Table caption="Report versions (published reports are frozen snapshots)">
        <thead>
          <tr><th scope="col">Report</th><th scope="col">Data as of</th><th scope="col">Issued</th><th scope="col">State</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><Link href="/reports/actions">Policy Actions Dashboard, reporting year 2025</Link><div className="small muted">Action-Level workbook v5</div></td>
            <td>Kobo submissions for 2025</td><td className="nowrap">{fmtDate("2026-05-27")}</td><td><StatusTag status="Endorsed" /></td>
          </tr>
          <tr>
            <td><Link href="/reports/progress-2025">{mtr.title}</Link><div className="small muted">EU-German CAPSAFE and GATE support</div></td>
            <td>{mtr.asOf}</td><td className="nowrap">{fmtDate(mtr.date)}</td><td><StatusTag status="Final draft" /></td>
          </tr>
          <tr>
            <td><Link href="/reports/outcome">Outcome dashboard, 2022–2025</Link><div className="small muted">Outcome workbook v12</div></td>
            <td>MAFF, GDCE data to 2025; processor survey test rows</td><td className="nowrap">May 2026</td><td><StatusTag status="Published" /></td>
          </tr>
        </tbody>
      </Table>
      <p className="small muted">A correction to a published report creates a new version that supersedes it; the earlier version stays readable.</p>
    </>
  );
}
