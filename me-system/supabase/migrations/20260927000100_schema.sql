-- Monitoring and Evaluation System: core schema (Level 3 data dictionary, draft v0.1).
-- 29 tables in 8 families. Field names, rules and allowed values follow
-- docs/DATA_DICTIONARY.md. Access rules are in the next migration.
--
-- Conventions
--   * every table has id, created_at, created_by, updated_at, row_version;
--     every table except workspaces has workspace_id
--   * rows are archived / deactivated, never deleted
--   * review_events and audit_events are insert-only

-- ---------------------------------------------------------------------------
-- Allowed values
-- ---------------------------------------------------------------------------
create type app_role          as enum ('admin', 'reviewer', 'focal', 'viewer');
create type record_status     as enum ('draft', 'active', 'closed', 'archived');
create type submission_state  as enum ('draft', 'submitted', 'in_review', 'returned', 'approved', 'rejected', 'superseded');
create type review_action     as enum ('review_started', 'returned', 'approved', 'rejected', 'comment');
create type calc_method       as enum ('count_to_target', 'percent_complete', 'milestone', 'inverse_time', 'baseline_trend');
create type result_status     as enum ('fully_achieved', 'largely_achieved', 'limited_progress');
create type indicator_level   as enum ('action', 'outcome');

-- ---------------------------------------------------------------------------
-- Shared trigger functions
-- ---------------------------------------------------------------------------
create function touch_row() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.row_version := old.row_version + 1;
  return new;
end $$;

create function forbid_change() returns trigger language plpgsql as $$
begin
  raise exception '% is insert-only', tg_table_name using errcode = 'insufficient_privilege';
end $$;

create function forbid_delete() returns trigger language plpgsql as $$
begin
  raise exception 'rows in % are archived or deactivated, not deleted', tg_table_name using errcode = 'insufficient_privilege';
end $$;

-- ---------------------------------------------------------------------------
-- Structure
-- ---------------------------------------------------------------------------
create table workspaces (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique check (code = lower(code)),
  name             text not null,
  timezone         text not null default 'Asia/Phnom_Penh',
  default_language text not null default 'km' check (default_language in ('en', 'km')),
  status           text not null default 'active' check (status in ('active', 'archived')),
  created_at       timestamptz not null default now(),
  created_by       uuid,
  updated_at       timestamptz not null default now(),
  row_version      integer not null default 1
);

create table users (
  id                 uuid primary key default gen_random_uuid(),
  auth_user_id       uuid unique references auth.users (id) on delete set null,
  email              text not null unique,
  full_name          text not null,
  phone              text,
  preferred_language text not null default 'km' check (preferred_language in ('en', 'km')),
  status             text not null default 'invited' check (status in ('invited', 'active', 'deactivated')),
  last_sign_in_at    timestamptz,
  created_at         timestamptz not null default now(),
  created_by         uuid references users (id),
  updated_at         timestamptz not null default now(),
  row_version        integer not null default 1
);
-- users are global (one person can belong to several workspaces through memberships)

alter table workspaces add foreign key (created_by) references users (id);

create table ministries (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id),
  code         text not null check (code = lower(code)),
  short_name   text not null,
  name_en      text not null,
  name_km      text,
  type         text not null default 'ministry' check (type in ('ministry', 'institution', 'secretariat', 'partner')),
  status       text not null default 'active' check (status in ('active', 'archived')),
  created_at   timestamptz not null default now(),
  created_by   uuid references users (id),
  updated_at   timestamptz not null default now(),
  row_version  integer not null default 1,
  unique (workspace_id, code),
  unique (workspace_id, id)
);

create table policies (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references workspaces (id),
  code              text not null,
  name_en           text not null,
  name_km           text,
  vision            text,
  start_date        date not null,
  end_date          date not null,
  approved_on       date,
  approved_by       text,
  owner_ministry_id uuid not null,
  status            record_status not null default 'draft',
  created_at        timestamptz not null default now(),
  created_by        uuid references users (id),
  updated_at        timestamptz not null default now(),
  row_version       integer not null default 1,
  unique (workspace_id, code),
  unique (workspace_id, id),
  check (end_date >= start_date),
  foreign key (workspace_id, owner_ministry_id) references ministries (workspace_id, id)
);

create table goals (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id),
  policy_id    uuid not null,
  code         text not null,
  text_en      text not null,
  text_km      text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  created_by   uuid references users (id),
  updated_at   timestamptz not null default now(),
  row_version  integer not null default 1,
  unique (policy_id, code),
  unique (workspace_id, id),
  foreign key (workspace_id, policy_id) references policies (workspace_id, id)
);

