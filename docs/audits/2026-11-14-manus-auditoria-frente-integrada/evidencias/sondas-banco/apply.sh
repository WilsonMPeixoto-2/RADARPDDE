#!/usr/bin/env bash
# Sobe um cluster PostgreSQL 17 descartável e aplica as migrations de um worktree.
# Uso: apply.sh <worktree> <dbname> [ultima_migration_inclusiva]
set -u
WT="$1"; DB="$2"; LAST="${3:-}"
PGBIN=/usr/lib/postgresql/17/bin
DATA=/home/ubuntu/analise/pgtest/data
PORT=54329
export PGHOST=/tmp PGPORT=$PORT PGUSER=postgres
if [ ! -d "$DATA" ]; then
  $PGBIN/initdb -D "$DATA" -U postgres --auth=trust -E UTF8 --locale=C.UTF-8 >/tmp/initdb.log 2>&1 || { cat /tmp/initdb.log; exit 1; }
  echo "unix_socket_directories = '/tmp'" >> "$DATA/postgresql.conf"
  echo "port = $PORT" >> "$DATA/postgresql.conf"
fi
$PGBIN/pg_ctl -D "$DATA" status >/dev/null 2>&1 || $PGBIN/pg_ctl -D "$DATA" -l /home/ubuntu/analise/pgtest/pg.log start -w >/dev/null
$PGBIN/dropdb --if-exists "$DB" >/dev/null 2>&1
$PGBIN/createdb "$DB"
$PGBIN/psql -q -v ON_ERROR_STOP=1 -d "$DB" -f /home/ubuntu/analise/pgtest/bootstrap.sql >/tmp/boot_$DB.log 2>&1 || { echo "BOOTSTRAP FALHOU"; cat /tmp/boot_$DB.log; exit 1; }
ok=0; fail=0
for f in $(ls "$WT"/supabase/migrations/*.sql | sort); do
  base=$(basename "$f")
  if [ -n "$LAST" ] && [[ "$base" > "$LAST" ]]; then break; fi
  if $PGBIN/psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f" >/tmp/mig_$DB.log 2>&1; then
    ok=$((ok+1))
  else
    fail=$((fail+1)); echo "FALHA em $base:"; tail -5 /tmp/mig_$DB.log; break
  fi
done
echo "migrations aplicadas: $ok, falhas: $fail"
