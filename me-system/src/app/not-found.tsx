import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <h1>Page not found</h1>
      <p>The page may have moved, or you may not have access to it.</p>
      <p>
        <Link href="/">Go to the overview</Link> or <Link href="/sitemap">browse the sitemap</Link>.
      </p>
    </>
  );
}
