import Link from "next/link";
import { MyWork } from "@/components/MyWork";
import { RoleOnly } from "@/components/RoleProvider";
import { PageHead, StatusTag, Table } from "@/components/ui";
import {
  actionCounts,
  actions,
  calendar,
  dataNotes,
  indicatorsOfMinistry,
  ministries,
  ministryCompletion,
  mtr,
  pct,
  policy,
  thresholdFor,
} from "@/lib/cashew";
import { submissions } from "@/lib/workflow";

export default function OverviewPage() {
  const c = actionCounts(actions, 2025);
  const reviewQueue = submissions.filter((s) => s.state === "Submitted" || s.state === "In review");
  const returned = submissions.filter((s) => s.state === "Returned");
  const lowest = [...ministries]
    .map((m) => ({ m, c: ministryCompletion(m.code) }))
    .sort((a, b) => (a.c.completion ?? 0) - (b.c.completion ?? 0))
    .slice(0, 3);
  const byMinistry = Object.fromEntries(
    ministries.map((m) => [
      m.code,
      {
        short: m.short,
        name: m.name,
        completion: ministryCompletion(m.code).completion,
        indicators: indicatorsOfMinistry(m.code).length,
        submissions: submissions.filter((x) => x.ministry === m.code).map((x) => ({ id: x.id, state: x.state, illustrative: x.illustrative })),
      },
    ]),
  );
  const limited = actions.filter((a) => (a.y2025.avgCappedPct ?? 0) < thresholdFor(2025).largely);

  return (
    <>
      <PageHead caption={`${policy.name} · Example workspace`} title="Overview">
        <RoleOnly any={["submit_report"]}>
          <Link className="btn" href="/collect/cashew-indicator-report">Fill ministry report</Link>
        </RoleOnly>
        <Link className="btn btn--secondary" href="/reports/actions">Policy Actions Dashboard</Link>
      </PageHead>

      <p className="lead">
        The reporting year 2025 cycle is closed: 17 of 17 ministries reported, and the Committee endorsed the annual report in May 2026. The next cycle
        (reporting year 2026) opens in February 2027, and the threshold for &ldquo;largely achieved&rdquo; rises from 40% to 70%.
      </p>

      <h2 className="visually-hidden">Reporting year 2025 headline</h2>
      <div className="kpi-grid">
        <div className="kpi"><p className="stat">44</p><p>Policy actions</p></div>
        <div className="kpi kpi--fully"><p className="stat">{c.fully}</p><p><StatusTag status="Fully Achieved" /></p></div>
        <div className="kpi kpi--largely"><p className="stat">{c.largely}</p><p><StatusTag status="Largely Achieved" /></p></div>
        <div className="kpi kpi--limited"><p className="stat">{c.limited}</p><p><StatusTag status="Limited Progress" /></p></div>
        <div className="kpi"><p className="stat">{pct(c.completion)}</p><p>Completion rate (average % of 2027 targets, capped at 100)</p></div>
      </div>

      <div className="grid grid--2">
        <RoleOnly any={["review"]} fallback={<MyWork byMinistry={byMinistry} />}>
        <section className="card card--accent" aria-labelledby="tasks-h">
          <h2 id="tasks-h" style={{ marginTop: 0, fontSize: "1.25rem" }}>Tasks for the M&amp;E Secretariat</h2>
          <ul>
            <li>
              <Link href="/reviews">{reviewQueue.length} submission waiting for verification</Link> <StatusTag status="Illustrative" />
            </li>
            <li>
              {returned.length} returned to a ministry for correction <StatusTag status="Illustrative" />
            </li>
            <li>
              MTR next steps: {mtr.nextSteps[0].replace(/\.$/, "")}; {mtr.nextSteps[1].charAt(0).toLowerCase() + mtr.nextSteps[1].slice(1)}
            </li>
            <li>January 2027: re-deploy the Kobo form for reporting year 2026.</li>
          </ul>
        </section>
        </RoleOnly>
        <section className="card card--accent" style={{ borderTopColor: "var(--red)" }} aria-labelledby="attention-h">
          <h2 id="attention-h" style={{ marginTop: 0, fontSize: "1.25rem" }}>Needs attention</h2>
          <p className="small muted" style={{ marginBottom: 8 }}>Lowest ministry completion, 2025:</p>
          <ul>
            {lowest.map(({ m, c }) => (
              <li key={m.code}>
                <Link href={`/programmes/${m.code}`}>{m.name}</Link>: {pct(c.completion)}
              </li>
            ))}
          </ul>
          <p className="small muted" style={{ marginBottom: 8 }}>Actions with limited progress ({limited.length}):</p>
          <p className="small" style={{ margin: 0 }}>
            {limited.map((a, i) => (
              <span key={a.code}>
                {i > 0 && ", "}
                <Link href={`/projects/${a.code}`}>Action {a.no}</Link>
              </span>
            ))}
          </p>
        </section>
      </div>

      <h2>Annual reporting calendar</h2>
      <p>From the Cashew Policy Monitoring System Manual. One Kobo submission per ministry per year.</p>
      <Table caption="Annual cycle (next: reporting year 2026, submitted in 2027)">
        <thead>
          <tr><th scope="col">When</th><th scope="col">Activity</th><th scope="col">Owner</th></tr>
        </thead>
        <tbody>
          {calendar.map((r) => (
            <tr key={r.month}><td className="nowrap">{r.month}</td><td>{r.activity}</td><td>{r.owner}</td></tr>
          ))}
        </tbody>
      </Table>

      <h2>Data-quality gaps carried from 2025</h2>
      <div className="notice notice--warning">
        <ul>
          <li>No evidence files were recorded for any of the 108 indicators (the manual asks for one per indicator).</li>
          <li>Narratives were recorded as &ldquo;N/A&rdquo;. Action narratives in this site come from the MTR progress summaries instead.</li>
          <li>Processor-survey indicators (Q1, Q2, PR1, PR2, S2, S3) are still based on test rows.</li>
        </ul>
      </div>

      <h2>How the monitoring works</h2>
      <ol className="flow">
        <li>MoC sends Kobo link</li>
        <li>Ministries report values + evidence</li>
        <li>MoC verifies (2 weeks)</li>
        <li>Status by year threshold</li>
        <li>Dashboard + report</li>
        <li>Committee endorses</li>
      </ol>
      <details className="small">
        <summary>Where these numbers come from</summary>
        <ul>{dataNotes.map((n) => <li key={n}>{n}</li>)}</ul>
      </details>
    </>
  );
}
