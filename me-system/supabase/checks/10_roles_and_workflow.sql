-- Role and workflow checks, run after the migrations and seed (see supabase/README.md).
-- Creates four test people, then acts as each through Supabase's `authenticated`
-- role and a JWT subject, exactly as the app would. Every check raises on failure.
\set ON_ERROR_STOP on
set client_min_messages = notice;

-- ---------------------------------------------------------------- helpers
create schema test;
create function test.expect_error(stmt text, fragment text) returns void language plpgsql as $$
begin
  execute stmt;
  raise exception 'EXPECTED ERROR containing "%" but statement succeeded: %', fragment, stmt;
exception when others then
  if sqlerrm like 'EXPECTED ERROR%' or position(lower(fragment) in lower(sqlerrm)) = 0 then
    raise exception 'wrong error for %: % (wanted "%")', stmt, sqlerrm, fragment;
  end if;
end $$;
create function test.rows(stmt text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute stmt;
  get diagnostics n = row_count;
  return n;
end $$;
create function test.eq(label text, got anyelement, want anyelement) returns void language plpgsql as $$
begin
  if got is distinct from want then raise exception '%: got %, want %', label, got, want; end if;
  raise notice 'ok  %', label;
end $$;
grant usage on schema test to authenticated, anon;
grant execute on all functions in schema test to authenticated, anon;

-- ---------------------------------------------------------------- people
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'lead@example.org'),
  ('00000000-0000-0000-0000-00000000000b', 'reviewer@example.org'),
  ('00000000-0000-0000-0000-00000000000c', 'focal.maff@example.org'),
  ('00000000-0000-0000-0000-00000000000d', 'committee@example.org');
insert into users (id, auth_user_id, email, full_name, status) values
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'lead@example.org', 'Secretariat lead', 'active'),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b', 'reviewer@example.org', 'Secretariat officer', 'active'),
  ('10000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-00000000000c', 'focal.maff@example.org', 'MAFF focal point', 'active'),
  ('10000000-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-00000000000d', 'committee@example.org', 'Committee member', 'active');
insert into memberships (id, workspace_id, user_id, ministry_id)
select ('20000000-0000-0000-0000-00000000000' || x.k)::uuid, w.id, ('10000000-0000-0000-0000-00000000000' || x.k)::uuid, m.id
from workspaces w, (values ('a', 'moc'), ('b', 'moc'), ('c', 'maff'), ('d', 'moc')) x(k, ministry)
join ministries m on m.code = x.ministry;
insert into role_grants (workspace_id, membership_id, role, scope_type, scope_ministry_id, granted_by)
select m.workspace_id, m.id, g.role::app_role, g.scope, case when g.scope = 'ministry' then m.ministry_id end,
       '10000000-0000-0000-0000-00000000000a'
from memberships m
join (values ('a', 'admin', 'workspace'), ('a', 'reviewer', 'workspace'), ('b', 'reviewer', 'workspace'),
             ('c', 'focal', 'ministry'), ('d', 'viewer', 'workspace')) g(k, role, scope)
  on m.user_id = ('10000000-0000-0000-0000-00000000000' || g.k)::uuid;