create table clusters (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id),
  policy_id    uuid not null,
  goal_id      uuid not null,
  code         text not null,
  name_en      text not null,
  name_km      text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  created_by   uuid references users (id),
  updated_at   timestamptz not null default now(),
  row_version  integer not null default 1,
  unique (policy_id, code),
  unique (workspace_id, id),
  foreign key (workspace_id, policy_id) references policies (workspace_id, id),
  foreign key (workspace_id, goal_id) references goals (workspace_id, id)
);

create table programmes (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id),
  policy_id    uuid not null,
  ministry_id  uuid not null,
  code         text not null,
  name_en      text not null,
  start_date   date,
  end_date     date,
  status       record_status not null default 'draft',
  created_at   timestamptz not null default now(),
  created_by   uuid references users (id),
  updated_at   timestamptz not null default now(),
  row_version  integer not null default 1,
  unique (workspace_id, code),
  unique (policy_id, ministry_id),       -- one programme per ministry per policy
  unique (workspace_id, id),
  check (end_date is null or start_date is null or end_date >= start_date),
  foreign key (workspace_id, policy_id) references policies (workspace_id, id),
  foreign key (workspace_id, ministry_id) references ministries (workspace_id, id)
);

create table actions (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references workspaces (id),
  policy_id        uuid not null,
  programme_id     uuid not null,
  cluster_id       uuid not null,
  number           integer not null check (number > 0),
  code             text not null,
  title_en         text not null,
  title_km         text,
  responsible_text text,
  status           text not null default 'active' check (status in ('planned', 'active', 'completed', 'archived')),
  created_at       timestamptz not null default now(),
  created_by       uuid references users (id),
  updated_at       timestamptz not null default now(),
  row_version      integer not null default 1,
  unique (workspace_id, code),
  unique (policy_id, number),
  unique (workspace_id, id),
  foreign key (workspace_id, policy_id) references policies (workspace_id, id),
  foreign key (workspace_id, programme_id) references programmes (workspace_id, id),
  foreign key (workspace_id, cluster_id) references clusters (workspace_id, id)
);

create table action_ministries (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id),
  action_id    uuid not null,
  ministry_id  uuid not null,
  role         text not null check (role in ('lead', 'contributing')),
  created_at   timestamptz not null default now(),
  created_by   uuid references users (id),
  updated_at   timestamptz not null default now(),
  row_version  integer not null default 1,
  unique (action_id, ministry_id),
  foreign key (workspace_id, action_id) references actions (workspace_id, id),
  foreign key (workspace_id, ministry_id) references ministries (workspace_id, id)
);
create unique index action_ministries_one_lead on action_ministries (action_id) where role = 'lead';

-- ---------------------------------------------------------------------------
-- Indicators
-- ---------------------------------------------------------------------------
create table reporting_years (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references workspaces (id),
  year                  integer not null,
  starts_on             date not null,
  ends_on               date not null,
  deadline              date not null,
  largely_threshold_pct numeric not null check (largely_threshold_pct between 0 and 100),
  fully_threshold_pct   numeric not null default 100 check (fully_threshold_pct between 0 and 100),
  status                text not null default 'upcoming' check (status in ('upcoming', 'open', 'verification', 'closed')),
  created_at            timestamptz not null default now(),
  created_by            uuid references users (id),
  updated_at            timestamptz not null default now(),
  row_version           integer not null default 1,
  unique (workspace_id, year),
  unique (workspace_id, id),
  check (ends_on >= starts_on),
  check (fully_threshold_pct >= largely_threshold_pct)
);

create table indicators (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references workspaces (id),
  code                  text not null,
  external_id           text,
  level                 indicator_level not null,
  action_id             uuid,
  goal_id               uuid,
  reporting_ministry_id uuid,
  area                  text check (area in ('production', 'quality', 'processing', 'market', 'socio-economic')),
  active_version_id     uuid,                      -- FK added below (circular)
  status                text not null default 'active' check (status in ('active', 'retired')),
  created_at            timestamptz not null default now(),
  created_by            uuid references users (id),
  updated_at            timestamptz not null default now(),
  row_version           integer not null default 1,
  unique (workspace_id, code),
  unique (workspace_id, id),
  check (level = 'outcome' or (action_id is not null and reporting_ministry_id is not null)),
  check (level = 'action' or action_id is null),
  foreign key (workspace_id, action_id) references actions (workspace_id, id),
  foreign key (workspace_id, goal_id) references goals (workspace_id, id),
  foreign key (workspace_id, reporting_ministry_id) references ministries (workspace_id, id)
);

