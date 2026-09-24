// FICTIONAL DEMONSTRATION DATA (specification section 1.2 and 5.2).
// All names, targets, values, organisations and dates are test data and
// make no factual claim about any country, ministry or project.

export type Status = "active" | "planned" | "closed" | "archived";
export type Level = "impact" | "outcome" | "output";
export type Method = "count" | "sum" | "percentage" | "weighted_mean" | "latest_snapshot" | "milestone";
export type SubmissionState =
  | "Draft"
  | "Submitted"
  | "In review"
  | "Returned"
  | "Approved"
  | "Rejected"
  | "Superseded";
export type ObligationState = "Due" | "Submitted" | "Approved" | "Overdue" | "Not applicable" | "Waived";

export const workspace = {
  name: "Demonstration Workspace (fictional)",
  timezone: "Asia/Phnom_Penh",
  currentPeriod: "2026-Q3",
};

export const organisations = [
  { code: "MIN-AGR", name: "Department of Agricultural Markets", type: "Ministry department" },
  { code: "NGO-GRN", name: "GreenField Partners", type: "Implementing NGO" },
  { code: "COOP-RV", name: "River Valley Producers' Union", type: "Implementing partner" },
  { code: "MEU", name: "Central M&E Unit", type: "Ministry department" },
];

export interface Policy {
  code: string;
  name: string;
  description: string;
  status: Status;
  start: string;
  end: string;
  owner: string;
  accountable: string;
  objectives: { code: string; text: string }[];
}

export const policies: Policy[] = [
  {
    code: "POL-01",
    name: "Agricultural Market Access Policy",
    description:
      "Improve smallholder producers' access to reliable, higher-value markets through quality standards, storage and collective marketing.",
    status: "active",
    start: "2025-01-01",
    end: "2030-12-31",
    owner: "MIN-AGR",
    accountable: "Director, Agricultural Markets",
    objectives: [
      { code: "OBJ-1", text: "More producers meet recognised quality standards" },
      { code: "OBJ-2", text: "Post-harvest losses and time to market fall" },
      { code: "OBJ-3", text: "Producer organisations sell collectively to formal buyers" },
    ],
  },
];

export interface Programme {
  code: string;
  policy: string;
  name: string;
  description: string;
  status: Status;
  start: string;
  end: string;
  owner: string;
  manager: string;
  contributesTo: { policy: string; objective: string; rationale: string }[];
}

export const programmes: Programme[] = [
  {
    code: "PRG-A",
    policy: "POL-01",
    name: "Market Access Programme A",
    description: "Quality certification, training and cold-chain support for vegetable producers in three provinces.",
    status: "active",
    start: "2025-04-01",
    end: "2028-03-31",
    owner: "MIN-AGR",
    manager: "Sokha Demo (Programme manager)",
    contributesTo: [{ policy: "POL-01", objective: "OBJ-2", rationale: "Cold storage reduces post-harvest loss" }],
  },
  {
    code: "PRG-B",
    policy: "POL-01",
    name: "Rural Value Chain Programme B",
    description: "Strengthens producer cooperatives and links them to formal buyers.",
    status: "active",
    start: "2025-07-01",
    end: "2029-06-30",
    owner: "MIN-AGR",
    manager: "Dara Demo (Programme manager)",
    contributesTo: [],
  },
];

export interface Project {
  code: string;
  programme: string;
  name: string;
  description: string;
  status: Status;
  start: string;
  end: string;
  owner: string;
  officer: string;
  contributesTo: { programme: string; rationale: string }[];
}

