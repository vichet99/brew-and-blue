import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KoboQuestions } from "@/components/KoboQuestions";
import { Tabs } from "@/components/Tabs";
import { Breadcrumbs, Meta, PageHead, StatusTag, Table } from "@/components/ui";
import {
  actionStatus,
  actions,
  clusterLabel,
  formatValue,
  getAction,
  getMinistry,
  indicatorsOfAction,
  ministryShort,
  mtr,
  pct,
  policy,
  statusFor,
} from "@/lib/cashew";

export function generateStaticParams() {
  return actions.map((a) => ({ code: a.code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const a = getAction(code);
  return { title: a ? `Action ${a.no}` : "Action" };
}

export default async function ActionPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const a = getAction(code);
  if (!a) notFound();
  const inds = indicatorsOfAction(a);
  const s = actionStatus(a);
  const lead = getMinistry(a.lead)!;
  const prev = actions.find((x) => x.no === a.no - 1);
  const next = actions.find((x) => x.no === a.no + 1);

  const overview = (
    <>
      <h2 style={{ marginTop: 0 }}>Progress summary (MTR, mid-2025)</h2>
      <div className="notice">
        <p>
          <strong>MTR progress: {a.mtrProgress || "not stated"}.</strong> {a.mtrSummary}
        </p>
        <p className="small muted">Source: {mtr.title}, {mtr.status.toLowerCase()} ({mtr.date}). Responsible institutions listed in the MTR: {a.responsible}.</p>
      </div>
      <h2>Indicators, 2027 targets and 2025 results</h2>
      <Table caption={`Indicators for action ${a.no}`}>
        <thead>
          <tr>
            <th scope="col">Indicator</th>
            <th scope="col">Reported by</th>
            <th scope="col">2027 target</th>
            <th scope="col" className="num">2025 value</th>
            <th scope="col" className="num">% of target</th>
            <th scope="col">2025 status</th>
            <th scope="col">Same % in 2027</th>
          </tr>
        </thead>
        <tbody>
          {inds.map((i) => {
            const in2027 = statusFor(i.y2025.cappedPct, 2027);
            return (
              <tr key={i.id}>
                <td><Link href={`/indicators/${i.code}`}>{i.code}</Link><div className="small">{i.label}</div></td>
                <td>{ministryShort(i.ministry)}</td>
                <td className="small">{i.targetText}</td>
                <td className="num">{formatValue(i)}</td>
                <td className="num">{pct(i.y2025.actualPct)}</td>
                <td>{i.y2025.status && <StatusTag status={i.y2025.status} />}</td>
                <td>{in2027 && <StatusTag status={in2027} />}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <p className="small muted">
        &ldquo;Same % in 2027&rdquo; applies the 2027 threshold (largely ≥ 90%) to today&apos;s value, to show how far each indicator still has to go.
        Values above 100% count as 100% for status.
      </p>
    </>
  );

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Policy actions", href: "/projects" },
          { label: `${lead.short} programme`, href: `/programmes/${lead.code}` },
          { label: `Action ${a.no}` },
        ]}
      />
      <PageHead caption={`${a.code} · ${clusterLabel[a.cluster]} cluster · ${policy.name}`} title={`Action ${a.no}`}>
        <Link className="btn" href={`/collect/cashew-indicator-report?ministry=${a.lead}`}>Report on this action</Link>
      </PageHead>
      <p className="lead">{a.title}</p>
      <Meta
        items={[
          ["Lead ministry", <Link key="l" href={`/programmes/${lead.code}`}>{lead.name}</Link>],
          ["Contributing", a.ministries.length > 1 ? a.ministries.slice(1).map(ministryShort).join(", ") : "None"],
          ["2025 completion", pct(a.y2025.avgCappedPct)],
          ["2025 status", s ? <StatusTag key="s" status={s} /> : "No data"],
        ]}
      />
      <Tabs
        tabs={[
          { label: "Overview", content: overview },
          { label: `Kobo questions (${inds.length})`, content: <KoboQuestions indicators={inds} /> },
        ]}
      />
      <nav className="btn-row" aria-label="Previous and next action" style={{ marginTop: 24, justifyContent: "space-between" }}>
        {prev ? <Link href={`/projects/${prev.code}`}>← Action {prev.no}</Link> : <span />}
        {next ? <Link href={`/projects/${next.code}`}>Action {next.no} →</Link> : <span />}
      </nav>
    </>
  );
}
