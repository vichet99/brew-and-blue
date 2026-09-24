import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, StatusTag } from "@/components/ui";
import { forms, submissions } from "@/lib/data";

export const metadata: Metadata = { title: "Reviews" };

export default function ReviewsPage() {
  const queue = submissions.filter((s) => s.state === "Submitted" || s.state === "In review");
  const recent = submissions.filter((s) => !queue.includes(s) && s.state !== "Draft");
  return (
    <>
      <PageHead caption="UI-10" title="Reviews" />
      <p className="lead">Submissions assigned to you as M&E reviewer. You cannot approve your own submission.</p>
      <h2>Waiting for review ({queue.length})</h2>
      <div className="grid grid--2">
        {queue.map((s) => (
          <article key={s.id} className="card card--purple">
            <p className="small muted" style={{ marginBottom: 4 }}>{forms.find((f) => f.code === s.form)?.title} · {s.period} · revision {s.revision}</p>
            <h3><Link href={`/reviews/${s.id}`}>Review {s.id}</Link></h3>
            <p className="small">From {s.owner}, {s.submitted}</p>
            <p className="btn-row small" style={{ margin: 0 }}>
              <StatusTag status={s.state} />
              {s.flags.map((f) => <StatusTag key={f} status="Returned" label={f} />)}
            </p>
          </article>
        ))}
      </div>
      <h2>Recently decided</h2>
      <ul>
        {recent.map((s) => (
          <li key={s.id}>
            <Link href={`/reviews/${s.id}`}>{s.id}</Link> <StatusTag status={s.state} /> <span className="small muted">{s.returnReason}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
