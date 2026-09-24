import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { MobileNav, SideNav } from "@/components/SideNav";
import { workspace } from "@/lib/data";

export const metadata: Metadata = {
  title: { default: "Monitoring and Evaluation System", template: "%s · Monitoring and Evaluation System" },
  description:
    "Monitoring and Evaluation System: connect policies and programmes to projects, indicators, evidence and approved reports. Prototype with fictional data.",
  robots: { index: false, follow: false },
};

function Mark() {
  return (
    <svg className="brand__mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="6" fill="#ffffff" />
      <rect x="6" y="18" width="5" height="8" fill="#1d70b8" />
      <rect x="13.5" y="12" width="5" height="14" fill="#1d70b8" />
      <rect x="21" y="6" width="5" height="20" fill="#0f385c" />
      <circle cx="23.5" cy="6" r="3" fill="#00ffe0" />
    </svg>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <a className="skip-link" href="#main">Skip to main content</a>
        <header className="site-header">
          <div className="site-header__inner">
            <Link href="/" className="brand">
              <Mark />
              <span>
                Monitoring and Evaluation System
                <span className="brand__sub">Policy · Programme · Project</span>
              </span>
            </Link>
            <div className="site-header__meta">
              <span className="workspace-pill">{workspace.name}</span>
              <Link href="/signin">Sign out</Link>
            </div>
          </div>
        </header>
        <div className="proto-banner" role="note">
          <div className="proto-banner__inner">
            <strong>PROTOTYPE</strong>
            All names, figures and dates are fictional test data. Actions are simulated in your browser and are not saved to a server.{" "}
            <Link href="/sitemap">See the sitemap</Link>.
          </div>
        </div>
        <MobileNav />
        <div className="layout">
          <SideNav />
          <main id="main" className="main" tabIndex={-1}>
            {children}
          </main>
        </div>
        <footer className="site-footer">
          <div className="site-footer__inner">
            <ul>
              <li><Link href="/sitemap">Sitemap</Link></li>
              <li><Link href="/brand">Brand guide</Link></li>
              <li><Link href="/admin">Administration</Link></li>
            </ul>
            <p className="muted small" style={{ margin: 0 }}>
              Monitoring and Evaluation System · M1 UI prototype · Specification v1.0 (24 Sep 2026)
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
