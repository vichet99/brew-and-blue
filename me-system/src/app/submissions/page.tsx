import type { Metadata } from "next";
import { PageHead } from "@/components/ui";
import { ministryShort } from "@/lib/cashew";
import { qualityFlags, submissions } from "@/lib/workflow";
import { SubmissionTable } from "./SubmissionTable";

export const metadata: Metadata = { title: "Submissions" };

export default function SubmissionsPage() {
  const rows = submissions.map((s) => {
    const flags = qualityFlags(s);
    return {
      id: s.id,
      year: s.year,
      ministry: ministryShort(s.ministry),
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
  return (
    <>
      <PageHead caption="UI-09" title="Submissions" />
      <p className="lead">
        One Kobo submission per ministry per reporting year. The flag counts apply MoC&apos;s verification rules: missing values, missing narratives
        and missing evidence.
      </p>
      <SubmissionTable rows={rows} />
    </>
  );
}
