import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui";
import { getForm, getSubmission, submissions } from "@/lib/data";
import { ReviewPanel } from "./ReviewPanel";

export function generateStaticParams() {
  return submissions.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Review ${id}` };
}

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sub = getSubmission(id);
  if (!sub) notFound();
  const form = getForm(sub.form)!;
  return (
    <>
      <Breadcrumbs items={[{ label: "Reviews", href: "/reviews" }, { label: sub.id }]} />
      <ReviewPanel sub={sub} form={form} />
    </>
  );
}