create table indicator_versions (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references workspaces (id),
  indicator_id   uuid not null,
  version_no     integer not null check (version_no > 0),
  label_en       text not null,
  label_km       text,
  unit           text not null,
  method         calc_method not null,
  direction      text not null default 'increase' check (direction in ('increase', 'decrease')),
  formula_text   text,
  frequency      text not null default 'annual' check (frequency in ('annual', 'quarterly')),
  data_source    text,
  disaggregation text,
  limitations    text,
  effective_from date not null,
  change_note    text,
  locked         boolean not null default false,
  created_at     timestamptz not null default now(),
  created_by     uuid references users (id),
  updated_at     timestamptz not null default now(),
  row_version    integer not null default 1,
  unique (indicator_id, version_no),
  unique (workspace_id, id),
  check (version_no = 1 or change_note is not null),
  foreign key (workspace_id, indicator_id) references indicators (workspace_id, id)
);

alter table indicators
  add foreign key (workspace_id, active_version_id) references indicator_versions (workspace_id, id)
  deferrable initially deferred;

create table targets (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id),
  indicator_id uuid not null,
  year         integer not null,
  revision_no  integer not null default 1 check (revision_no > 0),
  value        numeric,
  target_text  text not null,
  is_current   boolean not null default true,
  reason       text,
  approved_by  uuid references users (id),
  created_at   timestamptz not null default now(),
  created_by   uuid references users (id),
  updated_at   timestamptz not null default now(),
  row_version  integer not null default 1,
  unique (indicator_id, year, revision_no),
  unique (workspace_id, id),
  check (revision_no = 1 or reason is not null),
  foreign key (workspace_id, indicator_id) references indicators (workspace_id, id)
);
create unique index targets_one_current on targets (indicator_id, year) where is_current;

-- ---------------------------------------------------------------------------
-- Collection
-- ---------------------------------------------------------------------------
create table forms (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references workspaces (id),
  code              text not null,
  title_en          text not null,
  title_km          text,
  level             indicator_level not null,
  channel           text not null default 'native' check (channel in ('native', 'kobo')),
  kobo_asset_id     text,
  active_version_id uuid,                          -- FK added below (circular)
  status            text not null default 'draft' check (status in ('draft', 'published', 'retired')),
  created_at        timestamptz not null default now(),
  created_by        uuid references users (id),
  updated_at        timestamptz not null default now(),
  row_version       integer not null default 1,
  unique (workspace_id, code),
  unique (workspace_id, id)
);

create table form_versions (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces (id),
  form_id       uuid not null,
  version_label text not null,
  schema_json   jsonb not null,
  schema_hash   text not null,
  published_at  timestamptz,
  published_by  uuid references users (id),
  change_note   text,
  created_at    timestamptz not null default now(),
  created_by    uuid references users (id),
  updated_at    timestamptz not null default now(),
  row_version   integer not null default 1,
  unique (form_id, version_label),
  unique (workspace_id, id),
  foreign key (workspace_id, form_id) references forms (workspace_id, id)
);

alter table forms
  add foreign key (workspace_id, active_version_id) references form_versions (workspace_id, id)
  deferrable initially deferred;

create table questions (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces (id),
  form_version_id uuid not null,
  field_name      text not null check (field_name ~ '^[A-Za-z_][A-Za-z0-9_]*$'),
  indicator_id    uuid,
  purpose         text not null check (purpose in ('value', 'percentage', 'narrative', 'evidence', 'challenge', 'respondent', 'other')),
  type            text not null check (type in ('integer', 'decimal', 'select_one', 'select_multiple', 'text', 'date', 'file', 'calculate', 'note')),
  label_en        text not null,
  label_km        text,
  hint_en         text,
  required        boolean not null default false,
  constraint_rule text,
  visible_when    jsonb,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  created_by      uuid references users (id),
  updated_at      timestamptz not null default now(),
  row_version     integer not null default 1,
  unique (form_version_id, field_name),
  foreign key (workspace_id, form_version_id) references form_versions (workspace_id, id),
  foreign key (workspace_id, indicator_id) references indicators (workspace_id, id)
);

