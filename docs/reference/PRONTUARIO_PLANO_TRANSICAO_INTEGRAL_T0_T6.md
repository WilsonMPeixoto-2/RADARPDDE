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


## 8. Estratégia de homologação isolada e substituição progressiva — decisão de preparação

**Decisão de engenharia (15/11/2026):** manter `main`, Vercel Production e Supabase institucional inalterados; **não criar Preview remoto agora**. O primeiro ambiente integrado será o **Supabase local real (PostgreSQL/Auth/API/RLS/migrations) por Docker em runner descartável de GitHub Actions**, com frontend da branch candidata, Playwright e dados sintéticos. Repetir em computador local com Docker para navegação humana e depuração quando for útil, sem tornar a máquina pessoal dependência obrigatória. Somente depois dos gates locais e de compatibilidade considerar Preview remoto **explicitamente isolado**, se necessário para revisão visual compartilhada ou diferença de infraestrutura.

### 8.1 Ambientes e risco

| Ambiente | Conteúdo | Risco para sistema institucional | Uso correto |
|---|---|---|---|
| **B0 — Baseline** | `main` e testes atuais de contrato antigo, sem escrita na Produção | Nenhum se apenas leitura do GitHub/código | Saber quais regras antigas realmente funcionam; caracterizar testes de regressão |
| **B1 — Candidato automatizado** | Branch integrada + runner efêmero GitHub Ubuntu/Docker + Supabase local com todas as migrations candidatas + Auth local + Playwright | Nenhum acesso institucional necessário | Primeiro teste integral de regra nova, SQL/RLS, fluxo real, reload, desempenho inicial, repetibilidade por SHA |
| **B2 — Candidato local interativo (opcional, recomendado antes de aprovar layout)** | Mesma branch e bootstrap real em estação com Docker + navegador local | Isolado quando o ambiente estiver corretamente configurado | Inspeção de elementos, screenshots, cliques humanos, devtools, zoom, tema, densidade e depuração |
| **B3 — Pré-produção remota futura (opcional)** | Vercel isolado ou projeto específico **não vinculado à Produção**, Supabase separado e dados sintéticos; autenticação/staging exclusivos | Requer conferir projeto, URL, chaves, domínios, configuração da Vercel; risco baixo após isolamento conferido | Validar hospedagem real/colaboração e homologação visual remota depois de B1/B2; NÃO é pré-requisito para começar código/testes |
| **B4 — Produção** | Main + Supabase institucional + Vercel oficial | Alto para operações destrutivas | Apenas após T6, gates, aprovação expressa e publicação controlada |

**Observação:** Supabase local não é um “banco simulado”: SQL, triggers, RLS e Auth são serviços reais isolados. Não reproduz automaticamente cada diferença de hospedagem, volume/dados institucionais ou integração externa; o restante é testado em B3 quando pertinente. A configuração atual do projeto declara PostgreSQL 17 em `supabase/config.toml`. Os testes históricos em PostgreSQL 18 descartável não substituem a prova na configuração local real.

### 8.2 O que já existe no projeto e o que falta adaptar

- Workflow **`.github/workflows/functional-reliability-supabase.yml`** (nome “Confiabilidade funcional com Supabase real”) possui `workflow_dispatch`, checkout, Node 24, Docker/Supabase local, `npm run supabase:start` + `npm run supabase:reset`, autenticação fictícia controlada, runtime `supabase-preview` com URL **local**, Playwright/Chromium com recargas e publicação de traces. Executa atualmente `supabase-functional-reliability.spec.js` e `pendency-reanalysis-auth.spec.js`, **não** coleta automaticamente os E2E novos T2–T5.
- Manter e **estender esse pipeline existente**, mediante arquivo/seleção de testes e autorização de perfis por lote; não criar segundo CI redundante. O workflow suporta disparo manual; verificar branch/SHA exatos selecionados em cada execução.
- `package.json` já inclui `supabase:start`, `supabase:reset`, `supabase:test:db`, `test:unit`, `test:integration` e `test:readiness`. Executar pgTAP sobre a migration candidata no banco descartável, não no projeto institucional.
- `playwright.supabase-preview.config.js` possui `testMatch` restrito a `supabase-preview-profile-viewport.spec.js`; portanto não tratá-lo como certificação dos cenários T2–T5. Adaptar a seleção da suíte de testes apropriada e provar pela lista efetivamente coletada.
- `vercel.json` tem `git.deploymentEnabled` somente para `main`, e `ignoreCommand` também restringe builds. **Isso é barreira deliberada contra Preview casual**, não defeito de implantação. `scripts/build-vercel.mjs` mantém runtime Preview comum em `local` e bloqueia apontamento de Preview ao URL institucional. Qualquer B3 exigirá configuração explícita, inspeção do build final e projeto Supabase separado; um frontend remoto não consegue acessar automaticamente `127.0.0.1` do Docker na máquina do operador.
- **Ponto de versão:** a Supabase CLI v3 alterou comandos e defaults em novembro/2026. Para esta frente, manter versão **fixada e verificada no lockfile** e executar `--help` antes de mudanças de ferramenta; **não** atualizar a CLI em paralelo ao corte das regras de negócio.

### 8.3 Ciclo de testes por alteração — jamais somente depois de todo o código

**Fase R (caracterização antiga):** identificar operações e testes vigentes de B0. Classificar cada expectativa como `contrato a preservar`, `restrição a substituir na nova operação` ou `proteção de coexistência`. Não “corrigir” teste antigo alterando a expectativa sem implementação de novo comportamento correspondente.

