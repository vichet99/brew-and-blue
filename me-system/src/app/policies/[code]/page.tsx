import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, fmtDate, LevelTag, Meta, PageHead, StatusTag, Table } from "@/components/ui";
import { getPolicy, indicators, members, orgName, policies, programmes, programmesOf, projectsOf, results } from "@/lib/data";

export function generateStaticParams() {
  return policies.map((p) => ({ code: p.code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return { title: getPolicy(code)?.name ?? "Policy" };
}

export default async function PolicyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const pol = getPolicy(code);
  if (!pol) notFound();
  const owned = programmesOf(pol.code);
  const contributing = programmes.filter((p) => p.contributesTo.some((c) => c.policy === pol.code));
  const impact = results.filter((r) => r.owner === pol.code);
  const outcomeInds = indicators.filter((i) => i.level === "outcome");
  const access = members.filter((m) => m.scope === pol.code || m.scope === "Workspace");

  return (
    <>
      <Breadcrumbs items={[{ label: "Policies and programmes", href: "/policies" }, { label: pol.code }]} />
      <PageHead caption={`${pol.code} · Policy`} title={pol.name}>
        <Link className="btn btn--secondary" href="/reports">Policy dashboard</Link>
      </PageHead>
      <Meta
        items={[
          ["Status", <StatusTag key="s" status={pol.status} />],
          ["Period", `${fmtDate(pol.start)} – ${fmtDate(pol.end)}`],
          ["Responsible organisation", orgName(pol.owner)],
          ["Accountable person", pol.accountable],
        ]}
      />
      <p className="lead">{pol.description}</p>

      <h2>Objectives</h2>
      <ol>
        {pol.objectives.map((o) => (
          <li key={o.code}>
            <strong>{o.code}</strong> {o.text}
          </li>
        ))}
      </ol>

      <h2>Programmes</h2>
      <div className="grid grid--2">
        {owned.map((p) => (
          <article key={p.code} className="card card--accent">
            <p className="small muted" style={{ marginBottom: 4 }}>{p.code} · Owned programme</p>
            <h3><Link href={`/programmes/${p.code}`}>{p.name}</Link></h3>
            <p className="small">{p.description}</p>
            <p className="small" style={{ margin: 0 }}>
              {projectsOf(p.code).length} owned projects · <StatusTag status={p.status} />
            </p>
          </article>
        ))}
      </div>

      <h2>Contribution links</h2>
      {contributing.length === 0 ? (
        <p className="muted">No additional contribution links.</p>
      ) : (
        <ul>
          {contributing.flatMap((p) =>
            p.contributesTo
              .filter((c) => c.policy === pol.code)
              .map((c) => (
                <li key={p.code + c.objective}>
                  <Link href={`/programmes/${p.code}`}>{p.name}</Link> contributes to <strong>{c.objective}</strong>: {c.rationale}
                </li>
              )),
          )}
        </ul>
      )}
      <p className="small muted">A contribution link explains a pathway. It does not add numbers to policy totals and does not grant access to records.</p>

      <h2>Impact results</h2>
      {impact.map((r) => (
        <p key={r.code}>
          <LevelTag level={r.level} /> <strong>{r.code}</strong> {r.statement}
          {r.assumptions && <span className="small muted"> · Assumption: {r.assumptions}</span>}
        </p>
      ))}
      <p>
        <Link href="/results">View the full results framework</Link>
      </p>

      <h2>Outcome indicators</h2>
      <ul>
        {outcomeInds.map((i) => (
          <li key={i.code}>
            <Link href={`/indicators/${i.code}`}>{i.title}</Link> <span className="muted small">({i.code}, {i.unit})</span>
          </li>
        ))}
      </ul>

      <h2>Who can see this policy</h2>
      <Table caption="Access to this policy">
        <thead>
          <tr><th scope="col">Person</th><th scope="col">Role</th><th scope="col">Scope</th></tr>
        </thead>
        <tbody>
          {access.map((m) => (
            <tr key={m.email}><td>{m.name}</td><td>{m.role}</td><td>{m.scope}</td></tr>
          ))}
        </tbody>
      </Table>
      <p className="small muted">Access to policy-level aggregates does not include access to submission-level or personal data.</p>
    </>
  );
}
