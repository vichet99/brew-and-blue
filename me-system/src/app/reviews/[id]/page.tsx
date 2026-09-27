import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveNote } from "@/components/LiveNote";
import { Breadcrumbs } from "@/components/ui";
import { stateLabel } from "@/lib/access";
import { actionIndicators, getMinistry, indicatorsOfMinistry, thresholdFor } from "@/lib/cashew";
import { getAnswers, getLive, getSubmission as getLiveSubmission, localDate } from "@/lib/live";
import { getSubmission, qualityFlags } from "@/lib/workflow";
import { ReviewPanel, type LiveReview } from "./ReviewPanel";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Review ${id}` };
}

async function LiveReviewPage({ code }: { code: string }) {
  const live = (await getLive())!;
  if (!live.account) return <LiveNote noAccess />;
  const s = await getLiveSubmission(live, code);
  if (!s || !s.revision_id) notFound();
  const m = getMinistry(s.ministry_code)!;
  const [answers, flags, history] = await Promise.all([
    getAnswers(live, s.revision_id),
    live.supabase.from("quality_flags").select("level, message").eq("revision_id", s.revision_id).eq("status", "open").order("level"),
    live.supabase.from("review_history").select("action, reason, created_at, actor_name, revision_no").eq("submission_id", s.submission_id).order("created_at", { ascending: false }),
  ]);
  const byId = new Map(answers.map((a) => [a.external_id, a]));
  const returned = (history.data ?? []).find((h) => h.action === "returned");
  const liveInfo: LiveReview = {
    code: s.code,
    revisionId: s.revision_id,
    revisionNo: s.revision_no ?? 1,
    enteredByMe: s.entered_by_me,
    history: (history.data ?? []).map((h) => ({
      when: new Date(h.created_at).toLocaleString("en-GB", { timeZone: "Asia/Phnom_Penh", dateStyle: "medium", timeStyle: "short" }),
      action: h.action as string,
      reason: (h.reason as string) ?? "",
      who: (h.actor_name as string) ?? "",
      revision: h.revision_no as number,
    })),
  };
  return (
    <>
      <Breadcrumbs items={[{ label: "Reviews", href: "/reviews" }, { label: s.code }]} />
      <LiveNote />
      <ReviewPanel
        live={liveInfo}
        submission={{
          id: s.code,
          year: s.year,
          state: stateLabel(s.revision_state),
          submitted: localDate(s.submitted_at),
          respondentRole: `revision ${s.revision_no}`,
          illustrative: s.is_illustrative,
          returnReason: s.revision_state === "returned" && returned ? String(returned.reason ?? "") : "",
          reviewNote: "",
          ministry: `${m.name} (${m.short})`,
          ministryShort: m.short,
          ministryCode: m.code,
        }}
        threshold={thresholdFor(s.year)}
        flags={(flags.data ?? []).map((f) => ({ level: f.level as string, text: f.message as string }))}
        rows={indicatorsOfMinistry(m.code).map((i) => {
          const a = byId.get(i.id);
          return {
            id: i.id,
            code: i.code,
            action: i.action,
            label: i.label,
            target: i.targetText,
            method: i.method,
            prev: s.year > 2025 ? i.y2025.value : null,
            value: a ? a.value_number ?? a.value_choice : null,
            pct: a?.pct_of_target ?? null,
            narrative: a?.narrative ?? "",
            evidence: a?.evidence ?? null,
            feedback: a?.challenges ?? "",
          };
        })}
      />
    </>
  );
}

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (await getLive()) return <LiveReviewPage code={decodeURIComponent(id)} />;

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
          ministryCode: m.code,
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
