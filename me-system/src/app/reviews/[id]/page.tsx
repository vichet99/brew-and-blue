import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui";
import { actionIndicators, getMinistry, thresholdFor } from "@/lib/cashew";
import { getSubmission, qualityFlags, submissions } from "@/lib/workflow";
import { ReviewPanel } from "./ReviewPanel";

export function generateStaticParams() {
  return submissions.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Review ${id}` };
}

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = getSubmission(id);
  if (!s) notFound();
  const byId = new Map(actionIndicators.map((i) => [i.id, i]));
  const m = getMinistry(s.ministry)!;
  return (
    <>
      <Breadcrumbs items={[{ label: "Reviews", href: "/reviews" }, { label: s.id }]} />
      <ReviewPanel
        submission={{
          id: s.id,
          year: s.year,
          state: s.state,
          submitted: s.submitted,
          respondentRole: s.respondentRole,
          illustrative: s.illustrative,
          returnReason: s.returnReason ?? "",
          reviewNote: s.reviewNote ?? "",
          ministry: `${m.name} (${m.short})`,
          ministryShort: m.short,
        }}
        threshold={thresholdFor(s.year)}
        flags={qualityFlags(s)}
        rows={s.rows.map((r) => {
          const i = byId.get(r.indicator)!;
          return {
            id: i.id,
            code: i.code,
            action: i.action,
            label: i.label,
            target: i.targetText,
            method: i.method,
            prev: s.year > 2025 ? i.y2025.value : null,
            value: r.value,
            pct: r.pct,
            narrative: r.narrative,
            evidence: r.evidence,
            feedback: r.feedback ?? "",
          };
        })}
      />
    </>
  );
}
