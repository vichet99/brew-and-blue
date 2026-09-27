"""Level 3 data dictionary for the Monitoring and Evaluation System.

Single source for docs/data-dictionary.xlsx (for review by the M&E Secretariat)
and docs/DATA_DICTIONARY.md (for developers). Table names match the Level 2
Figma diagram. Examples use the National Cashew Policy workspace.

Usage:  python3 scripts/build_data_dictionary.py
Status: DRAFT v0.1 for review, 27 Sep 2026. Nothing has been created in a database yet.
"""

import os

from openpyxl import Workbook
from openpyxl.comments import Comment
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

VERSION = "Draft v0.1 · 27 Sep 2026"
HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.join(HERE, "..", "docs")

# ---------------------------------------------------------------------------
# Tables: (family, table, diagram name, purpose, cashew example, pilot rows)
# ---------------------------------------------------------------------------
TABLES = [
    ("Structure", "workspaces", "new in Level 3", "One isolated customer environment. Every other table belongs to exactly one workspace.", "Cashew Policy M&E (MoC)", "1"),
    ("Structure", "policies", "POLICY", "A policy being monitored.", "NCP-2022 National Cashew Policy 2022–2027", "1"),
    ("Structure", "goals", "GOAL", "A goal (objective) of a policy.", "G2 Promote industrialisation: 25% processed by 2027", "3"),
    ("Structure", "clusters", "CLUSTER", "A group of actions delivering one goal.", "processing (actions 18–28)", "3"),
    ("Structure", "ministries", "MINISTRY", "A ministry or institution that implements or reports.", "maff · MAFF", "18"),
    ("Structure", "programmes", "PROGRAMME", "One programme per ministry under a policy; owns the actions that ministry leads.", "PRG-MAFF", "17"),
    ("Structure", "actions", "ACTION", "A policy action (the platform's 'project').", "ACT-02 Research on cashew varieties", "44"),
    ("Structure", "action_ministries", "ACTION_MINISTRY", "Which ministries lead or contribute to an action.", "ACT-05 · moe · contributing", "~60"),
    ("Indicators", "indicators", "INDICATOR", "Stable identity of an indicator (action or outcome level).", "AI-002 New cashew varieties released", "121"),
    ("Indicators", "indicator_versions", "INDICATOR_VERSION", "The definition of an indicator at a point in time. A change of meaning creates a new version.", "AI-002 v1 · count to target · varieties", "121+"),
    ("Indicators", "targets", "TARGET", "Target value for an indicator and year, with revision history.", "AI-002 · 2027 · 7", "108+"),
    ("Indicators", "baselines", "BASELINE", "Starting value for an indicator, or the reason it is unknown.", "P2 · 2022 · 508,283 t", "13+"),
    ("Indicators", "reporting_years", "REPORTING_YEAR", "A reporting period with its deadline and status thresholds.", "2026 · largely ≥ 70% · due 31 Mar 2027", "4"),
    ("Collection", "forms", "FORM", "A data collection form (native or Kobo).", "cashew-indicator-report", "2"),
    ("Collection", "form_versions", "FORM_VERSION", "A published, frozen version of a form.", "v2026051204", "2+"),
    ("Collection", "questions", "QUESTION", "One question in a form version, with English and Khmer labels.", "ind_002_value", "~650"),
    ("Collection", "submissions", "SUBMISSION", "One ministry's report for one reporting year.", "RY2025-MAFF", "17 / year"),
    ("Collection", "submission_revisions", "REVISION", "A version of a submission. Each correction adds one; submitted revisions never change.", "RY2025-MAFF r1", "~20 / year"),
    ("Collection", "answers", "ANSWER", "The answer to one indicator in one revision.", "AI-002 = 4 (57%)", "~120 / year"),
    ("Collection", "evidence_files", "EVIDENCE", "Details of an uploaded evidence file. The file itself is in private file storage.", "variety-release-2025.pdf", "~120 / year"),
    ("Review", "review_events", "REVIEW_EVENT", "A decision or query on a submission revision. Never edited or deleted.", "RY2026-NBC r1 · returned", "~50 / year"),
    ("Review", "quality_flags", "QUALITY_FLAG", "An automatic or manual data-quality warning on a revision.", "AI-030 · no evidence file", "~200 / year"),
    ("Results", "results", "RESULT", "The official value of an indicator for a year, from an approved answer or an administrative source.", "AI-002 · 2025 · 4 · largely achieved", "~121 / year"),
    ("Reports", "reports", "REPORT", "A report identity (e.g. the annual report).", "AR-2025 Annual report", "3"),
    ("Reports", "report_versions", "REPORT_VERSION", "A published, frozen snapshot of a report.", "AR-2025 v1 · 27 May 2026", "3+"),
    ("Users & access", "users", "APP_USER", "A person who can sign in.", "MAFF focal point", "~30"),
    ("Users & access", "memberships", "MEMBERSHIP", "A user's membership of a workspace and ministry.", "user · maff", "~30"),
    ("Users & access", "role_grants", "ROLE_GRANT", "A role given to a membership for a scope.", "focal · ministry maff", "~35"),
    ("Control", "audit_events", "AUDIT_EVENT", "Permanent record of important actions. Insert-only.", "submission.approved · RY2026-MRD", "thousands"),
]

COMMON = [
    ("id", "uuid", "PK", "Y", "", "Generated", "Unique identifier of the row.", "8f3c…"),
    ("workspace_id", "uuid", "FK", "Y", "workspaces.id", "Must match the parent row's workspace", "Which workspace the row belongs to. Not on workspaces itself.", "Cashew workspace"),
    ("created_at", "timestamptz", "", "Y", "", "UTC, set by the database", "When the row was created.", "2026-05-11 09:14 UTC"),
    ("created_by", "uuid", "FK", "N", "users.id", "Empty for imported/system rows", "Who created the row.", "Secretariat lead"),
    ("updated_at", "timestamptz", "", "Y", "", "UTC", "When the row last changed. Not on insert-only tables.", "2026-05-12 10:00 UTC"),
    ("row_version", "integer", "", "Y", "", "Starts at 1; +1 on every update", "Detects two people editing at once (stale edit is refused).", "3"),
]

