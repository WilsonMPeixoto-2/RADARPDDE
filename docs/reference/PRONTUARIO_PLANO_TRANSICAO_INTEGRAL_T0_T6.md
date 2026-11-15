# Prontuário T0–T6 — Matriz de transição integral das regras, interfaces e provas

**Data-base:** 15/11/2026. **Natureza:** anexo executável do plano original do Astra; não cria outra frente, nem autoriza merge, SQL institucional ou deploy.  
**Branch de execução:** `fix/prontuario-integrado-validado-20261115`.  
**Regra de precedência:** [contrato aprovado](PRONTUARIO_CORRECAO_CONTRATO.md) → [plano original T0–T6](../superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md) → [checkpoint vigente](../handoff/2026-11-15-prontuario-integracao-verificada.md) → código e testes do SHA.  
**Base da auditoria detalhada:** [leitura de código e contraprovas](../audits/2026-11-15-auditoria-profunda-codigo-integrado-t0-t6.md).

> **Critério de conclusão revisto:** uma regra nova não está concluída quando a função foi criada. O lote está concluído quando a autoridade antiga foi conscientemente mantida ou substituída, o novo comando é atingível no fluxo humano, o banco o executa integralmente, os consumidores apresentam o resultado após F5/segunda sessão, as expectativas de teste descrevem a decisão nova, a documentação é coerente e a compatibilidade de clientes foi comprovada. Não antecipar a retirada de guarda antiga enquanto a operação substituta estiver incompleta.

## 1. Três estados que NÃO devem ser confundidos

| Estado | Significado | Evidência e decisão |
|---|---|---|
| **A. Produção vigente** | `main`, Vercel e Supabase institucional continuam com o contrato anterior nesta frente. | Revalidar SHAs e migrations antes de cada decisão. Não chamar comportamento antigo de regressão da Produção. |
| **B. Integração em preparação** | Branch tem código de T1, cliente/RPCs de T2/T3, diálogo de T2 sob flag, mas sem ativação por padrão e sem jornadas completas. | Bloqueios antigos ainda presentes em `InvoiceService.remove()` e `evaluation-retification.js` são esperados enquanto não ocorrer o corte. Distinguir falta de integração final de defeito na versão candidata. |
| **C. Homologação / versão candidata** | Mesmo SHA com frontend e Supabase descartável compatível, flag e operações habilitadas para o ensaio, não para Produção. | Precisam existir testes com autenticação, RLS, clique verdadeiro, transação e F5; aprovação do operador sobre a UI renderizada. |

`vercel.json` mantém `deploymentEnabled.main=true` e os demais ramos desativados. `scripts/build-vercel.mjs` configura Preview convencional como `RADAR_DATA_MODE=local` sem Supabase, salvo configuração **explicitamente isolada**. Isso explica a ausência de Preview remoto homologado da nova capacidade; **não é evidência de falha de deploy ou de funcionamento em Produção**. `RADAR_OPERATIONAL_CORRECTION_PREVIEW` está desativada por padrão, e a presença de código não ativa funcionalidade no navegador institucional.

## 2. Matriz de substituição por jornada (antes / candidato / corte / prova)

Esta matriz é **de transição**, não de funcionalidades publicadas. Cada linha recebe estado por camada na implementação, não apenas um check geral do lote.

