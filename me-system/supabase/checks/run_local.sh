#!/usr/bin/env bash
# Apply migrations + seed to a throwaway local Postgres and run the role checks.
# Usage: PGHOST=/tmp PGPORT=54329 PGUSER=postgres supabase/checks/run_local.sh
set -euo pipefail
cd "$(dirname "$0")/.."
db=me_check_$$
psql -q -c "create database $db"
trap 'psql -q -c "drop database $db"' EXIT
for f in checks/00_supabase_stub.sql migrations/*.sql seed.sql checks/10_roles_and_workflow.sql; do
  psql -q -v ON_ERROR_STOP=1 -d "$db" -f "$f" > /dev/null 2>checks.log || { cat checks.log; rm -f checks.log; exit 1; }
done
grep -c "NOTICE:  ok" checks.log | xargs -I{} echo "{} checks passed"
rm -f checks.log