# ---------------------------------------------------------------------------
# Fields per table: (field, type, key, required, references, rule, description, example)
# ---------------------------------------------------------------------------
F = {}
F["workspaces"] = [
    ("code", "text", "UK", "Y", "", "Unique, lowercase", "Short code.", "cashew-moc"),
    ("name", "text", "", "Y", "", "", "Display name.", "Cashew Policy M&E (MoC)"),
    ("timezone", "text", "", "Y", "", "IANA timezone", "Used for deadlines and period boundaries.", "Asia/Phnom_Penh"),
    ("default_language", "text", "", "Y", "", "en | km", "Default language of labels.", "km"),
    ("status", "text", "", "Y", "", "active | archived", "", "active"),
]
F["policies"] = [
    ("code", "text", "UK", "Y", "", "Unique in workspace", "Short code.", "NCP-2022"),
    ("name_en", "text", "", "Y", "", "", "Name in English.", "National Cashew Policy 2022–2027"),
    ("name_km", "text", "", "N", "", "", "Name in Khmer.", "គោលនយោបាយជាតិស្តីពីស្វាយចន្ទី…"),
    ("vision", "text", "", "N", "", "", "Vision statement.", "Develop cashew production, processing and markets…"),
    ("start_date", "date", "", "Y", "", "", "Policy start.", "2022-01-01"),
    ("end_date", "date", "", "Y", "", "≥ start_date", "Policy end.", "2027-12-31"),
    ("approved_on", "date", "", "N", "", "", "Approval date.", "2023-01-13"),
    ("approved_by", "text", "", "N", "", "", "Approving body.", "Council of Ministers"),
    ("owner_ministry_id", "uuid", "FK", "Y", "ministries.id", "", "Ministry accountable for the policy.", "moc"),
    ("status", "text", "", "Y", "", "draft | active | closed | archived", "", "active"),
]
F["goals"] = [
    ("policy_id", "uuid", "FK", "Y", "policies.id", "", "Policy the goal belongs to.", "NCP-2022"),
    ("code", "text", "UK", "Y", "", "Unique within the policy", "Short code.", "G2"),
    ("text_en", "text", "", "Y", "", "", "Goal statement in English.", "Promote industrialisation: 25% processed domestically by 2027"),
    ("text_km", "text", "", "N", "", "", "Goal statement in Khmer.", ""),
    ("sort_order", "integer", "", "Y", "", "", "Display order.", "2"),
]
F["clusters"] = [
    ("policy_id", "uuid", "FK", "Y", "policies.id", "", "Policy.", "NCP-2022"),
    ("goal_id", "uuid", "FK", "Y", "goals.id", "Goal in the same policy", "Goal the cluster delivers.", "G2"),
    ("code", "text", "UK", "Y", "", "Unique within the policy", "Short code.", "processing"),
    ("name_en", "text", "", "Y", "", "", "Name.", "Processing"),
    ("name_km", "text", "", "N", "", "", "Name in Khmer.", ""),
    ("sort_order", "integer", "", "Y", "", "", "Display order.", "2"),
]
F["ministries"] = [
    ("code", "text", "UK", "Y", "", "Lowercase; never change once used (join key across years)", "Stable code, same as the Kobo choice name.", "maff"),
    ("short_name", "text", "", "Y", "", "", "Abbreviation.", "MAFF"),
    ("name_en", "text", "", "Y", "", "", "Full name in English.", "Ministry of Agriculture, Forestry and Fisheries"),
    ("name_km", "text", "", "N", "", "", "Full name in Khmer.", "ក្រសួងកសិកម្ម រុក្ខាប្រមាញ់ និងនេសាទ"),
    ("type", "text", "", "Y", "", "ministry | institution | secretariat | partner", "", "ministry"),
    ("status", "text", "", "Y", "", "active | archived", "Archive instead of delete.", "active"),
]
F["programmes"] = [
    ("policy_id", "uuid", "FK", "Y", "policies.id", "", "Owning policy.", "NCP-2022"),
    ("ministry_id", "uuid", "FK", "Y", "ministries.id", "One programme per ministry per policy", "Ministry running the programme.", "maff"),
    ("code", "text", "UK", "Y", "", "Unique in workspace", "Short code.", "PRG-MAFF"),
    ("name_en", "text", "", "Y", "", "", "Name.", "MAFF cashew policy programme"),
    ("start_date", "date", "", "N", "", "Within the policy period (warning if outside)", "", "2022-01-01"),
    ("end_date", "date", "", "N", "", "≥ start_date", "", "2027-12-31"),
    ("status", "text", "", "Y", "", "draft | active | closed | archived", "", "active"),
]
F["actions"] = [
    ("programme_id", "uuid", "FK", "Y", "programmes.id", "", "Owning programme = lead ministry's programme.", "PRG-MAFF"),
    ("cluster_id", "uuid", "FK", "Y", "clusters.id", "Cluster in the same policy", "Cluster the action belongs to.", "production"),
    ("number", "integer", "UK", "Y", "", "Unique within the policy (1–44)", "Action number in the policy matrix.", "2"),
    ("code", "text", "UK", "Y", "", "Unique in workspace", "Short code.", "ACT-02"),
    ("title_en", "text", "", "Y", "", "", "Action text in English.", "Continue to conduct scientific research on cashew varieties…"),
    ("title_km", "text", "", "N", "", "", "Action text in Khmer.", ""),
    ("responsible_text", "text", "", "N", "", "", "Responsible institutions as written in the policy/MTR.", "MAFF"),
    ("status", "text", "", "Y", "", "planned | active | completed | archived", "", "active"),
]
F["action_ministries"] = [
    ("action_id", "uuid", "FK", "Y", "actions.id", "Unique with ministry_id", "Action.", "ACT-05"),
    ("ministry_id", "uuid", "FK", "Y", "ministries.id", "", "Ministry involved.", "moe"),
    ("role", "text", "", "Y", "", "lead | contributing; exactly one lead per action", "Its role in the action.", "contributing"),
]
F["indicators"] = [
    ("code", "text", "UK", "Y", "", "Unique in workspace", "Stable code, never reused.", "AI-002"),
    ("external_id", "text", "", "N", "", "", "ID in the source system.", "Indicator_002"),
    ("level", "text", "", "Y", "", "action | outcome", "Monitoring level.", "action"),
    ("action_id", "uuid", "FK", "N", "actions.id", "Required when level = action; empty for outcome", "Action measured.", "ACT-02"),
    ("goal_id", "uuid", "FK", "N", "goals.id", "Used for outcome indicators", "Goal the outcome indicator tracks.", "G1 (for P2)"),
    ("reporting_ministry_id", "uuid", "FK", "N", "ministries.id", "Required when level = action", "The one ministry that reports this indicator.", "maff"),
    ("area", "text", "", "N", "", "production | quality | processing | market | socio-economic", "Outcome area.", "production (for P2)"),
    ("active_version_id", "uuid", "FK", "Y", "indicator_versions.id", "A version of this indicator", "Current definition.", "AI-002 v1"),
    ("status", "text", "", "Y", "", "active | retired", "Retire instead of delete.", "active"),
]
F["indicator_versions"] = [
    ("indicator_id", "uuid", "FK", "Y", "indicators.id", "Unique with version_no", "Indicator.", "AI-002"),
    ("version_no", "integer", "UK", "Y", "", "1, 2, 3…", "Version number.", "1"),
    ("label_en", "text", "", "Y", "", "", "Indicator wording in English.", "New cashew varieties have been released for use."),
    ("label_km", "text", "", "N", "", "", "Indicator wording in Khmer.", "ប្រភេទពូជស្វាយចន្ទីបានបញ្ចេញឱ្យប្រើប្រាស់"),
    ("unit", "text", "", "Y", "", "", "Unit of measure.", "varieties"),
    ("method", "text", "", "Y", "", "See Allowed values: method", "How % of target is calculated.", "count_to_target"),
    ("direction", "text", "", "Y", "", "increase | decrease", "Which way is better.", "increase"),
    ("formula_text", "text", "", "N", "", "Documentation only; never executed", "Formula as written in the Kobo form.", "round(value ÷ 7 × 100)"),
    ("frequency", "text", "", "Y", "", "annual | quarterly", "", "annual"),
    ("data_source", "text", "", "N", "", "", "Where the value comes from.", "Ministry annual Kobo report"),
    ("disaggregation", "text", "", "N", "", "", "Breakdowns required.", "none"),
    ("limitations", "text", "", "N", "", "", "Known limits of the indicator.", ""),
    ("effective_from", "date", "", "Y", "", "", "Date this definition applies from.", "2025-01-01"),
    ("change_note", "text", "", "N", "", "Required from version 2", "Why the definition changed.", ""),
    ("locked", "boolean", "", "Y", "", "True once any result uses it; locked rows cannot change", "Protects historic results.", "true"),
]
F["targets"] = [
    ("indicator_id", "uuid", "FK", "Y", "indicators.id", "", "Indicator.", "AI-002"),
    ("year", "integer", "", "Y", "", "", "Target year.", "2027"),
    ("revision_no", "integer", "UK", "Y", "", "Unique with indicator and year", "Revision of this target.", "1"),
    ("value", "numeric", "", "N", "", "Empty for milestone indicators", "Target value.", "7"),
    ("target_text", "text", "", "Y", "", "", "Target as written.", "7 varieties by 2027"),
    ("is_current", "boolean", "", "Y", "", "Only one current per indicator and year", "The target in force.", "true"),
    ("reason", "text", "", "N", "", "Required from revision 2", "Why the target was revised.", ""),
    ("approved_by", "uuid", "FK", "N", "users.id", "", "Who approved the target.", "Secretariat lead"),
]
F["baselines"] = [
    ("indicator_id", "uuid", "FK", "Y", "indicators.id", "", "Indicator.", "P2"),
    ("year", "integer", "", "Y", "", "", "Baseline year.", "2022"),
    ("value", "numeric", "", "N", "", "Value OR missing_reason must be filled; zero is a real value", "Baseline value.", "508283"),
    ("missing_reason", "text", "", "N", "", "", "Why the baseline is unknown.", "No survey before 2025 (Q1)"),
    ("source", "text", "", "Y", "", "", "Where it comes from.", "MAFF Yearbook"),
    ("evidence_file_id", "uuid", "FK", "N", "evidence_files.id", "", "Supporting file.", ""),
]
F["reporting_years"] = [
    ("year", "integer", "UK", "Y", "", "Unique in workspace", "Reporting year.", "2026"),
    ("starts_on", "date", "", "Y", "", "", "Period start.", "2026-01-01"),
    ("ends_on", "date", "", "Y", "", "≥ starts_on", "Period end.", "2026-12-31"),
    ("deadline", "date", "", "Y", "", "", "Submission deadline.", "2027-03-31"),
    ("largely_threshold_pct", "numeric", "", "Y", "", "0–100", "Minimum % for 'Largely achieved'.", "70"),
    ("fully_threshold_pct", "numeric", "", "Y", "", "0–100, ≥ largely", "Minimum % for 'Fully achieved'.", "100"),
    ("status", "text", "", "Y", "", "upcoming | open | verification | closed", "Where the cycle is.", "upcoming"),
]
F["forms"] = [
    ("code", "text", "UK", "Y", "", "Unique in workspace", "Short code.", "cashew-indicator-report"),
    ("title_en", "text", "", "Y", "", "", "Title.", "CASHEW INDICATOR REPORT"),
    ("title_km", "text", "", "N", "", "", "Title in Khmer.", ""),
    ("level", "text", "", "Y", "", "action | outcome", "Which monitoring level it feeds.", "action"),
    ("channel", "text", "", "Y", "", "native | kobo", "Where respondents fill it.", "kobo"),
    ("kobo_asset_id", "text", "", "N", "", "Required when channel = kobo", "Kobo project ID.", "aB3dE…"),
    ("active_version_id", "uuid", "FK", "N", "form_versions.id", "", "Version currently collected.", "v2026051204"),
    ("status", "text", "", "Y", "", "draft | published | retired", "", "published"),
]
F["form_versions"] = [
    ("form_id", "uuid", "FK", "Y", "forms.id", "Unique with version_label", "Form.", "cashew-indicator-report"),
    ("version_label", "text", "UK", "Y", "", "", "Version as shown to users.", "2026051204"),
    ("schema_json", "jsonb", "", "Y", "", "Frozen once published", "Full question structure.", "{…}"),
    ("schema_hash", "text", "", "Y", "", "SHA-256 of schema_json", "Proves the schema did not change.", "9e1c…"),
    ("published_at", "timestamptz", "", "N", "", "", "When published.", "2026-05-12"),
    ("published_by", "uuid", "FK", "N", "users.id", "", "Who published it.", "Secretariat lead"),
    ("change_note", "text", "", "N", "", "", "What changed.", "Added 2025 progress hints"),
]
F["questions"] = [
    ("form_version_id", "uuid", "FK", "Y", "form_versions.id", "Unique with field_name", "Form version.", "v2026051204"),
    ("field_name", "text", "UK", "Y", "", "Letters, digits, underscore; never reused with a new meaning", "Stable field ID.", "ind_002_value"),
    ("indicator_id", "uuid", "FK", "N", "indicators.id", "", "Indicator this question measures.", "AI-002"),
    ("purpose", "text", "", "Y", "", "value | percentage | narrative | evidence | challenge | respondent | other", "Role of the question.", "value"),
    ("type", "text", "", "Y", "", "See Allowed values: question type", "Answer type.", "integer"),
    ("label_en", "text", "", "Y", "", "", "Question in English.", "How many cashew varieties were officially registered…"),
    ("label_km", "text", "", "N", "", "", "Question in Khmer.", "តើចំនួនពូជស្វាយចន្ទីថ្មី…"),
    ("hint_en", "text", "", "N", "", "", "Help text.", "2025 reported progress: 4."),
    ("required", "boolean", "", "Y", "", "", "Must be answered when visible.", "true"),
    ("constraint_rule", "text", "", "N", "", "Allowlisted operators only; never executed as code", "Validation rule.", ". >= 0 and . <= 99"),
    ("visible_when", "jsonb", "", "N", "", "", "Condition for showing the question.", "{\"field\":\"reporting_ministry\",\"eq\":\"maff\"}"),
    ("sort_order", "integer", "", "Y", "", "", "Position in the form.", "12"),
]
F["submissions"] = [
    ("code", "text", "UK", "Y", "", "Unique in workspace", "Readable ID.", "RY2025-MAFF"),
    ("ministry_id", "uuid", "FK", "Y", "ministries.id", "Unique with reporting_year_id and form_id", "Reporting ministry.", "maff"),
    ("reporting_year_id", "uuid", "FK", "Y", "reporting_years.id", "", "Year reported on.", "2025"),
    ("form_id", "uuid", "FK", "Y", "forms.id", "", "Form used.", "cashew-indicator-report"),
    ("state", "text", "", "Y", "", "See Allowed values: submission state", "Current workflow state.", "approved"),
    ("current_revision_id", "uuid", "FK", "N", "submission_revisions.id", "", "Latest revision.", "RY2025-MAFF r1"),
    ("approved_revision_id", "uuid", "FK", "N", "submission_revisions.id", "", "Revision that was approved.", "RY2025-MAFF r1"),
    ("source", "text", "", "Y", "", "native | kobo_import", "How it arrived.", "kobo_import"),
    ("kobo_submission_id", "text", "", "N", "", "Unique per form when present", "Kobo record ID, prevents duplicate imports.", "200001"),
    ("is_illustrative", "boolean", "", "Y", "", "Default false", "Demo/training record excluded from official figures.", "false"),
]
F["submission_revisions"] = [
    ("submission_id", "uuid", "FK", "Y", "submissions.id", "Unique with revision_no", "Submission.", "RY2025-MAFF"),
    ("revision_no", "integer", "UK", "Y", "", "1, 2, 3…", "Revision number.", "1"),
    ("form_version_id", "uuid", "FK", "Y", "form_versions.id", "", "Form version answered.", "v2026051204"),
    ("state", "text", "", "Y", "", "draft | submitted | in_review | returned | approved | rejected | superseded", "State of this revision.", "approved"),
    ("respondent_name", "text", "", "N", "", "Personal data: visible to M&E team only", "Person who filled it.", "(focal point name)"),
    ("respondent_phone", "text", "", "N", "", "Personal data: visible to M&E team only", "Contact number.", "(hidden)"),
    ("entered_by", "uuid", "FK", "N", "users.id", "", "Platform user who entered it.", "MAFF focal point"),
    ("submitted_at", "timestamptz", "", "N", "", "Set when submitted; then the revision is locked", "When submitted.", "2026-03-24 10:42"),
    ("payload_hash", "text", "", "N", "", "SHA-256 of all answers", "Proves answers did not change after submission.", "4b7a…"),
    ("raw_payload", "jsonb", "", "N", "", "Visible to M&E team only", "Original Kobo record, for traceability.", "{…}"),
]
F["answers"] = [
    ("revision_id", "uuid", "FK", "Y", "submission_revisions.id", "Unique with indicator_id", "Revision.", "RY2025-MAFF r1"),
    ("indicator_id", "uuid", "FK", "Y", "indicators.id", "Indicator must be assigned to the submitting ministry", "Indicator answered.", "AI-002"),
    ("indicator_version_id", "uuid", "FK", "Y", "indicator_versions.id", "", "Definition in force when answered.", "AI-002 v1"),
    ("value_number", "numeric", "", "N", "", "One of value_number / value_choice, unless not reported", "Numeric answer.", "4"),
    ("value_choice", "text", "", "N", "", "completed | in_progress | not_started", "Milestone answer.", ""),
    ("pct_of_target", "numeric", "", "N", "", "Calculated by the server, never typed", "% of the 2027 target (not capped).", "57"),
    ("narrative", "text", "", "N", "", "Required when pct < 100", "Progress and key achievements.", "Four varieties released: M-23, M-10, IM-4, H-09"),
    ("challenges", "text", "", "N", "", "", "Challenges and solutions.", "Three varieties still under trial"),
    ("not_reported_reason", "text", "", "N", "", "", "Why no value.", ""),
]
F["evidence_files"] = [
    ("answer_id", "uuid", "FK", "N", "answers.id", "", "Answer supported.", "AI-002 answer"),
    ("file_name", "text", "", "Y", "", "Display only, never used as a path", "Original file name.", "variety-release-2025.pdf"),
    ("storage_key", "text", "UK", "Y", "", "Generated; private bucket", "Location in file storage.", "ws/…/9f2a.pdf"),
    ("mime_type", "text", "", "Y", "", "Allowlist: pdf, jpg, png, xlsx, docx, csv", "File type (checked from content).", "application/pdf"),
    ("size_bytes", "bigint", "", "Y", "", "≤ 10 MB (configurable)", "File size.", "640000"),
    ("sha256", "text", "", "Y", "", "", "Fingerprint of the file.", "a31f…"),
    ("scan_status", "text", "", "Y", "", "pending | clean | rejected", "Virus/content scan result; only clean files download.", "clean"),
    ("classification", "text", "", "Y", "", "internal | restricted", "Sensitivity.", "internal"),
    ("source", "text", "", "Y", "", "upload | kobo_import", "How it arrived.", "kobo_import"),
    ("uploaded_by", "uuid", "FK", "N", "users.id", "", "Who uploaded.", "MAFF focal point"),
]
F["review_events"] = [
    ("revision_id", "uuid", "FK", "Y", "submission_revisions.id", "", "Revision reviewed.", "RY2026-NBC r1"),
    ("action", "text", "", "Y", "", "See Allowed values: review action", "What happened.", "returned"),
    ("actor_id", "uuid", "FK", "Y", "users.id", "Must not be the revision's entered_by when approving", "Reviewer.", "Secretariat officer"),
    ("reason", "text", "", "N", "", "Required for returned and rejected (≥ 10 characters)", "Query or reason.", "Value 450 looks like a count, not a percentage"),
    ("checks_completed", "jsonb", "", "N", "", "Required for approved: all four checks", "Verification checks ticked.", "[reasonable, consistent, evidence, assignment]"),
    ("affected_indicators", "jsonb", "", "N", "", "", "Indicators the query is about.", "[AI-023]"),
]
F["quality_flags"] = [
    ("revision_id", "uuid", "FK", "Y", "submission_revisions.id", "", "Revision flagged.", "RY2026-MRD r1"),
    ("answer_id", "uuid", "FK", "N", "answers.id", "", "Specific answer, if any.", "AI-030 answer"),
    ("rule_code", "text", "", "Y", "", "See Allowed values: flag rule", "Rule triggered.", "missing_evidence"),
    ("level", "text", "", "Y", "", "warning | blocking", "Blocking flags prevent approval.", "warning"),
    ("message", "text", "", "Y", "", "", "Explanation shown to the reviewer.", "AI-030: no evidence file"),
    ("status", "text", "", "Y", "", "open | resolved | accepted", "", "open"),
    ("resolved_by", "uuid", "FK", "N", "users.id", "", "Who resolved it.", ""),
    ("resolution_note", "text", "", "N", "", "Required when resolved or accepted", "How it was resolved.", ""),
]
F["results"] = [
    ("indicator_id", "uuid", "FK", "Y", "indicators.id", "", "Indicator.", "AI-002"),
    ("reporting_year_id", "uuid", "FK", "Y", "reporting_years.id", "", "Year.", "2025"),
    ("revision_no", "integer", "", "Y", "", "", "Revision of this result.", "1"),
    ("indicator_version_id", "uuid", "FK", "Y", "indicator_versions.id", "", "Definition used.", "AI-002 v1"),
    ("target_id", "uuid", "FK", "N", "targets.id", "", "Target revision used.", "AI-002 2027 r1"),
    ("value", "numeric", "", "N", "", "Empty = no data (never shown as zero)", "Official value.", "4"),
    ("value_choice", "text", "", "N", "", "", "Milestone value.", ""),
    ("pct_of_target", "numeric", "", "N", "", "", "Actual % (not capped).", "57"),
    ("status", "text", "", "N", "", "fully_achieved | largely_achieved | limited_progress", "Status with that year's thresholds (capped at 100 for status).", "largely_achieved"),
    ("source_type", "text", "", "Y", "", "answer | administrative | survey | computed", "Where the value comes from.", "answer"),
    ("source_answer_id", "uuid", "FK", "N", "answers.id", "Required when source_type = answer", "Approved answer used.", "RY2025-MAFF r1 · AI-002"),
    ("source_note", "text", "", "N", "", "Required when not from an answer", "Source description.", "MAFF Yearbook 2025 (for P2)"),
    ("state", "text", "", "Y", "", "approved | superseded", "Only one approved per indicator and year.", "approved"),
    ("is_test_data", "boolean", "", "Y", "", "Default false", "Marks indicative/test values.", "false (true for Q1 2025)"),
    ("stale", "boolean", "", "Y", "", "Default false", "Source was corrected after approval; needs re-approval.", "false"),
    ("approved_by", "uuid", "FK", "N", "users.id", "", "Who approved.", "Secretariat officer"),
    ("approved_at", "timestamptz", "", "N", "", "", "When approved.", "2026-05-11"),
]
F["reports"] = [
    ("code", "text", "UK", "Y", "", "Unique in workspace", "Short code.", "AR-2025"),
    ("title_en", "text", "", "Y", "", "", "Title.", "Annual report, reporting year 2025"),
    ("type", "text", "", "Y", "", "annual | mtr | outcome | other", "", "annual"),
    ("reporting_year_id", "uuid", "FK", "N", "reporting_years.id", "", "Year covered.", "2025"),
    ("scope", "text", "", "Y", "", "policy | programme | action", "What it covers.", "policy"),
]
F["report_versions"] = [
    ("report_id", "uuid", "FK", "Y", "reports.id", "Unique with version_no", "Report.", "AR-2025"),
    ("version_no", "integer", "UK", "Y", "", "", "Version number.", "1"),
    ("state", "text", "", "Y", "", "draft | published | superseded", "", "published"),
    ("as_of", "timestamptz", "", "Y", "", "", "Data cut-off time.", "2026-05-24 17:00"),
    ("snapshot_json", "jsonb", "", "Y", "", "Frozen once published", "All figures, targets and definitions used.", "{…}"),
    ("manifest_hash", "text", "", "Y", "", "", "Proves the snapshot did not change.", "c09d…"),
    ("published_at", "timestamptz", "", "N", "", "", "When published.", "2026-05-27"),
    ("published_by", "uuid", "FK", "N", "users.id", "", "Who published.", "Secretariat lead"),
    ("supersedes_id", "uuid", "FK", "N", "report_versions.id", "", "Earlier version it replaces.", ""),
    ("pdf_file_id", "uuid", "FK", "N", "evidence_files.id", "", "Printable copy.", ""),
]
F["users"] = [
    ("auth_user_id", "text", "UK", "Y", "", "From the sign-in service", "Link to the login account.", "auth|…"),
    ("email", "text", "UK", "Y", "", "Personal data", "Sign-in email.", "focal.maff@example.gov.kh"),
    ("full_name", "text", "", "Y", "", "Personal data", "Name.", "(name)"),
    ("phone", "text", "", "N", "", "Personal data", "Phone.", ""),
    ("preferred_language", "text", "", "Y", "", "en | km", "Interface language.", "km"),
    ("status", "text", "", "Y", "", "invited | active | deactivated", "Deactivate, never delete.", "active"),
    ("last_sign_in_at", "timestamptz", "", "N", "", "", "", "2026-09-20"),
]
F["memberships"] = [
    ("user_id", "uuid", "FK", "Y", "users.id", "Unique with workspace_id", "User.", "MAFF focal point"),
    ("ministry_id", "uuid", "FK", "Y", "ministries.id", "", "Ministry the person works for.", "maff"),
    ("job_title", "text", "", "N", "", "", "Position.", "Deputy Director, Planning"),
    ("status", "text", "", "Y", "", "active | deactivated", "Deactivated members lose access immediately.", "active"),
]
F["role_grants"] = [
    ("membership_id", "uuid", "FK", "Y", "memberships.id", "", "Membership.", "MAFF focal point"),
    ("role", "text", "", "Y", "", "admin | reviewer | focal | viewer", "Pilot role.", "focal"),
    ("scope_type", "text", "", "Y", "", "workspace | ministry | policy", "What the role applies to.", "ministry"),
    ("scope_ministry_id", "uuid", "FK", "N", "ministries.id", "Required when scope_type = ministry", "Ministry in scope.", "maff"),
    ("scope_policy_id", "uuid", "FK", "N", "policies.id", "Required when scope_type = policy", "Policy in scope.", ""),
    ("granted_by", "uuid", "FK", "Y", "users.id", "", "Administrator who granted it.", "Secretariat lead"),
    ("valid_from", "date", "", "Y", "", "", "", "2026-10-01"),
    ("valid_to", "date", "", "N", "", "", "Empty = no end date.", ""),
]
F["audit_events"] = [
    ("actor_id", "uuid", "FK", "N", "users.id", "Empty for system jobs", "Who acted.", "Secretariat officer"),
    ("action", "text", "", "Y", "", "dot.notation, e.g. submission.approved", "What happened.", "submission.approved"),
    ("record_type", "text", "", "Y", "", "", "Kind of record affected.", "submission_revision"),
    ("record_id", "uuid", "", "Y", "", "", "Record affected.", "RY2026-MRD r1"),
    ("reason", "text", "", "N", "", "Required for exceptional access", "Why.", ""),
    ("metadata", "jsonb", "", "N", "", "No sensitive values", "Extra details.", "{\"from\":\"submitted\",\"to\":\"approved\"}"),
    ("request_id", "text", "", "N", "", "", "Links to technical logs.", "req_7f2…"),
    ("occurred_at", "timestamptz", "", "Y", "", "Insert-only: no updates or deletes", "When.", "2026-09-26 10:12 UTC"),
]

