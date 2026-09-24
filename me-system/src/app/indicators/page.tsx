import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, StatusTag, Table } from "@/components/ui";
import { actionIndicators, formatOutcome, ministryShort, outcomeIndicators, outcomeTrend } from "@/lib/cashew";
import { IndicatorFilterTable } from "./IndicatorFilterTable";

export const metadata: Metadata = { title: "Indicators" };

export default function IndicatorsPage() {
  const rows = actionIndicators.map((i) => ({
    code: i.code,
    label: i.label,
    action: i.action,
    ministry: ministryShort(i.ministry),
    target: i.targetText,
    method: i.method,
    value: i.y2025.value === null ? null : String(i.y2025.value),
    pct: i.y2025.actualPct,
    status: i.y2025.status,
  }));
  return (
    <>
      <PageHead caption="UI-06" title="Indicator catalogue" />
      <p className="lead">
        Two levels. <strong>Outcome indicators</strong> (13) track change in the sector against 2022, with no targets.{" "}
        <strong>Action indicators</strong> (108) track delivery of each policy action against a 2027 target.
      </p>

      <h2>Outcome level (13)</h2>
      <Table caption="Outcome indicators: 2022 baseline and latest value">
        <thead>
          <tr>
            <th scope="col">Code</th><th scope="col">Indicator</th><th scope="col">Area</th><th scope="col">Unit</th><th scope="col">Better when</th>
            <th scope="col" className="num">2022</th><th scope="col" className="num">2025</th><th scope="col">Trend</th><th scope="col">Source</th>
          </tr>
        </thead>
        <tbody>
          {outcomeIndicators.map((o) => (
            <tr key={o.code}>
              <td>{o.code}</td>
              <td><Link href={`/indicators/${o.code}`}>{o.title}</Link> {o.testData && <StatusTag status="Test data" />}</td>
              <td>{o.area}</td>
              <td>{o.unit}</td>
              <td>{o.direction === "increase" ? "Higher" : "Lower"}</td>
              <td className="num">{formatOutcome(o, o.series["2022"])}</td>
              <td className="num">{formatOutcome(o, o.series["2025"])}</td>
              <td><StatusTag status={outcomeTrend(o, 2025).trend} /></td>
              <td className="small">{o.source} ({o.tool === "Kobo" ? "Kobo processor survey" : "administrative data"})</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <h2>Action level (108)</h2>
      <IndicatorFilterTable rows={rows} />
    </>
  );
}
