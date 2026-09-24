import Link from "next/link";
import { IndicatorCard } from "@/components/IndicatorCard";
import { fmtDate, PageHead, StatusTag, Table } from "@/components/ui";
import { getIndicator, indicators, obligations, orgName, submissions, workspace } from "@/lib/data";

export default function OverviewPage() {
  const reviewQueue = submissions.filter((s) => s.state === "Submitted" || s.state === "In review");
  const returned = submissions.filter((s) => s.state === "Returned");
  const overdue = obligations.filter((o) => o.state === "Overdue");
  const due = obligations.filter((o) => o.state === "Due");
  const headline = indicators.filter((i) => ["IND-02", "IND-03", "IND-04"].includes(i.code));

  return (
    <>
      <PageHead caption={`${workspace.name} · Current period ${workspace.currentPeriod}`} title="Overview">
        <Link className="btn" href="/collect/FRM-ACT">Submit a report</Link>
        <Link className="btn btn--secondary" href="/reports">Open dashboard</Link>
      </PageHead>

      <p className="lead">
        Your tasks come first. Headline figures below show <strong>approved</strong> values only, with their period, target and coverage.
      </p>

      <h2 className="visually-hidden">My tasks</h2>
      <div className="grid grid--4" style={{ marginBottom: 24 }}>
        <Link href="/reviews" className="card card--link card--accent" style={{ textDecoration: "none", color: "inherit" }}>
          <p className="stat">{reviewQueue.length}</p>
          <p style={{ margin: 0 }}>Reviews waiting for you</p>
        </Link>
        <Link href="/submissions" className="card card--link card--accent" style={{ textDecoration: "none", color: "inherit", borderTopColor: "var(--orange)" }}>
          <p className="stat">{returned.length}</p>
          <p style={{ margin: 0 }}>Returned for correction</p>
        </Link>
        <a href="#obligations" className="card card--link card--accent" style={{ textDecoration: "none", color: "inherit", borderTopColor: "var(--red)" }}>
          <p className="stat">{overdue.length}</p>
          <p style={{ margin: 0 }}>Overdue reports</p>
        </a>
        <a href="#obligations" className="card card--link card--accent" style={{ textDecoration: "none", color: "inherit", borderTopColor: "var(--teal)" }}>
          <p className="stat">{due.length}</p>
          <p style={{ margin: 0 }}>Reports due 15 Oct 2026</p>
        </a>
      </div>

      {overdue.length > 0 && (
        <div className="notice notice--error" role="status">
          <p>
            <strong>{overdue.length} report overdue:</strong>{" "}
            {overdue.map((o) => `${getIndicator(o.indicator)?.title} (${o.period}, ${orgName(o.org)})`).join("; ")}.
          </p>
        </div>
      )}

      <h2 id="obligations">Reporting obligations</h2>
      <Table caption="Reporting obligations by period">
        <thead>
          <tr>
            <th scope="col">Indicator</th>
            <th scope="col">Period</th>
            <th scope="col">Responsible</th>
            <th scope="col">Due</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {obligations.map((o) => (
            <tr key={o.id}>
              <td>
                <Link href={`/indicators/${o.indicator}`}>{getIndicator(o.indicator)?.title}</Link>
                {o.reason && <div className="small muted">Waiver reason: {o.reason}</div>}
              </td>
              <td className="nowrap">{o.period}</td>
              <td>{orgName(o.org)}</td>
              <td className="nowrap">{fmtDate(o.due)}</td>
              <td><StatusTag status={o.state} /></td>
            </tr>
          ))}
        </tbody>
      </Table>

      <h2>Approved headline indicators</h2>
      <div className="grid grid--3">
        {headline.map((i) => (
          <IndicatorCard key={i.code} ind={i} />
        ))}
      </div>

      <h2>How a figure reaches this page</h2>
      <ol className="flow">
        <li>Define indicator</li>
        <li>Assign obligation</li>
        <li>Collect with evidence</li>
        <li>Review and return or approve</li>
        <li>Calculate observation</li>
        <li>Compare with target</li>
        <li>Freeze report</li>
      </ol>
      <p className="small muted">
        A monitoring dashboard does not establish causal impact. Attribution needs an appropriate evaluation method.
      </p>
    </>
  );
}
