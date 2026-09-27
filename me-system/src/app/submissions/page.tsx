import type { Metadata } from "next";
import { LiveNote } from "@/components/LiveNote";
import { PageHead } from "@/components/ui";
import { stateLabel } from "@/lib/access";
import { ministryShort } from "@/lib/cashew";
import { getLive, listSubmissions, localDate } from "@/lib/live";
import { qualityFlags, submissions } from "@/lib/workflow";
import { SubmissionTable } from "./SubmissionTable";

export const metadata: Metadata = { title: "Submissions" };
export const dynamic = "force-dynamic";

function demoRows() {
  return submissions.map((s) => {
    const flags = qualityFlags(s);
    return {
      id: s.id,
      year: s.year,
      ministry: ministryShort(s.ministry),
      ministryCode: s.ministry,
      state: s.state,
      submitted: s.submitted,
      indicators: s.rows.length,
      reported: s.rows.filter((r) => r.value !== null && r.value !== "").length,
      evidence: s.rows.filter((r) => r.evidence).length,
      blocking: flags.filter((f) => f.level === "blocking").length,
      warnings: flags.filter((f) => f.level === "warning").length,
      illustrative: s.illustrative,
    };
  });
}

export default async function SubmissionsPage() {
  const live = await getLive();
  const rows = live?.account
    ? (await listSubmissions(live)).map((s) => ({
        id: s.code,
        year: s.year,
        ministry: s.ministry_short,
        ministryCode: s.ministry_code,
        state: stateLabel(s.state),
        submitted: localDate(s.submitted_at),
        indicators: s.assigned,
        reported: s.reported,
        evidence: s.evidence,
        blocking: s.blocking,
        warnings: s.warnings,
        illustrative: s.is_illustrative,
      }))
    : live
      ? []
      : demoRows();
  return (
    <>
      <PageHead caption="UI-09" title="Submissions" />
      <p className="lead">
        One submission per ministry per reporting year. The flag counts apply MoC&apos;s verification rules: missing values, missing narratives
        and missing evidence.
      </p>
      {live && <LiveNote noAccess={!live.account} />}
      <SubmissionTable rows={rows} />
    </>
  );
}