create function test.act_as(k text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000' || k, false)
$$;
grant execute on function test.act_as(text) to authenticated;

-- ---------------------------------------------------------------- anonymous
set role anon;
select test.expect_error('select count(*) from results', 'permission denied');
reset role;

-- ---------------------------------------------------------------- viewer (Committee)
set role authenticated;
select test.act_as('d');
select test.eq('viewer sees 44 action statuses for 2025', (select count(*) from action_status where year = 2025), 44::bigint);
select test.eq('viewer sees 108 approved action results', (select count(*) from official_results where year = 2025 and level = 'action'), 108::bigint);
select test.eq('viewer sees no submissions', (select count(*) from submissions), 0::bigint);
select test.eq('viewer sees no answers', (select count(*) from answers), 0::bigint);
select test.eq('viewer sees no audit trail', (select count(*) from audit_events), 0::bigint);
select test.eq('viewer cannot change set-up (0 rows)', test.rows($$update indicators set status = 'retired' where code = 'AI-002'$$), 0::bigint);
select test.expect_error($$select decide_revision((select id from submission_revisions limit 1), 'approved')$$, 'only reviewers');
reset role;

-- ---------------------------------------------------------------- focal point (MAFF)
set role authenticated;
select test.act_as('c');
select test.eq('focal sees only own submission', (select string_agg(code, ',') from submissions), 'RY2025-MAFF');
select test.eq('focal sees own 15 answers', (select count(*) from answers), 15::bigint);
select test.eq('focal still sees every approved result', (select count(*) from official_results where year = 2025 and level = 'action'), 108::bigint);
select test.eq('focal cannot edit approved answers (0 rows)', test.rows($$update answers set value_number = 5$$), 0::bigint);
select test.expect_error($$select decide_revision((select current_revision_id from submissions), 'approved', null, '["a","b","c","d"]')$$, 'only reviewers');
select test.expect_error($$select new_revision((select id from submissions s where code = 'RY2025-NBC'))$$, 'only the ministry focal point');

-- correction round: new draft revision copies the approved answers
select new_revision((select id from submissions where code = 'RY2025-MAFF'));
select test.eq('new revision is a draft with 15 answers',
  (select count(*) from answers a join submission_revisions r on r.id = a.revision_id where r.revision_no = 2 and r.state = 'draft'), 15::bigint);
-- the % is recalculated by the server; a typed % is ignored (AI-002: 6 of 7 = 86%)
update answers set value_number = 6, pct_of_target = 999, narrative = 'Six varieties released'
where indicator_id = (select id from indicators where code = 'AI-002')
  and revision_id = (select current_revision_id from submissions where code = 'RY2025-MAFF');
select test.eq('server-calculated % for AI-002 = 6/7',
  (select pct_of_target from answers a join submission_revisions r on r.id = a.revision_id
   where r.revision_no = 2 and a.indicator_id = (select id from indicators where code = 'AI-002')), 86::numeric);
select test.expect_error($$insert into answers (workspace_id, revision_id, indicator_id, indicator_version_id, value_number)
  select s.workspace_id, s.current_revision_id, i.id, i.active_version_id, 1
  from submissions s, indicators i where s.code = 'RY2025-MAFF' and i.code = (select min(code) from indicators where reporting_ministry_id = (select id from ministries where code = 'nbc'))$$,
  'not assigned to this ministry');
select test.expect_error($$update submission_revisions set state = 'approved' where revision_no = 2$$, 'permission denied');
select test.eq('submit', submit_revision((select current_revision_id from submissions where code = 'RY2025-MAFF')), 'submitted'::submission_state);
select test.eq('focal cannot edit after submitting (0 rows)', test.rows($$update answers set narrative = 'late edit' where revision_id = (select current_revision_id from submissions)$$), 0::bigint);
select test.eq('automatic quality flags raised (missing evidence)',
  (select count(*) > 0 from quality_flags where rule_code = 'missing_evidence'), true);
reset role;

-- ---------------------------------------------------------------- reviewer
set role authenticated;
select test.act_as('b');
select test.eq('reviewer sees all 17 submissions', (select count(*) from submissions), 17::bigint);
select test.eq('start review', start_review((select current_revision_id from submissions where code = 'RY2025-MAFF')), 'in_review'::submission_state);
select test.expect_error($$select decide_revision((select current_revision_id from submissions where code = 'RY2025-MAFF'), 'returned', 'too short')$$, 'review_events_check');
select test.expect_error($$select decide_revision((select current_revision_id from submissions where code = 'RY2025-MAFF'), 'approved', null, '["reasonable","consistent","evidence"]')$$, 'review_events_check');
select test.eq('approve with four checks',
  decide_revision((select current_revision_id from submissions where code = 'RY2025-MAFF'), 'approved', null,
                  '["reasonable","consistent","evidence","assignment"]'), 'approved'::submission_state);
select test.eq('AI-002 official result is now revision 2 at 86%',
  (select value || '/' || pct_of_target || '/' || status from official_results where year = 2025 and indicator_code = 'AI-002'), '6/86/largely_achieved');
select test.eq('earlier result kept as superseded',
  (select count(*) from results r join indicators i on i.id = r.indicator_id where i.code = 'AI-002' and r.state = 'superseded'), 1::bigint);
select test.eq('still one approved result per indicator', (select count(*) from official_results where year = 2025 and level = 'action'), 108::bigint);
select test.expect_error($$insert into audit_events (workspace_id, action, record_type, record_id) select id, 'x.y', 'x', id from workspaces$$, 'permission denied');
reset role;

-- ---------------------------------------------------------------- administrator: no self-approval
set role authenticated;
select test.act_as('a');
select new_revision((select id from submissions where code = 'RY2025-MAFF'));
select submit_revision((select current_revision_id from submissions where code = 'RY2025-MAFF'));
select test.expect_error($$select decide_revision((select current_revision_id from submissions where code = 'RY2025-MAFF'), 'approved', null, '["reasonable","consistent","evidence","assignment"]')$$,
  'cannot approve a submission you entered');
select test.eq('return needs a reason and works',
  decide_revision((select current_revision_id from submissions where code = 'RY2025-MAFF'), 'returned',
                  'Please attach the variety release decree', null, '["AI-002"]'), 'returned'::submission_state);
select test.eq('admin sees the audit trail', (select count(*) >= 5 from audit_events), true);
reset role;

-- ---------------------------------------------------------------- insert-only and frozen, even for the owner
select test.expect_error($$update answers set value_number = 1$$, 'cannot change');
select test.expect_error($$update review_events set reason = 'changed'$$, 'insert-only');
select test.expect_error($$delete from audit_events$$, 'insert-only');
select test.expect_error($$delete from ministries where code = 'mpwt'$$, 'not deleted');
select test.expect_error($$update indicator_versions set unit = 'items' where indicator_id = (select id from indicators where code = 'AI-002')$$, 'locked');
select test.expect_error($$update form_versions set schema_json = '{}'$$, 'frozen');

select 'ALL CHECKS PASSED' as result;
