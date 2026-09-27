import type { Metadata } from "next";
import { ActionsTable } from "@/components/ActionsTable";
import { PageHead } from "@/components/ui";
import { actionRows, ministryOptions } from "@/lib/rows";

export const metadata: Metadata = { title: "Policy actions" };

export default function ProjectsPage() {
  return (
    <>
      <PageHead caption="Project level · one project per policy action" title="Policy actions" />
      <p className="lead">
        The 44 strategic actions of the policy. The first ministry listed leads the action (owning programme); others contribute their own
        indicators. An action&apos;s % is the average of its indicators, each capped at 100.
      </p>
      <ActionsTable rows={actionRows()} ministryOptions={ministryOptions()} />
    </>
  );
}
