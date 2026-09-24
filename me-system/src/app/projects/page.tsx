import type { Metadata } from "next";
import Link from "next/link";
import { fmtDate, PageHead, StatusTag } from "@/components/ui";
import { getProgramme, indicatorsOf, obligations, orgName, projects } from "@/lib/data";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <>
      <PageHead caption="Portfolio" title="Projects" />
      <p className="lead">Projects in your scope. Each project has one owning programme.</p>
      <div className="grid grid--2">
        {projects.map((p) => {
          const inds = indicatorsOf(p.code);
          const due = obligations.filter((o) => inds.some((i) => i.code === o.indicator) && (o.state === "Due" || o.state === "Overdue"));
          return (
            <article key={p.code} className="card card--teal">
              <p className="small muted" style={{ marginBottom: 4 }}>
                {p.code} · {getProgramme(p.programme)?.name}
              </p>
              <h2 style={{ marginTop: 0, fontSize: "1.25rem" }}>
                <Link href={`/projects/${p.code}`}>{p.name}</Link>
              </h2>
              <p className="small">{p.description}</p>
              <p className="small" style={{ marginBottom: 8 }}>
                {orgName(p.owner)} · {fmtDate(p.start)} – {fmtDate(p.end)}
              </p>
              <p className="btn-row small" style={{ margin: 0 }}>
                <StatusTag status={p.status} />
                <span>{inds.length} indicators</span>
                {due.length > 0 && <StatusTag status={due.some((d) => d.state === "Overdue") ? "Overdue" : "Due"} label={`${due.length} report(s) due`} />}
              </p>
            </article>
          );
        })}
      </div>
    </>
  );
}
