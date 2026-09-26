import type { Metadata } from "next";
import { PageHead, StatusTag, Table } from "@/components/ui";

export const metadata: Metadata = { title: "Brand guide" };

const groups: { name: string; role: string; swatches: [string, string, boolean][] }[] = [
  {
    name: "Blue (primary brand)",
    role: "Header, links, primary structure, charts",
    swatches: [
      ["Shade 50", "#0f385c", true],
      ["Shade 25", "#16548a", true],
      ["Shade 10 (links)", "#1a65a6", true],
      ["Primary", "#1d70b8", true],
      ["Tint 50", "#8eb8dc", false],
      ["Tint 80", "#d2e2f1", false],
      ["Tint 95 (surface)", "#f4f8fb", false],
    ],
  },
  {
    name: "Teal and accent",
    role: "Project level, secondary highlights; accent only as a small dot",
    swatches: [
      ["Teal shade 25", "#106165", true],
      ["Teal primary", "#158187", true],
      ["Teal tint 80", "#d0e6e7", false],
      ["Accent", "#00ffe0", false],
    ],
  },
  {
    name: "Status colours",
    role: "Always paired with an icon and text",
    swatches: [
      ["Green (success, start)", "#0f7a52", true],
      ["Red (error, overdue)", "#ca3535", true],
      ["Orange (returned, stale)", "#f47738", false],
      ["Purple (in review, visited)", "#54319f", true],
      ["Yellow (focus)", "#ffdd00", false],
    ],
  },
  {
    name: "Neutrals",
    role: "Text, borders, backgrounds",
    swatches: [
      ["Black (text)", "#0b0c0c", true],
      ["Black tint 25 (secondary)", "#484949", true],
      ["Black tint 80 (border)", "#cecece", false],
      ["Black tint 95", "#f3f3f3", false],
      ["White (page)", "#ffffff", false],
    ],
  },
];

export default function BrandPage() {
  return (
    <>
      <PageHead caption="Help" title="Brand and design tokens" />
      <p className="lead">
        The colour system follows the <strong>GOV.UK brand refresh launched in June 2025</strong>, one of the most thoroughly published public-sector
        brand guidelines of 2025–2026. It suits a calm administrative tool: white pages, near-black text, restrained blue, and a strong yellow focus
        state for keyboard users.
      </p>

      <div className="notice">
        <p>
          <strong>Why this reference:</strong> the guideline documents colour tints and shades, functional roles (text, links, focus, error, success)
          and tested accessible combinations, which matches specification section 10.1 (&ldquo;white background, charcoal text, restrained blue&rdquo;,
          WCAG 2.2 AA).
        </p>
        <p className="small">
          Only the colour values and patterns are reused. The crown logo and GDS Transport typeface are reserved for UK government services and are{" "}
          <strong>not</strong> used; this site has its own mark and a system font stack with Khmer fallback.
        </p>
      </div>

      {groups.map((g) => (
        <section key={g.name}>
          <h2>{g.name}</h2>
          <p className="muted">{g.role}</p>
          <div className="swatch-grid">
            {g.swatches.map(([label, hex, darkBg]) => (
              <div className="swatch" key={hex}>
                <div className="swatch__chip" style={{ background: hex, color: darkBg ? "#fff" : "#0b0c0c", padding: 8, fontWeight: 700 }}>
                  Aa
                </div>
                <div className="swatch__label">
                  <strong>{label}</strong>
                  <br />
                  <code>{hex}</code>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <h2>Level colours in this system</h2>
      <Table caption="Colour used to signal each level">
        <thead>
          <tr>
            <th scope="col">Level</th>
            <th scope="col">Token</th>
            <th scope="col">Where</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Policy</td><td><code>--blue-shade-50 #0f385c</code></td><td>Sitemap tier, impact results</td></tr>
          <tr><td>Programme</td><td><code>--blue #1d70b8</code></td><td>Sitemap tier, outcome cards</td></tr>
          <tr><td>Project</td><td><code>--teal-shade-25 #106165</code></td><td>Sitemap tier, project pages</td></tr>
          <tr><td>Cross-cutting</td><td><code>--black-tint-25 #484949</code></td><td>Review, admin</td></tr>
        </tbody>
      </Table>

      <h2>Status tags</h2>
      <p>Status never relies on colour alone: each tag carries an icon and a word.</p>
      <p className="btn-row">
        {["Draft", "Submitted", "In review", "Returned", "Approved", "Rejected", "Superseded", "Overdue", "Waived", "Not reported", "Stale"].map((s) => (
          <StatusTag key={s} status={s} />
        ))}
      </p>

      <h2>Type and spacing</h2>
      <ul>
        <li>Body text 16 px, line height 1.5; headings bold, tight line height.</li>
        <li>Spacing scale 4 / 8 / 16 / 24 / 32 / 48 px; content width 1280 px.</li>
        <li>Interactive targets at least 44 × 44 px; focus is a yellow <code>#ffdd00</code> highlight with a black underline.</li>
        <li>Buttons: green for the main action, grey for secondary, red for destructive or rejecting.</li>
      </ul>

      <h2>Sources</h2>
      <ul className="small">
        <li>
          GOV.UK Brand Guidelines, colour (2025): <a href="https://brand.design-system.service.gov.uk/colour">brand.design-system.service.gov.uk/colour</a>
        </li>
        <li>
          Design notes, how GDS refreshed the brand (Apr 2025):{" "}
          <a href="https://designnotes.blog.gov.uk/2025/04/04/how-we-refreshed-the-government-digital-service-brand-and-what-were-doing-differently">designnotes.blog.gov.uk</a>
        </li>
        <li>
          New colour palette decision record: <a href="https://github.com/alphagov/govuk-design-system/discussions/5048">alphagov/govuk-design-system discussion 5048</a>
        </li>
        <li>Hex values read from the published npm package <code>govuk-frontend@6.5.1</code> (settings/_colours-palette--internal.scss).</li>
      </ul>
    </>
  );
}
