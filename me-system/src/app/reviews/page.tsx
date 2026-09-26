import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, StatusTag } from "@/components/ui";
import { getMinistry } from "@/lib/cashew";
import { qualityFlags, submissions } from "@/lib/workflow";

export const metadata: Metadata = { title: "Reviews" };

export default function ReviewsPage() {
  const queue = submissions.filter((s) => s.state === "Submitted" || s.state === "In review");
  const returned = submissions.filter((s) => s.state === "Returned");
  const recent = submissions.filter((s) => s.state === "Approved").slice(0, 6);
  return (
    <>
      <PageHead caption="UI-10 · MoC verification" title="Reviews" />
      <p className="lead">
        MoC checks each ministry submission in the two weeks after the deadline: reasonable progress, internal consistency, evidence sufficiency and
        assignment correctness. A reviewer cannot approve a submission they entered.
      </p>
      <h2>Waiting for verification ({queue.length})</h2>
      <div className="grid grid--2">
        {queue.map((s) => {
          const f = qualityFlags(s);
          return (
            <article key={s.id} className="card card--purple">
              <p className="small muted" style={{ marginBottom: 4 }}>Reporting year {s.year} · {s.rows.length} indicators · submitted {s.submitted}</p>
              <h3><Link href={`/reviews/${s.id}`}>Verify {getMinistry(s.ministry)?.short} ({s.id})</Link></h3>
              <p className="btn-row small" style={{ margin: 0 }}>
                <StatusTag status={s.state} />
                {s.illustrative && <StatusTag status="Illustrative" />}
                <span>{f.filter((x) => x.level === "blocking").length} blocking, {f.filter((x) => x.level === "warning").length} warnings</span>
              </p>
            </article>
          );
        })}
      </div>
      <h2>Returned for correction ({returned.length})</h2>
      <ul>
        {returned.map((s) => (
          <li key={s.id}>
            <Link href={`/reviews/${s.id}`}>{s.id}</Link> <StatusTag status="Returned" /> {s.illustrative && <StatusTag status="Illustrative" />} <span className="small muted">{s.returnReason}</span>
          </li>
        ))}
      </ul>
      <h2>Approved (reporting year 2025)</h2>
      <p className="small">All 17 ministries. Showing 6; see <Link href="/submissions">all submissions</Link>.</p>
      <ul>
        {recent.map((s) => (
          <li key={s.id}><Link href={`/reviews/${s.id}`}>{s.id}</Link> <StatusTag status="Approved" /></li>
        ))}
      </ul>
    </>
  );
}