create table submissions (
  id                   uuid primary key default gen_random_uuid(),
  workspace_id         uuid not null references workspaces (id),
  code                 text not null,
  ministry_id          uuid not null,
  reporting_year_id    uuid not null,
  form_id              uuid not null,
  state                submission_state not null default 'draft',
  current_revision_id  uuid,                       -- FKs added below (circular)
  approved_revision_id uuid,
  source               text not null default 'native' check (source in ('native', 'kobo_import')),
  kobo_submission_id   text,
  is_illustrative      boolean not null default false,
  created_at           timestamptz not null default now(),
  created_by           uuid references users (id),
  updated_at           timestamptz not null default now(),
  row_version          integer not null default 1,
  unique (workspace_id, code),
  unique (ministry_id, reporting_year_id, form_id),   -- one report per ministry per year
  unique (form_id, kobo_submission_id),
  unique (workspace_id, id),
  foreign key (workspace_id, ministry_id) references ministries (workspace_id, id),
  foreign key (workspace_id, reporting_year_id) references reporting_years (workspace_id, id),
  foreign key (workspace_id, form_id) references forms (workspace_id, id)
);

create table submission_revisions (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references workspaces (id),
  submission_id    uuid not null,
  revision_no      integer not null check (revision_no > 0),
  form_version_id  uuid not null,
  state            submission_state not null default 'draft',
  respondent_name  text,
  respondent_phone text,
  entered_by       uuid references users (id),
  submitted_at     timestamptz,
  payload_hash     text,
  raw_payload      jsonb,
  created_at       timestamptz not null default now(),
  created_by       uuid references users (id),
  updated_at       timestamptz not null default now(),
  row_version      integer not null default 1,
  unique (submission_id, revision_no),
  unique (workspace_id, id),
  foreign key (workspace_id, submission_id) references submissions (workspace_id, id),
  foreign key (workspace_id, form_version_id) references form_versions (workspace_id, id)
);

alter table submissions
  add foreign key (workspace_id, current_revision_id) references submission_revisions (workspace_id, id) deferrable initially deferred,
  add foreign key (workspace_id, approved_revision_id) references submission_revisions (workspace_id, id) deferrable initially deferred;

create table answers (
  id                   uuid primary key default gen_random_uuid(),
  workspace_id         uuid not null references workspaces (id),
  revision_id          uuid not null,
  indicator_id         uuid not null,
  indicator_version_id uuid not null,
  value_number         numeric,
  value_choice         text check (value_choice in ('completed', 'in_progress', 'not_started')),
  pct_of_target        numeric,                    -- always set by set_answer_pct()
  narrative            text,
  challenges           text,
  not_reported_reason  text,
  created_at           timestamptz not null default now(),
  created_by           uuid references users (id),
  updated_at           timestamptz not null default now(),
  row_version          integer not null default 1,
  unique (revision_id, indicator_id),
  unique (workspace_id, id),
  check (value_number is null or value_choice is null),
  foreign key (workspace_id, revision_id) references submission_revisions (workspace_id, id),
  foreign key (workspace_id, indicator_id) references indicators (workspace_id, id),
  foreign key (workspace_id, indicator_version_id) references indicator_versions (workspace_id, id)
);

