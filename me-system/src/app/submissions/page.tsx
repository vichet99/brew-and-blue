import type { Metadata } from "next";
import { PageHead } from "@/components/ui";
import { SubmissionTable } from "./SubmissionTable";

export const metadata: Metadata = { title: "Submissions" };

export default function SubmissionsPage() {
  return (
    <>
      <PageHead caption="UI-09" title="Submissions" />
      <p className="lead">Every submission keeps its revisions. A submitted revision is locked; corrections create a new revision.</p>
      <SubmissionTable />
    </>
  );
}