| Lote / objetivo humano | Caminho e restrições anteriores observados | Novo contrato / caminho a completar | Corte e provas necessárias |
|---|---|---|---|
| **T1 — reconhecer contexto do programa** | Grade anterior em `app.js` com acoplamentos de `td[rowspan]`, consumidores e estilos. | Cabeçalho horizontal real em `app.js`, `prontuario-operational-ux.js`, agrupamento semântico, documentos e ações preservados. | Na branch, já há código de T1; conferir responsividade, zoom 200%, perfis, foco/scroll, ordem de programas e telas reais. Não reabrir T1 por simples existência de código legado na main. |
| **T1 — editar metadados de NF com Pendência** | `InvoiceService.save()` e `auditable-retification.js` preservam ID, vínculos e limites estruturais. | Manter autoridade de edição atual e exibir NF atual por `registeredInvoiceId` em Pendências, Passivo, Busca Global e Excel; preservar `documentSnapshot` histórico. | Já há projeções integradas; testar com NF A/B, número incidental em texto livre, F5 e segunda sessão. Não alterar `pendency.item` apenas em memória. |
| **T2 — corrigir análise documental agregada** | `evaluation-retification-ui.js` e `evaluation-retification.js` exigem checkbox/justificativa em casos com Pendência e podem marcar anulação histórica. | `correct_analysis` / `clear_analysis` com prévia e observação opcional, remoção exata da consequência equivocada e sem falsa regularização; `operational-correction-dialog.js`. | Flag e capacidade do backend; dar entrada inequívoca pela UI; substituir a rota de retificação antiga para esta intenção **somente quando** SQL/recibo/refresh e testes autenticados estiverem prontos. Preservar cancelamento legítimo como ação distinta. |
| **T2 — análise de NF individual** | `app.js` usa `beginInvoiceDocumentAnalysisEdit()` e `changeInvoiceDocumentAnalysis()` → `InvoiceService.updateDocumentAnalysis()`. Abertura de `Incorreto` tem fluxo atômico próprio. | Conectar edição corretiva individual por `target.id` e `documentKey=notaFiscal` ao mesmo contrato, sem substituir o registro genuíno de Incorreto+Pendência. | Testar NF com/sem Pendência, agregação de outras NFs, histórico independente, bloco de ações e reload. Não expor seletor novo que faça escrita antiga silenciosa quando a operação composta falhar. |
| **T2 — Consulta Assessoria individual** | `changeInvoiceAdvisoryAnalysis()` / `updateServiceAdvisory()` e rotas próprias de Pendência. | `correct_analysis`/`clear_analysis` por NF de serviço, com recomposição da dimensão agregada e preservação da bonificação independente. | Casos com 1 e 2 NFs de serviço; estado da Assessoria, Pendência fiscal e Consultoria individual separado no Prontuário e nas demais telas. |
| **T2 — excluir Pendência equivocada** | Cancelar/reabrir Pendência preserva registro/histórico e pode exigir justificativa; não é exclusão física. | `delete_pendency` remove o alvo e dependentes reais, recompõe análise quando necessário; `clear_analysis` não equivale a apagar todo histórico. | Entrada UI explícita, contagens, confirmação, proteção de Pendência obrigatória de `a_identificar`, histórico independente, contatos gerais, análise/bonificação; testar seleção explícita vazia e ambiguidade. |
| **T3 — excluir NF com Pendência/histórico** | `app.js` esconde o botão quando `hasPendencyHistory`; `InvoiceService.remove()` verifica `assertDeletionHistorySafe` e `assertDeletionAssetSafe` e usa `delete_invoice_with_effects`. | `delete_invoice` via prévia/aplicação atômica; remover todos e somente dependentes identificados por FK/ID, incluindo tentativas, contatos específicos e bem exclusivo. | **Não é bug atual o bloqueio legado:** ele permanece até a nova operação ser comprovada. Depois, a **mesma intenção do usuário** deve ter uma única autoridade de exclusão, substituindo o fluxo antigo sem manter rota concorrente. |
| **T3 — permanente Inventariada** | Triggers terminais e serviço comum impedem exclusão regressiva. | O comando fiscal de correção pode apagar o conjunto errado inclusive bem Inventariado exclusivo, sem permitir `DELETE` genérico; nenhum ato externo de tombamento é presumido revertido. | Testar item exclusivo/compartilhado, trigger ordinário mantido e exceção exclusivamente transacional; Inventário e patrimônio no Prontuário após F5. |
| **T3 — saída provisória Qualidade** | UI permite editar/excluir somente saída `open`; identificada já está associada a NF. | Excluir NF originada da saída identificada deve reabrir a provisória; `undo_quality_identification` e `delete_quality_movement` são comandos distintos. | Provar vínculos e estado sem `identified` órfã, nova identificação por nova intenção, sem misturar com `a_identificar`. Ajustar UI, DB, resumos e testes. |
| **T4 — corrigir bonificação consolidada / N/A** | `VerificationService.setBonification()` e `evaluation-retification.js` têm bloqueios de consolidação e `FISCAL_NOTES_EXIST`; matriz atual registra exceções antigas. | `correct_bonification` distingue marca de entrega e análise técnica, admite correção autorizada de consolidação, preserva NF válida sob N/A quando a decisão específica permitir. | Testar novo caminho e conformidade por programa, obrigatoriedade documental, BB Ágil N/A, resultado consolidado, NF A/B e perfis. **Não** converter o novo comando em desbloqueio irrestrito do `setBonification` ordinário. |
| **T4 — limpar histórico ou corrigir mês/programa** | Identidade de contexto não se transfere por edição cadastral; sem comando integrado novo de lote. | `clear_item_history` e `delete_context` com alcance identificado e prévia completa. Excluir programa/mês certo, orientar recriar em contexto correto, sem transportar IDs ou escolher automaticamente. | Dois meses e programas, NF vizinha, Pendência legada sem FK, contato geral, provisória sem programa, competências futuras já cadastradas; recarregar e conferir exportação. |
| **T5 — envio/reanálise individual** | `PendencyService.registerAttempt()`, `reanalyze()` e histórico existente; transições normais preservadas. | Correção/exclusão de tentativa e revisão, recomposta do conjunto restante; helper `pendency-correction.js` já adapta `tentativas` reais mas não persiste. | Padronizar **nomes** do helper `delete_submission/correct_submission` versus contrato `delete_attempt/correct_attempt`; conferir tentativa alvo, eventos posteriores, status, próximo ator, erros atuais, data e análise. Não alterar histórico por índice presumido. |
| **T5 — contato / Pendência manual** | Contatos são registrados com vinculação; `retifyManualDetails` exige hoje também observação. | `delete_contact`, `correct_contact` e edição manual com observação opcional, preservando categoria/motivo/responsável minimamente válidos. | Contato geral não pode desaparecer junto com NF; edição não pode fingir nova comunicação externa; UI, autoria, RLS, testes e reconsulta. |
| **T5 — inventário corrigível** | `InventoryService`, status patrimonial terminal e triggers; perfil Inventário tem capacidade patrimonial específica. | `correct_inventory` e `delete_asset` autorizados por domínio; efeito fiscal composto continua a exigir perfil fiscal. | Provar isolamento de permissões e consistência de NF/bem, controle de processo e estado terminal; não prometer alterações automáticas em SIGMA/SEI. |
| **T6 — consumidores e publicação** | Dashboard, Carteira, Competências, Prontuário, Pendências, Passivo, Inventário, Timeline, Alertas, Busca e Excel usam projeções/invalidação próprias. | Releitura única ou invalidadores adequados por IDs/contextos alterados; recibo autoritativo, versão de contrato, frontend compatível, índices e documentação atualizada. | Same SHA: Auth/RLS/SQL/teste UI/segunda sessão/exportações, visual claro/escuro, zoom, restore/recuperação e configuração efetiva de Vercel. Publicação só autorizada após gate. |

