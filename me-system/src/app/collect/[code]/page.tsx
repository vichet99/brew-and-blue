import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, fmtDate } from "@/components/ui";
import { forms, getForm, getProject } from "@/lib/data";
import { CollectForm } from "./CollectForm";

export function generateStaticParams() {
  return forms.map((f) => ({ code: f.code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return { title: getForm(code)?.title ?? "Collect" };
}

export default async function CollectPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const form = getForm(code);
  if (!form) notFound();
  return (
    <>
      <Breadcrumbs items={[{ label: "Forms", href: "/forms" }, { label: form.title }]} />
      <span className="caption">
        UI-08 · {getProject(form.project)?.name} · Version {form.version}, published {fmtDate(form.published)}
      </span>
      <h1>{form.title}</h1>
      <CollectForm form={form} />
    </>
  );
}