export const projects: Project[] = [
  {
    code: "PRJ-A1",
    programme: "PRG-A",
    name: "Quality Support Project A1",
    description: "Trains producers on good agricultural practice and supports certification audits.",
    status: "active",
    start: "2025-06-01",
    end: "2027-12-31",
    owner: "NGO-GRN",
    officer: "Vanna Demo (Project officer)",
    contributesTo: [],
  },
  {
    code: "PRJ-A2",
    programme: "PRG-A",
    name: "Cold Storage Project A2",
    description: "Builds and operates three solar cold rooms at collection points.",
    status: "active",
    start: "2025-09-01",
    end: "2027-08-31",
    owner: "COOP-RV",
    officer: "Rithy Demo (Project officer)",
    contributesTo: [{ programme: "PRG-B", rationale: "Cold rooms are used by Programme B cooperatives" }],
  },
  {
    code: "PRJ-B1",
    programme: "PRG-B",
    name: "Cooperative Marketing Project B1",
    description: "Supports twelve cooperatives to negotiate supply agreements with formal buyers.",
    status: "planned",
    start: "2026-10-01",
    end: "2029-03-31",
    owner: "COOP-RV",
    officer: "Mealea Demo (Project officer)",
    contributesTo: [],
  },
];

export const activities = [
  { code: "ACT-A1-01", project: "PRJ-A1", title: "Good agricultural practice training, cohort 1", start: "2026-01-10", end: "2026-03-20", status: "Completed" },
  { code: "ACT-A1-02", project: "PRJ-A1", title: "Good agricultural practice training, cohort 2", start: "2026-07-01", end: "2026-09-30", status: "In progress" },
  { code: "ACT-A1-03", project: "PRJ-A1", title: "Certification audit support", start: "2026-04-01", end: "2027-06-30", status: "In progress" },
  { code: "ACT-A2-01", project: "PRJ-A2", title: "Cold room construction, site 1", start: "2025-10-01", end: "2026-06-30", status: "Completed" },
  { code: "ACT-A2-02", project: "PRJ-A2", title: "Cold room construction, sites 2 and 3", start: "2026-05-01", end: "2027-02-28", status: "In progress" },
  { code: "ACT-B1-01", project: "PRJ-B1", title: "Cooperative baseline assessment", start: "2026-10-01", end: "2026-12-15", status: "Not started" },
];

export interface Result {
  code: string;
  level: Level;
  statement: string;
  owner: string; // policy / programme / project code
  parent?: string;
  assumptions?: string;
}

export const results: Result[] = [
  { code: "IMP-1", level: "impact", owner: "POL-01", statement: "Smallholder incomes from market sales increase", assumptions: "Market prices remain stable" },
  { code: "OUT-1", level: "outcome", owner: "PRG-A", parent: "IMP-1", statement: "Producers meet recognised quality standards", assumptions: "Certification bodies keep audit capacity" },
  { code: "OUT-2", level: "outcome", owner: "PRG-A", parent: "IMP-1", statement: "Time from harvest to sale falls", assumptions: "Road access maintained in rainy season" },
  { code: "OP-1", level: "output", owner: "PRJ-A1", parent: "OUT-1", statement: "Producers trained in good agricultural practice" },
  { code: "OP-2", level: "output", owner: "PRJ-A1", parent: "OUT-1", statement: "Producers supported through certification" },
  { code: "OP-3", level: "output", owner: "PRJ-A2", parent: "OUT-2", statement: "Solar cold rooms operational at collection points" },
];

export interface Period {
  code: string;
  starts: string;
  ends: string;
}
export const periods: Period[] = [
  { code: "2026-Q1", starts: "2026-01-01", ends: "2026-03-31" },
  { code: "2026-Q2", starts: "2026-04-01", ends: "2026-06-30" },
  { code: "2026-Q3", starts: "2026-07-01", ends: "2026-09-30" },
];

export interface Observation {
  period: string;
  value: number | null;
  numerator?: number;
  denominator?: number;
  target: number | null;
  status: "Approved" | "Submitted" | "Draft" | "Not reported";
  stale?: boolean;
  sources?: string[];
}

