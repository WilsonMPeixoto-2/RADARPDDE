#!/usr/bin/env bash
set -euo pipefail

# Somente runners descartáveis do GitHub. Nunca limpar Docker do desenvolvedor.
if [[ "${GITHUB_ACTIONS:-}" != 'true' || "${RUNNER_ENVIRONMENT:-}" != 'github-hosted' ]]; then
  echo 'Este script exige runner descartável github-hosted.' >&2
  exit 1
fi
project_id=$(sed -n 's/^project_id = "\([a-zA-Z0-9_-]*\)"$/\1/p' supabase/config.toml)
[[ -n "$project_id" ]] || { echo 'project_id inválido.' >&2; exit 1; }

cleanup() {
  npx --no-install supabase stop --no-backup || true
  # Remove apenas containers residuais deste projeto; preserva imagens em cache.
  local containers
  containers=$(docker ps -aq --filter "name=^/supabase_.*_${project_id}$")
  if [[ -n "$containers" ]]; then
    docker rm -f $containers
  fi
}

for attempt in 1 2 3; do
  cleanup
  echo "Iniciando Supabase descartável: tentativa ${attempt}/3."
  if timeout 300 npx --no-install supabase start; then
    exit 0
  fi
  echo "::warning::Inicialização falhou na tentativa ${attempt}; limpando estado parcial."
  cleanup
  # Evidência de conflito sem encerrar serviços alheios ao projeto.
  docker ps --format '{{.Names}} {{.Ports}}'
  ss -ltn '( sport = :54322 )' || true
  if (( attempt < 3 )); then sleep "$((attempt * 15))"; fi
done
echo '::error::Supabase indisponível após três tentativas; gate permanece bloqueante.'
exit 1
