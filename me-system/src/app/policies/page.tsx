import type { Metadata } from "next";
import Link from "next/link";
import { fmtDate, PageHead, StatusTag, Table } from "@/components/ui";
import { orgName, policies, programmes, projectsOf } from "@/lib/data";

export const metadata: Metadata = { title: "Policies and programmes" };

export default function PoliciesPage() {
  return (
    <>
      <PageHead caption="Portfolio" title="Policies and programmes">
        <button className="btn btn--secondary" type="button" disabled title="Creating records arrives in milestone M3">
          New policy (M3)
        </button>
      </PageHead>
      <p className="lead">A policy owns programmes. A programme owns projects. Contribution links show extra support without double-counting.</p>

      {policies.map((pol) => (
        <section key={pol.code} className="card card--accent" style={{ marginBottom: 24, borderTopColor: "var(--blue-shade-50)" }}>
          <p className="small muted" style={{ marginBottom: 4 }}>
            {pol.code} · Policy · {fmtDate(pol.start)} to {fmtDate(pol.end)}
          </p>
          <h2 style={{ marginTop: 0 }}>
            <Link href={`/policies/${pol.code}`}>{pol.name}</Link>
          </h2>
          <p>{pol.description}</p>
          <p className="small">
            <StatusTag status={pol.status} /> · Owner: {orgName(pol.owner)} · Accountable: {pol.accountable}
          </p>
        </section>
      ))}

      <Table caption="Programmes">
        <thead>
          <tr>
            <th scope="col">Code</th>
            <th scope="col">Programme</th>
            <th scope="col">Owning policy</th>
            <th scope="col">Owned projects</th>
            <th scope="col">Period</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {programmes.map((p) => (
            <tr key={p.code}>
              <td className="nowrap">{p.code}</td>
              <td><Link href={`/programmes/${p.code}`}>{p.name}</Link></td>
              <td>{p.policy}</td>
              <td className="num">{projectsOf(p.code).length}</td>
              <td className="nowrap">{fmtDate(p.start)} – {fmtDate(p.end)}</td>
              <td><StatusTag status={p.status} /></td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
