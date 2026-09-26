import type { Metadata } from "next";
import Link from "next/link";
import { fmtDate, PageHead, StatusTag } from "@/components/ui";
import { actionCounts, actions, actionIndicators, ministries, outcomeIndicators, pct, policy } from "@/lib/cashew";

export const metadata: Metadata = { title: "Policies" };

export default function PoliciesPage() {
  const c = actionCounts(actions);
  return (
    <>
      <PageHead caption="Portfolio" title="Policies" />
      <p className="lead">This example workspace holds one policy. Each ministry has one programme; each policy action is one project.</p>
      <article className="card card--accent" style={{ borderTopColor: "var(--blue-shade-50)" }}>
        <p className="small muted" style={{ marginBottom: 4 }}>
          {policy.code} · Approved {fmtDate(policy.approved)} by the {policy.approvedBy}
        </p>
        <h2 style={{ marginTop: 0 }}>
          <Link href={`/policies/${policy.code}`}>{policy.name}</Link>
        </h2>
        <p>{policy.vision}</p>
        <p className="btn-row small" style={{ margin: 0 }}>
          <StatusTag status="active" />
          <span>{ministries.length} ministry programmes</span>
          <span>{actions.length} actions</span>
          <span>{actionIndicators.length} action indicators</span>
          <span>{outcomeIndicators.length} outcome indicators</span>
          <span>2025 completion {pct(c.completion)}</span>
        </p>
      </article>
    </>
  );
}
