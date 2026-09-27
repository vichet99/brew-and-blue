-- Row-level security for the four pilot roles (src/lib/roles.ts, /roles page):
--   admin     set-up, users, everything in the workspace (may also review)
--   reviewer  all submissions, evidence, flags; decides through decide_revision()
--   focal     own ministry's submissions only; approved results for everyone
--   viewer    approved results and the structure only (Committee)
-- Anonymous visitors get nothing. Workflow changes go through the functions in
-- 20260927000200_rules.sql, so direct UPDATEs of workflow state are not granted.

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Structure and indicator set-up: members read, administrators write
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'ministries', 'policies', 'goals', 'clusters', 'programmes', 'actions', 'action_ministries',
    'reporting_years', 'indicators', 'indicator_versions', 'targets', 'baselines',
    'forms', 'form_versions', 'questions', 'reports']
  loop
    execute format('create policy member_read on %I for select to authenticated using (is_member(workspace_id))', t);
    execute format($p$create policy admin_write on %I for all to authenticated
                     using (has_role(workspace_id, array['admin']::app_role[]))
                     with check (has_role(workspace_id, array['admin']::app_role[]))$p$, t);
  end loop;
end $$;

create policy member_read on workspaces for select to authenticated using (is_member(id));
create policy admin_write on workspaces for update to authenticated
  using (has_role(id, array['admin']::app_role[])) with check (has_role(id, array['admin']::app_role[]));

-- ---------------------------------------------------------------------------
-- Submissions: own ministry for focal points, all for reviewers/admins
-- ---------------------------------------------------------------------------
create policy read_submissions on submissions for select to authenticated
  using (can_see_ministry(workspace_id, ministry_id));
create policy open_submission on submissions for insert to authenticated
  with check (state = 'draft' and (is_focal_for(workspace_id, ministry_id) or has_role(workspace_id, array['admin']::app_role[])));

create policy read_revisions on submission_revisions for select to authenticated
  using (exists (select 1 from submissions s where s.id = submission_id and can_see_ministry(s.workspace_id, s.ministry_id)));
create policy open_revision on submission_revisions for insert to authenticated
  with check (state = 'draft' and exists (
    select 1 from submissions s where s.id = submission_id
      and (is_focal_for(s.workspace_id, s.ministry_id) or has_role(s.workspace_id, array['admin']::app_role[]))));
-- Drafts only: respondent fields may be edited before submission.
create policy edit_draft_revision on submission_revisions for update to authenticated
  using (state = 'draft' and exists (
    select 1 from submissions s where s.id = submission_id
      and (is_focal_for(s.workspace_id, s.ministry_id) or has_role(s.workspace_id, array['admin']::app_role[]))))
  with check (state = 'draft');

-- Answers: read with the submission; write while the revision is a draft
-- (the answers_guard trigger also blocks changes after submission).
create policy read_answers on answers for select to authenticated
  using (exists (select 1 from submission_revisions r join submissions s on s.id = r.submission_id
                 where r.id = revision_id and can_see_ministry(s.workspace_id, s.ministry_id)));
create policy write_draft_answers on answers for all to authenticated
  using (exists (select 1 from submission_revisions r join submissions s on s.id = r.submission_id
                 where r.id = revision_id and r.state = 'draft'
                   and (is_focal_for(s.workspace_id, s.ministry_id) or has_role(s.workspace_id, array['admin']::app_role[]))))
  with check (exists (select 1 from submission_revisions r join submissions s on s.id = r.submission_id
                 where r.id = revision_id and r.state = 'draft'
                   and (is_focal_for(s.workspace_id, s.ministry_id) or has_role(s.workspace_id, array['admin']::app_role[]))));

-- Evidence: focal points see their own ministry's files; reviewers/admins all.
-- Viewers (Committee) never see evidence.
create policy read_evidence on evidence_files for select to authenticated
  using (has_role(workspace_id, array['admin', 'reviewer']::app_role[])
         or exists (select 1 from answers a join submission_revisions r on r.id = a.revision_id
                    join submissions s on s.id = r.submission_id
                    where a.id = answer_id and is_focal_for(s.workspace_id, s.ministry_id)));
create policy add_evidence on evidence_files for insert to authenticated
  with check (scan_status = 'pending' and uploaded_by = app_user_id() and exists (
    select 1 from answers a join submission_revisions r on r.id = a.revision_id join submissions s on s.id = r.submission_id
    where a.id = answer_id and r.state = 'draft'
      and (is_focal_for(s.workspace_id, s.ministry_id) or has_role(s.workspace_id, array['admin']::app_role[]))));

