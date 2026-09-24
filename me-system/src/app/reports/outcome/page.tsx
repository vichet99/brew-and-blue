import type { Metadata } from "next";
import { Breadcrumbs, PageHead } from "@/components/ui";
import { outcomeIndicators, topMarkets } from "@/lib/cashew";
import { OutcomeDashboard } from "./OutcomeDashboard";

export const metadata: Metadata = { title: "Outcome dashboard" };

export default function OutcomeDashboardPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Dashboards and reports", href: "/reports" }, { label: "Outcome dashboard" }]} />
      <PageHead caption="Outcome level · 13 sector indicators · base year 2022" title="Outcome dashboard" />
      <p className="lead">
        A monitoring view, not a target tracker: it shows whether the sector is moving in the right direction since 2022. Changes in these indicators
        have many causes, so they cannot be attributed to the policy actions alone.
      </p>
      <div className="notice notice--warning small">
        <p>
          Production, markets and income come from MAFF, GDCE and computed farm-gate income. Quality, processing and inclusion indicators (Q1, Q2, PR1,
          PR2, S2, S3) are based on processor-survey test rows and have no baseline yet.
        </p>
      </div>
      <OutcomeDashboard
        indicators={outcomeIndicators.map(({ code, title, unit, direction, area, source, series, testData }) => ({ code, title, unit, direction, area, source, series, testData }))}
        markets={topMarkets}
      />
    </>
  );
}