NO_WORKSPACE = {"workspaces"}
INSERT_ONLY = {"review_events", "audit_events"}

ENUMS = [
    ("role", "admin", "Administrator (M&E manager); may also review"),
    ("role", "reviewer", "Reviewer"),
    ("role", "focal", "Ministry focal point (own ministry only)"),
    ("role", "viewer", "Viewer (Committee): approved figures only"),
    ("submission state", "draft", "Being filled; not visible to reviewers"),
    ("submission state", "submitted", "Sent to MoC; locked"),
    ("submission state", "in_review", "A reviewer is checking it"),
    ("submission state", "returned", "Query sent; ministry must correct (new revision)"),
    ("submission state", "approved", "Accepted; values become official results"),
    ("submission state", "rejected", "Not accepted; kept for the record"),
    ("submission state", "superseded", "Replaced by a later approved revision"),
    ("review action", "review_started", "Reviewer opened the revision"),
    ("review action", "returned", "Query sent back (reason required)"),
    ("review action", "approved", "Approved (not by the person who entered it)"),
    ("review action", "rejected", "Rejected (reason required)"),
    ("review action", "comment", "Note without a decision"),
    ("method", "count_to_target", "% = round(value ÷ target × 100)"),
    ("method", "percent_complete", "Value is a % complete; capped at 100 for status"),
    ("method", "milestone", "Completed = 100, In progress = 50, Not started = 0"),
    ("method", "inverse_time", "% = round(target ÷ value × 100), lower is better (e.g. days)"),
    ("method", "baseline_trend", "Outcome indicators: change vs 2022 baseline, no target"),
    ("result status", "fully_achieved", "Capped % ≥ fully threshold (100)"),
    ("result status", "largely_achieved", "Capped % ≥ largely threshold (40 / 70 / 90 by year)"),
    ("result status", "limited_progress", "Below the largely threshold"),
    ("question type", "integer", "Whole number"),
    ("question type", "decimal", "Number with decimals"),
    ("question type", "select_one", "One choice from a list"),
    ("question type", "select_multiple", "Several choices"),
    ("question type", "text", "Short or long text"),
    ("question type", "date", "Date"),
    ("question type", "file", "Evidence file"),
    ("question type", "calculate", "Calculated by the form (e.g. percentage)"),
    ("question type", "note", "Explanatory text, no answer"),
    ("flag rule", "missing_value", "Assigned indicator without a value (blocking)"),
    ("flag rule", "out_of_range", "Value outside allowed range, e.g. % > 100 (blocking)"),
    ("flag rule", "missing_narrative", "Progress below 100% without narrative (warning)"),
    ("flag rule", "missing_evidence", "No evidence file (warning)"),
    ("flag rule", "large_change", "Value ≥ 3× last year's (warning)"),
    ("flag rule", "duplicate_submission", "Second submission for same ministry and year (warning)"),
    ("flag rule", "wrong_assignment", "Ministry reported an indicator it does not own (blocking)"),
    ("cluster", "production", "Actions 1–17 (Goal 1)"),
    ("cluster", "processing", "Actions 18–28 (Goal 2)"),
    ("cluster", "export", "Actions 29–44 (Goal 3)"),
]

