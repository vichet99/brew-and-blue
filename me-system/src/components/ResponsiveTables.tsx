"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Copies each column heading onto its body cells as data-label, so CSS can
 * turn table rows into labelled cards on small screens. Re-runs when a page
 * changes or a client table re-renders (filters, tabs).
 */
function label(root: ParentNode) {
  root.querySelectorAll<HTMLTableElement>(".table-wrap table").forEach((table) => {
    const heads = Array.from(table.querySelectorAll("thead th")).map((th) => th.textContent?.trim() ?? "");
    if (!heads.length) return;
    table.classList.add("stackable");
    table.querySelectorAll("tbody tr").forEach((tr) => {
      Array.from(tr.children).forEach((cell, i) => {
        const h = heads[i];
        if (h && cell.getAttribute("data-label") !== h) cell.setAttribute("data-label", h);
      });
    });
  });
}

export function ResponsiveTables() {
  const pathname = usePathname();
  useEffect(() => {
    const main = document.getElementById("main");
    if (!main) return;
    label(main);
    let frame = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => label(main));
    });
    observer.observe(main, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [pathname]);
  return null;
}