## 3. Inventário de alteração obrigatória por operação

Antes de considerar um lote pronto, preencher **todos** os campos abaixo, com caminho/linha, SHA, status, evidência e responsável; `não aplicável` exige explicação:

1. **Regra antiga e regra nova:** proibições/efeitos removidos, preservados ou substituídos; ADRs e perfis.
2. **Pontos de entrada humanos:** botões, menus, listas, modais, drawers, atalhos, contexto, foco, teclado e mensagens.
3. **Caminhos de execução antigos:** handlers em `app.js`, extensões/wrappers, domínio, serviços, repositórios, RPC antiga, triggers, RLS, feature flags; distinguir **bloqueio deliberado da fase** de defeito.
4. **Autoridade de destino:** ação suportada, validação servidor, transação, locks, versões, efeitos, dependentes e recibo. Garantir que não restem dois escritores independentes para a mesma intenção.
5. **Modelos e tipos:** schema, migrations, tipos de `src/types/database.types.ts`, JSON/payloads/adapters e auditoria automática. **Constatação no corte 15/11:** novas RPCs de T2/T3 não aparecem ainda no arquivo de tipos.
6. **Persistência e concorrência:** plano confirmado, dependente novo entre prévia e commit, outra sessão, cliente antigo, falta de rede, retry idempotente, rollback parcial impossível, commit reconhecido vs refresh pendente.
7. **Consumidores do resultado:** Prontuário, Competências, Pendências, Passivo, Dashboard, Carteira, Inventário, Timeline, Busca Global, Alertas, exportações, indicadores e filtros — marcar `afetado` ou `não afetado` com motivo.
8. **Testes positivos e negativos:** modificar testes antigos superados **no mesmo lote que muda a autoridade**, não antes; preservar as restrições ainda válidas, testar portas fechadas e novo fluxo permitido, conferir que as suítes são realmente coletadas.
9. **Frontend e design:** substituir affordances que ainda comunicam proibição antiga, visualizar antes/depois e impacto, estados vazio/carga/erro/sucesso, densidade, responsividade, contraste, opções corretas por programa e perfis.
10. **Docs e matriz:** `FUNCTIONAL_CONTRACT_MATRIX.md` **e** `docs/reference/functional-contract-matrix/*.json` (fonte de geração), `SUPABASE_PERMISSIONS_MATRIX.md`, `SYSTEM_CANONICAL_MODEL.md`, `PRODUCT_SURFACE_CATALOG.md`, ADR/DECISION_LOG se o contrato mudou, guias operacionais e handoff de SHA. Não editar somente um Markdown gerado.
11. **CI e Preview:** `package.json`, `vercel.json`, workflows, Playwright configs e seleção da suíte de Supabase real; `playwright.supabase-preview.config.js` hoje seleciona somente `supabase-preview-profile-viewport.spec.js`, portanto não certifica automaticamente novas jornadas T2–T5.
12. **Publicação/recuperação:** versão de backend/frontend compatível, capacidade confirmada antes de mostrar botão, ordem de migrations, janela de clientes antigos, desligamento controlado, backup seletivo, validação depois de publicar e evidências no mesmo SHA.

