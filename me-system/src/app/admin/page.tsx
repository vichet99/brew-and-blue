import type { Metadata } from "next";
import { PageHead, Table } from "@/components/ui";
import { dataNotes, indicatorsOfMinistry, ministries, policy, roles, thresholds } from "@/lib/cashew";

export const metadata: Metadata = { title: "Administration" };

const audit = [
  { at: "2026-05-27", actor: "M&E Secretariat", action: "report.published", resource: "Policy Actions Dashboard, RY2025" },
  { at: "2026-05-11", actor: "M&E Secretariat", action: "submission.approved ×17", resource: "RY2025 ministry submissions" },
  { at: "2026-05-11", actor: "M&E Secretariat", action: "submission.excluded", resource: "Admin test entry (excluded from official report)" },
  { at: "2026-05-12", actor: "M&E Secretariat", action: "form.published", resource: "CASHEW INDICATOR REPORT v2026051204" },
];

export default function AdminPage() {
  return (
    <>
      <PageHead caption="UI-12 · Workspace administrator" title="Administration">
        <button className="btn" type="button" disabled title="Invitations arrive with authentication in M2">Invite focal point (M2)</button>
      </PageHead>
      <p className="lead">Access follows the roles in the monitoring manual. A focal point sees and reports only their own ministry&apos;s indicators.</p>

      <h2>Roles</h2>
      <Table caption="Roles and what they can do">
        <thead><tr><th scope="col">Role</th><th scope="col">Duty (manual)</th><th scope="col">Platform role and scope</th></tr></thead>
        <tbody>
          {roles.map((r) => <tr key={r.role}><td><strong>{r.role}</strong></td><td>{r.duty}</td><td>{r.platformRole}</td></tr>)}
        </tbody>
      </Table>

      <h2>Organisations ({ministries.length + 1})</h2>
      <Table caption="Ministries and institutions">
        <thead><tr><th scope="col">Name</th><th scope="col">Code</th><th scope="col">ខ្មែរ</th><th scope="col" className="num">Indicators</th></tr></thead>
        <tbody>
          <tr><td>{policy.secretariat}</td><td>moc-sec</td><td /><td className="num">—</td></tr>
          {ministries.map((m) => (
            <tr key={m.code}><td>{m.name}</td><td><code>{m.code}</code></td><td className="km" lang="km">{m.nameKm}</td><td className="num">{indicatorsOfMinistry(m.code).length}</td></tr>
          ))}
        </tbody>
      </Table>
      <p className="small muted">Ministry codes are join keys for comparing years: rename a ministry, never change its code.</p>

      <h2>Status thresholds</h2>
      <Table caption="Thresholds by reporting year (editable by MoC)">
        <thead><tr><th scope="col">Year</th><th scope="col" className="num">Largely achieved from</th><th scope="col" className="num">Fully achieved from</th></tr></thead>
        <tbody>{thresholds.map((t) => <tr key={t.year}><td>{t.year}</td><td className="num">{t.largely}%</td><td className="num">{t.fully}%</td></tr>)}</tbody>
      </Table>

      <h2>Audit trail</h2>
      <Table caption="Recent audit events (append-only; reconstructed from the workbook record)">
        <thead><tr><th scope="col">Date</th><th scope="col">Actor</th><th scope="col">Action</th><th scope="col">Resource</th></tr></thead>
        <tbody>{audit.map((e) => <tr key={e.action + e.at}><td className="nowrap">{e.at}</td><td>{e.actor}</td><td><code>{e.action}</code></td><td>{e.resource}</td></tr>)}</tbody>
      </Table>

      <h2 id="sources">Data sources for this example</h2>
      <ul>
        <li>Cashew Dashboard &amp; Database, Action Level, v5 (15 May 2026)</li>
        <li>Outcome Dashboard v12</li>
        <li>CASHEW INDICATOR REPORT, Kobo XLSForm v10 (12 May 2026)</li>
        <li>Cashew Policy Monitoring System Manual v3 (May 2026)</li>
        <li>Mid-Term Review report, final draft (25 May 2026)</li>
      </ul>
      <p>
        The site reads <code>src/data/cashew.json</code>, generated from these files by <code>scripts/build_cashew_data.py</code>. It holds
        aggregates, indicator definitions, form questions and report text only; no respondent names or phone numbers.
      </p>
      <ul className="small">{dataNotes.map((n) => <li key={n}>{n}</li>)}</ul>
    </>
  );
}
