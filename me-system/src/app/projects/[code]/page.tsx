import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IndicatorCard } from "@/components/IndicatorCard";
import { Tabs } from "@/components/Tabs";
import { Breadcrumbs, fmtDate, Meta, PageHead, StatusTag, Table } from "@/components/ui";
import {
  activities,
  forms,
  getIndicator,
  getProgramme,
  getProject,
  indicatorsOf,
  obligations,
  orgName,
  projects,
  reports,
  submissions,
} from "@/lib/data";

export function generateStaticParams() {
  return projects.map((p) => ({ code: p.code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return { title: getProject(code)?.name ?? "Project" };
}

export default async function ProjectPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const prj = getProject(code);
  if (!prj) notFound();
  const programme = getProgramme(prj.programme);
  const inds = indicatorsOf(prj.code);
  const acts = activities.filter((a) => a.project === prj.code);
  const prjForms = forms.filter((f) => f.project === prj.code);
  const obs = obligations.filter((o) => inds.some((i) => i.code === o.indicator));
  const tasks = obs.filter((o) => o.state === "Due" || o.state === "Overdue");
  const toFix = submissions.filter((s) => s.project === prj.code && s.state === "Returned");
  const inReview = submissions.filter((s) => s.project === prj.code && (s.state === "Submitted" || s.state === "In review"));

  const overview = (
    <>
      <h2 style={{ marginTop: 0 }}>What needs doing</h2>
      {tasks.length === 0 && toFix.length === 0 ? (
        <div className="notice notice--success"><p>Nothing due right now.</p></div>
      ) : (
        <ul>
          {toFix.map((s) => (
            <li key={s.id}>
              <StatusTag status="Returned" /> <Link href={`/reviews/${s.id}`}>{s.id}</Link>: {s.returnReason}
            </li>
          ))}
          {tasks.map((o) => (
            <li key={o.id}>
              <StatusTag status={o.state} /> {getIndicator(o.indicator)?.title}, {o.period}, due {fmtDate(o.due)}
            </li>
          ))}
        </ul>
      )}
      <p className="small muted">{inReview.length} submission(s) from this project are waiting for review.</p>
      <h2>Indicator progress</h2>
      {inds.length === 0 ? (
        <div className="notice"><p>No indicators defined yet. The M&E reviewer adds them before reporting starts.</p></div>
      ) : (
        <div className="grid grid--2">
          {inds.map((i) => (
            <IndicatorCard key={i.code} ind={i} />
          ))}
        </div>
      )}
    </>
  );

  const indicatorTab =
    inds.length === 0 ? (
      <p className="muted">No indicators yet.</p>
    ) : (
      <Table caption="Indicators for this project">
        <thead>
          <tr><th scope="col">Code</th><th scope="col">Indicator</th><th scope="col">Method</th><th scope="col">Unit</th><th scope="col">Frequency</th></tr>
        </thead>
        <tbody>
          {inds.map((i) => (
            <tr key={i.code}>
              <td>{i.code}</td>
              <td><Link href={`/indicators/${i.code}`}>{i.title}</Link></td>
              <td>{i.method.replace("_", " ")}</td>
              <td>{i.unit}</td>
              <td>{i.frequency}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    );

  const activityTab = (
    <Table caption="Activities">
      <thead>
        <tr><th scope="col">Code</th><th scope="col">Activity</th><th scope="col">Dates</th><th scope="col">Status</th></tr>
      </thead>
      <tbody>
        {acts.map((a) => (
          <tr key={a.code}>
            <td className="nowrap">{a.code}</td>
            <td>{a.title}</td>
            <td className="nowrap">{fmtDate(a.start)} – {fmtDate(a.end)}</td>
            <td><StatusTag status={a.status} /></td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  const formsTab =
    prjForms.length === 0 ? (
      <p className="muted">No forms published for this project.</p>
    ) : (
      <div className="grid grid--2">
        {prjForms.map((f) => (
          <article key={f.code} className="card">
            <h3>{f.title}</h3>
            <p className="small">Version {f.version} · published {fmtDate(f.published)} · {f.questions.length} questions</p>
            <div className="btn-row">
              <Link className="btn" href={`/collect/${f.code}`}>Fill in</Link>
              <Link className="btn btn--secondary" href={`/forms/${f.code}`}>Open designer</Link>
            </div>
          </article>
        ))}
      </div>
    );

  const reportsTab = (
    <ul>
      {reports.map((r) => (
        <li key={r.id}>
          <Link href="/reports">{r.title}</Link> <span className="small muted">v{r.version} · {r.state}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Projects", href: "/projects" },
          { label: programme?.code ?? "", href: `/programmes/${prj.programme}` },
          { label: prj.code },
        ]}
      />
      <PageHead caption={`${prj.code} · Project`} title={prj.name}>
        {prjForms[0] && <Link className="btn" href={`/collect/${prjForms[0].code}`}>Submit a report</Link>}
      </PageHead>
      <Meta
        items={[
          ["Period", `${fmtDate(prj.start)} – ${fmtDate(prj.end)}`],
          ["Responsible organisation", orgName(prj.owner)],
          ["Owning programme", programme ? <Link key="p" href={`/programmes/${programme.code}`}>{programme.name}</Link> : prj.programme],
          ["Status", <StatusTag key="s" status={prj.status} />],
        ]}
      />
      <Tabs
        tabs={[
          { label: "Overview", content: overview },
          { label: `Indicators (${inds.length})`, content: indicatorTab },
          { label: `Activities (${acts.length})`, content: activityTab },
          { label: `Forms (${prjForms.length})`, content: formsTab },
          { label: "Reports", content: reportsTab },
        ]}
      />
    </>
  );
}
