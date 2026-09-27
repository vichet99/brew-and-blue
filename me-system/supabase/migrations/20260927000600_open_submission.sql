-- open_submission: the report form's entry point. Returns the draft revision the
-- caller may edit for a ministry and reporting year, creating the submission on
-- first use or starting a correction round (new revision) for an approved or
-- returned report. Only that ministry's focal point or an administrator may call it.

create function open_submission(ministry_code text, report_year integer) returns uuid
language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  m ministries;
  y reporting_years;
  f forms;
  s submissions;
  cur submission_state;
  rid uuid;
begin
  select * into m from ministries where code = ministry_code and is_member(workspace_id) limit 1;
  if m.id is null then
    raise exception 'unknown ministry %', ministry_code using errcode = 'no_data_found';
  end if;
  if not (is_focal_for(m.workspace_id, m.id) or has_role(m.workspace_id, array['admin']::app_role[])) then
    raise exception 'only the % focal point or an administrator can report for %', m.short_name, m.short_name
      using errcode = 'insufficient_privilege';
  end if;
  select * into y from reporting_years where workspace_id = m.workspace_id and year = report_year;
  if y.id is null then
    raise exception 'reporting year % is not set up', report_year using errcode = 'no_data_found';
  end if;
  select * into f from forms where workspace_id = m.workspace_id and code = 'cashew-indicator-report';

  select * into s from submissions
  where ministry_id = m.id and reporting_year_id = y.id and form_id = f.id for update;

  if s.id is not null then
    select state into cur from submission_revisions where id = s.current_revision_id;
    if cur = 'draft' then
      return s.current_revision_id;
    elsif cur in ('approved', 'returned') then
      return new_revision(s.id);
    else
      raise exception 'the % report for % is % and waiting for MoC review', m.short_name, report_year, cur
        using errcode = 'check_violation';
    end if;
  end if;

  if y.status = 'closed' then
    raise exception 'reporting year % is closed', report_year using errcode = 'check_violation';
  end if;

  insert into submissions (workspace_id, code, ministry_id, reporting_year_id, form_id, state, source, created_by)
  values (m.workspace_id, 'RY' || report_year || '-' || upper(m.short_name), m.id, y.id, f.id, 'draft', 'native', app_user_id())
  returning * into s;
  insert into submission_revisions (workspace_id, submission_id, revision_no, form_version_id, state, entered_by, created_by)
  values (m.workspace_id, s.id, 1, f.active_version_id, 'draft', app_user_id(), app_user_id())
  returning id into rid;
  update submissions set current_revision_id = rid where id = s.id;
  perform write_audit(m.workspace_id, 'submission.opened', 'submission_revision', rid, jsonb_build_object('submission', s.code));
  return rid;
end $$;

revoke execute on function open_submission(text, integer) from public, anon;
grant execute on function open_submission(text, integer) to authenticated;