RULES = [
    ("Isolation", "Every row (except workspaces) has a workspace_id, and every link stays inside one workspace.", "A second policy/customer can never see Cashew data."),
    ("Uniqueness", "One submission per ministry, reporting year and form.", "Matches the manual: submit once per ministry per year."),
    ("Uniqueness", "One approved result per indicator and reporting year.", "Dashboards can never show two competing official values."),
    ("Uniqueness", "One lead ministry per action; each action indicator has exactly one reporting ministry.", "No double counting of joint actions."),
    ("Immutability", "A submitted revision's answers never change. Corrections create a new revision.", "Reviewers can always see what was originally sent."),
    ("Immutability", "Published form versions and report versions are frozen (checked by hash).", "Old reports keep their original numbers after corrections."),
    ("Immutability", "review_events and audit_events are insert-only; no one can edit or delete them.", "A trustworthy trail of decisions."),
    ("Versioning", "Changing an indicator's meaning, unit or formula creates a new indicator version; results keep the version they used.", "Historic results stay interpretable."),
    ("Versioning", "Target changes create a new target revision with a reason.", "Reports reference the target actually used."),
    ("Workflow", "Nobody approves a revision they entered, including the Administrator.", "Owner decision, 26 Sep 2026."),
    ("Workflow", "Returned and rejected decisions need a reason; approval needs the four verification checks and no open blocking flags.", "Manual section 3.1."),
    ("Workflow", "Approval and its audit event are saved together or not at all.", "No approval without a record."),
    ("Calculation", "pct_of_target is always calculated by the server from the value and the target, using the indicator's method.", "Nobody can type a different %."),
    ("Calculation", "Status uses the reporting year's thresholds, with % capped at 100 for status only.", "Same rule as workbook sheet 10_STATUS_THRESHOLDS."),
    ("Missing data", "Empty means no data and is never shown or counted as zero. Zero is a real value.", "Avoids false 'limited progress'."),
    ("Access", "Focal points read and write only their own ministry's submissions; the Committee reads approved results only; evidence downloads need reviewer or administrator rights.", "Pilot roles."),
    ("Deletion", "Ministries, indicators, users and approved records are archived or deactivated, never deleted.", "Keeps history and authorship."),
    ("Personal data", "Respondent name and phone are visible to the M&E team only and excluded from exports to the Committee.", "Minimum personal data."),
]

