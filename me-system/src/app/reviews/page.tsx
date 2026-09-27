import type { Metadata } from "next";
import Link from "next/link";
import { LiveNote } from "@/components/LiveNote";
import { PageHead, StatusTag } from "@/components/ui";
import { stateLabel } from "@/lib/access";
import { getMinistry } from "@/lib/cashew";
import { getLive, listSubmissions, localDate } from "@/lib/live";
import { qualityFlags, submissions } from "@/lib/workflow";

export const metadata: Metadata = { title: "Reviews" };
export const dynamic = "force-dynamic";

interface Item {
  id: string;
  year: number;
  ministry: string;
  state: string;
  submitted: string;
  indicators: number;
  blocking: number;
  warnings: number;
  illustrative: boolean;
  note: string;
}

export default async function ReviewsPage() {
  const live = await getLive();
  let items: Item[];
  if (live) {
    const rows = live.account ? await listSubmissions(live) : [];
    items = rows.map((s) => ({
      id: s.code,
      year: s.year,
      ministry: s.ministry_short,
      state: stateLabel(s.revision_state ?? s.state),
      submitted: localDate(s.submitted_at),
      indicators: s.assigned,
      blocking: s.blocking,
      warnings: s.warnings,
      illustrative: s.is_illustrative,
      note: s.revision_no && s.revision_no > 1 ? `revision ${s.revision_no}` : "",
    }));
  } else {
    items = submissions.map((s) => {
      const f = qualityFlags(s);
      return {
        id: s.id,
        year: s.year,
        ministry: getMinistry(s.ministry)?.short ?? s.ministry,
        state: s.state,
        submitted: s.submitted,
        indicators: s.rows.length,
        blocking: f.filter((x) => x.level === "blocking").length,
        warnings: f.filter((x) => x.level === "warning").length,
        illustrative: s.illustrative,
        note: s.returnReason ?? "",
      };
    });
  }
  const queue = items.filter((s) => s.state === "Submitted" || s.state === "In review");
  const returned = items.filter((s) => s.state === "Returned");
  const drafts = items.filter((s) => s.state === "Draft");
  const approved = items.filter((s) => s.state === "Approved");
  return (
    <>
      <PageHead caption="UI-10 · MoC verification" title="Reviews" />
      <p className="lead">
        MoC checks each ministry submission in the two weeks after the deadline: reasonable progress, internal consistency, evidence sufficiency and
        assignment correctness. A reviewer cannot approve a submission they entered.
      </p>
      {live && <LiveNote noAccess={!live.account} />}
      <h2>Waiting for verification ({queue.length})</h2>
      {queue.length === 0 && <p className="muted">Nothing is waiting.</p>}
      <div className="grid grid--2">
        {queue.map((s) => (
          <article key={s.id} className="card card--purple">
            <p className="small muted" style={{ marginBottom: 4 }}>Reporting year {s.year} · {s.indicators} indicators · submitted {s.submitted}{s.note ? ` · ${s.note}` : ""}</p>
            <h3><Link href={`/reviews/${s.id}`}>Verify {s.ministry} ({s.id})</Link></h3>
            <p className="btn-row small" style={{ margin: 0 }}>
              <StatusTag status={s.state} />
              {s.illustrative && <StatusTag status="Illustrative" />}
              <span>{s.blocking} blocking, {s.warnings} warnings</span>
            </p>
          </article>
        ))}
      </div>
      <h2>Returned for correction ({returned.length})</h2>
      {returned.length === 0 ? <p className="muted">None.</p> : (
        <ul>
          {returned.map((s) => (
            <li key={s.id}>
              <Link href={`/reviews/${s.id}`}>{s.id}</Link> <StatusTag status="Returned" /> {s.illustrative && <StatusTag status="Illustrative" />} <span className="small muted">{s.note}</span>
            </li>
          ))}
        </ul>
      )}
      {live && drafts.length > 0 && (
        <>
          <h2>Drafts not yet submitted ({drafts.length})</h2>
          <ul>{drafts.map((s) => <li key={s.id}><Link href={`/reviews/${s.id}`}>{s.id}</Link> <StatusTag status="Draft" /> <span className="small muted">{s.note}</span></li>)}</ul>
        </>
      )}
      <h2>Approved ({approved.length})</h2>
      <p className="small">Showing {Math.min(6, approved.length)}; see <Link href="/submissions">all submissions</Link>.</p>
      <ul>
        {approved.slice(0, 6).map((s) => (
          <li key={s.id}><Link href={`/reviews/${s.id}`}>{s.id}</Link> <StatusTag status="Approved" /></li>
        ))}
      </ul>
    </>
  );
}
