"use client";

// Simulated signed-in role for the prototype. Stored in this browser only;
// real roles come from sign-in and scoped grants in milestone M2.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { can, canOpen, getRole, ROLES, type Permission, type RoleId } from "@/lib/roles";

export interface MinistryOption {
  code: string;
  short: string;
  name: string;
}

interface RoleState {
  role: RoleId;
  ministry: string; // focal point's own ministry
  ministries: MinistryOption[];
  ready: boolean;
  setRole: (role: RoleId, ministry?: string) => void;
}

const KEY = "me-demo-role";
const RoleContext = createContext<RoleState | null>(null);

export function RoleProvider({ ministries, children }: { ministries: MinistryOption[]; children: ReactNode }) {
  const [role, setRoleState] = useState<RoleId>("admin");
  const [ministry, setMinistry] = useState(ministries[0]?.code ?? "");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (saved && ROLES.some((r) => r.id === saved.role)) {
        setRoleState(saved.role);
        if (ministries.some((m) => m.code === saved.ministry)) setMinistry(saved.ministry);
      }
    } catch {
      // Storage unavailable (private mode, blocked): keep the default role.
    }
    setReady(true);
  }, [ministries]);

  function setRole(next: RoleId, nextMinistry?: string) {
    setRoleState(next);
    const m = nextMinistry ?? ministry;
    setMinistry(m);
    try {
      localStorage.setItem(KEY, JSON.stringify({ role: next, ministry: m }));
    } catch {
      // Not saved; the choice still applies until the page reloads.
    }
  }

  return <RoleContext.Provider value={{ role, ministry, ministries, ready, setRole }}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleState {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  return ctx;
}

export function useCan(permission: Permission) {
  const { role } = useRole();
  return can(role, permission);
}

/** Compact "Viewing as" control for the header and the mobile menu. */
export function RoleSwitcher({ id = "role-switch" }: { id?: string }) {
  const { role, ministry, ministries, setRole } = useRole();
  return (
    <div className="role-switch">
      <label htmlFor={id}>Viewing as</label>
      <select id={id} value={role} onChange={(e) => setRole(e.target.value as RoleId)}>
        {ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>
      {role === "focal" && (
        <>
          <label htmlFor={`${id}-min`} className="visually-hidden">Focal point for ministry</label>
          <select id={`${id}-min`} value={ministry} onChange={(e) => setRole("focal", e.target.value)}>
            {ministries.map((m) => <option key={m.code} value={m.code}>{m.short}</option>)}
          </select>
        </>
      )}
    </div>
  );
}

/** Shows the permission-denied state (FR-35) when the current role may not open this page. */
export function PageGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const { role, ready } = useRole();
  if (!ready || canOpen(role, pathname)) return <>{children}</>;
  const r = getRole(role);
  return (
    <div className="notice notice--error" role="alert" style={{ marginTop: 24 }}>
      <h1 style={{ fontSize: "1.75rem" }}>You don&apos;t have access to this page</h1>
      <p>
        You are viewing as <strong>{r.name}</strong> ({r.scope.toLowerCase()}). {r.summary}
      </p>
      <p>
        <Link href="/">Go to your overview</Link> or change &ldquo;Viewing as&rdquo; at the top of the page. <Link href="/roles">About the roles</Link>
      </p>
      <p className="small muted">Prototype: access is simulated in your browser. The real system checks it on the server.</p>
    </div>
  );
}

/** Renders children only for roles holding at least one of the permissions. */
export function RoleOnly({ any, children, fallback = null }: { any: Permission[]; children: ReactNode; fallback?: ReactNode }) {
  const { role } = useRole();
  return <>{any.some((p) => can(role, p)) ? children : fallback}</>;
}

/** "Fill report" button: shown to the Administrator, or to the focal point of that ministry. */
export function ReportButton({ ministry, children }: { ministry: string; children: ReactNode }) {
  const { role, ministry: mine } = useRole();
  const allowed = role === "admin" || (role === "focal" && mine === ministry);
  if (!allowed) return null;
  return (
    <Link className="btn" href={`/collect/cashew-indicator-report?ministry=${ministry}`}>
      {children}
    </Link>
  );
}
