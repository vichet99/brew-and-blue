import type { Metadata } from "next";
import Link from "next/link";
import { LevelTag, PageHead } from "@/components/ui";
import { indicators, results, scopeHref, scopeName, type Result } from "@/lib/data";

export const metadata: Metadata = { title: "Results framework" };

function Node({ r }: { r: Result }) {
  const children = results.filter((c) => c.parent === r.code);
  const inds = indicators.filter((i) => i.result === r.code);
  return (
    <li>
      <div className="card" style={{ borderLeft: `5px solid var(--${r.level === "impact" ? "purple" : r.level === "outcome" ? "teal" : "blue"})` }}>
        <p className="small muted" style={{ marginBottom: 4 }}>
          <LevelTag level={r.level} /> {r.code} · owned by <Link href={scopeHref(r.owner)}>{scopeName(r.owner)}</Link>
        </p>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>{r.statement}</p>
        {r.assumptions && <p className="small" style={{ marginBottom: 4 }}>Assumption: {r.assumptions}</p>}
        {inds.length > 0 && (
          <p className="small" style={{ margin: 0 }}>
            Indicators:{" "}
            {inds.map((i, n) => (
              <span key={i.code}>
                {n > 0 && ", "}
                <Link href={`/indicators/${i.code}`}>{i.code} {i.title}</Link>
              </span>
            ))}
          </p>
        )}
      </div>
      {children.length > 0 && (
        <ul>
          {children.map((c) => (
            <Node key={c.code} r={c} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function ResultsPage() {
  const roots = results.filter((r) => !r.parent);
  return (
    <>
      <PageHead caption="UI-05" title="Results framework" />
      <p className="lead">
        The intended contribution pathway from outputs to outcomes to impact. Frameworks do not have to contain every level, and links do not
        authorise adding numbers across levels.
      </p>
      <p className="btn-row small">
        <LevelTag level="impact" /> long-term change · <LevelTag level="outcome" /> change the programme seeks to influence ·{" "}
        <LevelTag level="output" /> what projects deliver
      </p>
      <ul className="tree">
        {roots.map((r) => (
          <Node key={r.code} r={r} />
        ))}
      </ul>
      <h2>Risks (text register, R1)</h2>
      <ul>
        <li><strong>Flooding</strong> interrupts grading at collection points. Likelihood medium, impact high. Response: waiver procedure agreed.</li>
        <li><strong>Certification body capacity</strong> delays audits. Likelihood low, impact medium. Response: book audits two quarters ahead.</li>
      </ul>
    </>
  );
}