create table evidence_files (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references workspaces (id),
  answer_id      uuid,
  file_name      text not null,
  storage_key    text not null unique,
  mime_type      text not null check (mime_type in (
                   'application/pdf', 'image/jpeg', 'image/png', 'text/csv',
                   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                   'application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
  size_bytes     bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  sha256         text not null,
  scan_status    text not null default 'pending' check (scan_status in ('pending', 'clean', 'rejected')),
  classification text not null default 'internal' check (classification in ('internal', 'restricted')),
  source         text not null default 'upload' check (source in ('upload', 'kobo_import')),
  uploaded_by    uuid references users (id),
  created_at     timestamptz not null default now(),
  created_by     uuid references users (id),
  updated_at     timestamptz not null default now(),
  row_version    integer not null default 1,
  unique (workspace_id, id),
  foreign key (workspace_id, answer_id) references answers (workspace_id, id)
);

create table baselines (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references workspaces (id),
  indicator_id     uuid not null,
  year             integer not null,
  value            numeric,
  missing_reason   text,
  source           text not null,
  evidence_file_id uuid,
  created_at       timestamptz not null default now(),
  created_by       uuid references users (id),
  updated_at       timestamptz not null default now(),
  row_version      integer not null default 1,
  unique (indicator_id, year),
  check (value is not null or missing_reason is not null),
  foreign key (workspace_id, indicator_id) references indicators (workspace_id, id),
  foreign key (workspace_id, evidence_file_id) references evidence_files (workspace_id, id)
);

-- ---------------------------------------------------------------------------
-- Review
-- ---------------------------------------------------------------------------
create table review_events (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references workspaces (id),
  revision_id         uuid not null,
  action              review_action not null,
  actor_id            uuid not null references users (id),
  reason              text,
  checks_completed    jsonb,
  affected_indicators jsonb,
  created_at          timestamptz not null default now(),
  created_by          uuid references users (id),
  check (action not in ('returned', 'rejected') or length(coalesce(reason, '')) >= 10),
  check (action <> 'approved' or jsonb_array_length(coalesce(checks_completed, '[]'::jsonb)) = 4),
  foreign key (workspace_id, revision_id) references submission_revisions (workspace_id, id)
);

create table quality_flags (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces (id),
  revision_id     uuid not null,
  answer_id       uuid,
  rule_code       text not null check (rule_code in ('missing_value', 'out_of_range', 'missing_narrative', 'missing_evidence',
                                                     'large_change', 'duplicate_submission', 'wrong_assignment')),
  level           text not null check (level in ('warning', 'blocking')),
  message         text not null,
  status          text not null default 'open' check (status in ('open', 'resolved', 'accepted')),
  resolved_by     uuid references users (id),
  resolution_note text,
  created_at      timestamptz not null default now(),
  created_by      uuid references users (id),
  updated_at      timestamptz not null default now(),
  row_version     integer not null default 1,
  check (status = 'open' or resolution_note is not null),
  foreign key (workspace_id, revision_id) references submission_revisions (workspace_id, id),
  foreign key (workspace_id, answer_id) references answers (workspace_id, id)
);

-- ---------------------------------------------------------------------------
-- Results
-- ---------------------------------------------------------------------------
create table results (
  id                   uuid primary key default gen_random_uuid(),
  workspace_id         uuid not null references workspaces (id),
  indicator_id         uuid not null,
  reporting_year_id    uuid not null,
  revision_no          integer not null default 1 check (revision_no > 0),
  indicator_version_id uuid not null,
  target_id            uuid,
  value                numeric,
  value_choice         text check (value_choice in ('completed', 'in_progress', 'not_started')),
  pct_of_target        numeric,
  status               result_status,
  source_type          text not null check (source_type in ('answer', 'administrative', 'survey', 'computed')),
  source_answer_id     uuid,
  source_note          text,
  state                text not null default 'approved' check (state in ('approved', 'superseded')),
  is_test_data         boolean not null default false,
  stale                boolean not null default false,
  approved_by          uuid references users (id),
  approved_at          timestamptz,
  created_at           timestamptz not null default now(),
  created_by           uuid references users (id),
  updated_at           timestamptz not null default now(),
  row_version          integer not null default 1,
  unique (indicator_id, reporting_year_id, revision_no),
  check (source_type <> 'answer' or source_answer_id is not null),
  check (source_type = 'answer' or source_note is not null),
  foreign key (workspace_id, indicator_id) references indicators (workspace_id, id),
  foreign key (workspace_id, reporting_year_id) references reporting_years (workspace_id, id),
  foreign key (workspace_id, indicator_version_id) references indicator_versions (workspace_id, id),
  foreign key (workspace_id, target_id) references targets (workspace_id, id),
  foreign key (workspace_id, source_answer_id) references answers (workspace_id, id)
);
create unique index results_one_approved on results (indicator_id, reporting_year_id) where state = 'approved';

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------
create table reports (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references workspaces (id),
  code              text not null,
  title_en          text not null,
  type              text not null check (type in ('annual', 'mtr', 'outcome', 'other')),
  reporting_year_id uuid,
  scope             text not null default 'policy' check (scope in ('policy', 'programme', 'action')),
  created_at        timestamptz not null default now(),
  created_by        uuid references users (id),
  updated_at        timestamptz not null default now(),
  row_version       integer not null default 1,
  unique (workspace_id, code),
  unique (workspace_id, id),
  foreign key (workspace_id, reporting_year_id) references reporting_years (workspace_id, id)
);

create table report_versions (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces (id),
  report_id     uuid not null,
  version_no    integer not null check (version_no > 0),
  state         text not null default 'draft' check (state in ('draft', 'published', 'superseded')),
  as_of         timestamptz not null,
  snapshot_json jsonb not null,
  manifest_hash text not null,
  published_at  timestamptz,
  published_by  uuid references users (id),
  supersedes_id uuid,
  pdf_file_id   uuid,
  created_at    timestamptz not null default now(),
  created_by    uuid references users (id),
  updated_at    timestamptz not null default now(),
  row_version   integer not null default 1,
  unique (report_id, version_no),
  unique (workspace_id, id),
  foreign key (workspace_id, report_id) references reports (workspace_id, id),
  foreign key (workspace_id, supersedes_id) references report_versions (workspace_id, id),
  foreign key (workspace_id, pdf_file_id) references evidence_files (workspace_id, id)
);

-- ---------------------------------------------------------------------------
-- Users & access
-- ---------------------------------------------------------------------------
create table memberships (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id),
  user_id      uuid not null references users (id),
  ministry_id  uuid not null,
  job_title    text,
  status       text not null default 'active' check (status in ('active', 'deactivated')),
  created_at   timestamptz not null default now(),
  created_by   uuid references users (id),
  updated_at   timestamptz not null default now(),
  row_version  integer not null default 1,
  unique (workspace_id, user_id),
  unique (workspace_id, id),
  foreign key (workspace_id, ministry_id) references ministries (workspace_id, id)
);

create table role_grants (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references workspaces (id),
  membership_id     uuid not null,
  role              app_role not null,
  scope_type        text not null check (scope_type in ('workspace', 'ministry', 'policy')),
  scope_ministry_id uuid,
  scope_policy_id   uuid,
  granted_by        uuid not null references users (id),
  valid_from        date not null default current_date,
  valid_to          date,
  created_at        timestamptz not null default now(),
  created_by        uuid references users (id),
  updated_at        timestamptz not null default now(),
  row_version       integer not null default 1,
  check ((scope_type = 'ministry') = (scope_ministry_id is not null)),
  check ((scope_type = 'policy') = (scope_policy_id is not null)),
  check (role <> 'focal' or scope_type = 'ministry'),
  check (valid_to is null or valid_to >= valid_from),
  foreign key (workspace_id, membership_id) references memberships (workspace_id, id),
  foreign key (workspace_id, scope_ministry_id) references ministries (workspace_id, id),
  foreign key (workspace_id, scope_policy_id) references policies (workspace_id, id)
);

-- ---------------------------------------------------------------------------
-- Control
-- ---------------------------------------------------------------------------
create table audit_events (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id),
  actor_id     uuid references users (id),
  action       text not null check (action ~ '^[a-z_]+(\.[a-z_]+)+$'),
  record_type  text not null,
  record_id    uuid not null,
  reason       text,
  metadata     jsonb,
  request_id   text,
  occurred_at  timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  created_by   uuid references users (id)
);

