import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, ReleaseTag } from "@/components/ui";
import { sitemap } from "@/lib/sitemap";
import { policies, programmesOf, projectsOf } from "@/lib/data";

export const metadata: Metadata = { title: "Sitemap" };

export default function SitemapPage() {
  const pageCount = sitemap.reduce((n, t) => n + t.pages.length, 0);
  return (
    <>
      <PageHead caption="Help" title="Sitemap" />
      <p className="lead">
        The system is organised around the three levels people manage: <strong>policy</strong>, <strong>programme</strong> and{" "}
        <strong>project</strong>. Start from the level you are responsible for. Each level answers one practical question.
      </p>

      <div className="grid grid--3" style={{ marginBottom: 32 }}>
        {sitemap.slice(0, 3).map((t) => (
          <a key={t.id} href={`#${t.id}`} className="card card--link card--accent" style={{ textDecoration: "none", color: "inherit" }}>
            <p className="small muted" style={{ marginBottom: 4 }}>
              Level {t.number} · {t.audience}
            </p>
            <h3 style={{ color: "var(--link)", textDecoration: "underline" }}>{t.title}</h3>
            <p style={{ margin: 0 }}>“{t.question}”</p>
          </a>
        ))}
      </div>

      <h2>The results chain at a glance</h2>
      <p>Ownership runs top-down. Contribution links show extra support between levels but never add figures automatically.</p>
      <ul className="tree" aria-label="Policy, programme and project hierarchy">
        {policies.map((pol) => (
          <li key={pol.code}>
            <strong>Policy</strong> · <Link href={`/policies/${pol.code}`}>{pol.name}</Link>
            <ul>
              {programmesOf(pol.code).map((prg) => (
                <li key={prg.code}>
                  <strong>Programme</strong> · <Link href={`/programmes/${prg.code}`}>{prg.name}</Link>
                  <ul>
                    {projectsOf(prg.code).map((prj) => (
                      <li key={prj.code}>
                        <strong>Project</strong> · <Link href={`/projects/${prj.code}`}>{prj.name}</Link>
                        {prj.contributesTo.length > 0 && (
                          <span className="small muted"> — also contributes to {prj.contributesTo.map((c) => c.programme).join(", ")}</span>
                        )}
                        <span className="small muted"> → activities → indicators → forms → submissions</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <h2>All pages ({pageCount})</h2>
      <p className="small">
        <ReleaseTag release="R1" /> in the first pilot · <ReleaseTag release="R2" /> Kobo import and advanced collection ·{" "}
        <ReleaseTag release="R3" /> offline and evaluation. Screen IDs (UI-01 to UI-13) match specification section 10.2.
      </p>

      {sitemap.map((tier) => (
        <section key={tier.id} id={tier.id} className={`sitemap-tier tier-${tier.id}`} aria-labelledby={`${tier.id}-h`}>
          <div className="sitemap-tier__head">
            <span className="sitemap-tier__num" aria-hidden="true">{tier.number}</span>
            <h2 id={`${tier.id}-h`}>{tier.title}</h2>
            <p>
              <em>“{tier.question}”</em> · For: {tier.audience}
            </p>
          </div>
          <div className="sitemap-tier__body">
            {tier.pages.map((p) => (
              <article key={p.title} className="sm-page">
                <h3>
                  {p.live ? <Link href={p.href}>{p.title}</Link> : <span>{p.title}</span>}
                  <ReleaseTag release={p.release} />
                </h3>
                <div className="sm-route">
                  {p.live ? p.href : "not in this prototype"}
                  {p.ui ? ` · ${p.ui}` : ""}
                </div>
                <p className="who" style={{ margin: "4px 0 8px" }}>Used by: {p.who}</p>
                <p style={{ marginBottom: 0 }}>{p.purpose}</p>
                <ul>
                  {p.contains.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      ))}

      <h2 id="roadmap">Release roadmap</h2>
      <div className="table-wrap" role="region" aria-label="Release roadmap" tabIndex={0}>
        <table>
          <caption>What each release adds</caption>
          <thead>
            <tr>
              <th scope="col">Release</th>
              <th scope="col">Adds</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>R0 local demo</td>
              <td>Fictional policy, programmes, projects, four indicator types, four roles; submit, return, approve.</td>
              <td>This clickable prototype (UI only, M1)</td>
            </tr>
            <tr>
              <td>R1 private pilot</td>
              <td>Sign-in, tenant isolation, results frameworks, versioned indicators, forms, evidence, review, dashboards, exports, audit, backups.</td>
              <td>Designed; database and access control (M2) next</td>
            </tr>
            <tr>
              <td>R2 collection and integration</td>
              <td>Kobo read-only import, repeat groups, GPS, translated form labels, XLSX export.</td>
              <td>Designed</td>
            </tr>
            <tr>
              <td>R3 offline and evaluation</td>
              <td>Offline device queue, conflict handling, evaluation register and management responses.</td>
              <td>Designed</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
