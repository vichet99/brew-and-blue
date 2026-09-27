"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useRole } from "@/components/RoleProvider";
import type { RoleId } from "@/lib/roles";
import { browserClient } from "@/lib/supabase/browser";
import { liveEnabled } from "@/lib/supabase/config";

type State = "form" | "sending" | "error" | "unavailable" | "locked" | "no-workspace" | "signed-in";

export default function SignInPage() {
  const [state, setState] = useState<State>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [detail, setDetail] = useState("");
  const { setRole, live, account, ready } = useRole();
  const router = useRouter();

  async function submit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter an email address in the correct format, like name@example.org";
    if (!password) next.password = "Enter your password";
    setErrors(next);
    if (Object.keys(next).length) return;

    if (!liveEnabled) {
      // Demo build without a database: keep the simulated behaviour.
      if (email === "former@example.test") setState("no-workspace");
      else setState(password === "demo" ? "signed-in" : "error");
      return;
    }

    setState("sending");
    const client = browserClient();
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      if (error.status === 429) setState("locked");
      else if (error.code === "invalid_credentials" || error.status === 400) setState("error");
      else {
        setDetail(error.message);
        setState("unavailable");
      }
      return;
    }
    const { data: rows } = await client.from("my_access").select("role");
    if (!rows?.length) {
      await client.auth.signOut();
      setState("no-workspace");
      return;
    }
    setPassword("");
    router.push("/");
    router.refresh();
  }

  const hasErrors = Object.keys(errors).length > 0;
  const quick: { label: string; role: RoleId; ministry?: string }[] = [
    { label: "Administrator (M&E manager)", role: "admin" },
    { label: "Reviewer", role: "reviewer" },
    { label: "MAFF focal point", role: "focal", ministry: "maff" },
    { label: "Committee viewer", role: "viewer" },
  ];

  if (ready && live) {
    return (
      <div className="signin">
        <span className="caption">UI-01</span>
        <h1>You are signed in</h1>
        <div className="notice notice--success" role="status">
          <p>
            Signed in as <strong>{account?.name ?? "unknown user"}</strong>
            {account?.email ? ` (${account.email})` : ""}. <Link href="/">Go to your overview</Link>.
          </p>
        </div>
        <p className="small">To sign in as someone else, sign out first (top of the page, or the menu on a phone).</p>
      </div>
    );
  }

  return (
    <div className="signin">
      <span className="caption">UI-01 · {liveEnabled ? "Sign in with your account" : "Simulated sign-in"}</span>
      <h1>Sign in</h1>

      {hasErrors && (
        <div className="notice notice--error" role="alert">
          <h2 style={{ marginTop: 0, fontSize: "1.125rem" }}>There is a problem</h2>
          <ul>
            {errors.email && <li><a href="#email">{errors.email}</a></li>}
            {errors.password && <li><a href="#password">{errors.password}</a></li>}
          </ul>
        </div>
      )}
      {state === "error" && (
        <div className="notice notice--error" role="alert">
          <p>The email or password is not right. Check them and try again.</p>
        </div>
      )}
      {state === "unavailable" && (
        <div className="notice notice--error" role="alert">
          <p>Sign-in is not available right now ({detail}). Try again later or contact the workspace administrator.</p>
        </div>
      )}
      {state === "locked" && (
        <div className="notice notice--warning" role="alert">
          <p>Too many sign-in attempts. Wait a few minutes, then try again.</p>
        </div>
      )}
      {state === "no-workspace" && (
        <div className="notice notice--warning" role="alert">
          <p>
            {liveEnabled ? "Your password is right, but" : "You signed in, but"} you do not have access to any workspace. Your access may not be set up
            yet or may have been removed. Contact your workspace administrator.
          </p>
        </div>
      )}
      {state === "signed-in" && (
        <div className="notice notice--success" role="status">
          <p>
            Signed in (simulated). <Link href="/">Go to your overview</Link>.
          </p>
        </div>
      )}

      <form onSubmit={submit} noValidate>
        <div className={`field ${errors.email ? "field--error" : ""}`}>
          <label htmlFor="email">Email address</label>
          {errors.email && <p className="error-message" id="email-error">{errors.email}</p>}
          <input id="email" type="email" autoComplete="email" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} aria-describedby={errors.email ? "email-error" : undefined} />
        </div>
        <div className={`field ${errors.password ? "field--error" : ""}`}>
          <label htmlFor="password">Password</label>
          {errors.password && <p className="error-message" id="password-error">{errors.password}</p>}
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby={errors.password ? "password-error" : undefined} />
        </div>
        <div className="btn-row">
          <button className="btn" type="submit" disabled={state === "sending"}>{state === "sending" ? "Signing in…" : "Sign in"}</button>
        </div>
      </form>
      {liveEnabled && (
        <p className="small">
          Forgotten your password? Ask the workspace administrator to reset it. Accounts are created by the administrator; there is no self sign-up.
        </p>
      )}

      <h2>{liveEnabled ? "Or explore the demo" : "Quick demo sign-in"}</h2>
      <p className="small">
        {liveEnabled
          ? "Without an account you can look around the demo as any pilot role. Demo actions are simulated in your browser and never reach the database."
          : "Choose a pilot role to see the site as that person. You can switch at any time with “Viewing as”."}
      </p>
      <div className="grid grid--2" style={{ marginBottom: 24 }}>
        {quick.map((q) => (
          <button
            key={q.label}
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              setRole(q.role, q.ministry);
              router.push("/");
            }}
          >
            {liveEnabled ? "Demo as" : "Sign in as"} {q.label}
          </button>
        ))}
      </div>
      <p className="small"><Link href="/roles">What can each role do?</Link></p>

      {!liveEnabled && (
        <>
          <h2>Demo accounts</h2>
          <p className="small">
            Any fictional address with password <code>demo</code> signs in. <code>former@example.test</code> shows the “no workspace” state (deactivated
            user). Nothing is sent to a server.
          </p>
        </>
      )}
    </div>
  );
}
