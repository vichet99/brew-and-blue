-- Read models for the website. All views run with the caller's rights
-- (security_invoker), so the row-level security of the underlying tables applies:
-- a focal point sees only their ministry's rows, the Committee none of these.

-- Who is signed in: one row per active role grant (or one row without a role).
create view my_access with (security_invoker = true) as
select u.id as user_id, u.full_name, u.email,
       w.id as workspace_id, w.code as workspace_code, w.name as workspace_name,
       mi.code as ministry_code, mi.short_name as ministry_short,
       g.role, sm.code as scope_ministry_code
from users u
join memberships m on m.user_id = u.id and m.status = 'active'
join workspaces w on w.id = m.workspace_id
join ministries mi on mi.id = m.ministry_id
left join role_grants g on g.membership_id = m.id
  and g.valid_from <= current_date and (g.valid_to is null or g.valid_to >= current_date)
left join ministries sm on sm.id = g.scope_ministry_id
where u.id = private.app_user_id() and u.status = 'active';

-- One row per submission with its current revision and check counts.
create view submission_overview with (security_invoker = true) as
select s.id as submission_id, s.code, s.workspace_id, y.year, m.code as ministry_code, m.short_name as ministry_short,
       s.state, s.is_illustrative, r.id as revision_id, r.revision_no, r.state as revision_state, r.submitted_at,
       coalesce(r.entered_by = private.app_user_id(), false) as entered_by_me,
       (select count(*) from indicators i
         where i.reporting_ministry_id = s.ministry_id and i.level = 'action' and i.status = 'active') as assigned,
       (select count(*) from answers a
         where a.revision_id = r.id and (a.value_number is not null or a.value_choice is not null)) as reported,
       (select count(*) from evidence_files e join answers a on a.id = e.answer_id where a.revision_id = r.id) as evidence,
       (select count(*) from quality_flags f where f.revision_id = r.id and f.status = 'open' and f.level = 'blocking') as blocking,
       (select count(*) from quality_flags f where f.revision_id = r.id and f.status = 'open' and f.level = 'warning') as warnings
from submissions s
join reporting_years y on y.id = s.reporting_year_id
join ministries m on m.id = s.ministry_id
left join submission_revisions r on r.id = s.current_revision_id;

-- Answers of a revision with indicator codes and evidence file names.
create view revision_answers with (security_invoker = true) as
select a.revision_id, i.code as indicator_code, i.external_id, a.value_number, a.value_choice, a.pct_of_target,
       a.narrative, a.challenges, a.not_reported_reason,
       (select string_agg(e.file_name, ', ' order by e.file_name) from evidence_files e where e.answer_id = a.id) as evidence
from answers a
join indicators i on i.id = a.indicator_id;

-- Review decisions and queries with the reviewer's name (visible to the M&E team).
create view review_history with (security_invoker = true) as
select e.revision_id, r.submission_id, r.revision_no, e.action, e.reason, e.affected_indicators, e.created_at,
       u.full_name as actor_name
from review_events e
join submission_revisions r on r.id = e.revision_id
left join users u on u.id = e.actor_id;

revoke all on my_access, submission_overview, revision_answers, review_history from public, anon, authenticated;
grant select on my_access, submission_overview, revision_answers, review_history to authenticated;
