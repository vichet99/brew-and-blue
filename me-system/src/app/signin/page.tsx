"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useRole } from "@/components/RoleProvider";
import type { RoleId } from "@/lib/roles";

type State = "form" | "error" | "expired" | "no-workspace" | "signed-in";

export default function SignInPage() {
  const [state, setState] = useState<State>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter an email address in the correct format, like name@example.org";
    if (!password) next.password = "Enter your password";
    setErrors(next);
    if (Object.keys(next).length) return;
    if (email === "former@example.test") setState("no-workspace");
    else if (password !== "demo") setState("error");
    else setState("signed-in");
  }

  const hasErrors = Object.keys(errors).length > 0;
  const { setRole } = useRole();
  const router = useRouter();
  const quick: { label: string; role: RoleId; ministry?: string }[] = [
    { label: "Administrator (M&E manager)", role: "admin" },
    { label: "Reviewer", role: "reviewer" },
    { label: "MAFF focal point", role: "focal", ministry: "maff" },
    { label: "Committee viewer", role: "viewer" },
  ];

  return (
    <div className="signin">
      <span className="caption">UI-01 · Simulated sign-in</span>
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
          <p>The email or password is not right. Check them and try again. After 5 attempts you will need to wait 15 minutes.</p>
        </div>
      )}
      {state === "expired" && (
        <div className="notice notice--warning" role="alert">
          <p>This sign-in link has expired. Links last 1 hour. Request a new one below.</p>
        </div>
      )}
      {state === "no-workspace" && (
        <div className="notice notice--warning" role="alert">
          <p>You signed in, but you do not have access to any workspace. Your access may have been removed. Contact your workspace administrator.</p>
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
          <button className="btn" type="submit">Sign in</button>
          <button className="btn btn--secondary" type="button" onClick={() => setState("expired")}>
            Simulate expired link
          </button>
        </div>
      </form>

      <h2>Quick demo sign-in</h2>
      <p className="small">Choose a pilot role to see the site as that person. You can switch at any time with &ldquo;Viewing as&rdquo;.</p>
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
            Sign in as {q.label}
          </button>
        ))}
      </div>
      <p className="small"><Link href="/roles">What can each role do?</Link></p>

      <h2>Demo accounts</h2>
      <p className="small">
        Any fictional address with password <code>demo</code> signs in. <code>former@example.test</code> shows the “no workspace” state (deactivated
        user). Nothing is sent to a server.
      </p>
      <p className="small">
        <a href="#email">Forgotten your password?</a> Real recovery arrives with authentication in milestone M2.
      </p>
    </div>
  );
}
