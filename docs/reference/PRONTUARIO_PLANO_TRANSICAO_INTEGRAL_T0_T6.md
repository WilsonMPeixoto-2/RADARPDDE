# Prontuário T0–T6 — Matriz de transição integral das regras, interfaces e provas

**Data-base:** 15/11/2026. **Natureza:** anexo executável do plano original do Astra; não cria outra frente, nem autoriza merge, SQL institucional ou deploy.  
**Branch de execução:** `fix/prontuario-integrado-validado-20261115`.  
**Regra de precedência:** [contrato aprovado](PRONTUARIO_CORRECAO_CONTRATO.md) → [plano original T0–T6](../superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md) → [checkpoint vigente](../handoff/2026-11-15-prontuario-integracao-verificada.md) → código e testes do SHA.  
**Base da auditoria detalhada:** [leitura de código e contraprovas](../audits/2026-11-15-auditoria-profunda-codigo-integrado-t0-t6.md).

> **Critério de conclusão revisto:** uma regra nova não está concluída quando a função foi criada. O lote está concluído quando a autoridade antiga foi conscientemente mantida ou substituída, o novo comando é atingível no fluxo humano, o banco o executa integralmente, os consumidores apresentam o resultado após F5/segunda sessão, as expectativas de teste descrevem a decisão nova, a documentação é coerente e a compatibilidade de clientes foi comprovada. Não antecipar a retirada de guarda antiga enquanto a operação substituta estiver incompleta.

## Situação de execução auditada em 16–19/11/2026

Esta matriz é **contrato de transição e critérios de prova**, não relatório isolado de funcionalidades prontas. O [checkpoint vigente](../handoff/2026-11-15-prontuario-integracao-verificada.md) distingue estados reais por lote: **T0/T1 preparados; T2/T3 com operações de correção e exclusão ligadas à interface candidata sob flag local (incluindo o 7º reparo de 17/11, a correção A-01 de `009e9101` e o 8º reparo de 19/11 em `prontuario-conditional-reconciler.js`, `database.types.ts`, `operational-correction-dialog.js` e `evaluation-retification-ui.css`), ainda não homologadas de ponta a ponta; T4/T5 incompletas; T6 pendente**.

**74/74 asserções pgTAP PASSARAM em PostgreSQL local Docker** no CI do PR #532 (`actions/runs/44310070849`), e o descompasso de ordenação alfabética em `src/types/database.types.ts` que interrompeu `check:generated` antes dos steps de Auth/RLS foi corrigido nesta branch com match SHA-256 exato (`e9ebed11...`, 6042 tokens). Testes de interface com RPC simulada (`46/46` E2E, `20/20` em `operational-correction-dialog.spec.js`) não substituem Auth/RLS com banco local, F5, segunda sessão e aceite visual humano.

## 1. Três estados que NÃO devem ser confundidos

| Estado | Significado | Evidência e decisão |
|---|---|---|
| **A. Produção vigente** | `main`, Vercel e Supabase institucional continuam com o contrato anterior nesta frente. | Revalidar SHAs e migrations antes de cada decisão. Não chamar comportamento antigo de regressão da Produção. |
| **B. Integração em preparação** | Branch tem T1, RPCs e cliente T2/T3, e janelas de correção e exclusão **conectadas** no Prontuário e em Pendências, sob flag OFF por padrão. Falta prova Auth/RLS/persistência real. | Rotas antigas em `InvoiceService.remove()` e `evaluation-retification.js` permanecem para uso legado até substituição validada. Distinguir código candidato conectado, alcance ainda incompleto e ausência de homologação. |
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
| **T2 — Consulta Assessoria individual** | `changeInvoiceAdvisoryAnalysis()` / `updateServiceAdvisory()` e rotas próprias de Pendência. | `correct_analysis`/`clear_analysis` por NF de serviço (conectado no `<select>` via `service-advisory-pendency.js` e no botão `Editar análise` reconciliado via `prontuario-conditional-reconciler.js` e `app.js`), com recomposição da dimensão agregada e preservação da bonificação independente. | Casos com 1 e 2 NFs de serviço; estado da Assessoria, Pendência fiscal e Consultoria individual separado no Prontuário e nas demais telas. |
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
5. **Modelos e tipos:** schema, migrations, tipos de `src/types/database.types.ts`, JSON/payloads/adapters e auditoria automática. **Atualização verificada em 16/11:** o arquivo de tipos **já declara** `preview_operational_change` e `apply_operational_change`; falta confrontar tipos regenerados com a migration executada em PostgreSQL descartável.
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

