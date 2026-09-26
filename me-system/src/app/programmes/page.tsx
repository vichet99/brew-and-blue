import type { Metadata } from "next";
import { PercentBars } from "@/components/charts";
import { PageHead } from "@/components/ui";
import { actionsJoinedBy, actionsLedBy, indicatorsOfMinistry, ministries, ministryCompletion, thresholds } from "@/lib/cashew";

export const metadata: Metadata = { title: "Ministry programmes" };

export default function ProgrammesPage() {
  const rows = ministries
    .map((m) => ({ m, c: ministryCompletion(m.code) }))
    .sort((a, b) => (b.c.completion ?? -1) - (a.c.completion ?? -1));
  return (
    <>
      <PageHead caption="Programme level" title="Ministry programmes" />
      <p className="lead">
        One programme per ministry or institution. A programme owns the actions its ministry leads and contributes to joint actions. Completion is
        the average of its indicators&apos; % of 2027 target, each capped at 100.
      </p>
      <PercentBars
        caption="Completion by ministry, reporting year 2025"
        markers={thresholds.filter((t) => t.year <= 2027).map((t) => ({ at: t.largely, label: `${t.year} largely` }))}
        rows={rows.map(({ m, c }) => ({
          label: m.short,
          href: `/programmes/${m.code}`,
          value: c.completion,
          sub: `${indicatorsOfMinistry(m.code).length} indicators · ${actionsLedBy(m.code).length} led, ${actionsJoinedBy(m.code).length} joint`,
        }))}
      />
      <p className="small muted">
        The dashed lines show the &ldquo;largely achieved&rdquo; threshold for 2025 (40%), 2026 (70%) and 2027 (90%). A ministry at 60% today will
        need to move past 70% next year to keep the same grade.
      </p>
    </>
  );
}
