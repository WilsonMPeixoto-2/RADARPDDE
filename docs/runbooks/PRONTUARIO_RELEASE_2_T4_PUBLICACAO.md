# Release 2 — T4 (primeiro caso): ativação controlada da correção de bonificação

**Publicação conferida em 22/11/2026:** PR #538 integrado (`ca73311377f95f32e994f98dfa5bdb4b0f56b7cc`), migration 65 aplicada e deployment `dpl_84bdgsjX2HS3CuWaseM4ErXF8KwR` em READY. O manifesto público confirmou `operationalCorrectionRelease=true` e `bonificationCorrectionRelease=true`. O procedimento abaixo preserva a ordem histórica e as condições de recuperação; a correção de linguagem `T0T6-D021` será proposta em PR independente, mantendo backend intacto.


**Escopo restrito:** correção ou limpeza da avaliação de **Notas Fiscais**, por escola × competência × programa, com prévia, registro administrativo e reconsolidação. **Não significa T4 integral concluída**: limpeza de histórico, exclusão de contexto e outras marcas continuam pendentes.

## Limites operacionais

- T0–T3 permanecem em Production com `operationalCorrectionRelease=true`; essa flag **não** habilita T4.
- A T4 é executável no Supabase **local descartável** com `operationalCorrectionPilot=true`.
- Em Production, a T4 requer simultaneamente `operationalCorrectionRelease=true` e o opt-in **independente** `RADAR_BONIFICATION_CORRECTION_RELEASE_ENABLED=true`.
- Esse segundo opt-in é **OFF por padrão**, inclusive quando a Release 1 está ON. O manifesto público `radar-build-manifest.json` deve apresentar `bonificationCorrectionRelease:false` antes da ativação.
- O SQL da migration 65 `20261121000200_correct_fiscal_bonification.sql` é versionado e aprovado apenas quando executado com sucesso em banco descartável; a existência no GitHub **não comprova sua aplicação** no Supabase institucional.

## Ordem de publicação (sem atalhos)

1. **Homologação:** comprovar CI no SHA exato (incluindo Auth/RLS, pgTAP, concorrência, XLSX gerado, responsividade e screenshots), confirmar aceite visual do proprietário para o botão **Corrigir consolidação**, prévia, aviso **Alterações pendentes de consolidação** e consolidação.
2. **Merge com T4 desativada:** integrar o PR à `main` sem configurar `RADAR_BONIFICATION_CORRECTION_RELEASE_ENABLED=true`. A publicação automatizada da Vercel pode ocorrer com a feature T4 OFF; verificar o manifesto público e o deploy no mesmo SHA. T0–T3 continuam disponíveis.
3. **Migration institucional:** conferir previamente o histórico remoto das 64 migrations e o projeto institucional correto. Executar exclusivamente a migration **65**, com a autorização institucional de publicação apropriada, sem importação de dados nem seed de testes. Validar a presença de `20261121000200_correct_fiscal_bonification`, funções e trigger correspondentes por leitura SQL, sem executar CRUD de escolas reais.
4. **Ativação explícita e redeploy:** somente após migração verificada, configurar `RADAR_BONIFICATION_CORRECTION_RELEASE_ENABLED=true` para **Production**, preservar `RADAR_OPERATIONAL_CORRECTION_RELEASE_ENABLED=true`, publicar novo deployment. Verificar `READY`, SHA e manifesto com ambas as flags `true`.
5. **Smoke:** um Controlador autorizado deve conseguir encontrar **Corrigir marca** e abrir a prévia; navegar entre programas e verificar que o histórico e as notas são preservados. Não confirmar alterações em registros de escolas reais durante smoke sem autorização específica. Registrar data, commit, migration, deployment, perfis e evidências.

## Recuperação

Se ocorrer regressão, desligar **apenas** `RADAR_BONIFICATION_CORRECTION_RELEASE_ENABLED` e publicar novamente, conservando T0–T3 ON. Não reverter automaticamente a migration 65: ela define funções/trigger e requer análise específica de compatibilidade. Nunca apagar dados institucionais como mecanismo de rollback.

## Contrato do Excel institucional

O modelo XLSX e o CSV legado incluem apenas bonificações atualmente consolidadas. Com `bonificacaoPendenteConsolidacao=true`, o programa fica ausente da base e sínteses enquanto aguarda reconsolidação; após a ação válida, volta a aparecer no **novo** arquivo. Os 12 campos, quatro abas e programas vizinhos são preservados. A prova de referência está no teste autenticado de T4 e nos dois anexos `t4-excel-pendente` e `t4-excel-reconsolidado` do relatório Playwright em Supabase descartável.
