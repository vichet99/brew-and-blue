import Link from "next/link";
import type { ReactNode } from "react";
import type { Release } from "@/lib/sitemap";

type Tone = "blue" | "green" | "red" | "orange" | "grey" | "purple" | "teal" | "yellow";
type IconName = "check" | "cross" | "clock" | "alert" | "dot" | "return" | "edit" | "stale" | "minus" | "send";

const paths: Record<IconName, ReactNode> = {
  check: <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />,
  cross: <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />,
  clock: (
    <>
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8 4.5V8l2.5 1.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  alert: (
    <>
      <path d="M8 1.8l6.5 12H1.5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 6v3.5M8 11.6v.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  dot: <circle cx="8" cy="8" r="4" fill="currentColor" />,
  return: <path d="M6 3L2.5 6.5 6 10M3 6.5h6.5a4 4 0 010 8H7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  edit: <path d="M10.5 2.5l3 3L6 13H3v-3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
  stale: (
    <>
      <path d="M13 8a5 5 0 11-1.5-3.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M13 2v3h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  minus: <path d="M3.5 8h9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />,
  send: <path d="M2 8l12-5-4 11-2.5-4.5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  );
}

const statusMap: Record<string, { tone: Tone; icon: IconName }> = {
  Approved: { tone: "green", icon: "check" },
  Completed: { tone: "green", icon: "check" },
  Clean: { tone: "green", icon: "check" },
  Active: { tone: "green", icon: "check" },
  active: { tone: "green", icon: "check" },
  Published: { tone: "green", icon: "check" },
  "Published (supersedes v1)": { tone: "green", icon: "check" },
  Submitted: { tone: "blue", icon: "send" },
  "In review": { tone: "purple", icon: "clock" },
  "In progress": { tone: "blue", icon: "clock" },
  Due: { tone: "blue", icon: "clock" },
  planned: { tone: "grey", icon: "dot" },
  "Not started": { tone: "grey", icon: "dot" },
  Draft: { tone: "grey", icon: "edit" },
  Returned: { tone: "orange", icon: "return" },
  Overdue: { tone: "red", icon: "alert" },
  Rejected: { tone: "red", icon: "cross" },
  Deactivated: { tone: "grey", icon: "minus" },
  Superseded: { tone: "grey", icon: "minus" },
  Waived: { tone: "teal", icon: "minus" },
  "Not applicable": { tone: "grey", icon: "minus" },
  "Not reported": { tone: "yellow", icon: "alert" },
  "No data": { tone: "yellow", icon: "alert" },
  "Pending scan": { tone: "yellow", icon: "clock" },
  Stale: { tone: "orange", icon: "stale" },
  closed: { tone: "grey", icon: "minus" },
  archived: { tone: "grey", icon: "minus" },
  "Fully Achieved": { tone: "green", icon: "check" },
  "Largely Achieved": { tone: "orange", icon: "clock" },
  "Limited Progress": { tone: "red", icon: "alert" },
  Improving: { tone: "green", icon: "check" },
  Declining: { tone: "red", icon: "alert" },
  "No change": { tone: "grey", icon: "minus" },
  Upcoming: { tone: "grey", icon: "clock" },
  Endorsed: { tone: "green", icon: "check" },
  "Final draft": { tone: "blue", icon: "edit" },
  Illustrative: { tone: "yellow", icon: "alert" },
  "Test data": { tone: "yellow", icon: "alert" },
};

/** Status is shown with text and an icon, never colour alone (spec 10.1). */
export function StatusTag({ status, label }: { status: string; label?: string }) {
  const s = statusMap[status] ?? { tone: "grey" as Tone, icon: "dot" as IconName };
  const text = label ?? status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`tag tag--${s.tone}`}>
      <Icon name={s.icon} />
      {text}
    </span>
  );
}

export function LevelTag({ level }: { level: "impact" | "outcome" | "output" }) {
  const tone: Record<string, Tone> = { impact: "purple", outcome: "teal", output: "blue" };
  return <span className={`tag tag--${tone[level]}`}>{level.charAt(0).toUpperCase() + level.slice(1)}</span>;
}

export function ReleaseTag({ release }: { release: Release }) {
  const label = { R1: "R1 pilot", R2: "R2 later", R3: "R3 later" }[release];
  return <span className={`release release--${release}`}>{label}</span>;
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((it, i) => (
          <li key={i}>{it.href ? <Link href={it.href}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHead({ caption, title, children }: { caption?: string; title: string; children?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        {caption && <span className="caption">{caption}</span>}
        <h1>{title}</h1>
      </div>
      {children && <div className="btn-row">{children}</div>}
    </div>
  );
}

export function Meta({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="meta-list">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Table({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="table-wrap" role="region" aria-label={caption} tabIndex={0}>
      <table>
        <caption>{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function fmtDate(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function fmtNum(n: number | null | undefined, unit = "") {
  if (n === null || n === undefined) return "No data";
  return `${n.toLocaleString("en-GB")}${unit ? " " + unit : ""}`;
}