-- ---------------------------------------------------------------------------
-- Review
-- ---------------------------------------------------------------------------
create policy read_review_events on review_events for select to authenticated
  using (exists (select 1 from submission_revisions r join submissions s on s.id = r.submission_id
                 where r.id = revision_id and can_see_ministry(s.workspace_id, s.ministry_id)));
create policy add_comment on review_events for insert to authenticated
  with check (action = 'comment' and actor_id = app_user_id()
              and has_role(workspace_id, array['admin', 'reviewer']::app_role[]));

create policy read_flags on quality_flags for select to authenticated
  using (exists (select 1 from submission_revisions r join submissions s on s.id = r.submission_id
                 where r.id = revision_id and can_see_ministry(s.workspace_id, s.ministry_id)));
create policy manage_flags on quality_flags for all to authenticated
  using (has_role(workspace_id, array['admin', 'reviewer']::app_role[]))
  with check (has_role(workspace_id, array['admin', 'reviewer']::app_role[]));

-- ---------------------------------------------------------------------------
-- Results and reports: approved figures for every member; admins write
-- administrative/survey results (answer results come from decide_revision()).
-- ---------------------------------------------------------------------------
create policy read_results on results for select to authenticated
  using (is_member(workspace_id)
         and (state = 'approved' or has_role(workspace_id, array['admin', 'reviewer']::app_role[])));
create policy admin_results on results for all to authenticated
  using (has_role(workspace_id, array['admin']::app_role[]))
  with check (has_role(workspace_id, array['admin']::app_role[]) and source_type <> 'answer');

create policy read_report_versions on report_versions for select to authenticated
  using (is_member(workspace_id)
         and (state = 'published' or has_role(workspace_id, array['admin', 'reviewer']::app_role[])));
create policy admin_report_versions on report_versions for all to authenticated
  using (has_role(workspace_id, array['admin']::app_role[]))
  with check (has_role(workspace_id, array['admin']::app_role[]));

-- ---------------------------------------------------------------------------
-- Users & access
-- ---------------------------------------------------------------------------
create policy read_self on users for select to authenticated
  using (id = app_user_id()
         or exists (select 1 from memberships m where m.user_id = users.id
                    and has_role(m.workspace_id, array['admin', 'reviewer']::app_role[])));
create policy update_self on users for update to authenticated
  using (id = app_user_id()) with check (id = app_user_id() and status = 'active');
create policy admin_users on users for update to authenticated
  using (exists (select 1 from memberships m where m.user_id = users.id and has_role(m.workspace_id, array['admin']::app_role[])))
  with check (exists (select 1 from memberships m where m.user_id = users.id and has_role(m.workspace_id, array['admin']::app_role[])));
-- Inviting a brand-new person (no membership yet) is done server-side with the service role.

create policy read_memberships on memberships for select to authenticated
  using (user_id = app_user_id() or has_role(workspace_id, array['admin']::app_role[]));
create policy admin_memberships on memberships for all to authenticated
  using (has_role(workspace_id, array['admin']::app_role[]))
  with check (has_role(workspace_id, array['admin']::app_role[]));

create policy read_grants on role_grants for select to authenticated
  using (exists (select 1 from memberships m where m.id = membership_id and m.user_id = app_user_id())
         or has_role(workspace_id, array['admin']::app_role[]));
create policy admin_grants on role_grants for all to authenticated
  using (has_role(workspace_id, array['admin']::app_role[]))
  with check (has_role(workspace_id, array['admin']::app_role[]) and granted_by = app_user_id());

-- ---------------------------------------------------------------------------
-- Audit: administrators read; rows are written only by the workflow functions
-- ---------------------------------------------------------------------------
create policy admin_read_audit on audit_events for select to authenticated
  using (has_role(workspace_id, array['admin']::app_role[]));

-- ---------------------------------------------------------------------------
-- Table privileges for signed-in users (RLS above decides which rows)
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated;
-- Supabase's default privileges give every new table to authenticated; start from nothing.
revoke all on all tables in schema public from authenticated;
grant select on all tables in schema public to authenticated;
grant insert, update, delete on
  ministries, policies, goals, clusters, programmes, actions, action_ministries, reporting_years,
  indicators, indicator_versions, targets, baselines, forms, form_versions, questions, reports, report_versions,
  answers, quality_flags, results, memberships, role_grants
  to authenticated;
grant update on workspaces to authenticated;
grant update (full_name, phone, preferred_language, status) on users to authenticated;
grant insert on submissions, submission_revisions, evidence_files, review_events to authenticated;
-- Workflow columns (state, submitted_at, payload_hash, entered_by) change only
-- through the workflow functions, so only respondent details are updatable.
grant update (respondent_name, respondent_phone, form_version_id) on submission_revisions to authenticated;
