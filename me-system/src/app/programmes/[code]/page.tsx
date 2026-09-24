import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IndicatorCard } from "@/components/IndicatorCard";
import { Breadcrumbs, fmtDate, Meta, PageHead, StatusTag, Table } from "@/components/ui";
import {
  contributingProjects,
  getIndicator,
  getPolicy,
  getProgramme,
  indicators,
  obligations,
  orgName,
  programmes,
  projectsOf,
} from "@/lib/data";

export function generateStaticParams() {
  return programmes.map((p) => ({ code: p.code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return { title: getProgramme(code)?.name ?? "Programme" };
}

export default async function ProgrammePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const prg = getProgramme(code);
  if (!prg) notFound();
  const policy = getPolicy(prg.policy);
  const owned = projectsOf(prg.code);
  const contributing = contributingProjects(prg.code);
  const inds = indicators.filter((i) => owned.some((p) => p.code === i.project));
  const obs = obligations.filter((o) => inds.some((i) => i.code === o.indicator));

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Policies and programmes", href: "/policies" },
          { label: policy?.code ?? prg.policy, href: `/policies/${prg.policy}` },
          { label: prg.code },
        ]}
      />
      <PageHead caption={`${prg.code} · Programme`} title={prg.name}>
        <Link className="btn btn--secondary" href="/reports">Reports</Link>
      </PageHead>
      <Meta
        items={[
          ["Status", <StatusTag key="s" status={prg.status} />],
          ["Owning policy", policy ? <Link key="p" href={`/policies/${policy.code}`}>{policy.name}</Link> : prg.policy],
          ["Period", `${fmtDate(prg.start)} – ${fmtDate(prg.end)}`],
          ["Manager", prg.manager],
        ]}
      />
      <p className="lead">{prg.description}</p>

      <h2>Projects</h2>
      <Table caption="Owned and contributing projects">
        <thead>
          <tr>
            <th scope="col">Project</th>
            <th scope="col">Relationship</th>
            <th scope="col">Implementer</th>
            <th scope="col">Period</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {owned.map((p) => (
            <tr key={p.code}>
              <td><Link href={`/projects/${p.code}`}>{p.name}</Link> <span className="small muted">{p.code}</span></td>
              <td>Owned</td>
              <td>{orgName(p.owner)}</td>
              <td className="nowrap">{fmtDate(p.start)} – {fmtDate(p.end)}</td>
              <td><StatusTag status={p.status} /></td>
            </tr>
          ))}
          {contributing.map((p) => (
            <tr key={p.code}>
              <td><Link href={`/projects/${p.code}`}>{p.name}</Link> <span className="small muted">{p.code}</span></td>
              <td>
                Contributes (owned by {p.programme})
                <div className="small muted">{p.contributesTo.find((c) => c.programme === prg.code)?.rationale}</div>
              </td>
              <td>{orgName(p.owner)}</td>
              <td className="nowrap">{fmtDate(p.start)} – {fmtDate(p.end)}</td>
              <td><StatusTag status={p.status} /></td>
            </tr>
          ))}
        </tbody>
      </Table>
      <p className="small muted">Portfolio totals use ownership only. Contributing projects are listed but not counted twice.</p>

      <h2>Results</h2>
      {inds.length === 0 ? (
        <div className="notice"><p>No indicators yet. Projects in this programme start in October 2026.</p></div>
      ) : (
        <div className="grid grid--3">
          {inds.map((i) => (
            <IndicatorCard key={i.code} ind={i} />
          ))}
        </div>
      )}

      {obs.length > 0 && (
        <>
          <h2>Reporting obligations</h2>
          <Table caption="Obligations for this programme's indicators">
            <thead>
              <tr><th scope="col">Indicator</th><th scope="col">Period</th><th scope="col">Responsible</th><th scope="col">Status</th></tr>
            </thead>
            <tbody>
              {obs.map((o) => (
                <tr key={o.id}>
                  <td>{getIndicator(o.indicator)?.title}</td>
                  <td>{o.period}</td>
                  <td>{orgName(o.org)}</td>
                  <td><StatusTag status={o.state} /></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </>
  );
}