QUESTIONS = [
    ("Q1", "One programme per ministry: is this right for all 17 institutions (e.g. NBC, CDC, CMAA)?", "Structure"),
    ("Q2", "Does every action indicator always have exactly one reporting ministry?", "Structure"),
    ("Q3", "Annual reporting only for the pilot, or quarterly for some data (e.g. GDCE exports)?", "Indicators"),
    ("Q4", "Where are evidence files stored: Vercel Blob, Supabase Storage, or left in Kobo with links?", "Collection"),
    ("Q5", "Should respondent name and phone be stored at all, or only the platform user who submitted?", "Collection"),
    ("Q6", "How long are evidence files and submissions kept (retention period)?", "Control"),
    ("Q7", "Should the 2025 data be loaded as approved history, and the 2026 illustrative records left out?", "Results"),
    ("Q8", "Import run table (Kobo sync history) is left for release R2. Agree?", "Control"),
]

# ---------------------------------------------------------------------------
ARIAL = "Arial"
HEAD_FILL = PatternFill("solid", fgColor="1D70B8")
FAMILY_FILL = {
    "Structure": "D2E2F1", "Indicators": "D0E6E7", "Collection": "CFE4DC", "Review": "DDD6EC",
    "Results": "FFF8CC", "Reports": "FDE4D7", "Users & access": "F3F3F3", "Control": "F3F3F3", "All tables": "FFFFFF",
}
INPUT_FILL = PatternFill("solid", fgColor="FFFF00")
thin = Side(style="thin", color="CECECE")
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)