export interface Indicator {
  code: string;
  title: string;
  result: string;
  level: Level;
  version: number;
  effectiveFrom: string;
  definition: string;
  unit: string;
  direction: "increase" | "decrease";
  method: Method;
  spatialRule: string;
  temporalRule: string;
  frequency: string;
  source: string;
  collection: string;
  responsible: string;
  reviewer: string;
  disaggregation: string[];
  limitations: string;
  evidence: string;
  baseline: { value: number | null; period: string; source: string; missingReason?: string };
  observations: Observation[];
  milestones?: { stage: string; done: boolean; criteria: string }[];
  project: string;
}

export const indicators: Indicator[] = [
  {
    code: "IND-01",
    title: "Training attendances",
    result: "OP-1",
    level: "output",
    version: 1,
    effectiveFrom: "2025-06-01",
    definition: "Number of attendances at good agricultural practice sessions. A person attending twice counts twice.",
    unit: "attendances",
    direction: "increase",
    method: "count",
    spatialRule: "Sum across sites (mutually exclusive sessions)",
    temporalRule: "Sum across quarters",
    frequency: "Quarterly",
    source: "Session attendance form",
    collection: "Native form: Activity report v2",
    responsible: "NGO-GRN",
    reviewer: "Central M&E Unit",
    disaggregation: ["Sex (exclusive, exhaustive, incl. not disclosed)", "Province"],
    limitations: "Counts attendances, not unique people. Use IND-02 for people certified.",
    evidence: "Signed attendance sheet photo per session",
    baseline: { value: 0, period: "2025-Q2", source: "Project start: no sessions held" },
    project: "PRJ-A1",
    observations: [
      { period: "2026-Q1", value: 212, target: 200, status: "Approved", sources: ["SUB-1041 r1", "SUB-1044 r2"] },
      { period: "2026-Q2", value: 80, target: 100, status: "Approved", sources: ["SUB-1052 r1"] },
      { period: "2026-Q3", value: 146, target: 200, status: "Submitted", sources: ["SUB-1063 r1"] },
    ],
  },
  {
    code: "IND-02",
    title: "Producers holding a valid quality certificate",
    result: "OUT-1",
    level: "outcome",
    version: 2,
    effectiveFrom: "2026-01-01",
    definition: "Unique producers with a certificate valid on the last day of the period. Cumulative snapshot.",
    unit: "producers",
    direction: "increase",
    method: "latest_snapshot",
    spatialRule: "Sum across provinces (a producer is registered in one province)",
    temporalRule: "Latest approved snapshot; never add quarters",
    frequency: "Quarterly",
    source: "Certification body register extract",
    collection: "Manual observation with evidence",
    responsible: "NGO-GRN",
    reviewer: "Central M&E Unit",
    disaggregation: ["Sex", "Province", "Certificate scheme"],
    limitations: "Depends on register completeness; lapsed certificates drop out.",
    evidence: "Register extract signed by certification body",
    baseline: { value: 18, period: "2025-Q4", source: "Register extract Dec 2025" },
    project: "PRJ-A1",
    observations: [
      { period: "2026-Q1", value: 40, target: 50, status: "Approved", sources: ["Manual: register 2026-03-31"] },
      { period: "2026-Q2", value: 70, target: 80, status: "Approved", stale: true, sources: ["Manual: register 2026-06-30"] },
      { period: "2026-Q3", value: null, target: 110, status: "Not reported" },
    ],
  },
  {
    code: "IND-03",
    title: "Share of sampled lots meeting quality grade A",
    result: "OUT-1",
    level: "outcome",
    version: 1,
    effectiveFrom: "2025-06-01",
    definition: "Lots graded A divided by all lots graded at participating collection points in the period.",
    unit: "% of graded lots",
    direction: "increase",
    method: "percentage",
    spatialRule: "Pool numerators and denominators; never average percentages",
    temporalRule: "Pool numerators and denominators across quarters",
    frequency: "Quarterly",
    source: "Collection point grading log",
    collection: "Native form: Grading log v1",
    responsible: "COOP-RV",
    reviewer: "Central M&E Unit",
    disaggregation: ["Collection point", "Crop"],
    limitations: "Covers participating collection points only; not a national estimate.",
    evidence: "Grading log export",
    baseline: { value: null, period: "2025-Q3", source: "—", missingReason: "Grading not recorded before project start" },
    project: "PRJ-A1",
    observations: [
      { period: "2026-Q1", value: 60, numerator: 30, denominator: 50, target: 55, status: "Approved", sources: ["SUB-1039 r1"] },
      { period: "2026-Q2", value: 20, numerator: 20, denominator: 100, target: 58, status: "Approved", sources: ["SUB-1050 r1"] },
      { period: "2026-Q3", value: null, target: 60, status: "Draft" },
    ],
  },
  {
    code: "IND-04",
    title: "Average days from harvest to sale",
    result: "OUT-2",
    level: "outcome",
    version: 1,
    effectiveFrom: "2025-09-01",
    definition: "Mean days between harvest and first sale for tracked lots, weighted by lot volume.",
    unit: "days",
    direction: "decrease",
    method: "weighted_mean",
    spatialRule: "Weighted mean using lot volume; keep weighted sum and total weight",
    temporalRule: "Weighted mean across quarters",
    frequency: "Quarterly",
    source: "Lot tracking sheet",
    collection: "Native form: Lot tracker v1",
    responsible: "COOP-RV",
    reviewer: "Central M&E Unit",
    disaggregation: ["Crop"],
    limitations: "Tracked lots are a convenience sample, not a statistical estimate.",
    evidence: "Lot tracking export",
    baseline: { value: 100, period: "2025-Q3", source: "Baseline lot tracking, 2025" },
    project: "PRJ-A2",
    observations: [
      { period: "2026-Q1", value: 92, target: 85, status: "Approved", sources: ["SUB-1040 r1"] },
      { period: "2026-Q2", value: 80, target: 70, status: "Approved", sources: ["SUB-1051 r1"] },
      { period: "2026-Q3", value: null, target: 60, status: "Not reported" },
    ],
  },
  {
    code: "IND-05",
    title: "Solar cold rooms operational",
    result: "OP-3",
    level: "output",
    version: 1,
    effectiveFrom: "2025-09-01",
    definition: "Cold rooms passing the commissioning checklist and storing produce.",
    unit: "milestone stages",
    direction: "increase",
    method: "milestone",
    spatialRule: "Reported per site",
    temporalRule: "Latest stage reached",
    frequency: "Quarterly",
    source: "Commissioning checklist",
    collection: "Manual observation with evidence",
    responsible: "COOP-RV",
    reviewer: "Central M&E Unit",
    disaggregation: ["Site"],
    limitations: "No weighted percentage: stage weights not approved by the M&E owner.",
    evidence: "Signed commissioning checklist and photos",
    baseline: { value: 0, period: "2025-Q3", source: "No cold rooms at project start" },
    project: "PRJ-A2",
    observations: [],
    milestones: [
      { stage: "Site 1 constructed", done: true, criteria: "Engineer sign-off" },
      { stage: "Site 1 commissioned", done: true, criteria: "Commissioning checklist passed" },
      { stage: "Sites 2 and 3 constructed", done: false, criteria: "Engineer sign-off" },
      { stage: "Sites 2 and 3 commissioned", done: false, criteria: "Commissioning checklist passed" },
    ],
  },
];