**Proibição de falso verde:** `npm run test:readiness` não comprova execução dos novos E2E autenticados; types/linters verdes sem declaração das RPCs novas não os validam; Playwright com `executeRpc` simulado não prova transação/RLS/persistência após reload. Um `Preview READY` local não prova conectividade de Supabase.

## 4. Política para adaptar testes e regras anteriores

| Classe | Exemplo observado | Decisão |
|---|---|---|
| **Legado que deve continuar verdadeiro até o corte** | `tests/unit/evaluation-retification.test.js` espera `FISCAL_NOTES_EXIST` e bloqueio de consolidada; `tests/unit/invoice-service.test.js` cobre restrições de histórico. | Manter enquanto a rota antiga estiver em uso; não alterar testes apenas para aparentar progresso. |
| **Regra deliberadamente superada no novo comando** | A exclusão autorizada de NF com Pendência deixa de ser proibida somente por histórico; a correção técnica não exige justificativa. | Criar teste de novo comando com resultado permitido, e atualizar/remover a expectativa antiga correspondente **no corte da substituição**, preservando testes de autorização e integridade. |
| **Regra que continua para operações ordinárias** | `Incorreto` não pode ser gravado sem Pendência; trigger terminal não aceita exclusão patrimonial comum; SME é leitora. | Manter ou fortalecer, mesmo depois do novo recurso. Nova exceção deve ser estreita, autorizada e testada. |
| **Compatibilidade entre versões** | Cliente antigo ainda aberto enquanto banco/backend novo aceita correção composta. | Testar lado a lado: leituras antigas continuam; escrita destrutiva incompatível é bloqueada/orientada; snapshot obsoleto não restaura NF apagada. |
| **Nova proteção que só existe parcialmente** | Testes SQL pgTAP e diálogo DOM controlado passaram, mas não há jornada Auth/Supabase/segunda sessão. | Estado `testado parcialmente`, não `homologado`. Acrescentar teste real no gate da jornada e validar que o CI o executa. |