**Fase N (novo contrato com flag/capacidade controlada):** criar REDs contra a nova autoridade, testar SQL e Auth local, implementar o menor lote T2/T3 completo; garantir que a antiga interface continua correta quando a capacidade nova não está disponível.

**Fase C (corte de responsabilidade na branch candidata):** ligar UI nova para o perfil permitido **somente** em B1/B2 e com backend compatível, conectar serviços/repos e remapear botões, retirar/desativar guards e mensagens antigas apenas onde a nova autoridade assumiu a intenção. Mudar/aposentar testes negativos superados **no mesmo commit/lote** e incluir testes positivos/negativos da nova operação. As proteções ordinárias que continuam válidas permanecem testadas.

**Fase X (efeitos cruzados):** cada teste principal aciona controle real via Playwright com usuário local autenticado, compara banco antes/depois e verifica ID de entidades removidas/preservadas, Prontuário, Pendências, Inventário, Competências, Dashboard/Carteira, Busca, Passivo, Timeline, Alertas, Excel e cliente com dados em cache, conforme pertinência. Recarregar F5, reabrir em segunda sessão/perfil e conferir se ambos mostram o mesmo fato. Não simular RPC para afirmar persistência.

**Fase G (gate por lote):** comparar resultados do mesmo SHA, migrations, logs, perfis, tempos, screenshot e expectativa revisada. A frente não avança para ativação até que a jornada seja completa. B3 e depois B4 permanecem posteriores e condicionais.

### 8.4 Provas mínimas obrigatórias

| Família | Caso real de teste | O que deve resultar |
|---|---|---|
| **Legado intacto** | Reanalisar envio legítimo, bonificação, NF sem histórico, colaboração entre controladores | Continua funcionando sem efeito colateral |
| **Nova permissão** | Corrigir análise equivocada sem justificativa; excluir NF com histórico com dependentes conhecidos | Ação disponível no contexto correto, sem declaração ou envio fictício, transação única |
| **Restrições ainda válidas** | Gravar `Incorreto` sem Pendência por rota comum; usuário SME tentando exclusão fiscal; bem compartilhado | Banco rejeita ou a transação correta preserva o vínculo; botão não autoriza mais do que RLS/RPC |
| **Fronteira de concorrência** | A faz prévia, B inclui/altera dependente, A tenta confirmação | Rejeita plano obsoleto ou requer nova prévia, não amplia apagamento |
| **Idempotência** | Resposta de commit se perde, mesmo usuário repete operação com mesma chave | Não duplica efeito; recibo único estável |
| **Sincronização** | Após commit, modal fecha, Prontuário e Pendências mostram estado novo; F5 e segunda sessão | Sem falsa confirmação, sem registro ressuscitado, com foco/contexto mantidos |
| **Interação/visual** | 1280/1440/1920 px, 390 px, zoom 200%, temas claro/escuro, sem/varias NFs | Hierarquia visual, legibilidade, controles, informações e mensagens corretos |
| **Compatibilidade** | Cliente antigo com aba aberta antes da nova migration, novo cliente depois | Cliente antigo não reverte exclusão nem escreve através de rota obsoleta incompatível |
| **Documentação e CI** | Matriz JSON/MD, tipos do banco, workflow de E2E, gates de arquitetura/estilo | Todos coerentes com a mesma regra; novos testes realmente coletados e executados |

### 8.5 Testar no computador do usuário: opcional, não obrigação

Se desejar visualização e navegação por si próprio, a estação local é excelente para B2. A instalação depende de sistema operacional/recursos disponíveis e deve seguir o mesmo roteiro auditável de B1; nunca copiar configurações ou segredos da Produção.

Passos de referência **não suficientes, isoladamente, para habilitar autenticação**:

1. Obter a branch candidata numa pasta separada e confirmar seu SHA.
2. Instalar Node 24, dependências pelo lockfile e runtime de containers compatível com Docker; confirmar versão **fixada** da Supabase CLI.
3. Subir Supabase local, reinicializar com migrations e seed sintético; os scripts existentes são `npm run supabase:start` / `npm run supabase:reset` / `npm run supabase:test:db`.
4. Reproduzir **o bootstrap de usuários e configuração local** que está no workflow de GitHub Actions; validar que runtime aponta para API local, nunca URL institucional.
5. Rodar servidor local do RADAR, realizar login com perfis sintéticos, navegar com navegador e Playwright, tirar screenshots, ver registros após F5; ao final encerrar somente o Supabase local com `npm run supabase:stop`.

Caso não queira configurar a máquina, tudo de B1 pode ser executado no GitHub runner, com relatórios, screenshots e traces como artifacts; B2 continua opcional.

### 8.6 Critério de decisão para um Preview futuro

**Não criar Preview agora por simples existência de código ou por falha de teste antigo.** Antes de B3 exigir: T2/T3 com ações reais completas; RLS/Auth/concorrência; testes adaptados; fronteiras de configuração/repositório verificadas; dados 100% sintéticos; CI coletando todos os casos; operador capaz de validar o frontend local. Se B2 demonstrar qualidade e a questão remanescente for especificamente hospedagem/collaboração, criar B3 **em projeto Vercel isolado e banco Supabase de staging independente**, com URL/chaves e bloqueio de produção revisados. Não alterar `git.deploymentEnabled.main` do projeto produtivo para gerar Preview acidentalmente.

**Não realizar `supabase link`, `db push`, `db reset --linked` ou utilizar credenciais de Produção para executar o ensaio.** Scripts automatizados devem recusar alvos remotos quando a finalidade é B1/B2. Provas por SHA e logs precisam ser guardadas e referidas no checkpoint. Nada nesta matriz autoriza disparo de workflows, implantação ou migrations por si só.
