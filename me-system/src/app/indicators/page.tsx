import type { Metadata } from "next";
import Link from "next/link";
import { progressText } from "@/components/IndicatorCard";
import { LevelTag, PageHead, Table } from "@/components/ui";
import { indicators, orgName } from "@/lib/data";

export const metadata: Metadata = { title: "Indicators" };

const methodLabel: Record<string, string> = {
  count: "Count",
  sum: "Sum",
  percentage: "Percentage (pooled)",
  weighted_mean: "Weighted mean",
  latest_snapshot: "Latest snapshot",
  milestone: "Milestone",
};

export default function IndicatorsPage() {
  return (
    <>
      <PageHead caption="UI-06" title="Indicator catalogue">
        <button className="btn btn--secondary" type="button" disabled title="Editing arrives in milestone M3">New indicator (M3)</button>
      </PageHead>
      <p className="lead">
        Every indicator has a versioned definition with its unit, direction, method and aggregation rules. Changing meaning creates a new version;
        historic figures keep the version they were approved under.
      </p>
      <Table caption="Indicators">
        <thead>
          <tr>
            <th scope="col">Code</th>
            <th scope="col">Indicator</th>
            <th scope="col">Level</th>
            <th scope="col">Method</th>
            <th scope="col">Unit</th>
            <th scope="col">Version</th>
            <th scope="col">Responsible</th>
            <th scope="col">Latest progress</th>
          </tr>
        </thead>
        <tbody>
          {indicators.map((i) => (
            <tr key={i.code}>
              <td className="nowrap">{i.code}</td>
              <td><Link href={`/indicators/${i.code}`}>{i.title}</Link></td>
              <td><LevelTag level={i.level} /></td>
              <td>{methodLabel[i.method]}</td>
              <td>{i.unit}</td>
              <td className="num">v{i.version}</td>
              <td>{orgName(i.responsible)}</td>
              <td className="small">{progressText(i).text}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
