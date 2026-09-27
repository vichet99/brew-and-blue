-- Business rules enforced by the database (docs/DATA_DICTIONARY.md, "Rules" section):
--   calculation   % of target and status are computed here, never typed
--   immutability  submitted revisions, published form/report versions, locked
--                 indicator versions cannot change
--   workflow      submit / return / approve / reject / new revision as single
--                 transactions that also write review and audit events
--   separation    nobody approves a revision they entered

-- ---------------------------------------------------------------------------
-- Who is calling (Supabase Auth -> users -> memberships -> role_grants)
-- ---------------------------------------------------------------------------
create function app_user_id() returns uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select id from users where auth_user_id = auth.uid() and status = 'active'
$$;

create function has_role(ws uuid, roles app_role[]) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
    from role_grants g
    join memberships m on m.id = g.membership_id
    where m.user_id = app_user_id()
      and m.workspace_id = ws
      and m.status = 'active'
      and g.role = any (roles)
      and g.valid_from <= current_date
      and (g.valid_to is null or g.valid_to >= current_date)
  )
$$;

create function is_member(ws uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from memberships where user_id = app_user_id() and workspace_id = ws and status = 'active')
$$;

-- Ministries whose submissions the caller may read: all for admin/reviewer,
-- own ministry for a focal point, none for a viewer.
create function can_see_ministry(ws uuid, ministry uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select has_role(ws, array['admin', 'reviewer']::app_role[])
      or exists (
        select 1
        from role_grants g
        join memberships m on m.id = g.membership_id
        where m.user_id = app_user_id() and m.workspace_id = ws and m.status = 'active'
          and g.role = 'focal' and g.scope_ministry_id = ministry
          and g.valid_from <= current_date and (g.valid_to is null or g.valid_to >= current_date)
      )
$$;

create function is_focal_for(ws uuid, ministry uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
    from role_grants g
    join memberships m on m.id = g.membership_id
    where m.user_id = app_user_id() and m.workspace_id = ws and m.status = 'active'
      and g.role = 'focal' and g.scope_ministry_id = ministry
      and g.valid_from <= current_date and (g.valid_to is null or g.valid_to >= current_date)
  )
$$;

-- ---------------------------------------------------------------------------
-- Calculation (mirrors src/lib/rules.ts)
-- ---------------------------------------------------------------------------
create function compute_pct(method calc_method, target numeric, value_number numeric, value_choice text)
returns numeric language sql immutable set search_path = public, pg_temp as $$
  select case
    when method = 'milestone' then
      case value_choice when 'completed' then 100 when 'in_progress' then 50 when 'not_started' then 0 end
    when value_number is null then null
    when method = 'percent_complete' then least(value_number, 100)
    when method = 'inverse_time' then
      case when value_number > 0 and coalesce(target, 0) <> 0 then round(target / value_number * 100) end
    when method = 'count_to_target' then
      case when coalesce(target, 0) <> 0 then round(value_number / target * 100) end
  end
$$;

-- Status uses % capped at 100; the actual % is kept separately.
create function status_for(pct numeric, largely numeric, fully numeric)
returns result_status language sql immutable set search_path = public, pg_temp as $$
  select case
    when pct is null then null
    when least(pct, 100) >= fully then 'fully_achieved'::result_status
    when least(pct, 100) >= largely then 'largely_achieved'::result_status
    else 'limited_progress'::result_status
  end
$$;

-- The target in force for the end of the policy (latest current target).
create function current_target(ind uuid) returns targets
language sql stable set search_path = public, pg_temp as $$
  select * from targets where indicator_id = ind and is_current order by year desc limit 1
$$;

-- ---------------------------------------------------------------------------
-- Answers: server-calculated %, correct ministry, frozen after submission
-- ---------------------------------------------------------------------------
create function answers_guard() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  rev_state submission_state;
  sub_ministry uuid;
  ind indicators;
  ver indicator_versions;
begin
  select r.state, s.ministry_id into rev_state, sub_ministry
  from submission_revisions r join submissions s on s.id = r.submission_id
  where r.id = coalesce(new.revision_id, old.revision_id);

  if rev_state <> 'draft' then
    raise exception 'answers of a % revision cannot change; start a new revision', rev_state
      using errcode = 'check_violation';
  end if;
  if tg_op = 'DELETE' then return old; end if;

  select * into ind from indicators where id = new.indicator_id;
  if ind.level = 'action' and ind.reporting_ministry_id <> sub_ministry then
    raise exception 'indicator % is not assigned to this ministry', ind.code using errcode = 'check_violation';
  end if;

  select * into ver from indicator_versions where id = new.indicator_version_id;
  if ver.indicator_id <> new.indicator_id then
    raise exception 'indicator version does not belong to indicator %', ind.code using errcode = 'check_violation';
  end if;
  if ver.method = 'milestone' and new.value_number is not null then
    raise exception 'milestone indicator % takes a choice, not a number', ind.code using errcode = 'check_violation';
  end if;
  if ver.method <> 'milestone' and new.value_choice is not null then
    raise exception 'indicator % takes a number, not a choice', ind.code using errcode = 'check_violation';
  end if;

  new.pct_of_target := compute_pct(ver.method, (current_target(new.indicator_id)).value, new.value_number, new.value_choice);
  return new;
end $$;

create trigger guard before insert or update or delete on answers
  for each row execute function answers_guard();

-- ---------------------------------------------------------------------------
-- Frozen records
-- ---------------------------------------------------------------------------
-- A submitted revision may only move through workflow states.
create function revisions_guard() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if old.state <> 'draft' and (
       new.submission_id, new.revision_no, new.form_version_id, new.respondent_name, new.respondent_phone,
       new.entered_by, new.submitted_at, new.payload_hash, new.raw_payload)
     is distinct from (
       old.submission_id, old.revision_no, old.form_version_id, old.respondent_name, old.respondent_phone,
       old.entered_by, old.submitted_at, old.payload_hash, old.raw_payload) then
    raise exception 'a submitted revision cannot be edited; start a new revision' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger frozen before update on submission_revisions for each row execute function revisions_guard();

create function form_versions_guard() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if old.published_at is not null and (new.schema_json, new.schema_hash, new.published_at) is distinct from (old.schema_json, old.schema_hash, old.published_at) then
    raise exception 'a published form version is frozen; create a new version' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger frozen before update on form_versions for each row execute function form_versions_guard();

create function report_versions_guard() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if old.state <> 'draft' and (new.snapshot_json, new.manifest_hash, new.as_of, new.published_at) is distinct from (old.snapshot_json, old.manifest_hash, old.as_of, old.published_at) then
    raise exception 'a published report version is frozen; publish a new version' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger frozen before update on report_versions for each row execute function report_versions_guard();

create function indicator_versions_guard() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if old.locked then
    raise exception 'indicator version % is used by results and is locked; create a new version', old.version_no
      using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger frozen before update on indicator_versions for each row execute function indicator_versions_guard();

-- Nobody approves a revision they entered (including the Administrator).
create function review_events_guard() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.action = 'approved' and exists (
       select 1 from submission_revisions where id = new.revision_id and entered_by = new.actor_id) then
    raise exception 'you cannot approve a submission you entered yourself' using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;
create trigger no_self_approval before insert on review_events for each row execute function review_events_guard();

-- ---------------------------------------------------------------------------
-- Audit helper
-- ---------------------------------------------------------------------------
create function write_audit(ws uuid, act text, rtype text, rid uuid, meta jsonb default null, why text default null)
returns void language sql security definer set search_path = public, pg_temp as $$
  insert into audit_events (workspace_id, actor_id, action, record_type, record_id, metadata, reason, created_by)
  values (ws, app_user_id(), act, rtype, rid, meta, why, app_user_id())
$$;

-- ---------------------------------------------------------------------------
-- Automatic quality checks on submission
-- ---------------------------------------------------------------------------
create function run_quality_checks(rev uuid) returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer;
begin
  delete from quality_flags where revision_id = rev and status = 'open' and created_by is null;

  with r as (
    select r.id, r.workspace_id, s.ministry_id
    from submission_revisions r join submissions s on s.id = r.submission_id where r.id = rev
  ), assigned as (
    select i.id, i.code, a.id as answer_id, a.value_number, a.value_choice, a.pct_of_target, a.narrative,
           a.not_reported_reason, v.method, r.workspace_id
    from r
    join indicators i on i.reporting_ministry_id = r.ministry_id and i.level = 'action' and i.status = 'active'
    join indicator_versions v on v.id = i.active_version_id
    left join answers a on a.revision_id = r.id and a.indicator_id = i.id
  ), flags as (
    select workspace_id, answer_id, 'missing_value' as rule_code, 'blocking' as level,
           code || ': no value reported' as message
    from assigned where value_number is null and value_choice is null and not_reported_reason is null
    union all
    select workspace_id, answer_id, 'out_of_range', 'blocking', code || ': percentage above 100'
    from assigned where method = 'percent_complete' and value_number > 100
    union all
    select workspace_id, answer_id, 'missing_narrative', 'warning', code || ': below 100% without a progress narrative'
    from assigned where pct_of_target < 100 and coalesce(nullif(trim(narrative), ''), 'N/A') = 'N/A'
    union all
    select a.workspace_id, a.answer_id, 'missing_evidence', 'warning', a.code || ': no evidence file'
    from assigned a
    where a.answer_id is not null
      and not exists (select 1 from evidence_files e where e.answer_id = a.answer_id and e.scan_status <> 'rejected')
  )
  insert into quality_flags (workspace_id, revision_id, answer_id, rule_code, level, message)
  select workspace_id, rev, answer_id, rule_code, level, message from flags;

  get diagnostics n = row_count;
  return n;
end $$;

-- ---------------------------------------------------------------------------
-- Workflow (call from the app with supabase.rpc(...))
-- ---------------------------------------------------------------------------
create function submit_revision(rev uuid) returns submission_state
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  r submission_revisions;
  s submissions;
begin
  select * into r from submission_revisions where id = rev for update;
  select * into s from submissions where id = r.submission_id for update;
  if r.id is null then raise exception 'revision not found' using errcode = 'no_data_found'; end if;
  if not (is_focal_for(s.workspace_id, s.ministry_id) or has_role(s.workspace_id, array['admin']::app_role[])) then
    raise exception 'only the ministry focal point or an administrator can submit' using errcode = 'insufficient_privilege';
  end if;
  if r.state <> 'draft' then raise exception 'revision is already %', r.state using errcode = 'check_violation'; end if;

  update submission_revisions set
    state = 'submitted',
    submitted_at = now(),
    entered_by = coalesce(entered_by, app_user_id()),
    payload_hash = encode(sha256(convert_to(coalesce((
      select jsonb_agg(to_jsonb(a) - 'id' - 'created_at' - 'updated_at' - 'row_version' order by a.indicator_id)::text
      from answers a where a.revision_id = rev), '[]'), 'UTF8')), 'hex')
  where id = rev;
  update submissions set state = 'submitted', current_revision_id = rev where id = s.id;
  perform run_quality_checks(rev);
  perform write_audit(s.workspace_id, 'submission.submitted', 'submission_revision', rev, jsonb_build_object('submission', s.code, 'revision', r.revision_no));
  return 'submitted';
end $$;

create function start_review(rev uuid) returns submission_state
language plpgsql security definer set search_path = public, pg_temp as $$
declare r submission_revisions;
begin
  select * into r from submission_revisions where id = rev for update;
  if not has_role(r.workspace_id, array['admin', 'reviewer']::app_role[]) then
    raise exception 'only reviewers can review' using errcode = 'insufficient_privilege';
  end if;
  if r.state <> 'submitted' then raise exception 'revision is %', r.state using errcode = 'check_violation'; end if;
  update submission_revisions set state = 'in_review' where id = rev;
  update submissions set state = 'in_review' where id = r.submission_id;
  insert into review_events (workspace_id, revision_id, action, actor_id, created_by)
  values (r.workspace_id, rev, 'review_started', app_user_id(), app_user_id());
  return 'in_review';
end $$;

create function decide_revision(rev uuid, decision review_action, reason text default null,
                                checks jsonb default null, indicator_codes jsonb default null)
returns submission_state
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  r submission_revisions;
  s submissions;
  y reporting_years;
  me uuid := app_user_id();
  new_state submission_state;
begin
  if decision not in ('returned', 'approved', 'rejected') then
    raise exception 'decision must be returned, approved or rejected' using errcode = 'invalid_parameter_value';
  end if;
  select * into r from submission_revisions where id = rev for update;
  select * into s from submissions where id = r.submission_id for update;
  select * into y from reporting_years where id = s.reporting_year_id;
  if not has_role(r.workspace_id, array['admin', 'reviewer']::app_role[]) then
    raise exception 'only reviewers can decide' using errcode = 'insufficient_privilege';
  end if;
  if r.state not in ('submitted', 'in_review') then
    raise exception 'revision is %', r.state using errcode = 'check_violation';
  end if;
  if decision = 'approved' and exists (
       select 1 from quality_flags where revision_id = rev and level = 'blocking' and status = 'open') then
    raise exception 'resolve blocking quality flags before approving' using errcode = 'check_violation';
  end if;

  -- The check constraints and no_self_approval trigger on review_events enforce
  -- reason length, the four checks and separation of duties.
  insert into review_events (workspace_id, revision_id, action, actor_id, reason, checks_completed, affected_indicators, created_by)
  values (r.workspace_id, rev, decision, me, reason, checks, indicator_codes, me);

  new_state := case decision when 'approved' then 'approved' when 'returned' then 'returned' else 'rejected' end;
  update submission_revisions set state = new_state where id = rev;

  if decision = 'approved' then
    update submission_revisions set state = 'superseded'
    where submission_id = s.id and id <> rev and state = 'approved';
    update submissions set state = 'approved', approved_revision_id = rev where id = s.id;

    -- supersede earlier official results for these indicators and year
    update results x set state = 'superseded'
    from answers a
    where a.revision_id = rev and x.indicator_id = a.indicator_id
      and x.reporting_year_id = y.id and x.state = 'approved';

    insert into results (workspace_id, indicator_id, reporting_year_id, revision_no, indicator_version_id, target_id,
                         value, value_choice, pct_of_target, status, source_type, source_answer_id,
                         state, approved_by, approved_at, created_by)
    select a.workspace_id, a.indicator_id, y.id,
           coalesce((select max(revision_no) from results p where p.indicator_id = a.indicator_id and p.reporting_year_id = y.id), 0) + 1,
           a.indicator_version_id, (current_target(a.indicator_id)).id,
           a.value_number, a.value_choice, a.pct_of_target,
           status_for(a.pct_of_target, y.largely_threshold_pct, y.fully_threshold_pct),
           'answer', a.id, 'approved', me, now(), me
    from answers a where a.revision_id = rev;

    update indicator_versions set locked = true
    where id in (select indicator_version_id from answers where revision_id = rev) and not locked;
  else
    update submissions set state = new_state where id = s.id;
  end if;

  perform write_audit(r.workspace_id, 'submission.' || decision::text, 'submission_revision', rev,
                      jsonb_build_object('submission', s.code, 'revision', r.revision_no), reason);
  return new_state;
end $$;

-- After a return: copy the returned answers into a new draft revision.
create function new_revision(sub uuid) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  s submissions;
  last submission_revisions;
  rid uuid;
begin
  select * into s from submissions where id = sub for update;
  if not (is_focal_for(s.workspace_id, s.ministry_id) or has_role(s.workspace_id, array['admin']::app_role[])) then
    raise exception 'only the ministry focal point or an administrator can correct a submission' using errcode = 'insufficient_privilege';
  end if;
  select * into last from submission_revisions where submission_id = sub order by revision_no desc limit 1;
  if last.state not in ('returned', 'approved') then
    raise exception 'latest revision is %; only returned or approved submissions can be corrected', last.state
      using errcode = 'check_violation';
  end if;

  insert into submission_revisions (workspace_id, submission_id, revision_no, form_version_id, state, entered_by, created_by)
  values (s.workspace_id, sub, last.revision_no + 1,
          coalesce((select active_version_id from forms where id = s.form_id), last.form_version_id),
          'draft', app_user_id(), app_user_id())
  returning id into rid;

  insert into answers (workspace_id, revision_id, indicator_id, indicator_version_id, value_number, value_choice,
                       narrative, challenges, not_reported_reason, created_by)
  select workspace_id, rid, indicator_id, indicator_version_id, value_number, value_choice,
         narrative, challenges, not_reported_reason, app_user_id()
  from answers where revision_id = last.id;

  update submissions set state = 'draft', current_revision_id = rid where id = sub;
  perform write_audit(s.workspace_id, 'submission.revision_started', 'submission_revision', rid,
                      jsonb_build_object('submission', s.code, 'revision', last.revision_no + 1));
  return rid;
end $$;

-- ---------------------------------------------------------------------------
-- Read models used by the dashboards
-- ---------------------------------------------------------------------------
-- Official result per indicator and year, with the action and ministry.
create view official_results with (security_invoker = true) as
select r.workspace_id, y.year, i.code as indicator_code, i.level, a.number as action_no, a.code as action_code,
       c.code as cluster, m.code as ministry, r.value, r.value_choice, r.pct_of_target,
       least(r.pct_of_target, 100) as capped_pct, r.status, r.source_type, r.source_note, r.is_test_data, r.stale
from results r
join reporting_years y on y.id = r.reporting_year_id
join indicators i on i.id = r.indicator_id
left join actions a on a.id = i.action_id
left join clusters c on c.id = a.cluster_id
left join ministries m on m.id = i.reporting_ministry_id
where r.state = 'approved';

-- Action status = average capped % of its indicators, judged against that year's thresholds.
create view action_status with (security_invoker = true) as
select a.workspace_id, y.year, a.number, a.code, c.code as cluster,
       round(avg(least(r.pct_of_target, 100)), 2) as avg_capped_pct,
       count(r.id) as indicators_reported,
       status_for(avg(least(r.pct_of_target, 100)), y.largely_threshold_pct, y.fully_threshold_pct) as status
from actions a
join clusters c on c.id = a.cluster_id
join indicators i on i.action_id = a.id
join results r on r.indicator_id = i.id and r.state = 'approved'
join reporting_years y on y.id = r.reporting_year_id
group by a.workspace_id, y.year, y.largely_threshold_pct, y.fully_threshold_pct, a.number, a.code, c.code;

-- ---------------------------------------------------------------------------
-- Function privileges: RPC only for signed-in users; helpers are internal
-- ---------------------------------------------------------------------------
-- Functions from the schema migration: fixed search_path.
alter function touch_row() set search_path = public, pg_temp;
alter function forbid_change() set search_path = public, pg_temp;
alter function forbid_delete() set search_path = public, pg_temp;

-- Supabase grants EXECUTE on new functions to anon and authenticated directly, not only via PUBLIC.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function app_user_id(), has_role(uuid, app_role[]), is_member(uuid), can_see_ministry(uuid, uuid),
  is_focal_for(uuid, uuid), compute_pct(calc_method, numeric, numeric, text), status_for(numeric, numeric, numeric),
  current_target(uuid)
  to authenticated;
grant execute on function submit_revision(uuid), start_review(uuid),
  decide_revision(uuid, review_action, text, jsonb, jsonb), new_revision(uuid)
  to authenticated;

-- Functions created later are not callable by anonymous or signed-in users unless granted.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
