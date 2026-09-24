import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, Meta, PageHead, StatusTag, Table } from "@/components/ui";
import {
  actionByNo,
  actionStatus,
  actionsJoinedBy,
  actionsLedBy,
  clusterLabel,
  formatValue,
  getMinistry,
  indicatorsOfMinistry,
  ministries,
  ministryCompletion,
  ministryShort,
  pct,
  policy,
} from "@/lib/cashew";
import { submissions } from "@/lib/workflow";

export function generateStaticParams() {
  return ministries.map((m) => ({ code: m.code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return { title: `${getMinistry(code)?.short ?? code} programme` };
}

export default async function MinistryProgrammePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const m = getMinistry(code);
  if (!m) notFound();
  const led = actionsLedBy(code);
  const joined = actionsJoinedBy(code);
  const inds = indicatorsOfMinistry(code);
  const c = ministryCompletion(code);
  const subs = submissions.filter((s) => s.ministry === code);

  return (
    <>
      <Breadcrumbs items={[{ label: "Policy", href: `/policies/${policy.code}` }, { label: "Ministry programmes", href: "/programmes" }, { label: m.short }]} />
      <PageHead caption={`Programme · ${policy.name}`} title={`${m.name} (${m.short})`}>
        <Link className="btn" href={`/collect/cashew-indicator-report?ministry=${m.code}`}>Fill {m.short} report</Link>
      </PageHead>
      <p className="km muted" lang="km">{m.nameKm}</p>
      <Meta
        items={[
          ["Actions led", String(led.length)],
          ["Joint actions", String(joined.length)],
          ["Assigned indicators", String(inds.length)],
          ["2025 completion", pct(c.completion)],
        ]}
      />
      <p className="btn-row">
        <StatusTag status="Fully Achieved" label={`${c.fully} fully achieved`} />
        <StatusTag status="Largely Achieved" label={`${c.largely} largely achieved`} />
        <StatusTag status="Limited Progress" label={`${c.limited} limited progress`} />
      </p>

      <h2>Actions (projects)</h2>
      {led.length + joined.length === 0 ? (
        <p className="muted">No actions.</p>
      ) : (
        <Table caption={`Actions led or joined by ${m.short}`}>
          <thead>
            <tr><th scope="col">Action</th><th scope="col">Role</th><th scope="col">Cluster</th><th scope="col" className="num">2025 %</th><th scope="col">Status</th></tr>
          </thead>
          <tbody>
            {[...led, ...joined].map((a) => {
              const s = actionStatus(a);
              return (
                <tr key={a.code}>
                  <td><Link href={`/projects/${a.code}`}>Action {a.no}</Link><div className="small">{a.title.length > 110 ? a.title.slice(0, 110) + "…" : a.title}</div></td>
                  <td>{a.lead === code ? "Lead" : `Joint (lead: ${ministryShort(a.lead)})`}</td>
                  <td><span className={`chip chip--${a.cluster}`}>{clusterLabel[a.cluster]}</span></td>
                  <td className="num">{pct(a.y2025.avgCappedPct)}</td>
                  <td>{s && <StatusTag status={s} />}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <h2>Assigned indicators</h2>
      <Table caption={`${m.short} indicators: 2027 target and 2025 result`}>
        <thead>
          <tr><th scope="col">Indicator</th><th scope="col">Action</th><th scope="col">2027 target</th><th scope="col" className="num">2025 value</th><th scope="col" className="num">% of target</th><th scope="col">Status</th></tr>
        </thead>
        <tbody>
          {inds.map((i) => (
            <tr key={i.id}>
              <td><Link href={`/indicators/${i.code}`}>{i.code}</Link><div className="small">{i.label.length > 100 ? i.label.slice(0, 100) + "…" : i.label}</div></td>
              <td><Link href={`/projects/${actionByNo(i.action)!.code}`}>{i.action}</Link></td>
              <td className="small">{i.targetText}</td>
              <td className="num">{formatValue(i)}</td>
              <td className="num">{pct(i.y2025.actualPct)}</td>
              <td>{i.y2025.status && <StatusTag status={i.y2025.status} />}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <h2>Reporting</h2>
      <ul>
        {subs.map((s) => (
          <li key={s.id}>
            <Link href={`/reviews/${s.id}`}>{s.id}</Link> <StatusTag status={s.state} /> {s.illustrative && <StatusTag status="Illustrative" />}
          </li>
        ))}
        <li>
          Kobo section <code>grp_{m.code}</code>: shown only when the respondent selects {m.short}.{" "}
          <Link href="/forms/cashew-indicator-report">View form structure</Link>
        </li>
      </ul>
    </>
  );
}
