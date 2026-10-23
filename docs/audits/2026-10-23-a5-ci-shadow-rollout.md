# A5 — Shadow CI: classificação de impacto sem dispensar verificações

**Data:** 23/10/2026. **Status:** candidata experimental à integração, exclusivamente observacional.

## Objetivo
Reduzir futuramente a execução redundante de CI em alterações documentais ou de tooling, mantendo a qualidade dos gates que protegem autenticação, permissões, persistência, UX e banco.

O [PR #475](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/475), com duas ferramentas Knip, uma linha em `package.json` e documento Markdown, acionou 18 workflows e 34 checks inicialmente. O resultado final teve 32 sucessos, 2 skips e 2 falhas em jornadas de Auth/perfis e Supabase. Os arquivos modificados não afetam diretamente esses fluxos, mas as falhas exigem classificação e não devem ser apagadas ou rotuladas automaticamente como flakiness.

## Mudança concreta
O classificador em `scripts/ci/classify-pr-impact.mjs` reconhece:
- `docs-only`: apenas Markdown explicitamente permitido.
- `tooling-only`: arquivos de diagnóstico Knip conhecidos e/ou inclusão **exata** do script `analyze:unused:deep` sem qualquer outra alteração em `package.json`.
- `full`: qualquer alteração fora dessas condições, ausência da referência base, arquivo desconhecido, SQL, TypeScript/JavaScript do produto, YAML de CI, `package-lock.json` ou falha de leitura/diff.

O workflow existente `.github/workflows/validate.yml` executa o classificador **depois do checkout e antes do npm ci**, apenas em `pull_request`, usa o SHA base do evento e registra JSON/log e um resumo. O checkout da validação principal usa profundidade 2 para incluir os pais do merge de teste. O passo usa `continue-on-error: true`, pois é só observação e não pode vetar o status check principal.

**Nenhum `if` foi adicionado aos jobs funcionais; não houve mudança dos triggers, permissões, nomes dos checks, produtos, SQL ou RLS.** O modo sombra nunca autoriza pular checks. Testes unitários verificam classificação conservadora, dependências, scripts de produto e falha segura.

## Contraprova necessária antes de otimizar a execução

1. Validar em GitHub Actions que a CI reconhece o SHA base correto e não depende de histórico de Git indisponível.
2. Confrontar classificações com PRs históricos que mudaram SQL, runtime, testes, `package-lock.json`, docs e tooling.
3. Ler a configuração **efetiva** dos required status checks antes de editar qualquer trigger, `if` ou job de CI. A integração atualmente não tem acesso à branch protection (403).
4. Só depois propor um piloto de redução de carga em **um** workflow, preservando status check com nome estável. Diferenças inesperadas devem retornar `full`.
5. Medir redução de execuções, duração e custo sem remover cobertura real de riscos.

## Referências

- [Prova A5 anterior: 7 testes em runner isolado](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39901827962).
- [A4 TypeScript/Knip: dois jobs aprovados](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39901370296).
- [PR #475, Knip opt-in](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/475).
- GitHub Docs: https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks

**Não considerar A5 como otimização implantada enquanto estiver somente em modo observacional.**
