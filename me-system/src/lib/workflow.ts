// Submission, review and form records for the Cashew example workspace.
// Reporting year 2025 records mirror the workbook (values from Kobo, reviewed
// by MoC, endorsed May 2026). Reporting year 2026 records are ILLUSTRATIVE:
// invented values used only to demonstrate the review workflow.

import {
  actionIndicators,
  indicatorsOfMinistry,
  koboPercentage,
  ministries,
  type ActionIndicator,
} from "./cashew";

export type SubmissionState = "Draft" | "Submitted" | "In review" | "Returned" | "Approved" | "Rejected" | "Superseded";

export interface SubmissionRow {
  indicator: string; // Indicator_xxx
  value: number | string | null;
  pct: number | null;
  narrative: string;
  evidence: string | null;
  feedback?: string;
}

export interface Submission {
  id: string;
  year: number;
  ministry: string;
  state: SubmissionState;
  submitted: string;
  respondentRole: string;
  illustrative: boolean;
  rows: SubmissionRow[];
  previous?: Record<string, number | string | null>; // prior revision values by indicator id
  returnReason?: string;
  reviewNote?: string;
  revision: number;
}

const ry2025: Submission[] = ministries.map((m) => ({
  id: `RY2025-${m.short.toUpperCase()}`,
  year: 2025,
  ministry: m.code,
  state: "Approved",
  submitted: "2026-05-11",
  respondentRole: `${m.short} M&E focal point`,
  illustrative: false,
  revision: 1,
  reviewNote: "OK (workbook 09_DATA_QUALITY_CHECK). Endorsed with the RY2025 annual report.",
  rows: indicatorsOfMinistry(m.code).map((i) => ({
    indicator: i.id,
    value: i.y2025.value,
    pct: i.y2025.actualPct,
    narrative: "N/A",
    evidence: null,
  })),
}));

function illustrative(
  ministry: string,
  state: SubmissionState,
  values: Record<string, { v: number | string | null; n: string; e?: string | null; f?: string }>,
  extra: Partial<Submission> = {},
): Submission {
  const code = ministries.find((m) => m.code === ministry)!.short.toUpperCase();
  return {
    id: `RY2026-${code}`,
    year: 2026,
    ministry,
    state,
    submitted: state === "Draft" ? "—" : "2027-03-24",
    respondentRole: `${code} M&E focal point`,
    illustrative: true,
    revision: 1,
    rows: indicatorsOfMinistry(ministry).map((i) => {
      const x = values[i.id] ?? { v: null, n: "" };
      return { indicator: i.id, value: x.v, pct: koboPercentage(i, x.v), narrative: x.n, evidence: x.e ?? null, feedback: x.f };
    }),
    ...extra,
  };
}

const mrdIds = indicatorsOfMinistry("mrd").map((i) => i.id);
const nbcIds = indicatorsOfMinistry("nbc").map((i) => i.id);
const mistiIds = indicatorsOfMinistry("misti").map((i) => i.id);

const ry2026: Submission[] = [
  illustrative(
    "mrd",
    "Submitted",
    {
      [mrdIds[0]]: { v: 131.2, n: "Illustrative: 9 further gravel roads completed in Kampong Thom and Preah Vihear.", e: "mrd-road-completion-2026.pdf" },
      [mrdIds[1]]: { v: 64, n: "Illustrative: drainage works on cashew access roads.", e: "mrd-drainage-2026.pdf" },
      [mrdIds[2]]: { v: 55, n: "", e: null, f: "Illustrative: rainy season delayed works." },
    },
  ),
  illustrative(
    "nbc",
    "Returned",
    {
      [nbcIds[0]]: { v: 45, n: "Illustrative: CGCC risk-sharing extended to two more banks.", e: "nbc-cgcc-2026.pdf" },
      [nbcIds[1]]: { v: 450, n: "Illustrative: lending to processors expanded.", e: null },
      [nbcIds[2]]: { v: 30, n: "Illustrative: consultation workshop held with banks.", e: "nbc-workshop-minutes.pdf" },
      [nbcIds[3]]: { v: 20, n: "", e: null },
    },
    { returnReason: "Illustrative: the second value (450) looks like a count, not a percentage (0–100). Please re-enter and attach evidence." },
  ),
  illustrative("misti", "Draft", {
    [mistiIds[0]]: { v: 80, n: "Illustrative draft.", e: null },
    [mistiIds[1]]: { v: 6, n: "", e: null },
  }),
];

export const submissions: Submission[] = [...ry2026, ...ry2025];
export const getSubmission = (id: string) => submissions.find((s) => s.id === id);

/** Automatic quality flags from the MoC verification rules (manual section 3.1 and 4.5). */
export function qualityFlags(s: Submission): { level: "blocking" | "warning"; text: string }[] {
  const flags: { level: "blocking" | "warning"; text: string }[] = [];
  const byId = new Map(actionIndicators.map((i) => [i.id, i]));
  for (const r of s.rows) {
    const i = byId.get(r.indicator) as ActionIndicator;
    if (r.value === null || r.value === "") {
      if (s.state !== "Draft") flags.push({ level: "blocking", text: `${i.code}: no value reported (missing assigned indicator)` });
      continue;
    }
    if (i.method === "percent_complete" && typeof r.value === "number" && (r.value < 0 || r.value > 100)) {
      flags.push({ level: "blocking", text: `${i.code}: ${r.value} is outside 0–100 for a percent-complete indicator` });
    }
    const prev = i.y2025.value;
    if (s.year > 2025 && typeof prev === "number" && typeof r.value === "number" && prev > 0 && r.value / prev >= 3) {
      flags.push({ level: "warning", text: `${i.code}: value is ${Math.round(r.value / prev)}× the 2025 figure. Check it is reasonable.` });
    }
    if ((r.pct ?? 0) < 100 && (!r.narrative || r.narrative === "N/A")) {
      flags.push({ level: "warning", text: `${i.code}: narrative missing while progress is below 100%` });
    }
    if (!r.evidence) flags.push({ level: "warning", text: `${i.code}: no evidence file` });
  }
  return flags;
}