export interface Obligation {
  id: string;
  indicator: string;
  period: string;
  org: string;
  due: string;
  state: ObligationState;
  reason?: string;
}

export const obligations: Obligation[] = [
  { id: "OB-301", indicator: "IND-01", period: "2026-Q3", org: "NGO-GRN", due: "2026-10-15", state: "Submitted" },
  { id: "OB-302", indicator: "IND-02", period: "2026-Q3", org: "NGO-GRN", due: "2026-10-15", state: "Due" },
  { id: "OB-303", indicator: "IND-03", period: "2026-Q3", org: "COOP-RV", due: "2026-10-15", state: "Due" },
  { id: "OB-304", indicator: "IND-04", period: "2026-Q3", org: "COOP-RV", due: "2026-10-15", state: "Due" },
  { id: "OB-251", indicator: "IND-04", period: "2026-Q2", org: "COOP-RV", due: "2026-07-15", state: "Approved" },
  { id: "OB-252", indicator: "IND-05", period: "2026-Q2", org: "COOP-RV", due: "2026-07-15", state: "Overdue" },
  { id: "OB-253", indicator: "IND-03", period: "2026-Q2", org: "COOP-RV", due: "2026-07-15", state: "Waived", reason: "Grading suspended during flooding (approved by M&E Unit)" },
];

