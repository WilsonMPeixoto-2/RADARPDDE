# T4 — `clear_item_history`: homologação e liberação controlada

**Estado:** CANDIDATA / DRAFT #558. **Não aplicada, não publicada, não homologada e não autorizada para merge.**
**Baseline obrigatória:** PR #546 / migration 66. **Migration candidata:** `20261123000200_t4_clear_item_history.sql` (67ª).
**Branch de desenvolvimento:** `feat/t4-clear-item-history-chatgpt-20261123`, base `feat/t4-delete-context-contract-20261123`.

## Contrato humano

A ação **Limpar histórico** aplica-se ao item identificado por escola + competência + programa + tipo de documento (e ID de nota para Nota Fiscal ou Consulta à Assessoria). Ela **não** equivale a limpar apenas a análise atual, excluir a NF ou excluir todos os lançamentos do programa.

Na prévia, apresentar explicitamente as Pendências de qualquer status, seus envios e contatos associados. A confirmação é única, destrutiva e idempotente; não é oferecida quando a prévia omite IDs afetados. Preservar notas fiscais, despesas, bens, bonificação consolidada, outros documentos, meses/programas, contatos gerais e a trilha administrativa da própria exclusão.

**Proibição de inferência:** uma Pendência antiga sem `program_id` ou sem vínculo explícito de NF não é associada ao item por proximidade de escola, competência ou texto. Tratar individualmente o vínculo ambíguo.

## Ativação — dois marcos independentes

1. **Integração de código:** exigir CI no SHA final da combinação #546 + #558, testes SQL reais com Auth/RLS, contratos de acesso, teste adversarial de duas sessões e screenshots navegados desktop/mobile; registrar aceite do responsável. Não confundir deploy com ativação.
2. **Ativação funcional:** somente após migrations 66 e 67 conferidas no histórico institucional, backup comprovado, procedimento de restauração testado em ambiente descartável e autorização explícita. Ativar `RADAR_T4_ITEM_HISTORY_RELEASE_ENABLED=true` apenas quando `RADAR_OPERATIONAL_CORRECTION_RELEASE_ENABLED`, `RADAR_BONIFICATION_CORRECTION_RELEASE_ENABLED` e `RADAR_T4_CONTEXT_DELETION_RELEASE_ENABLED` já estiverem autorizadas. O manifesto público `itemHistoryRelease` deve refletir a autorização. **A flag nasce OFF.**

## Gates verificáveis

- `supabase test db` com dados sintéticos, Auth/RLS de Controlador e recusa de `sme_management`; contextos vizinhos e patrimônio preservados; Pendências abertas, resolvidas, canceladas, seus contatos e tentativas; idempotência e `STALE_PLAN`.
- Testes E2E da janela: prévia detalhada, tecla Escape e Cancelar sem gravação, confirmação uma vez, mudança visível antes do F5, leitura após reload e outra sessão; screenshots em 1280×720 e 390×844, claro/escuro e zoom.
- Revisão de fontes: planner + apply + ledger + guards + versões; confirmação de que nenhuma tentativa/contato extra pode ser apagado; revisão das telas reais e do layout como usuário humano.
- CI no SHA final sem testes obrigatórios ignorados e sem regressão da bonificação/Excel e das demais funções.
- Revalidar `remote-post-apply.sql` e o espelho de 67 migrations **somente em banco descartável** durante a homologação. Nenhum preflight institucional deve escrever dados.

## Contenção e rollback

1. **Desabilitar a função:** manter/retornar `RADAR_T4_ITEM_HISTORY_RELEASE_ENABLED=false`; confirmar que `itemHistoryRelease=false` no manifesto publicado. Bloqueio na UI é contenção, não recuperação de dados.
2. **Interromper novas operações** e preservar logs/ledger/recibos. Não executar `db reset`, `db push` ou scripts de reversão no Supabase institucional sem autorização e plano testado.
3. **Schema:** eventual reversão dos wrappers `operational_correction_build_plan`/`operational_correction_log` para as funções anteriores (`*_r3`) depende de ensaio em clone, verificação de dependências e autorização. Não apagar migrations já registradas para forçar alinhamento.
4. **Dados:** uma exclusão confirmada não é desfeita simplesmente pela flag OFF nem por reversão de schema. Recuperação requer backup/ponto de restauração confiável, identificação do conjunto pelo recibo e reconciliação administrativa; não sobrescrever movimentos legítimos feitos depois do backup.

## Evidência e ressalvas

A revisão de código identificou e corrigiu, **como candidata ainda não homologada**, um defeito de visibilidade dos botões do modal de exclusão do #546 em viewport de 720 px; sua prova é o teste Playwright de geometria e screenshot no mesmo SHA. Capturas anteriores mostram o problema de UX mas não comprovam sua correção. Screenshots de produção autenticada não foram obtidos nesta frente.

Não encerrar T4 enquanto a operação não estiver utilizável e validada na versão publicada.
