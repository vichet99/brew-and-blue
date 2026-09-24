import type { Metadata } from "next";
import { PageHead, StatusTag, Table } from "@/components/ui";
import { auditEvents, members, orgName, organisations } from "@/lib/data";

export const metadata: Metadata = { title: "Administration" };

export default function AdminPage() {
  return (
    <>
      <PageHead caption="UI-12 · Workspace administrator" title="Administration">
        <button className="btn" type="button" disabled title="Invitations arrive with authentication in M2">Invite member (M2)</button>
      </PageHead>
      <p className="lead">
        Access is granted per role and scope. Administrators manage access but have no automatic right to approve data.
      </p>

      <h2>Members and grants</h2>
      <Table caption="Members">
        <thead>
          <tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Organisation</th><th scope="col">Role</th><th scope="col">Scope</th><th scope="col">Status</th></tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.email}>
              <td>{m.name}</td>
              <td>{m.email}</td>
              <td>{orgName(m.org)}</td>
              <td>{m.role}</td>
              <td>{m.scope}</td>
              <td><StatusTag status={m.status} /></td>
            </tr>
          ))}
        </tbody>
      </Table>
      <p className="small muted">Deactivating a member stops future access but keeps their authorship on historic records.</p>

      <h2>Organisations</h2>
      <Table caption="Organisations in this workspace">
        <thead><tr><th scope="col">Code</th><th scope="col">Name</th><th scope="col">Type</th></tr></thead>
        <tbody>
          {organisations.map((o) => (
            <tr key={o.code}><td>{o.code}</td><td>{o.name}</td><td>{o.type}</td></tr>
          ))}
        </tbody>
      </Table>

      <h2>Audit trail</h2>
      <Table caption="Recent audit events (append-only)">
        <thead><tr><th scope="col">Time</th><th scope="col">Actor</th><th scope="col">Action</th><th scope="col">Resource</th></tr></thead>
        <tbody>
          {auditEvents.map((e) => (
            <tr key={e.at + e.action}><td className="nowrap">{e.at}</td><td>{e.actor}</td><td><code>{e.action}</code></td><td>{e.resource}</td></tr>
          ))}
        </tbody>
      </Table>

      <h2>Integration health</h2>
      <div className="notice"><p>Kobo integration is planned for release R2. No connectors are configured.</p></div>

      <h2>Pilot settings</h2>
      <ul>
        <li>Evidence: up to 5 files per submission, 10 MB each (configurable).</li>
        <li>Self-approval: disabled.</li>
        <li>Backups: database and evidence files backed up separately (to be configured in M6/M7).</li>
      </ul>
    </>
  );
}
