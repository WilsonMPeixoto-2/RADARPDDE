# Release 2 — T4 (primeiro caso): ativação controlada da correção de bonificação

**Publicação conferida em 22–23/11/2026:** PR #538 integrado (`ca73311377f95f32e994f98dfa5bdb4b0f56b7cc`), migration 65 aplicada e ativação confirmada no deployment `dpl_84bdgsjX2HS3CuWaseM4ErXF8KwR` (`operationalCorrectionRelease=true`, `bonificationCorrectionRelease=true`). A correção de linguagem `T0T6-D021` ([PR #540](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/540), commit `4b698b4121c9f5f356622b468fb44b71a5832915`) e as Ondas 1–3 de UX/a11y ([#541](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/541), [#542](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/542), [#543](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/543)) foram integradas na `main` mantendo o backend intacto. O procedimento abaixo preserva a ordem histórica e as condições de recuperação.


**Escopo restrito:** correção ou limpeza da avaliação de **Notas Fiscais**, por escola × competência × programa, com prévia, registro administrativo e reconsolidação. **Não significa T4 integral concluída**: limpeza de histórico, exclusão de contexto e outras marcas continuam pendentes.

## Limites operacionais

- T0–T3 permanecem em Production com `operationalCorrectionRelease=true`; essa flag **não** habilita T4.
- A T4 é executável no Supabase **local descartável** com `operationalCorrectionPilot=true`.
- Em Production, a T4 requer simultaneamente `operationalCorrectionRelease=true` e o opt-in **independente** `RADAR_BONIFICATION_CORRECTION_RELEASE_ENABLED=true`.
- Esse segundo opt-in é **OFF por padrão**, inclusive quando a Release 1 está ON. O manifesto público `radar-build-manifest.json` deve apresentar `bonificationCorrectionRelease:false` antes da ativação.
- O SQL da migration 65 `20261121000200_correct_fiscal_bonification.sql` é versionado e aprovado apenas quando executado com sucesso em banco descartável; a existência no GitHub **não comprova sua aplicação** no Supabase institucional.

## Ordem de publicação (sem atalhos)

1. **Homologação:** comprovar CI no SHA exato (incluindo Auth/RLS, pgTAP, concorrência, XLSX gerado, responsividade e screenshots), confirmar aceite visual do proprietário para o botão **Corrigir bonificação**, prévia, aviso **Alterações pendentes de consolidação** e consolidação.
2. **Merge com T4 desativada:** integrar o PR à `main` sem configurar `RADAR_BONIFICATION_CORRECTION_RELEASE_ENABLED=true`. A publicação automatizada da Vercel pode ocorrer com a feature T4 OFF; verificar o manifesto público e o deploy no mesmo SHA. T0–T3 continuam disponíveis.
3. **Migration institucional:** conferir previamente o histórico remoto das 64 migrations e o projeto institucional correto. Executar exclusivamente a migration **65**, com a autorização institucional de publicação apropriada, sem importação de dados nem seed de testes. Validar a presença de `20261121000200_correct_fiscal_bonification`, funções e trigger correspondentes por leitura SQL, sem executar CRUD de escolas reais.
4. **Ativação explícita e redeploy:** somente após migração verificada, configurar `RADAR_BONIFICATION_CORRECTION_RELEASE_ENABLED=true` para **Production**, preservar `RADAR_OPERATIONAL_CORRECTION_RELEASE_ENABLED=true`, publicar novo deployment. Verificar `READY`, SHA e manifesto com ambas as flags `true`.
5. **Smoke:** um Controlador autorizado deve conseguir encontrar **Corrigir bonificação** e abrir a prévia; navegar entre programas e verificar que o histórico e as notas são preservados. Não confirmar alterações em registros de escolas reais durante smoke sem autorização específica. Registrar data, commit, migration, deployment, perfis e evidências.

## Recuperação

Se ocorrer regressão, desligar **apenas** `RADAR_BONIFICATION_CORRECTION_RELEASE_ENABLED` e publicar novamente, conservando T0–T3 ON. Não reverter automaticamente a migration 65: ela define funções/trigger e requer análise específica de compatibilidade. Nunca apagar dados institucionais como mecanismo de rollback.

## Contrato do Excel institucional

O modelo XLSX e o CSV legado incluem apenas bonificações atualmente consolidadas. Com `bonificacaoPendenteConsolidacao=true`, o programa fica ausente da base e sínteses enquanto aguarda reconsolidação; após a ação válida, volta a aparecer no **novo** arquivo. Os 12 campos, quatro abas e programas vizinhos são preservados. A prova de referência está no teste autenticado de T4 e nos dois anexos `t4-excel-pendente` e `t4-excel-reconsolidado` do relatório Playwright em Supabase descartável.


## Encerramento integral da T4 — candidatas #546 e #558

O primeiro caso acima já foi publicado. Para os dois comandos restantes, preservar T0–T3 e bonificação ativos; as novas flags começam OFF. Consultar o [runbook de histórico](../releases/2026-11-23-t4-item-history-candidate.md) e a preparação de [exclusão do contexto](../releases/2026-11-23-t4-context-deletion-merge-preparation.md).

1. Validar a combinação #546 + #558 no mesmo SHA, incluindo CI obrigatório, pgTAP, duas sessões PostgreSQL, jornadas autenticadas, provas de isolamento NF/Assessoria/a_identificar e inspeção visual desktop/mobile em ambos os temas.
2. Integrar #558 sobre #546; congelar e validar novamente o SHA final de #546. Não liberar apenas a primeira metade da candidata.
3. Antes do merge à main: conferir backup recuperável, histórico remoto (65 migrations), autorização de aplicação e catálogo. Aplicar somente 66 e 67, sem seed nem CRUD de registros institucionais. Validar o catálogo em leitura.
4. Integrar #546 na main, verificar deploy READY e manifesto com as duas novas flags OFF; as melhorias visuais sem flag já devem estar homologadas.
5. Ativar explicitamente RADAR_T4_CONTEXT_DELETION_RELEASE_ENABLED e RADAR_T4_ITEM_HISTORY_RELEASE_ENABLED somente para Production, preservar as flags anteriores, redeployar o mesmo SHA e confirmar manifesto e smoke não destrutivo.
6. Registrar evidências e atualizar CHECKPOINT. Não marcar T4 publicada antes de concluir os seis passos; T5 não é parte desta release.

Rollback de schema depende de ensaio em clone e aprovação. Flags OFF contêm novas operações, mas não recuperam dados já excluídos.
