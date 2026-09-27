import Link from "next/link";

/** Marks a page as showing live database records (or explains why it can't). */
export function LiveNote({ noAccess = false }: { noAccess?: boolean }) {
  if (noAccess) {
    return (
      <div className="notice notice--warning" role="note">
        <p>You are signed in, but your account has no access to this workspace yet. Ask the workspace administrator to add you.</p>
      </div>
    );
  }
  return (
    <p className="small">
      <span className="tag tag--green">Live</span> Records from the database, filtered by your access.{" "}
      <Link href="/roles">About the roles</Link>
    </p>
  );
}
