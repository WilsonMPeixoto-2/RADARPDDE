#!/usr/bin/env bash
set -euo pipefail

# Exclusivamente PostgreSQL DESCARTÁVEL/local. Nunca rodar em Production.
DB="$(printf '%s' "$1")"
case "$DB" in
  ind_*|radar_test_*) ;;
  *) echo "Informe um banco DESCARTÁVEL com nome ind_* ou radar_test_*." >&2; exit 2 ;;
esac
case "$(printenv PGHOST 2>/dev/null || true)" in
  ""|localhost|127.0.0.1|/var/run/postgresql) ;;
  *) echo "PGHOST remoto não autorizado neste teste." >&2; exit 2 ;;
esac

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
runpsql(){ psql -X -q -t -A -v ON_ERROR_STOP=1 -d "$DB" "$@"; }

runpsql -f "$ROOT/tests/fixtures/operational-correction-concurrency-seed.sql" > "$TMP/seed.log" 2>&1
REQUEST='{"contractVersion":1,"action":"delete_invoice","target":{"kind":"invoice","id":"OCC-NF-1","schoolId":"OCC-SCHOOL","competence":"2041-03","programId":"OCC_BASIC"}}'
JWT='{"sub":"00000000-0000-0000-0000-00000000c001","role":"authenticated"}'
DIGEST="$(runpsql -c "BEGIN; SELECT set_config('request.jwt.claims','$JWT',true); SET LOCAL ROLE authenticated; SELECT public.preview_operational_change('$REQUEST'::jsonb)->>'planDigest'; ROLLBACK;" | grep -E '^[[:xdigit:]]{64}$' | tail -1)"
test "$(printf '%s' "$DIGEST" | wc -c)" -eq 64

OPKEY='ea7ba3dc-4d31-4a07-a066-e4f50b41ea10'
for session in A B; do
  {
    echo "BEGIN;"
    echo "SELECT set_config('request.jwt.claims','$JWT',true);"
    echo "SET LOCAL ROLE authenticated;"
    echo "SELECT public.apply_operational_change('$REQUEST'::jsonb,'$DIGEST','$OPKEY'::uuid);"
    if [ "$session" = A ]; then echo 'SELECT pg_sleep(3);'; fi
    echo 'COMMIT;'
  } > "$TMP/$session.sql"
done

(runpsql -f "$TMP/A.sql" > "$TMP/A.out" 2>&1; echo "$?" > "$TMP/A.rc") &
A=$!
sleep 0.5
(runpsql -f "$TMP/B.sql" > "$TMP/B.out" 2>&1; echo "$?" > "$TMP/B.rc") &
B=$!
wait "$A" || true
wait "$B" || true

RC_A="$(cat "$TMP/A.rc" 2>/dev/null || echo 99)"
RC_B="$(cat "$TMP/B.rc" 2>/dev/null || echo 99)"
if [ "$RC_A" -ne 0 ] || [ "$RC_B" -ne 0 ]; then
  echo "Concorrência FALHOU: A=$RC_A B=$RC_B"
  cat "$TMP/A.out" "$TMP/B.out"
  exit 1
fi
grep -Eq '"committed": true' "$TMP/A.out"
grep -Eq '"committed": true' "$TMP/B.out"
grep -Eq '"replayed": true' "$TMP/B.out" || { echo "A segunda sessão não recebeu replay"; cat "$TMP/B.out"; exit 1; }
COUNTS="$(runpsql -c "SELECT (SELECT count(*) FROM public.registered_invoices WHERE id='OCC-NF-1')::text || '|' || (SELECT count(*) FROM radar_private.operational_change_ledger WHERE operation_key='$OPKEY');")"
test "$COUNTS" = '0|1' || { echo "Estado inconsistente: $COUNTS"; exit 1; }
echo 'PASS: duas sessões simultâneas, um commit, um replay, uma única exclusão.'
