import type { Metadata } from "next";
import Link from "next/link";
import { fmtDate, PageHead, StatusTag, Table } from "@/components/ui";
import { forms, getProject } from "@/lib/data";

export const metadata: Metadata = { title: "Forms" };

export default function FormsPage() {
  return (
    <>
      <PageHead caption="UI-07" title="Forms" />
      <p className="lead">
        Each published version is frozen. Publishing a new version never changes how older submissions are read.
      </p>
      <Table caption="Forms">
        <thead>
          <tr>
            <th scope="col">Form</th>
            <th scope="col">Project</th>
            <th scope="col" className="num">Version</th>
            <th scope="col">Published</th>
            <th scope="col" className="num">Questions</th>
            <th scope="col">State</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {forms.map((f) => (
            <tr key={f.code}>
              <td>{f.title} <div className="small muted">{f.code}</div></td>
              <td>{getProject(f.project)?.name}</td>
              <td className="num">v{f.version}</td>
              <td className="nowrap">{fmtDate(f.published)}</td>
              <td className="num">{f.questions.length}</td>
              <td><StatusTag status={f.state} /></td>
              <td>
                <span className="btn-row">
                  <Link href={`/forms/${f.code}`}>Designer</Link>
                  <Link href={`/collect/${f.code}`}>Fill in</Link>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <h2>Question types in the pilot (R1)</h2>
      <p>
        Short text, long text, integer, decimal, date, single choice, multiple choice, yes/no, section and explanatory note. Evidence files attach
        through a separate upload control. Repeat groups, GPS and translated labels come in R2.
      </p>
    </>
  );
}
