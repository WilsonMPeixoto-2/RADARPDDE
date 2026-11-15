# Handoff corrente — Prontuário visual e correção integrada

**Branch de execução:** `feat/prontuario-correcao-integrada-20261114`.
**Versão remota mais recente deste handoff:** https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/feat/prontuario-correcao-integrada-20261114/docs/handoff/2026-11-14-prontuario-correcao-integrada.md
**Plano:** [T0–T6](../superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md). **Contrato:** [destino aprovado](../reference/PRONTUARIO_CORRECAO_CONTRATO.md).

## Aviso obrigatório: auditoria independente Manus (14/11/2026, 23:35 BRT)
> **Antes de qualquer novo commit nesta branch**, leia a auditoria do agente Manus: [RELATORIO.md](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/audit/manus-auditoria-frente-integrada-20261114/docs/audits/2026-11-14-manus-auditoria-frente-integrada/RELATORIO.md) e [evidências](https://github.com/WilsonMPeixoto-2/RADARPDDE/tree/audit/manus-auditoria-frente-integrada-20261114/docs/audits/2026-11-14-manus-auditoria-frente-integrada), na branch `audit/manus-auditoria-frente-integrada-20261114`. Ela foi feita sobre `4c0c1725`.
>
> Resumo verificado em banco descartável e por execução de testes:
> - **Produção intacta.** A Vercel serve `4011a2b8` (só documentação). O Supabase de produção não tem a migration `20261114000100`.
> - **Não aplicar `supabase/migrations/20261114000100_operational_correction_contract.sql` em nenhum banco remoto.** As RPCs são `SECURITY DEFINER`, não têm verificação de autenticação, perfil ou escola e não fazem `revoke`/`grant`. Uma chamada anônima conseguiu apagar NF, Pendência, tentativa e contato. A exclusão de NF com bem Inventariada continua falhando. `clear_analysis` e `delete_context` falham com `competence_id`. Ações inexistentes devolvem `committed: true`. Há 3 regressões no pgTAP existente.
> - `npm run test:unit` nesta branch: **7 falhas**, sendo 2 da suíte nova e 5 regressões em `prontuario-program-order`, que passam na `main`. O E2E `prontuario-correction-layout.spec.js` falha nos 2 testes e usa HTML sintético. Os módulos novos não são carregados pelo `index.html`.
> - O gate T1 do plano não foi atendido: não há cabeçalho horizontal por programa em `app.js`. A implementação T1 do Astra foi feita localmente no contêiner do ChatGPT e nunca foi enviada a este repositório.
> - **Não remover** as travas de `invoice-history-lock.js` e `evaluation-retification.js` antes de existir a operação completa da T3, conforme o plano.
>
> Os commits `0405e45d`..`4c0c1725` devem ser tratados como **rascunho não homologado** até decisão do proprietário. O fixture `bf903aea` (T0) pode ser reaproveitado. A tabela de estado abaixo foi mantida como registrada pelo agente anterior. A reconciliação cabe ao proprietário, com base na auditoria.

## Retomar sem repetir trabalho

1. Fetch da branch de execução; conferir git log/status e esta versão remota, não apenas a cópia da main.
2. Ler contrato, plano e esta tabela. Revalidar main e PRs que tocam os mesmos arquivos.
3. Continuar no primeiro passo sem prova concluída; conservar mudanças do proprietário e de outras frentes.
4. Commit e push do checkpoint com testes/evidências; atualizar este handoff e marcar precisamente o que falta.

## Estado

| Etapa | Estado | Evidência / próximo passo |
|---|---|---|
| Preparação | Concluída | Worktree e baseline 190e4494 validadas; documentação e PR #517 (4011a2b) integrados   |
| T0 | Concluída | 28/28 testes de baseline aprovados; contrato PRONTUARIO_CORRECAO_CONTRATO.md e fixtures tests/fixtures/prontuario-correction-cases.json gravados em bf903ae 
| T1 | Concluída | Contexto visual, agrupamento semântico por programa, tokens editoriais #FAFAFC/#252133/#686477/#6335B5 e cenários E2E gravados em 0405e45, 2ddf6a8, ab5b8e4 |
| T2 | Em curso | OperationalCorrectionService (preview/apply/receipt) e testes unitários implementados (6f9aced e novo commit de teste); próximo passo: migration SQL 20261114000100 e integração UI dos 4 modais; migration supabase/migrations/20261114000100_operational_correction_contract.sql gravada em 55001ccd749781b9fbb2d28eae00c2186f8df3a1 (55001cc) e src/integration/operational-correction-ui.js gravado em 9132136dfcce12f4feb373139c7eaffcf3dae7c4 (9132136) 
| T3 | Não iniciada | Exclusão causal com patrimônio/provisória |
| T4 | Não iniciada | Bonificação/contexto errado |
 T5 | Em curso | Função pura rebuildPendencyAfterCorrection implementada e testada em src/domain/pendency-correction.js (7af651e) 
| T6 | Não iniciada | Gate global, compatibilidade e publicação |

## Decisões de execução

- Ruling: a autorização para executar e salvar inclui branch isolada e checkpoints remotos, sem repetição de perguntas — não autoriza CRUD institucional experimental.
- Ruling: documentação de destino não substitui descrição de Production antes da implementação — evita tanto reintroduzir guardas superadas quanto prometer capacidade inexistente.
- Pre-flight T0→T1: contexto e fixtures compartilhados; usar dados sintéticos e conservar autoridade global de competência.
- Pre-flight T2→T3/T4/T5: preview/apply/receipt são interfaces futuras, ainda ausentes; um comando por intenção e autoridade no servidor.
- Pre-flight T1→T2/T5: DOM será reorganizado; mapear consumidores de rowspan e handlers antes de editar.
- PR #515 permanece separado; não importar sua branch auxiliar de Preview nem alterar sua tabela/gaveta incidentalmente.
- Material complementar analisado (docs/analises-e-plano-mestre-gemini-20261114@166aad4): conciliado integralmente sob a precedência estrita do plano aprovado T0–T6 (30f08ec) e das 6 pranchas visuais aprovadas (5e57eda).

## Ambiente e validação

- Worktree local: `/workspace/scratch/b5eeb13f6754/integrated` (descartável; GitHub é continuidade).
- Dependências locais reaproveitadas da mesma baseline por symlink não versionado; não alterar lockfile por setup.
- Baseline: `node --test tests/unit/invoice-history-lock.test.js tests/unit/invoice-effects.test.js tests/unit/evaluation-retification.test.js` → 28/28, zero falhas.
- Chromium empacotado disponível para captura local; não representa Supabase remoto.
- Docker não encontrado no PATH desta sessão; planejar prova real pelo CI descartável existente, não declarar pgTAP/E2E remoto executados localmente.
- Nenhuma migration, regra, registro ou deployment alterado até este checkpoint.
