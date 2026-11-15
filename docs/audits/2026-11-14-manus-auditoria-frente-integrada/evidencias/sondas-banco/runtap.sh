#!/usr/bin/env bash
# Executa cada arquivo pgTAP numa transação isolada; reporta ok/not ok por arquivo.
WT="$1"; DB="$2"; OUT="$3"
export PGHOST=/tmp PGPORT=54329 PGUSER=postgres
: > "$OUT"
for f in "$WT"/supabase/tests/database/*.test.sql; do
  b=$(basename "$f")
  r=$(/usr/lib/postgresql/17/bin/psql -X -q -t -A -v ON_ERROR_STOP=0 -d "$DB" -f "$f" 2>&1)
  ok=$(echo "$r" | grep -cE "^ok [0-9]+")
  nok=$(echo "$r" | grep -cE "^not ok [0-9]+")
  err=$(echo "$r" | grep -cE "ERROR:")
  echo "$b ok=$ok notok=$nok errors=$err" >> "$OUT"
  if [ "$nok" -gt 0 ] || [ "$err" -gt 0 ]; then echo "--- $b" >> "${OUT}.detail"; echo "$r" | grep -E "^not ok|ERROR:|# " | head -12 >> "${OUT}.detail"; fi
done