export interface Submission {
  id: string;
  form: string;
  project: string;
  owner: string;
  state: SubmissionState;
  revision: number;
  submitted: string;
  period: string;
  flags: string[];
  answers: Record<string, string | number | boolean>;
  previous?: Record<string, string | number | boolean>;
  returnReason?: string;
  evidence: { name: string; size: string; scan: "Clean" | "Pending scan" | "Rejected" }[];
}

export const submissions: Submission[] = [
  {
    id: "SUB-1063",
    form: "FRM-ACT",
    project: "PRJ-A1",
    owner: "Chan Demo (Data collector)",
    state: "Submitted",
    revision: 1,
    submitted: "2026-09-21 10:42",
    period: "2026-Q3",
    flags: [],
    answers: { activity_code: "ACT-A1-02", activity_date: "2026-09-20", attendance: 146, female: 81, male: 63, not_disclosed: 2, has_feedback: true, feedback: "Participants requested a follow-up session on pesticide storage." },
    evidence: [{ name: "attendance-sheet-0920.jpg", size: "2.1 MB", scan: "Clean" }],
  },
  {
    id: "SUB-1061",
    form: "FRM-ACT",
    project: "PRJ-A1",
    owner: "Chan Demo (Data collector)",
    state: "In review",
    revision: 2,
    submitted: "2026-09-18 16:05",
    period: "2026-Q3",
    flags: ["Disaggregation total differs from attendance (warning)"],
    answers: { activity_code: "ACT-A1-02", activity_date: "2026-09-12", attendance: 58, female: 30, male: 26, not_disclosed: 0, has_feedback: false },
    previous: { activity_code: "ACT-A1-02", activity_date: "2026-09-12", attendance: 85, female: 30, male: 26, not_disclosed: 0, has_feedback: false },
    returnReason: "Attendance 85 does not match the signed sheet (58). Please correct.",
    evidence: [{ name: "attendance-sheet-0912.pdf", size: "640 KB", scan: "Clean" }],
  },
  {
    id: "SUB-1058",
    form: "FRM-GRD",
    project: "PRJ-A1",
    owner: "Bopha Demo (Data collector)",
    state: "Returned",
    revision: 1,
    submitted: "2026-09-10 09:12",
    period: "2026-Q3",
    flags: ["Missing evidence (blocking)"],
    answers: { collection_point: "CP-03", lots_graded: 44, lots_grade_a: 19 },
    returnReason: "Please attach the grading log export for CP-03.",
    evidence: [],
  },
  {
    id: "SUB-1052",
    form: "FRM-ACT",
    project: "PRJ-A1",
    owner: "Chan Demo (Data collector)",
    state: "Approved",
    revision: 1,
    submitted: "2026-06-28 11:30",
    period: "2026-Q2",
    flags: [],
    answers: { activity_code: "ACT-A1-01", activity_date: "2026-06-27", attendance: 80, female: 42, male: 38, not_disclosed: 0, has_feedback: false },
    evidence: [{ name: "attendance-sheet-0627.jpg", size: "1.8 MB", scan: "Clean" }],
  },
  {
    id: "SUB-1049",
    form: "FRM-LOT",
    project: "PRJ-A2",
    owner: "Sophea Demo (Data collector)",
    state: "Rejected",
    revision: 1,
    submitted: "2026-06-20 14:02",
    period: "2026-Q2",
    flags: ["Duplicate candidate of SUB-1051"],
    answers: { lot_id: "LOT-2231", harvest_date: "2026-05-02", sale_date: "2026-07-21", volume_kg: 420 },
    returnReason: "Duplicate of SUB-1051 (same lot). Record retained, excluded from calculations.",
    evidence: [{ name: "lot-2231.csv", size: "12 KB", scan: "Clean" }],
  },
  {
    id: "SUB-1047",
    form: "FRM-LOT",
    project: "PRJ-A2",
    owner: "Sophea Demo (Data collector)",
    state: "Draft",
    revision: 1,
    submitted: "—",
    period: "2026-Q3",
    flags: [],
    answers: { lot_id: "LOT-2310", harvest_date: "2026-09-01" },
    evidence: [{ name: "lot-2310.csv", size: "9 KB", scan: "Pending scan" }],
  },
];

