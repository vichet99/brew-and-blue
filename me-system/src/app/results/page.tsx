import type { Metadata } from "next";
import Link from "next/link";
import { LevelTag, PageHead, StatusTag } from "@/components/ui";
import {
  actionCounts,
  actionStatus,
  actions,
  clusterLabel,
  formatOutcome,
  getOutcomeIndicator,
  goalOutcomeCodes,
  ministryShort,
  outcomeTrend,
  pct,
  policy,
} from "@/lib/cashew";

export const metadata: Metadata = { title: "Results framework" };

function OutcomeList({ codes }: { codes: string[] }) {
  return (
    <ul className="small" style={{ margin: "8px 0 0", paddingLeft: 18 }}>
      {codes.map((c) => {
        const o = getOutcomeIndicator(c)!;
        return (
          <li key={c}>
            <Link href={`/indicators/${c}`}>{c} {o.title}</Link>: {formatOutcome(o, o.series["2025"])} in 2025 <StatusTag status={outcomeTrend(o, 2025).trend} />
          </li>
        );
      })}
    </ul>
  );
}

export default function ResultsPage() {
  return (
    <>
      <PageHead caption="UI-05" title="Results framework" />
      <p className="lead">
        How the 44 actions are meant to contribute to the three goals and the policy vision. Outcome indicators track sector change against the 2022
        baseline; they have no targets, and a link here does not mean the actions alone caused the change.
      </p>
      <p className="btn-row small">
        <LevelTag level="impact" /> vision · <LevelTag level="outcome" /> goals with outcome indicators · <LevelTag level="output" /> action clusters and
        actions
      </p>

      <ul className="tree">
        <li>
          <div className="card" style={{ borderLeft: "5px solid var(--purple)" }}>
            <p className="small muted" style={{ marginBottom: 4 }}><LevelTag level="impact" /> Vision · {policy.code}</p>
            <p style={{ fontWeight: 700, marginBottom: 4 }}>{policy.vision}</p>
            <p className="small muted" style={{ margin: 0 }}>Socio-economic indicators:</p>
            <OutcomeList codes={goalOutcomeCodes.impact} />
          </div>
          <ul>
            {policy.goals.map((g) => {
              const acts = actions.filter((a) => a.cluster === g.cluster);
              const c = actionCounts(acts);
              return (
                <li key={g.code}>
                  <div className="card" style={{ borderLeft: "5px solid var(--teal)" }}>
                    <p className="small muted" style={{ marginBottom: 4 }}><LevelTag level="outcome" /> {g.code}</p>
                    <p style={{ fontWeight: 700, marginBottom: 4 }}>{g.text}</p>
                    <OutcomeList codes={goalOutcomeCodes[g.code]} />
                  </div>
                  <ul>
                    <li>
                      <details className="card" style={{ borderLeft: "5px solid var(--brand)" }}>
                        <summary style={{ cursor: "pointer", minHeight: 44 }}>
                          <LevelTag level="output" /> <strong>{clusterLabel[g.cluster]} cluster: {acts.length} actions</strong>{" "}
                          <span className="small">({c.fully} fully, {c.largely} largely, {c.limited} limited · completion {pct(c.completion)})</span>
                        </summary>
                        <ul className="small" style={{ marginTop: 8 }}>
                          {acts.map((a) => {
                            const s = actionStatus(a);
                            return (
                              <li key={a.code} style={{ marginBottom: 6 }}>
                                <Link href={`/projects/${a.code}`}>Action {a.no}</Link> ({a.ministries.map(ministryShort).join(", ")}):{" "}
                                {a.title.length > 110 ? a.title.slice(0, 110) + "…" : a.title} {s && <StatusTag status={s} />}
                              </li>
                            );
                          })}
                        </ul>
                      </details>
                    </li>
                  </ul>
                </li>
              );
            })}
          </ul>
        </li>
      </ul>
      <p className="small muted">
        Cluster-to-goal pathway as presented in the MTR (sections 3 and 4.3). Actions 1–17 production, 18–28 processing, 29–44 export.
      </p>
    </>
  );
}
