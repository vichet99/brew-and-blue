"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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

/** Menu button for small screens; the panel drops down under the header. */
export function MobileNav() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="menu-btn"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="menu-btn__icon" aria-hidden="true">{open ? "✕" : "☰"}</span>
        Menu
      </button>
      <div id="mobile-menu" className="mobile-menu" hidden={!open}>
        <nav className="sidenav" aria-label="Main (mobile)">
          <NavLists pathname={pathname} />
        </nav>
      </div>
    </>
  );
}