-- ---------------------------------------------------------------------------
-- Indexes on foreign keys used for filtering
-- ---------------------------------------------------------------------------
create index on actions (programme_id);
create index on actions (cluster_id);
create index on action_ministries (ministry_id);
create index on indicators (action_id);
create index on indicators (reporting_ministry_id);
create index on questions (indicator_id);
create index on submissions (reporting_year_id, state);
create index on submission_revisions (submission_id);
create index on answers (indicator_id);
create index on evidence_files (answer_id);
create index on review_events (revision_id);
create index on quality_flags (revision_id) where status = 'open';
create index on results (reporting_year_id);
create index on memberships (user_id);
create index on role_grants (membership_id);
create index on audit_events (record_type, record_id);
create index on audit_events (workspace_id, occurred_at desc);

-- ---------------------------------------------------------------------------
-- updated_at / row_version on every mutable table; insert-only tables
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'workspaces', 'users', 'ministries', 'policies', 'goals', 'clusters', 'programmes', 'actions',
    'action_ministries', 'reporting_years', 'indicators', 'indicator_versions', 'targets', 'forms',
    'form_versions', 'questions', 'submissions', 'submission_revisions', 'answers', 'evidence_files',
    'baselines', 'quality_flags', 'results', 'reports', 'report_versions', 'memberships', 'role_grants']
  loop
    execute format('create trigger touch before update on %I for each row execute function touch_row()', t);
  end loop;
end $$;

create trigger insert_only before update or delete on review_events for each row execute function forbid_change();
create trigger insert_only before update or delete on audit_events  for each row execute function forbid_change();

-- Deletes are not part of the workflow: archive or deactivate instead.
do $$
declare t text;
begin
  foreach t in array array['ministries', 'policies', 'programmes', 'actions', 'indicators', 'indicator_versions',
                           'users', 'memberships', 'submissions', 'submission_revisions', 'results', 'report_versions']
  loop
    execute format('create trigger no_delete before delete on %I for each row execute function forbid_delete()', t);
  end loop;
end $$;