export interface FormQuestion {
  id: string;
  type:
    | "short_text"
    | "long_text"
    | "integer"
    | "decimal"
    | "date"
    | "single_choice"
    | "multiple_choice"
    | "boolean"
    | "section"
    | "note";
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
  project: string;
  title: string;
  version: number;
  published: string;
  state: "Published" | "Draft" | "Retired";
  questions: FormQuestion[];
}

export const forms: FormDef[] = [
  {
    code: "FRM-ACT",
    project: "PRJ-A1",
    title: "Activity report",
    version: 2,
    published: "2026-06-01",
    state: "Published",
    questions: [
      { id: "s_activity", type: "section", label: "Activity" },
      { id: "activity_code", type: "single_choice", label: "Activity", required: true, choices: ["ACT-A1-01", "ACT-A1-02", "ACT-A1-03"] },
      { id: "activity_date", type: "date", label: "Activity date", required: true },
      { id: "s_att", type: "section", label: "Attendance" },
      { id: "n_att", type: "note", label: "Count every attendance. A person attending two sessions counts twice." },
      { id: "attendance", type: "integer", label: "Attendances", required: true, min: 0, max: 10000 },
      { id: "female", type: "integer", label: "Of which female", min: 0, max: 10000 },
      { id: "male", type: "integer", label: "Of which male", min: 0, max: 10000 },
      { id: "not_disclosed", type: "integer", label: "Of which not disclosed", min: 0, max: 10000 },
      { id: "topics", type: "multiple_choice", label: "Topics covered", choices: ["Pesticide safety", "Soil health", "Record keeping", "Post-harvest handling"] },
      { id: "has_feedback", type: "boolean", label: "Any feedback from participants?", required: true },
      { id: "feedback", type: "long_text", label: "Feedback", required: true, visibleWhen: { field: "has_feedback", operator: "eq", value: true }, hint: "Shown only when the previous answer is Yes." },
    ],
  },
  {
    code: "FRM-GRD",
    project: "PRJ-A1",
    title: "Grading log",
    version: 1,
    published: "2025-06-15",
    state: "Published",
    questions: [
      { id: "collection_point", type: "short_text", label: "Collection point code", required: true },
      { id: "lots_graded", type: "integer", label: "Lots graded", required: true, min: 0 },
      { id: "lots_grade_a", type: "integer", label: "Lots graded A", required: true, min: 0 },
    ],
  },
  {
    code: "FRM-LOT",
    project: "PRJ-A2",
    title: "Lot tracker",
    version: 1,
    published: "2025-09-10",
    state: "Published",
    questions: [
      { id: "lot_id", type: "short_text", label: "Lot ID", required: true },
      { id: "harvest_date", type: "date", label: "Harvest date", required: true },
      { id: "sale_date", type: "date", label: "Sale date" },
      { id: "volume_kg", type: "decimal", label: "Volume (kg)", min: 0 },
    ],
  },
];

