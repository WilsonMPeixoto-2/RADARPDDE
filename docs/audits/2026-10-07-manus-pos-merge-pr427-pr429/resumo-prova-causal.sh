#!/usr/bin/env bash
# Baixa métricas pequenas e resume a prova causal de reconexão de cada run/variante.
set -u
source /home/ubuntu/.user_env
export NO_COLOR=1 GH_PAGER=cat GH_PROMPT_DISABLED=1
R=WilsonMPeixoto-2/RADARPDDE
mkdir -p /home/ubuntu/audit407/art429
cd /home/ubuntu/audit407/art429
for id in "$@"; do
  for v in baseline candidate; do
    d="$id-$v"
    [ -d "$d" ] || timeout 180 gh run download "$id" --repo "$R" -n "operational-metrics-$v-$id" -D "$d" >/dev/null 2>&1 < /dev/null
    f=$(find "$d" -name session-report.json 2>/dev/null | head -1)
    if [ -z "$f" ]; then echo "$id $v SEM_ARTEFATO"; continue; fi
    python3 - "$f" "$id" "$v" <<'EOF'
import json, sys
f, i, v = sys.argv[1:]
d = json.load(open(f))
fa = d.get('faults', {})
p = fa.get('reconnectProof', {})
o = p.get('old', {}); r = p.get('recovery', {})
print(json.dumps({
  'run': i, 'variant': v, 'outcome': d.get('outcome'), 'stage': d.get('stage'),
  'rounds': d.get('rounds'), 'failure': (d.get('failure') or {}).get('message', '')[:300],
  'old': [o.get('value'), o.get('rowVersion'), bool(o.get('releasedAt'))],
  'recovery': [r.get('value'), r.get('rowVersion'), r.get('rpc')],
  'oldHeld': p.get('oldHeldThroughReconnect'), 'uiOldBefore': p.get('uiOldBeforeRecovery'),
  'uiConverged': p.get('uiConvergedAfterRecovery'), 'source': p.get('recoverySource'),
  'counterproof': fa.get('counterproof')
}, ensure_ascii=False))
EOF
  done
done