def field_rows():
    rows = []
    for family, table, *_ in TABLES:
        for f in F[table]:
            rows.append((family, table) + f)
    return rows


def common_rows():
    return [("All tables", "(every table)") + c for c in COMMON]


def style_header(ws, row, ncols):
    for c in range(1, ncols + 1):
        cell = ws.cell(row=row, column=c)
        cell.font = Font(name=ARIAL, bold=True, color="FFFFFF")
        cell.fill = HEAD_FILL
        cell.alignment = Alignment(wrap_text=True, vertical="center")
        cell.border = BORDER


def write_table(ws, start_row, headers, rows, widths, family_col=None, input_cols=()):
    for i, h in enumerate(headers, 1):
        ws.cell(row=start_row, column=i, value=h)
    style_header(ws, start_row, len(headers))
    for r, row in enumerate(rows, start_row + 1):
        fill = PatternFill("solid", fgColor=FAMILY_FILL.get(row[family_col], "FFFFFF")) if family_col is not None else None
        for c, v in enumerate(row, 1):
            cell = ws.cell(row=r, column=c, value=v)
            cell.font = Font(name=ARIAL, size=10)
            cell.alignment = Alignment(wrap_text=True, vertical="top")
            cell.border = BORDER
            if fill is not None and c <= 2:
                cell.fill = fill
        for c in input_cols:
            ws.cell(row=r, column=c).fill = INPUT_FILL
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.freeze_panes = ws.cell(row=start_row + 1, column=3 if family_col is not None else 2)
    ws.auto_filter.ref = f"A{start_row}:{get_column_letter(len(headers))}{start_row + len(rows)}"


