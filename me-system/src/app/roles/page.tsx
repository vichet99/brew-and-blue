import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, Table } from "@/components/ui";
import { can, ROLES, type Permission } from "@/lib/roles";

export const metadata: Metadata = { title: "Roles and access" };

const matrix: { perm: Permission; label: string }[] = [
  { perm: "view_dashboards", label: "See approved dashboards: policy totals and each ministry's detail" },
  { perm: "view_forms", label: "See data forms and questions" },
  { perm: "submit_report", label: "Fill and submit the annual ministry report" },
  { perm: "view_own_submissions", label: "See own ministry's submissions and queries" },
  { perm: "view_all_submissions", label: "See all ministries' submissions" },
  { perm: "view_drafts", label: "See drafts and returned submissions" },
  { perm: "view_evidence", label: "Open evidence files" },
  { perm: "review", label: "Verify, return, approve or reject submissions" },
  { perm: "publish_reports", label: "Publish reports" },
  { perm: "open_close_cycle", label: "Open and close the reporting cycle" },
  { perm: "manage_setup", label: "Set up actions, indicators, targets, thresholds and forms" },
  { perm: "manage_users", label: "Invite, deactivate and assign users" },
];

export default function RolesPage() {
  return (
    <>
      <PageHead caption="Help · pilot decision, 26 Sep 2026" title="Roles and access" />
      <p className="lead">Four roles for the pilot. Use &ldquo;Viewing as&rdquo; at the top of the page (or in the menu on a phone) to see the site as each role.</p>

      <div className="grid grid--2">
        {ROLES.map((r) => (
          <article key={r.id} className="card card--accent">
            <p className="small muted" style={{ marginBottom: 4 }}>{r.who}</p>
            <h2 style={{ marginTop: 0, fontSize: "1.25rem" }}>{r.name}</h2>
            <p>{r.summary}</p>
            <p className="small" style={{ marginBottom: 4 }}><strong>Scope:</strong> {r.scope}</p>
            <p className="small" style={{ marginBottom: 0 }}><strong>Cannot:</strong> {r.cannot.join("; ")}.</p>
          </article>
        ))}
      </div>

      <h2>Who can do what</h2>
      <Table caption="Permissions by role">
        <thead>
          <tr>
            <th scope="col">Permission</th>
            {ROLES.map((r) => <th key={r.id} scope="col">{r.name}</th>)}
          </tr>
        </thead>
        <tbody>
          {matrix.map((m) => (
            <tr key={m.perm}>
              <td>{m.label}</td>
              {ROLES.map((r) => (
                <td key={r.id}>{can(r.id, m.perm) ? <span className="tag tag--green">Yes</span> : <span className="muted">No</span>}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>

      <h2>Rules that always apply</h2>
      <ul>
        <li><strong>One person may hold Administrator and Reviewer.</strong> The Secretariat lead can set up, review and publish.</li>
        <li><strong>Nobody approves a submission they entered themselves</strong>, including the Administrator. Another reviewer must decide.</li>
        <li><strong>The Committee sees both levels:</strong> policy-level totals and each ministry&apos;s detail, approved figures only. Drafts, raw submissions and evidence files stay with the M&amp;E team.</li>
        <li><strong>A focal point works only for their own ministry.</strong> They see approved dashboards for everyone, but only their own ministry&apos;s submissions.</li>
        <li><strong>People are deactivated, not deleted,</strong> so past submissions keep their author.</li>
      </ul>

      <h2>Added later</h2>
      <ul>
        <li><strong>Data collector</strong>: processor staff who fill the outcome survey (when the processor survey goes live).</li>
        <li><strong>Partner viewer</strong>: development partners who read published reports only.</li>
      </ul>
      <p className="small muted">
        Prototype: the role is simulated and remembered in this browser only. In the real system, sign-in decides the role and every page, file and
        export is checked on the server. See also <Link href="/sitemap">the sitemap</Link>.
      </p>
    </>
  );
}
