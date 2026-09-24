import Link from "next/link";
import { achievement, baselineProgress, formatResult } from "@/lib/calc";
import type { Indicator } from "@/lib/data";
import { fmtNum, LevelTag, StatusTag } from "./ui";

export function latestApproved(ind: Indicator) {
  return [...ind.observations].reverse().find((o) => o.status === "Approved" && o.value !== null);
}

/** Headline progress text for an indicator, following its method. */
export function progressText(ind: Indicator): { label: string; text: string } {
  if (ind.method === "milestone") {
    const done = ind.milestones?.filter((m) => m.done).length ?? 0;
    return { label: "Stages complete", text: `${done} of ${ind.milestones?.length ?? 0} (no weighted %)` };
  }
  const obs = latestApproved(ind);
  if (!obs) return { label: "Achievement", text: "No approved data" };
  if (ind.method === "weighted_mean") {
    return {
      label: "Progress toward reduction",
      text: formatResult(baselineProgress(ind.baseline.value, obs.target, obs.value, ind.direction)),
    };
  }
  return { label: "Achievement vs period target", text: formatResult(achievement(obs.value, obs.target)) };
}

export function IndicatorCard({ ind }: { ind: Indicator }) {
  const obs = latestApproved(ind);
  const reported = ind.observations.filter((o) => o.status !== "Not reported").length;
  const p = progressText(ind);
  return (
    <article className="card card--accent">
      <p className="small muted" style={{ marginBottom: 4 }}>
        {ind.code} · v{ind.version} · <LevelTag level={ind.level} />
      </p>
      <h3>
        <Link href={`/indicators/${ind.code}`}>{ind.title}</Link>
      </h3>
      {ind.method === "milestone" ? (
        <ul className="small" style={{ paddingLeft: 18 }}>
          {ind.milestones?.map((m) => (
            <li key={m.stage}>
              {m.stage}: {m.done ? <StatusTag status="Completed" /> : <StatusTag status="Not started" label="Not yet" />}
            </li>
          ))}
        </ul>
      ) : (
        <>
          <p className="stat">
            {fmtNum(obs?.value ?? null)} <small>{ind.unit}</small>
          </p>
          <p className="small" style={{ marginBottom: 8 }}>
            Target {fmtNum(obs?.target ?? null)} · Period {obs?.period ?? "—"}
          </p>
        </>
      )}
      <p className="small" style={{ marginBottom: 8 }}>
        <strong>{p.label}:</strong> {p.text}
      </p>
      <p className="btn-row small" style={{ marginBottom: 0 }}>
        {obs ? <StatusTag status="Approved" /> : <StatusTag status="No data" />}
        {obs?.stale && <StatusTag status="Stale" label="Stale: source corrected" />}
        {ind.method !== "milestone" && (
          <span className="muted">
            Coverage {reported}/{ind.observations.length} quarters
          </span>
        )}
      </p>
    </article>
  );
}

/** Horizontal bars with a target marker; paired with a data table for accessibility. */
export function SeriesChart({ ind }: { ind: Indicator }) {
  const values = ind.observations.flatMap((o) => [o.value ?? 0, o.target ?? 0]);
  const max = Math.max(1, ...values) * 1.1;
  return (
    <figure style={{ margin: "0 0 16px" }}>
      <figcaption className="small muted" style={{ marginBottom: 8 }}>
        {ind.title} by quarter ({ind.unit}). Bar = actual, black line = target. Hatched = not yet approved.
      </figcaption>
      <div className="bars" aria-hidden="true">
        {ind.observations.map((o) => (
          <div className="bar-row" key={o.period}>
            <span>{o.period}</span>
            <span className="bar-track">
              {o.value !== null && (
                <span className={`bar-fill ${o.status !== "Approved" ? "bar-fill--draft" : ""}`} style={{ width: `${(o.value / max) * 100}%` }} />
              )}
              {o.target !== null && <span className="bar-target" style={{ left: `${(o.target / max) * 100}%` }} />}
            </span>
            <span>{o.value === null ? "No data" : `${fmtNum(o.value)} / ${fmtNum(o.target)}`}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}