def build_xlsx(path):
    wb = Workbook()

    # Read me
    ws = wb.active
    ws.title = "Read me"
    lines = [
        ("Monitoring and Evaluation System: data dictionary (Level 3)", True, 14),
        (VERSION + " · for review by the MoC M&E Secretariat. Nothing has been created in a database yet.", False, 10),
        ("", False, 10),
        ("What this is", True, 11),
        ("Every table and field the platform's database will hold, with a real example from the National Cashew Policy workspace. Table names match the Level 2 diagram in Figma.", False, 10),
        ("", False, 10),
        ("How to review", True, 11),
        ("1. Read the 'Tables' sheet for the overall picture (29 tables in 8 families).", False, 10),
        ("2. On the 'Fields' sheet, filter by Family or Table. Write comments in the yellow 'Reviewer comment' column (the only column to edit).", False, 10),
        ("3. Check 'Allowed values' and 'Rules' for workflow and calculation rules.", False, 10),
        ("4. Answer the 'Open questions' sheet (yellow cells).", False, 10),
        ("", False, 10),
        ("Column guide (Fields sheet)", True, 11),
        ("Key: PK = unique ID of the row · FK = link to another table (see References) · UK = must be unique (within the rule shown).", False, 10),
        ("Required: Y = must always have a value · N = may be empty. Empty means 'no data', never zero.", False, 10),
        ("Type: text, integer, numeric (exact decimals), boolean (true/false), date, timestamptz (date + time, stored in UTC), uuid (generated ID), jsonb (structured data).", False, 10),
        ("", False, 10),
        ("Conventions for every table", True, 11),
        ("Every table has the 6 common fields listed first on the Fields sheet (id, workspace_id, created_at, created_by, updated_at, row_version). They are not repeated per table.", False, 10),
        ("Records are archived or deactivated, not deleted. review_events and audit_events are insert-only.", False, 10),
        ("", False, 10),
        ("Colour legend", True, 11),
        ("Yellow cells = for reviewers to fill in. Coloured Family/Table cells match the family colours in the Figma diagram.", False, 10),
        ("", False, 10),
        ("Sources", True, 11),
        ("Platform specification v1.0 and engineering contracts (24 Sep 2026); Cashew Action-Level workbook v5, Outcome workbook v12, Kobo XLSForm v10, Monitoring System Manual v3, MTR final draft; owner decisions on roles (26 Sep 2026).", False, 10),
    ]
    for i, (text, bold, size) in enumerate(lines, 1):
        c = ws.cell(row=i, column=1, value=text)
        c.font = Font(name=ARIAL, bold=bold, size=size, color="1D70B8" if size == 14 else "0B0C0C")
        c.alignment = Alignment(wrap_text=True, vertical="top")
    ws.cell(row=23, column=1).fill = INPUT_FILL
    ws.column_dimensions["A"].width = 120

    # Tables (field counts by formula)
    ws = wb.create_sheet("Tables")
    headers = ["#", "Family", "Table (database name)", "Diagram name", "Purpose", "Cashew example", "Pilot size (rows)", "Fields (own)", "Fields incl. common", "Reviewer comment"]
    rows = []
    for i, (family, table, diag, purpose, example, size) in enumerate(TABLES, 1):
        rows.append([i, family, table, diag, purpose, example, size, None, None, None])
    write_table(ws, 1, headers, rows, [5, 14, 24, 18, 50, 36, 14, 11, 12, 34], input_cols=(10,))
    for r in range(2, len(rows) + 2):
        ws.cell(row=r, column=8, value=f'=COUNTIF(Fields!$B$2:$B$400,C{r})')
        common = len(COMMON) - (1 if rows[r - 2][2] in NO_WORKSPACE else 0) - (2 if rows[r - 2][2] in INSERT_ONLY else 0)
        ws.cell(row=r, column=9, value=f"=H{r}+{common}")
        for c in (8, 9):
            ws.cell(row=r, column=c).font = Font(name=ARIAL, size=10)
            ws.cell(row=r, column=c).border = BORDER
        fam = rows[r - 2][1]
        ws.cell(row=r, column=2).fill = PatternFill("solid", fgColor=FAMILY_FILL[fam])
    total = len(rows) + 2
    ws.cell(row=total, column=7, value="Total").font = Font(name=ARIAL, bold=True)
    ws.cell(row=total, column=8, value=f"=SUM(H2:H{total - 1})").font = Font(name=ARIAL, bold=True)
    ws.cell(row=total, column=9, value=f"=SUM(I2:I{total - 1})").font = Font(name=ARIAL, bold=True)
    ws.cell(row=total + 1, column=7, value="Common fields per table: 6 (5 on workspaces; review_events and audit_events have no updated_at/row_version).").font = Font(name=ARIAL, size=9, italic=True)
    ws.freeze_panes = "D2"

    # Fields
    ws = wb.create_sheet("Fields")
    headers = ["Family", "Table", "Field", "Type", "Key", "Required", "References", "Rule / allowed values", "Description", "Cashew example", "Reviewer comment"]
    write_table(ws, 1, headers, common_rows() + field_rows(), [13, 20, 22, 12, 6, 9, 22, 36, 40, 32, 30], family_col=0, input_cols=(11,))
    ws["A1"].comment = Comment("Rows with Table '(every table)' are the common fields present on all tables.", "M&E System")

    # Allowed values
    ws = wb.create_sheet("Allowed values")
    write_table(ws, 1, ["List", "Value", "Meaning"], ENUMS, [18, 22, 70])
    ws.freeze_panes = "A2"

    # Rules
    ws = wb.create_sheet("Rules")
    write_table(ws, 1, ["Type", "Rule", "Why"], RULES, [14, 80, 50])
    ws.freeze_panes = "A2"

    # Open questions
    ws = wb.create_sheet("Open questions")
    rows = [list(q) + [None, None] for q in QUESTIONS]
    write_table(ws, 1, ["#", "Question", "Family", "Answer (Secretariat)", "Answered by / date"], rows, [5, 80, 14, 40, 20], input_cols=(4, 5))
    ws.freeze_panes = "A2"
    dv = DataValidation(type="list", formula1='"Structure,Indicators,Collection,Review,Results,Reports,Users & access,Control"', allow_blank=True)
    ws.add_data_validation(dv)
    dv.add(f"C2:C{len(rows) + 1}")

    for sheet in wb.worksheets:
        sheet.sheet_view.zoomScale = 100
    wb.calculation.fullCalcOnLoad = True
    wb.save(path)


