import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { ResponsiveTables } from "@/components/ResponsiveTables";
import { MobileNav, SideNav } from "@/components/SideNav";

export const metadata: Metadata = {
  title: { default: "Monitoring and Evaluation System", template: "%s · Monitoring and Evaluation System" },
  description:
    "Monitoring and Evaluation System prototype, shown with the National Cashew Policy 2022–2027 as an example workspace.",
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <a className="skip-link" href="#main">Skip to main content</a>
        <header className="site-header">
          <div className="site-header__inner">
            <Link href="/" className="brand">
              <Mark />
              <span>
                <span className="brand__full">Monitoring and Evaluation System</span>
                <span className="brand__short" aria-hidden="true">M&amp;E System</span>
                <span className="brand__sub">Policy · Programme · Project</span>
              </span>
            </Link>
            <div className="site-header__meta">
              <span className="workspace-pill">Example: National Cashew Policy 2022–2027</span>
              <Link href="/signin">Sign out</Link>
            </div>
            <MobileNav />
          </div>
        </header>
        <div className="proto-banner" role="note">
          <div className="proto-banner__inner">
            <strong>PROTOTYPE</strong>
            <span className="banner-short">
              Example data from MoC&apos;s Cashew M&amp;E; actions are simulated. <Link href="/admin#sources">Details</Link>
            </span>
            <span className="banner-full">
            Example workspace built from MoC&apos;s Cashew Policy M&amp;E workbooks (reporting year 2025) and the MTR final draft. Records marked
            &ldquo;Illustrative&rdquo; are invented for the demo. Actions are simulated in your browser and not saved.{" "}
            <Link href="/sitemap">Sitemap</Link> · <Link href="/admin#sources">Data sources</Link>.
            </span>
          </div>
        </div>
        <div className="layout">
          <SideNav />
          <main id="main" className="main" tabIndex={-1}>
            {children}
          </main>
          <ResponsiveTables />
        </div>
        <footer className="site-footer">
          <div className="site-footer__inner">
            <ul>
              <li><Link href="/sitemap">Sitemap</Link></li>
              <li><Link href="/brand">Brand guide</Link></li>
              <li><Link href="/admin">Administration</Link></li>
            </ul>
            <p className="muted small" style={{ margin: 0 }}>
              Monitoring and Evaluation System · UI prototype · Example data: National Cashew Policy M&E (MoC)
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
