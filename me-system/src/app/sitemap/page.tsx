import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, ReleaseTag } from "@/components/ui";
import { sitemap } from "@/lib/sitemap";
import { actionsJoinedBy, actionsLedBy, indicatorsOfMinistry, ministries, policy } from "@/lib/cashew";

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
      <p>One policy, one programme per ministry, one project per policy action. The lead ministry owns an action; ministries on joint actions report their own indicators, and nothing is counted twice. Open a ministry to see its actions.</p>
      <ul className="tree" aria-label="Policy, programme and project hierarchy">
        <li>
          <strong>Policy</strong> · <Link href={`/policies/${policy.code}`}>{policy.name}</Link>{" "}
          <span className="small muted">3 goals · 13 outcome indicators</span>
          <ul>
            {ministries.map((m) => {
              const led = actionsLedBy(m.code);
              const joined = actionsJoinedBy(m.code);
              return (
                <li key={m.code}>
                  <details>
                    <summary style={{ cursor: "pointer", minHeight: 32 }}>
                      <strong>Programme</strong> · {m.short}{" "}
                      <span className="small muted">
                        {led.length} action{led.length === 1 ? "" : "s"} led{joined.length ? `, ${joined.length} joint` : ""} · {indicatorsOfMinistry(m.code).length} indicators
                      </span>
                    </summary>
                    <p className="small" style={{ margin: "4px 0" }}><Link href={`/programmes/${m.code}`}>{m.name}</Link></p>
                    <ul>
                      {led.map((a) => (
                        <li key={a.code} className="small">
                          <strong>Project</strong> · <Link href={`/projects/${a.code}`}>Action {a.no}</Link>
                          {a.ministries.length > 1 && <span className="muted"> (with {a.ministries.slice(1).map((c) => ministries.find((x) => x.code === c)?.short).join(", ")})</span>}
                          <span className="muted"> → indicators → Kobo questions → submissions</span>
                        </li>
                      ))}
                      {joined.map((a) => (
                        <li key={a.code} className="small muted">Contributes to <Link href={`/projects/${a.code}`}>Action {a.no}</Link></li>
                      ))}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        </li>
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
              <td>Example workspace: National Cashew Policy with 17 ministry programmes, 44 actions, 121 indicators, Kobo questions, dashboards and a review workflow.</td>
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