def build_md(path):
    out = [
        "# Data dictionary (Level 3)",
        "",
        f"{VERSION}. Generated by `scripts/build_data_dictionary.py`; the Excel copy for review is `docs/data-dictionary.xlsx`.",
        "Table names match the Level 2 Figma diagram. Examples come from the National Cashew Policy workspace.",
        "Nothing has been created in a database yet.",
        "",
        "## Common fields (every table)",
        "",
        "| Field | Type | Key | Req. | References | Rule | Description |",
        "|---|---|---|---|---|---|---|",
    ]
    for f in COMMON:
        out.append(f"| `{f[0]}` | {f[1]} | {f[2]} | {f[3]} | {f[4]} | {f[5]} | {f[6]} |")
    out += ["", "`workspaces` has no `workspace_id`; `review_events` and `audit_events` are insert-only (no `updated_at` / `row_version`).", ""]
    family = None
    for fam, table, diag, purpose, example, size in TABLES:
        if fam != family:
            out += [f"## {fam}", ""]
            family = fam
        out += [f"### `{table}` ({diag})", "", f"{purpose} Example: *{example}*. Pilot size: {size}.", "",
                "| Field | Type | Key | Req. | References | Rule / allowed values | Description | Example |",
                "|---|---|---|---|---|---|---|---|"]
        for f in F[table]:
            cells = [f"`{f[0]}`"] + [str(x).replace("|", "\\|") for x in f[1:]]
            out.append("| " + " | ".join(cells) + " |")
        out.append("")
    out += ["## Allowed values", "", "| List | Value | Meaning |", "|---|---|---|"]
    out += [f"| {a} | `{b}` | {c} |" for a, b, c in ENUMS]
    out += ["", "## Rules", "", "| Type | Rule | Why |", "|---|---|---|"]
    out += [f"| {a} | {b} | {c} |" for a, b, c in RULES]
    out += ["", "## Open questions", "", "| # | Question | Family |", "|---|---|---|"]
    out += [f"| {a} | {b} | {c} |" for a, b, c in QUESTIONS]
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(out) + "\n")


if __name__ == "__main__":
    os.makedirs(DOCS, exist_ok=True)
    build_xlsx(os.path.join(DOCS, "data-dictionary.xlsx"))
    build_md(os.path.join(DOCS, "DATA_DICTIONARY.md"))
    n = sum(len(v) for v in F.values())
    print(f"{len(TABLES)} tables, {n} table-specific fields + {len(COMMON)} common fields, {len(ENUMS)} allowed values, {len(RULES)} rules")