// ---- processor survey (outcome level) ---------------------------------------

export interface FormQuestion {
  id: string;
  type: "short_text" | "long_text" | "integer" | "decimal" | "date" | "single_choice" | "multiple_choice" | "boolean" | "section" | "note";
  label: string;
  required?: boolean;
  min?: number;
  max?: number;
  choices?: string[];
  visibleWhen?: { field: string; operator: "eq"; value: string | boolean };
  hint?: string;
}

export interface FormDef {
  code: string;
  title: string;
  version: number;
  published: string;
  state: "Published" | "Draft" | "Retired";
  owner: string;
  questions: FormQuestion[];
}

export const processorSurvey: FormDef = {
  code: "processor-survey",
  title: "Cashew Processor Survey (outcome level)",
  version: 1,
  published: "2025-11-01",
  state: "Published",
  owner: "MoC M&E Secretariat",
  questions: [
    { id: "s_bg", type: "section", label: "Background" },
    { id: "report_year", type: "single_choice", label: "Reporting year", required: true, choices: ["2025", "2026", "2027"] },
    { id: "processor_id", type: "short_text", label: "Processor ID", required: true, hint: "As registered with MISTI, e.g. P-2025-001. One submission per plant per year." },
    { id: "province_facility", type: "short_text", label: "Province of the facility", required: true },
    { id: "plant_category", type: "single_choice", label: "Plant category", required: true, choices: ["Export-scale factory", "Medium processor", "Small / artisanal processor"] },
    { id: "is_operational", type: "boolean", label: "Was the plant operational during the reporting year?", required: true },
    { id: "s_proc", type: "section", label: "Processing (PR1)" },
    { id: "installed_capacity_tpy", type: "decimal", label: "Installed capacity (tonnes of RCN per year)", required: true, min: 0, max: 200000, visibleWhen: { field: "is_operational", operator: "eq", value: true } },
    { id: "rcn_processed_t", type: "decimal", label: "Raw cashew nuts processed this year (tonnes)", required: true, min: 0, max: 200000, visibleWhen: { field: "is_operational", operator: "eq", value: true } },
    { id: "n_proc", type: "note", label: "Capacity utilisation = processed ÷ installed capacity. MoC queries values above 110%." },
    { id: "s_cert", type: "section", label: "Certification (PR2)" },
    {
      id: "cert_current",
      type: "multiple_choice",
      label: "Which valid certificates does the plant hold?",
      required: true,
      choices: ["GMP / GHP", "HACCP", "ISO 22000", "FSSC 22000", "BRCGS", "IFS Food", "ISO 9001", "Halal", "Kosher", "EU organic", "USDA organic", "JAS organic", "Non-GMO", "Fairtrade", "CS 159:2015", "US FDA registration", "No certificate"],
    },
    { id: "s_q", type: "section", label: "Quality sample (Q1, Q2)" },
    { id: "sample_raw_kg", type: "decimal", label: "Raw nut sample weight (kg)", required: true, min: 0.1, max: 100 },
    { id: "sample_kernel_kg", type: "decimal", label: "Kernel weight from that sample (kg)", required: true, min: 0, max: 100, hint: "Outturn = kernel ÷ raw weight. Expected range 18–32%." },
    { id: "nut_count_per_kg", type: "integer", label: "Nut count (nuts per kg)", required: true, min: 50, max: 300, hint: "Lower is better (larger nuts)." },
    { id: "s_hr", type: "section", label: "Employment and inclusion (S2, S3)" },
    { id: "emp_fulltime_male", type: "integer", label: "Full-time workers, male", min: 0, max: 20000 },
    { id: "emp_fulltime_female", type: "integer", label: "Full-time workers, female", min: 0, max: 20000 },
    { id: "emp_season_total", type: "integer", label: "Seasonal workers (all)", min: 0, max: 50000 },
    { id: "season_months", type: "decimal", label: "Months worked by seasonal workers", min: 0, max: 12, hint: "FTE = headcount × (hours per week ÷ 40) × (months ÷ 12)." },
    { id: "managers_total", type: "integer", label: "Managers, total", required: true, min: 0, max: 1000 },
    { id: "managers_female", type: "integer", label: "Managers, female", required: true, min: 0, max: 1000 },
    { id: "has_comment", type: "boolean", label: "Anything else MoC should know?", required: true },
    { id: "comment", type: "long_text", label: "Comment", required: true, visibleWhen: { field: "has_comment", operator: "eq", value: true } },
  ],
};

export const forms = [
  {
    code: "cashew-indicator-report",
    title: "CASHEW INDICATOR REPORT (action level)",
    tool: "KoboToolbox XLSForm",
    level: "Action / output",
    who: "17 line-ministry focal points, once a year",
  },
  {
    code: "processor-survey",
    title: processorSurvey.title,
    tool: "KoboToolbox (Enketo)",
    level: "Outcome",
    who: "Cashew processors, once a year per plant",
  },
];
