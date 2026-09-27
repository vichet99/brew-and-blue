#!/usr/bin/env bash
# LOCAL STACK ONLY: creates three test accounts (lead = admin + reviewer, reviewer, MAFF focal point)
# in a local `supabase start` stack (run from me-system/). Never run against a real project.
set -euo pipefail
SK=$(npx --yes supabase@2.118.0 status -o env | sed -n 's/^SECRET_KEY="\(.*\)"$/\1/p')
[ -n "$SK" ] || { echo "local Supabase stack is not running"; exit 1; }
for u in lead reviewer focal; do curl -s -o /dev/null -X POST http://127.0.0.1:54321/auth/v1/admin/users -H "apikey: $SK" -H "Authorization: Bearer $SK" -H "Content-Type: application/json" -d "{\"email\":\"$u@example.org\",\"password\":\"Test-$u-2026!\",\"email_confirm\":true}"; done
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -q <<'SQL'
insert into users (auth_user_id, email, full_name, status)
select id, email, case split_part(email,'@',1) when 'lead' then 'Test Lead' when 'reviewer' then 'Test Reviewer' else 'Test MAFF Focal' end, 'active' from auth.users;
insert into memberships (workspace_id, user_id, ministry_id)
select w.id, u.id, m.id from users u, workspaces w, ministries m where m.code = case when u.email like 'focal%' then 'maff' else 'moc' end;
insert into role_grants (workspace_id, membership_id, role, scope_type, scope_ministry_id, granted_by)
select ms.workspace_id, ms.id, g.role::app_role, g.scope, case when g.scope='ministry' then ms.ministry_id end, (select id from users where email='lead@example.org')
from memberships ms join users u on u.id = ms.user_id
join (values ('lead@example.org','admin','workspace'),('lead@example.org','reviewer','workspace'),('reviewer@example.org','reviewer','workspace'),('focal@example.org','focal','ministry')) g(email, role, scope) on g.email = u.email;
SQL