- **R1 — refresh e foco:** **mitigado no candidato**: o diálogo é fechado antes do `refreshSchool`, sem restaurar o foco ao editor antigo; teste DOM isolado executado. **Ainda falta** prova com controlador de refresh verdadeiro, dados persistidos e foco em outros formulários. Flag OFF por padrão.
- **R2 — Pendência ativa vazia/incompleta:** **mitigado no código candidato** pela verificação do conjunto de candidatos (inclusive IDs repetidos), com teste pgTAP escrito. **Pendente executar o pgTAP no PostgreSQL local** e confirmar concorrência real; não atribuir o defeito ao código já corrigido.
- **R3 — projeções de Assessoria/Inventário:** **recomposição SQL candidata implementada** ao excluir NF/Pendência e corrigir ou limpar análise individual de Assessoria; testes SQL foram adicionados. **Pendente** prova efetiva de cada agregado, NF irmã e preservação de bonificação independente em Supabase local real.
- **R4 — concorrência de dependentes:** prova de duas sessões com a **mesma** `operationKey` não cobre um colega criando filho ou um escritor REST legado após a prévia. Necessária prova `concurrent-child-and-stale-retry` e concorrência do ciclo normal.
- **R5 — protocolo ainda parcial:** tipos RPC básicos já declarados e cliente de prévia/aplicação conectado à UI sob flag local; **pendem** contrato completo de recibo, coleta E2E Auth/RLS, compatibilidade com escritores antigos, consumidores e validação do corte da autoridade.
- **R6 — ambiguidade de regras de atraso:** o domínio vigente `requiresLateCorrect` relaciona `Correto (Atrasado)` à consolidação e entrega `Não`, não a uma dedução livre de data. Ajustar expectativas de T5 para não criar nova regra de prazo ao editar tentativa.

**Critério de classificação:** risco de contrato incompleto/contraprova pendente ≠ falha demonstrada na Produção ≠ bloqueio antigo correto durante a transição.

## 6. Como incorporar continuamente contribuições Manus, Antigravity, Astra e outras branches

Não descartar contribuições por origem nem importar uma branch inteira apenas porque seus testes próprios passaram. A qualquer início/fechamento de lote:

1. Consultar os HEADs **novamente** de `fix/prontuario-integrado-validado-20261115` e das branches auxiliares relevantes; novos commits podem surgir depois de 15/11.
2. Fazer diff **por arquivo e comportamento** contra o código já integrado; classificar contribuição como: **já incorporada**, **melhoria nova aproveitável**, **exige contraprova**, **incompatível com o contrato aprovado**, **histórica sem ação**.
3. Investigar o cenário demonstrado e seus testes, incluindo chamada real de UI, adaptadores, autoridade de aplicação, reflexos em outras telas, layouts e UX; registrar SHA da fonte.
4. Incorporar **seletivamente** as soluções que melhorem confiabilidade, clareza ou qualidade global; preservar APIs, responsabilidades, segurança e contratos de negócio; nunca copiar regressão ou pressupor que outro agente testou nossa versão.
5. Reexecutar contraprova no **SHA integrado**, atualizar esta matriz, o checkpoint e os testes/artefatos do lote. Branch auxiliar permanece rastreável e disponível para evolução; não se torna uma rota concorrente de execução.