**Técnica de teste:** primeiro RED que demonstra o problema no caminho certo; menor mudança coerente; GREEN focalizado; regressão adjacente; suíte ampla no mesmo SHA. Não alterar expectativa para acompanhar um resultado incorreto. Quando o comportamento tiver sido deliberadamente modificado, escrever explicitamente o motivo da mudança de expectativa.

## 5. Registro dos riscos da versão candidata (não defeitos de Produção)

- **R1 — atualização com diálogo aberto:** `operational-correction-dialog.js` aguarda `refreshSchool()` antes de fechar `role=dialog/aria-modal=true`; `operational-context-refresh.js` classifica diálogo aberto como edição e pode responder `skipped:editing`. Criar teste com controller verdadeiro e tratar sem comprometer outros formulários abertos. A flag está OFF por padrão; não atribuir o resultado à Produção.
- **R2 — seleção de Pendência ativa vazia:** na migration `operational_correction_build_plan`, subconjunto `[]` satisfaz `selectedPendencyIds <@ candidates`. Teste negativo deve impedir mudança do estado `Incorreto` sem recompor sua consequência ativa.
- **R3 — projeções de Consultoria/Inventário:** `invoice-effects.js` e `service-advisory.js` recompõem dimensões derivadas após exclusão; a nova operação SQL não trata integralmente todos esses agregados. Testar NF de serviço/permanente e decidir recomposição transacional precisa sem violar ADR-055.
- **R4 — concorrência de dependentes:** prova de duas sessões com a **mesma** `operationKey` não cobre um colega criando filho ou um escritor REST legado após a prévia. Necessária prova `concurrent-child-and-stale-retry` e concorrência do ciclo normal.
- **R5 — protocolo ainda parcial:** `src/types/database.types.ts`, recibo completo, seleção de testes E2E e capacidade de backend precisam acompanhar o corte.
- **R6 — ambiguidade de regras de atraso:** o domínio vigente `requiresLateCorrect` relaciona `Correto (Atrasado)` à consolidação e entrega `Não`, não a uma dedução livre de data. Ajustar expectativas de T5 para não criar nova regra de prazo ao editar tentativa.

**Critério de classificação:** risco de contrato incompleto/contraprova pendente ≠ falha demonstrada na Produção ≠ bloqueio antigo correto durante a transição.

## 6. Como incorporar continuamente contribuições Manus, Antigravity, Astra e outras branches

Não descartar contribuições por origem nem importar uma branch inteira apenas porque seus testes próprios passaram. A qualquer início/fechamento de lote:

