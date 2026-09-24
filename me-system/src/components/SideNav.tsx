"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav, secondaryNav } from "@/lib/sitemap";

function isCurrent(pathname: string, match: string[]) {
  return match.some((m) => (m === "/" ? pathname === "/" : pathname === m || pathname.startsWith(m + "/")));
}

function NavLists({ pathname }: { pathname: string }) {
  return (
    <>
      <div className="sidenav__group">
        <p className="sidenav__heading">Workspace</p>
        <ul>
          {primaryNav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} aria-current={isCurrent(pathname, item.match) ? "page" : undefined}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="sidenav__group">
        <p className="sidenav__heading">Help</p>
        <ul>
          {secondaryNav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} aria-current={isCurrent(pathname, item.match) ? "page" : undefined}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export function SideNav() {
  const pathname = usePathname() ?? "/";
  return (
    <nav className="sidenav" aria-label="Main">
      <NavLists pathname={pathname} />
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname() ?? "/";
  return (
    <details className="mobile-nav" key={pathname}>
      <summary>Menu</summary>
      <nav className="sidenav" aria-label="Main (mobile)">
        <NavLists pathname={pathname} />
      </nav>
    </details>
  );
}