export const members = [
  { name: "Admin Demo", email: "admin@example.test", org: "MIN-AGR", role: "Workspace administrator", scope: "Workspace", status: "Active" },
  { name: "Sokha Demo", email: "sokha@example.test", org: "MIN-AGR", role: "Programme manager", scope: "PRG-A", status: "Active" },
  { name: "Reviewer Demo", email: "reviewer@example.test", org: "MEU", role: "M&E reviewer", scope: "PRG-A", status: "Active" },
  { name: "Vanna Demo", email: "vanna@example.test", org: "NGO-GRN", role: "Project officer", scope: "PRJ-A1", status: "Active" },
  { name: "Chan Demo", email: "chan@example.test", org: "NGO-GRN", role: "Data collector", scope: "FRM-ACT", status: "Active" },
  { name: "Viewer Demo", email: "viewer@example.test", org: "MIN-AGR", role: "Viewer", scope: "POL-01", status: "Active" },
  { name: "Former Demo", email: "former@example.test", org: "COOP-RV", role: "Data collector", scope: "FRM-LOT", status: "Deactivated" },
];

export const auditEvents = [
  { at: "2026-09-21 10:42", actor: "Chan Demo", action: "submission.submitted", resource: "SUB-1063 r1" },
  { at: "2026-09-19 08:15", actor: "Reviewer Demo", action: "submission.review_started", resource: "SUB-1061 r2" },
  { at: "2026-09-18 16:05", actor: "Chan Demo", action: "submission.resubmitted", resource: "SUB-1061 r2" },
  { at: "2026-09-15 13:40", actor: "Reviewer Demo", action: "submission.returned", resource: "SUB-1061 r1" },
  { at: "2026-09-12 09:02", actor: "Admin Demo", action: "grant.revoked", resource: "Former Demo / FRM-LOT" },
  { at: "2026-07-20 11:00", actor: "Reviewer Demo", action: "obligation.waived", resource: "OB-253" },
];

export const reports = [
  { id: "RPT-2026-Q2-A", title: "Programme A quarterly report, 2026-Q2", version: 1, published: "2026-07-25", state: "Published", asOf: "2026-07-24 17:00" },
  { id: "RPT-2026-Q1-A", title: "Programme A quarterly report, 2026-Q1", version: 2, published: "2026-05-02", state: "Published (supersedes v1)", asOf: "2026-05-01 12:00" },
  { id: "RPT-2026-Q1-A-v1", title: "Programme A quarterly report, 2026-Q1", version: 1, published: "2026-04-22", state: "Superseded", asOf: "2026-04-21 16:00" },
];

// ---- lookups -------------------------------------------------------------

export const orgName = (code: string) => organisations.find((o) => o.code === code)?.name ?? code;
export const getPolicy = (code: string) => policies.find((p) => p.code === code);
export const getProgramme = (code: string) => programmes.find((p) => p.code === code);
export const getProject = (code: string) => projects.find((p) => p.code === code);
export const getIndicator = (code: string) => indicators.find((i) => i.code === code);
export const getForm = (code: string) => forms.find((f) => f.code === code);
export const getSubmission = (id: string) => submissions.find((s) => s.id === id);
export const programmesOf = (policy: string) => programmes.filter((p) => p.policy === policy);
export const projectsOf = (programme: string) => projects.filter((p) => p.programme === programme);
export const indicatorsOf = (project: string) => indicators.filter((i) => i.project === project);
export const contributingProjects = (programme: string) =>
  projects.filter((p) => p.contributesTo.some((c) => c.programme === programme));

export function scopeName(code: string): string {
  return (
    getPolicy(code)?.name ??
    getProgramme(code)?.name ??
    getProject(code)?.name ??
    code
  );
}

export function scopeHref(code: string): string {
  if (getPolicy(code)) return `/policies/${code}`;
  if (getProgramme(code)) return `/programmes/${code}`;
  if (getProject(code)) return `/projects/${code}`;
  return "#";
}
