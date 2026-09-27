"use client";

import Link from "next/link";
import { useRole } from "./RoleProvider";
import { StatusTag } from "./ui";

export interface MinistryWork {
  short: string;
  name: string;
  completion: number | null;
  indicators: number;
  submissions: { id: string; state: string; illustrative: boolean }[];
}

/** "My work" card for roles without review rights: a focal point's ministry, or the Committee view. */
export function MyWork({ byMinistry }: { byMinistry: Record<string, MinistryWork> }) {
  const { role, ministry } = useRole();
  if (role === "focal") {
    const m = byMinistry[ministry];
    if (!m) return null;
    return (
      <section className="card card--accent" aria-labelledby="mywork-h">
        <h2 id="mywork-h" style={{ marginTop: 0, fontSize: "1.25rem" }}>Your ministry: {m.short}</h2>
        <p className="small muted">{m.name}</p>
        <ul>
          <li>{m.indicators} indicators to report once a year. Next deadline: <strong>31 March 2027</strong> (reporting year 2026).</li>
          <li>2025 completion: <strong>{m.completion === null ? "—" : `${Math.round(m.completion)}%`}</strong>. From 2026, &ldquo;largely achieved&rdquo; needs 70%.</li>
          {m.submissions.map((s) => (
            <li key={s.id}>
              <Link href={`/reviews/${s.id}`}>{s.id}</Link> <StatusTag status={s.state} /> {s.illustrative && <StatusTag status="Illustrative" />}
            </li>
          ))}
        </ul>
        <p className="btn-row" style={{ margin: 0 }}>
          <Link className="btn" href={`/collect/cashew-indicator-report?ministry=${ministry}`}>Fill {m.short} report</Link>
          <Link className="btn btn--secondary" href={`/programmes/${ministry}`}>{m.short} results</Link>
        </p>
      </section>
    );
  }
  return (
    <section className="card card--accent" aria-labelledby="mywork-h">
      <h2 id="mywork-h" style={{ marginTop: 0, fontSize: "1.25rem" }}>For the Committee</h2>
      <p>Approved figures only. Start with the one-page dashboard, then open any ministry for its detail.</p>
      <ul>
        <li><Link href="/reports/actions">Policy Actions Dashboard</Link>: status by cluster, ministry and action</li>
        <li><Link href="/programmes">Ministry programmes</Link>: each ministry&apos;s actions and indicators</li>
        <li><Link href="/reports/outcome">Outcome dashboard</Link>: sector change since 2022</li>
        <li><Link href="/reports/progress-2025">Progress report 2025 and MTR</Link></li>
      </ul>
    </section>
  );
}
