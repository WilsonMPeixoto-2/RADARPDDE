# Handoff corrente — Prontuário visual e correção integrada

> **CONTINUIDADE EM 15/11/2026:** este registro documenta a branch ORIGINAL do Argon e não acompanha as correções mais recentes. A integração verificada continua em [checkpoint atual](2026-11-15-prontuario-integracao-verificada.md), branch \`fix/prontuario-integrado-validado-20261115\`. Conferir o HEAD antes de editar. Esta nota não equivale a migração/merge.

**Branch de execução:** `feat/prontuario-correcao-integrada-20261114`.
**Versão remota mais recente deste handoff:** https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/feat/prontuario-correcao-integrada-20261114/docs/handoff/2026-11-14-prontuario-correcao-integrada.md
**Plano:** [T0–T6](../superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md). **Contrato:** [destino aprovado](../reference/PRONTUARIO_CORRECAO_CONTRATO.md).

## Retomar sem repetir trabalho

1. Fetch da branch de execução; conferir git log/status e esta versão remota, não apenas a cópia da main.
2. Ler contrato, plano e esta tabela. Revalidar main e PRs que tocam os mesmos arquivos.
3. Continuar no primeiro passo sem prova concluída; conservar mudanças do proprietário e de outras frentes.
4. Commit e push do checkpoint com testes/evidências; atualizar este handoff e marcar precisamente o que falta.

## Estado

| Etapa | Estado | Evidência / próximo passo |
|---|---|---|
| Preparação | Em curso | Worktree isolada na baseline `190e4494`; documentação conciliada e roteada |
| T0 | Em curso | 28 testes de baseline passaram; preparar fixtures e capturas do produto real |
| T1 | Não iniciada | Contexto/cabeçalhos/edição e prova visual |
| T2 | Não iniciada | Correção/regularização e contrato transacional |
| T3 | Não iniciada | Exclusão causal com patrimônio/provisória |
| T4 | Não iniciada | Bonificação/contexto errado |
| T5 | Não iniciada | Histórico/contatos/inventariação |
| T6 | Não iniciada | Gate global, compatibilidade e publicação |

## Decisões de execução

- Ruling: a autorização para executar e salvar inclui branch isolada e checkpoints remotos, sem repetição de perguntas — não autoriza CRUD institucional experimental.
- Ruling: documentação de destino não substitui descrição de Production antes da implementação — evita tanto reintroduzir guardas superadas quanto prometer capacidade inexistente.
- Pre-flight T0→T1: contexto e fixtures compartilhados; usar dados sintéticos e conservar autoridade global de competência.
- Pre-flight T2→T3/T4/T5: preview/apply/receipt são interfaces futuras, ainda ausentes; um comando por intenção e autoridade no servidor.
- Pre-flight T1→T2/T5: DOM será reorganizado; mapear consumidores de rowspan e handlers antes de editar.
- PR #515 permanece separado; não importar sua branch auxiliar de Preview nem alterar sua tabela/gaveta incidentalmente.
- Material de outro agente mencionado pelo proprietário: ainda não identificado nas consultas remotas iniciais; não presumir conteúdo nem bloquear execução. Incorporar somente após ler e confrontar com o código.

## Ambiente e validação

- Worktree local: `/workspace/scratch/b5eeb13f6754/integrated` (descartável; GitHub é continuidade).
- Dependências locais reaproveitadas da mesma baseline por symlink não versionado; não alterar lockfile por setup.
- Baseline: `node --test tests/unit/invoice-history-lock.test.js tests/unit/invoice-effects.test.js tests/unit/evaluation-retification.test.js` → 28/28, zero falhas.
- Chromium empacotado disponível para captura local; não representa Supabase remoto.
- Docker não encontrado no PATH desta sessão; planejar prova real pelo CI descartável existente, não declarar pgTAP/E2E remoto executados localmente.
- Nenhuma migration, regra, registro ou deployment alterado até este checkpoint.
