/*
  How this works (Next.js root layout)
  ------------------------------------
  In the App Router, layout.tsx wraps EVERY page. Whatever a page returns is passed in as `children`
  and rendered inside <main>. So the header, yellow banner, side menu and footer are written once, here.

  - This is a Server Component (no "use client"): it runs at build time / on the server and sends HTML.
  - `metadata` sets the <title> and <meta> tags; `template` adds the site name after each page's own title.
  - Interactive parts (RoleSwitcher, AccountLink, MobileNav, ProtoBanner) are Client Components imported here;
    Next.js sends their JavaScript to the browser, the rest stays plain HTML.
  - <RoleProvider> is a React Context provider: every component inside can call useRole() to learn who is
    signed in (or which demo role is chosen) without passing props through every level.
  - globals.css is imported once here, so its styles apply to the whole site.
*/

import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { ResponsiveTables } from "@/components/ResponsiveTables";
import { AccountLink, PageGate, ProtoBanner, RoleProvider, RoleSwitcher } from "@/components/RoleProvider";
import { MobileNav, SideNav } from "@/components/SideNav";
import { ministries } from "@/lib/cashew";

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
        <RoleProvider ministries={ministries.map(({ code, short, name }) => ({ code, short, name }))}>
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
              <RoleSwitcher />
              <AccountLink />
            </div>
            <MobileNav />
          </div>
        </header>
        <div className="proto-banner" role="note">
          <div className="proto-banner__inner">
            <strong>PROTOTYPE</strong>
            <ProtoBanner />
          </div>
        </div>
        <div className="layout">
          <SideNav />
          <main id="main" className="main" tabIndex={-1}>
            <PageGate>{children}</PageGate>
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
        </RoleProvider>
      </body>
    </html>
  );
}
