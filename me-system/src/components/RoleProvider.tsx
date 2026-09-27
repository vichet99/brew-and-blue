"use client";

/*
  How this works (React Context for "who am I")
  ---------------------------------------------
  createContext + a Provider component + a useRole() hook is the standard React way to share state with
  every component on the page.
  - Live mode: an effect (useEffect) asks Supabase for the signed-in user and reads the `my_access` view,
    then buildAccount() (src/lib/access.ts) turns the rows into the name, roles and ministry.
    onAuthStateChange re-runs that when the person signs in or out in this tab.
  - Demo mode: the chosen demo role is kept in localStorage (browser storage) so it survives reloads.
  - `ready` stays false until we know; PageGate waits for it so pages don't flash "no access".
  The role here only changes what the interface shows. The database enforces real access.
*/

// Who the interface is acting for. Signed in (Supabase configured): the role and
// ministry come from the database grants. Signed out: the demo's simulated role,
// stored in this browser only. Either way the database enforces access itself.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { buildAccount, type AccessRow, type Account } from "@/lib/access";
import { can, canOpen, getRole, ROLES, type Permission, type RoleId } from "@/lib/roles";
import { browserClient } from "@/lib/supabase/browser";
import { liveEnabled } from "@/lib/supabase/config";

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
  /** Signed in with a real account. */
  live: boolean;
  /** The signed-in person (null when signed in without workspace access, or in the demo). */
  account: Account | null;
  signOut: () => Promise<void>;
}

const KEY = "me-demo-role";
const RoleContext = createContext<RoleState | null>(null);

export function RoleProvider({ ministries, children }: { ministries: MinistryOption[]; children: ReactNode }) {
  const [role, setRoleState] = useState<RoleId>("admin");
  const [ministry, setMinistry] = useState(ministries[0]?.code ?? "");
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    if (!liveEnabled) return;
    const client = browserClient();
    let cancelled = false;
    async function load() {
      const { data } = await client.auth.getUser();
      if (cancelled) return;
      if (!data.user) {
        setLive(false);
        setAccount(null);
      } else {
        const { data: rows } = await client.from("my_access").select("*");
        if (cancelled) return;
        setLive(true);
        setAccount(buildAccount((rows ?? []) as AccessRow[]));
      }
      setReady(true);
    }
    void load();
    const { data: sub } = client.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void load();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

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
    if (!liveEnabled) setReady(true);
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

  async function signOut() {
    if (liveEnabled) await browserClient().auth.signOut();
    setLive(false);
    setAccount(null);
  }

  // Signed in: the database grants decide. Without a role the person gets the least access.
  const effectiveRole: RoleId = live ? account?.role ?? "viewer" : role;
  const effectiveMinistry = live ? account?.ministry ?? "" : ministry;

  return (
    <RoleContext.Provider value={{ role: effectiveRole, ministry: effectiveMinistry, ministries, ready, setRole, live, account, signOut }}>
      {children}
    </RoleContext.Provider>
  );
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
  const { role, ministry, ministries, setRole, live, account } = useRole();
  if (live) {
    return (
      <div className="role-switch" id={id}>
        <span>
          Signed in as <strong>{account?.name ?? "unknown user"}</strong>
          {account?.roles.length ? ` · ${account.roles.map((r) => getRole(r).name.replace(/ \(.*\)$/, "")).join(" + ")}` : " · no workspace access"}
        </span>
      </div>
    );
  }
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

/** "Sign in" in the demo, "Sign out" for a signed-in account. */
export function AccountLink() {
  const { live, signOut } = useRole();
  const router = useRouter();
  if (!live) return <Link href="/signin">{liveEnabled ? "Sign in" : "Sign out"}</Link>;
  return (
    <button
      type="button"
      className="link-button"
      onClick={async () => {
        await signOut();
        router.push("/signin");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}

/** Shows the permission-denied state (FR-35) when the current role may not open this page. */
export function PageGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const { role, ready, live } = useRole();
  if (!ready || canOpen(role, pathname)) return <>{children}</>;
  const r = getRole(role);
  if (live) {
    return (
      <div className="notice notice--error" role="alert" style={{ marginTop: 24 }}>
        <h1 style={{ fontSize: "1.75rem" }}>You don&apos;t have access to this page</h1>
        <p>Your account has the <strong>{r.name}</strong> role ({r.scope.toLowerCase()}). {r.summary}</p>
        <p><Link href="/">Go to your overview</Link>. If you need more access, ask the workspace administrator. <Link href="/roles">About the roles</Link></p>
      </div>
    );
  }
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

/** Prototype banner: explains what is real for a signed-in account and what is example data. */
export function ProtoBanner() {
  const { live } = useRole();
  if (live) {
    return (
      <>
        <span className="banner-short">
          Signed in: Submissions, Reviews and the report form use the live database. <Link href="/admin#sources">Details</Link>
        </span>
        <span className="banner-full">
          Signed in: <Link href="/submissions">Submissions</Link>, <Link href="/reviews">Reviews</Link> and the ministry report form read and save
          live records in the database. Other pages still show the example built from MoC&apos;s Cashew workbooks (reporting year 2025).{" "}
          <Link href="/admin#sources">Data sources</Link>.
        </span>
      </>
    );
  }
  return (
    <>
      <span className="banner-short">
        Example data from MoC&apos;s Cashew M&amp;E; actions are simulated. <Link href="/admin#sources">Details</Link>
      </span>
      <span className="banner-full">
        Example workspace built from MoC&apos;s Cashew Policy M&amp;E workbooks (reporting year 2025) and the MTR final draft. Records marked
        &ldquo;Illustrative&rdquo; are invented for the demo. Actions are simulated in your browser and not saved.{" "}
        <Link href="/sitemap">Sitemap</Link> · <Link href="/admin#sources">Data sources</Link>.
      </span>
    </>
  );
}