1. Consultar os HEADs **novamente** de `fix/prontuario-integrado-validado-20261115` e das branches auxiliares relevantes; novos commits podem surgir depois de 15/11.
2. Fazer diff **por arquivo e comportamento** contra o código já integrado; classificar contribuição como: **já incorporada**, **melhoria nova aproveitável**, **exige contraprova**, **incompatível com o contrato aprovado**, **histórica sem ação**.
3. Investigar o cenário demonstrado e seus testes, incluindo chamada real de UI, adaptadores, autoridade de aplicação, reflexos em outras telas, layouts e UX; registrar SHA da fonte.
4. Incorporar **seletivamente** as soluções que melhorem confiabilidade, clareza ou qualidade global; preservar APIs, responsabilidades, segurança e contratos de negócio; nunca copiar regressão ou pressupor que outro agente testou nossa versão.
5. Reexecutar contraprova no **SHA integrado**, atualizar esta matriz, o checkpoint e os testes/artefatos do lote. Branch auxiliar permanece rastreável e disponível para evolução; não se torna uma rota concorrente de execução.

No corte consultado, Manus (`f0fa7335`/`300ac6d1`), Antigravity (`52ff0871`) e a autoauditoria Gemini (`6b4efb5d`) não tinham novos commits além da reconciliação anterior. Isso é **fotografia datada**, não ordem de ignorá-los no futuro.

## 7. Ordem prática de execução e critérios de aceite

**T2 — antes de liberar:** testes dos R1/R2, UI correta para análises agregadas/individualizadas e `delete_pendency`, atualização do estado autenticada, preservação de Pendências independentes, observação opcional e prova pelo clique e reload. Só depois substituir as rotas antigas de **correção**, sem retirar fluxo de regularização genuíno.

**T3 — antes de liberar:** teste dos R3/R4, UI de `delete_invoice`, adaptador do `InvoiceService.remove` para um comando único, remanejamento dos guards antigos, recibo com entidades e contextos, atualização de todos consumidores e comparação NF A/NF B. Não mostrar botão novo funcional antes dessa conclusão.

**T4 — antes de liberar:** corrigir marca consolidada sem mexer automaticamente em NF, N/A autorizado, regras por programa; implementar `clear_item_history` e `delete_context`, provas negativas de alcance e substituição das expectativas antigas por sua condição nova.

**T5 — antes de liberar:** harmonizar nomes de ações, implementar RPCs e UI para tentativas/revisões/contatos/inventário, recompor status e erros sem inventar atos; adaptar testes e guias do histórico.

**T6 — antes de publicar:** revalidar todas as branches e PRs relevantes, compatibilidade de clientes, CI que **coleta** as novas suítes, Supabase descartável com Auth/RLS/migrations, banco+UI em duas sessões, indicadores/Excel/Busca/Inventário, snapshots visuais reais, zoom/perfis/temas, plano de recuperação e documentação canônica. Registrar SHA+ambiente+evidência. Sem autorização automática de merge/deploy.

### Registro mínimo por jornada

| Campo obrigatório | Preenchimento |
|---|---|
| Lote e ação humana | Ex.: T3, excluir NF de serviço com Pendência ativa |
| Regra antiga | Arquivos/linhas, testes que a esperam |
| Regra nova | Contrato aprovado, ação/autoridade/backend e contextos |
| Estado de cada camada | Plano; código criado; conectado; testado; homologado; publicado |
| Substituição | Guard removido/modificado/mantido e por que; destino e compatibilidade |
| Prova positiva e negativa | IDs afetados/preservados, Auth/RLS, mudança concorrente e F5 |
| Interfaces e derivados | Todos consumidores afetados/não afetados, UX, contraste, foco |
| Testes e tipos | Expectativas antigas revisadas, suítes novas realmente coletadas, tipos RPC |
| Documentação | Matriz JSON+MD, modelos, ADRs, guia, checkpoint |
| Fontes auxiliares | Branch/SHA Manus/Antigravity/outro, decisão de aproveitamento |
| Publicação | Ambiente, SHA, migrations, autorização, Preview, rollback/recuperação |

**Objetivo operacional:** impedir que a evolução do RADAR entregue apenas uma função nova sobre um sistema que continua dependente da lógica anterior. O sucesso é uma **substituição integrada, rastreável e homologada por jornada**, sem regressões nas demais superfícies.