**Conferência de 16–17/11/2026:** `fix/prontuario-integrado-validado-20261115@20409c12` incorporou seletivamente as seis correções de `1cb118fd`; `audit/antigravity-argon-prontuario-20261115` sincronizou `20409c12` e `main@58ca0c0a` (PRs #524 `74f92c08` e #526 `58ca0c0a`) e acrescentou o 7º reparo (interceptação T2 no `<select>` e botão `Editar análise` na Consulta à Assessoria + `modern-web-guidance`); Gemini avançou para `d55747b9` sobre `20409c12`; Manus permanece em `a87e9e0e` e o Argon original em `182b7949`. `chore/supabase-cli3-2-remote-safety-20261117@7414b21e` (issue #530) e `chore/deps-browser-validation-blocked-20261117@baf158ab` (issue #528) permanecem isoladas; PR #522 (`37de3033`) acrescenta correção separada de parágrafos CSS da tela de Pendências; PR #515 segue frente visual distinta; PR #523 (`ed2054a3`) trata autenticação, fora desta etapa. Não fazer merge automático nem refazer correções já incorporadas.

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


## 7.1. Critério transversal de desbloqueio orientado ao objetivo do usuário

**Regra de leitura obrigatória para T1–T6 (complemento do proprietário em 15/11/2026):** toda restrição remanescente precisa responder a três perguntas: **(i)** o que o usuário está tentando fazer? **(ii)** qual consequência concreta a restrição protege? **(iii)** qual é o caminho mais curto e consistente para concluir a intenção?

**Prioridade por funcionalidade:** (1) permitir operação direta e recalcular os dependentes, se segura; (2) permitir a mudança e sinalizar uma etapa posterior obrigatória com botão contextual; (3) explicar a dependência e oferecer navegação/ação prévia guiada, retornando ao ponto original; (4) bloquear somente quando houver impedimento real de integridade, autorização, ambiguidade ou risco concreto. Não exigir justificativa, confirmação textual ou atos documentais fictícios. Para exclusão destrutiva, manter prévia real de impacto e confirmação simples. Não transformar um risco tecnicamente tratável em bloqueio definitivo por comodidade de implementação.

**Caso de aceite T4:** o usuário autorizado altera um item depois de consolidar; a edição é persistida sem justificativa; o sistema apresenta **“Alterações pendentes de consolidação”** enquanto o resultado anterior estiver desatualizado; fornece **“Consolidar alterações”**; se dados insuficientes, explica os campos faltantes e facilita completá-los; após reconsolidar, o estado pendente desaparece e nova exportação XLSX reflete a situação correta. O arquivo já baixado permanece imutável. As atualizações fiscais independentes **não** tornam a bonificação pendente por acidente. Registrar testes unitários, RPC, CI/Playwright autenticado e conferência de células de exportação com dados sintéticos. Não duplicar a autoridade de consolidação nem presumir que o Excel seja armazenado e regravado em servidor.

**Casos de aceite T2/T3/T5:** quando um vínculo pode ser resolvido com transação única, a ação principal o faz; quando não pode, o aviso explica qual dependência impede **esse caso concreto**, apresenta o botão da ação prévia e preserva o contexto/retorno. Exemplo patrimonial não é ordem de exigir duas exclusões para todos os bens inventariados: não remover uma solução causal segura já existente. Testar os dois caminhos (direto e guiado) na aplicação local.

**Registro por bloqueio restante:** causa legítima, caminho preferencial (direto/pós-ação/ação prévia), contexto e controle apresentado, condição de desbloqueio, consequência em outras telas, teste de sucesso humano, teste de integridade; testar como navegador, não só código. Exceção de segurança não dá permissão a perfil proibido.

## 8. Ambiente local como etapa obrigatória de validação — decisão de 15/11/2026

**Decisão aprovada pelo proprietário:** a forma principal de experimentar o RADAR candidato é **uma cópia local da branch de integração, executando o frontend verdadeiro em navegador e o Supabase local completo por Docker**, com PostgreSQL, APIs, autenticação, políticas RLS, RPCs, migrations e **dados exclusivamente sintéticos**. Testes unitários, integração, pgTAP e Playwright devem operar sobre a mesma versão do código e, quando pertinente, o mesmo banco isolado. **Nenhuma publicação ou alteração de ambientes institucionais integra o escopo atual.**

O workflow existente de GitHub Actions com Docker e Supabase local é uma automação complementar de regressão, não substitui a sessão local navegável pelo proprietário. **Não tomar CI verde como aprovação da experiência de uso.**

### 8.1. Duas formas complementares de validar a mesma cópia isolada

| Frente | Exigência | Prova |
|---|---|---|
| **Execução local navegável — referência humana obrigatória** | Cópia da branch `fix/prontuario-integrado-validado-20261115` em diretório separado, Node e dependências fixadas, Docker com Supabase local, usuários de teste e frontend real servidos em `localhost`; navegador com acesso a formulários, fluxos, conteúdo denso, todos os perfis e modos claro/escuro | O proprietário consegue navegar, operar, identificar incoerências e **validar explicitamente** as decisões visuais e operacionais relevantes |
| **Automação no mesmo código — verificação técnica obrigatória** | Reutilizar `.github/workflows/functional-reliability-supabase.yml`, que inicia Supabase local no runner, prepara autenticação sintética e executa Chromium; ampliar os testes para T2–T5 e garantir coleta efetiva dos novos cenários | SQL, RLS, Auth, navegação automatizada, alterações cruzadas, rollback, concorrência, segunda sessão e persistência após recarga; guardar artifacts por SHA |

**Importante:** o Supabase do Docker **não é um banco simulado por mocks**: suas migrations, funções, RLS e transações são executadas de verdade, com dados de teste. Os mocks podem continuar úteis nos testes unitários; eles não certificam a integração final. O ambiente não replica automaticamente serviços externos ou dados institucionais, os quais não devem ser acessados nos ensaios.

### 8.2. Momento correto de construir e utilizar o ambiente

**Não esperar até T6 para começar a testar localmente.** Preparar o ambiente assim que for possível executar uma primeira jornada integrada — preferencialmente durante o fechamento de T2 — e reutilizá-lo nas demais etapas.

O código da frente **ainda não está integralmente concluído**: T2/T3 já possuem **janelas e ações conectadas à UI candidata** sob flag local, mas a experiência não foi homologada com PostgreSQL/Auth/RLS reais, e a cobertura da origem provisória e dos consumidores ainda exige testes/correções. T4 e T5 exigem comandos persistentes e interfaces. Assim, a próxima tarefa é montar a cópia local navegável para testar de verdade, não redesenhar do zero o fluxo já conectado.

Cada lote deve passar pelo ciclo:
1. **Caracterizar:** identificar a regra vigente, os testes correspondentes, as proteções que continuam válidas e as que serão substituídas.
2. **Completar o código do fluxo:** interface real → serviço → autorização → Supabase local → atualização dos consumidores. Manter ações incompletas indisponíveis no candidato.
3. **Trocar responsabilidades dentro da branch isolada:** adaptar botões, handlers, guardas, mensagens, tipos do banco, contratos e expectativas dos testes *no mesmo lote*, sem liberar gravação antiga concorrente.
4. **Testar tecnicamente:** criar reproduções RED/GREEN, executar pgTAP/unitários/integração/Playwright autenticado em Docker e provar persistência depois de F5 e em outra sessão.
5. **Validar navegando:** apresentar o frontend local com estados reais sintéticos e permitir ao proprietário realizar a jornada e julgar resultado, texto, alcance, clareza, foco, layout e efeitos entre telas.
6. **Registrar o resultado:** ajustar somente o que foi identificado; repetir testes afetados e registrar no handoff SHA, capturas, decisões humanas e pendências. Avançar para o lote seguinte apenas quando os critérios de passagem forem cumpridos.

### 8.3. Pontos obrigatórios de validação do proprietário

| Marco | O que deve ser experimentado na cópia local | Condição de prosseguimento |
|---|---|---|
| **T1 / composição visual** | Prontuário realista, diversos programas, muitas NFs, menus, contexto, 1280/1440/1920 px, 390 px, zoom, temas e foco | Proprietário valida legibilidade, hierarquia e experiência efetiva **antes de considerar fechado o desenho** |
| **T2 / correção** | Corrigir análise incorreta e/ou excluir Pendência equivocada pela UI, com prévia, ausência de justificativa obrigatória e resultado em outras telas | Aprovação da experiência de correção e testes reais de persistência, isolamento e permissões |
| **T3 / exclusão composta** | Visualizar antes da confirmação exatamente quais registros desaparecem e quais permanecem; excluir NF com dependentes; reabrir após F5 | Aprovação da informação de impacto e da jornada, com testes negativos/concorrência e dados independentes preservados |
| **T4 / bonificação e contexto** | Corrigir marca consolidada e excluir lançamentos de mês/programa errado sem afetar contexto vizinho | Proprietário entende e aprova o alcance, e testes abrangem todos os contextos afetados |
| **T5 / histórico e patrimônio** | Corrigir/excluir tentativa, reanálise, contato e registro patrimonial; verificar histórico remanescente | Aprovação das ações e consequências, sem destruir o histórico independente |
| **T6 / verificação global** | Navegação completa como usuário, com perfis, dados sintéticos, consultas, relatórios e estados de erro | Gate técnico e validação humana registrados no mesmo SHA; conclusão interna da implementação, **sem implicar publicação** |

**Não confundir:** validação humana de decisões materiais não significa que cada pequena alteração de serviço deva aguardar aprovação manual. Código e testes independentes podem progredir entre marcos; **a conclusão das jornadas de interface e das ações destrutivas depende da experiência navegada e do feedback do proprietário**. Se a validação revelar desacordo, a correção integra o lote em curso, com nova execução dos testes e nova inspeção.

### 8.4. Roteiro do ambiente local

O projeto já fornece `supabase/config.toml` e scripts `npm run supabase:start`, `npm run supabase:reset`, `npm run supabase:test:db`, `npm run start` e scripts de autenticação sintética. A execução de referência é o workflow `.github/workflows/functional-reliability-supabase.yml`; seu procedimento de bootstrap deve ser reaproveitado localmente, **sem improvisar perfis nem usar contas reais**.

Antes de entregar instruções de instalação para a máquina do proprietário, conferir sistema operacional, Docker/recursos, versões fixadas no repositório e passos exatos já testados no workflow. Executar em pasta isolada, conferir branch/SHA e que a URL configurada aponta somente para a API local. Não usar comandos vinculados a projetos remotos, nem importar dados institucionais.

### 8.5. Critério de conclusão dos testes

Uma jornada **não** está pronta apenas porque:
- a nova função está versionada, mas o botão continua apontando para a implementação antiga;
- o teste unitário passa, mas nenhuma pessoa consegue percorrer o fluxo real;
- um teste antigo foi removido sem cobertura equivalente do contrato deliberadamente substituído;
- o teste de browser usa respostas RPC controladas, sem Auth/RLS/migration efetivos;
- os dados parecem corretos antes de F5 mas divergem após recarga, em outra aba ou em outro perfil;
- o visual de referência não foi confrontado com a aplicação renderizada;
- os testes novos não foram efetivamente selecionados pelo CI.

**Evidência exigida por lote:** SHA, regras anteriores/novas, matriz de substituição dos guards, testes antigos adaptados e testes novos executados, SQL/RLS/Auth, capturas e traces, dados afetados/preservados, conferência pós-reload e registro da validação humana relevante. Isso complementa os gates T0–T6 originais sem reabrir escopo.
