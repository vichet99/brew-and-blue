import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, PageHead } from "@/components/ui";
import { forms, getForm } from "@/lib/data";
import { FormDesigner } from "./FormDesigner";

export function generateStaticParams() {
  return forms.map((f) => ({ code: f.code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return { title: `Designer: ${getForm(code)?.title ?? "Form"}` };
}

export default async function DesignerPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const form = getForm(code);
  if (!form) notFound();
  return (
    <>
      <Breadcrumbs items={[{ label: "Forms", href: "/forms" }, { label: form.code }]} />
      <PageHead caption={`UI-07 · Designer · draft of v${form.version + 1}`} title={form.title} />
      <FormDesigner form={form} />
    </>
  );
}
