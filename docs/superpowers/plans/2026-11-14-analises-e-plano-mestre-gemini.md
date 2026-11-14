# Análises Técnicas e Plano Mestre Comparativo do Prontuário (Frente Gemini)

- **Classe:** pacote completo de análises (Visual + Flexibilização de Regras + Comparativo e Plano Mestre `T0+` a `T6+`) produzido separadamente para leitura cruzada pelo proprietário e pelo outro agente.
- **Data:** 14/11/2026, Brasília.
- **Baseline de código auditada:** `main@190e44942d0bb6927d1a7eeb83fb94fc782171b8`.
- **Branches do outro agente lidas e preservadas intocadas:**
  - `docs/prontuario-direcao-visual-20261113` (`5e57eda` — `docs/superpowers/specs/2026-11-13-prontuario-exploracao-visual.md`)
  - `docs/flexibilizacao-lancamentos-20261114` (`54de4f3` e `5db04f4` — `docs/evidence/2026-11-14-flexibilizacao-lancamentos-catalogo.json` e `docs/superpowers/specs/2026-11-14-flexibilizacao-correcao-exclusao-lancamentos.md`)
  - `docs/plano-integrado-prontuario-20261114` (`30f08ec` — `docs/superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md`)

---

## Parte 1 — Análise de Arquitetura Visual, Usabilidade e Conexões do Prontuário

### 1.1. Diagnóstico Estrutural da Superfície Atual
1. **Competição Visual entre Cabeçalho Cadastral e Área Operacional:** O cabeçalho da unidade escolar ocupa grande altura útil no viewport Desktop (`1280×800`, `1440×900`, `1920×1080`), misturando abas de navegação (`Competências e Análises`, `Pendências Ativas`, `Histórico de Contatos`, `Registro de Capital`) com botões de comando (`Gerar comunicação`, `Registrar contato`).
2. **Acoplamento Visual Indevido entre `Bonificação` e `Análise Técnica`:** Em `src/domain/fluxo-operacional.js`, a Bonificação avalia tempestividade/entrega (`Sim`, `Não`, `Não se aplica`), enquanto a Análise Técnica avalia conformidade material (`Não analisado`, `Correto`, `Correto (Atrasado)`, `Incorreto`). O uso de `td[rowspan]` em `getProgramGroups` comprime a largura dos documentos e oculta a independência entre as duas dimensões (`ADR-055`).
3. **Invisibilidade das Relações Causais nas Despesas (`Notas Fiscais`):**
   - `Despesa a identificar` (`a_identificar` em `src/domain/invoice-effects.js`) nasce com pendência técnica obrigatória, mas sem afetar a bonificação consolidada.
   - `Consulta Assessoria` (`src/domain/service-advisory.js`) é derivada exclusivamente das notas fiscais com `tipo === 'servico'` (`deriveServiceAdvisory`), mantendo avaliação técnica e pendência independentes da avaliação fiscal da própria NF.
   - `Encaminhado para Inventariação` (`encampInventario`) depende das notas com `tipo === 'permanente'` e dos bens em `assets` (`deriveInventoryForwarding`).
   - `Saídas sem ação definida` (`#quality-provisional-panel` em `src/integration/quality-provisional-ux.js`) registram movimentações da conta PDDE Qualidade antes de se conhecer a Ação Integrada (`CONECTADA`, `PROEC`, `ED_FAMILIA`, `ADOLESCENCIAS`, `LEITURA`, `TEMPO_APRENDER`), não devendo ser confundidas com `a_identificar` de programa já conhecido.

### 1.2. Diretrizes Visuais Consolidadas
- Adotar a direção de arte de `5e57eda` (`#FAFAFC` fundo, `#252133` texto primário, `#686477` secundário, `#6335B5` ação primária/foco, superfícies brancas opacas, altura de controles `36–40px`, números tabulares).
- Substituir `td[rowspan]` por cabeçalho horizontal de programa com resumos separados de Bonificação e Análise Técnica, seguido pela matriz de 4 eixos (`Documento`, `Bonificação`, `Análise técnica`, `Providência`).
- Expandir `Relações deste documento` abaixo de cada NF (exibindo `Documento fiscal` e `Consulta Assessoria` em linhas independentes para serviço, e `Bem vinculado` + processo SEI para permanente), usando painel lateral não-modal (`Em foco →`) sem duplicar o botão `Reanalisar`.

---

## Parte 2 — Análise de Flexibilização de Regras de Edição, Alteração e Exclusão em Cascata

### 2.1. Mapeamento dos 8 Bloqueios no Código Atual (`main@190e449`)

| Módulo / Arquivo | Guarda ou Regra Atual | Efeito Restritivo Atual | Solução Proposta |
| :--- | :--- | :--- | :--- |
| `src/integration/invoice-history-lock.js` | `assertDeletionAllowed(state, invoiceId)` / `hasInvoicePendencyHistory` | Lança `INVOICE_HISTORY_LOCKED` e proíbe excluir qualquer NF que tenha ou já tenha tido pendência em `notaFiscal` ou `consAssessoria` (afetando 424 despesas no banco atual). | Substituir o bloqueio por exclusão transacional em cascata da NF e de seus dependentes exclusivos (`delete_invoice`). |
| `src/integration/invoice-history-lock.js` | `assertStructuralIdentity(state, input)` / `hasServiceAdvisoryHistory` | Proíbe alterar `expenseType` de uma NF de `servico` que tenha histórico em `consAssessoria`. | Permitir troca coordenada de tipo (`change_invoice_classification`), removendo automaticamente a pendência de Assessoria ou o bem patrimonial que deixou de ser aplicável. |
| `src/integration/evaluation-retification-ui.js` | `undoBlocked` e ocultação pós-consolidação | Impede desmarcar bonificação (`Não preenchido`) quando há pendência ativa e bloqueia correção direta de bonificação consolidada (`resultadoBonif`). | Liberar `correct_bonification` e limpeza da marca mesmo com pendência ativa, reabrindo `resultadoBonif` apenas quando a própria bonificação mudar. |
| `src/integration/evaluation-retification.js` | `requireFormalRetificationConfirmation()` | Exige `confirmPendencyCancellation === true` (checkbox obrigatório) e `retificationJustification` não vazia para alterar `Incorreto`. | Tornar observação/justificativa 100% opcional e remover checkbox obrigatório de bloqueio (`correct_analysis` e `clear_analysis`). |
| `src/integration/evaluation-retification.js` | `validateTechnicalCorrection()` (`LATE_ANALYSIS_REQUIRED`) | Bloqueia salvar `Correto` quando `bonificacao === 'Não'` e consolidada, exigindo seleção manual de `Correto (Atrasado)`. | Normalizar automaticamente `Correto` para `Correto (Atrasado)` quando `requiresLateCorrect` for verdadeiro. |
| `src/domain/retificacoes.js` e `auditable-retification.js` | `createRetification()` / `canRetify()` | Restringe retificação por perfil estrito e exige justificativa textual obrigatória. | Permitir correção aos perfis operacionais autorizados no domínio (`controlador`, `assistente`) com observação opcional e autoria automática no recibo. |
| `src/integration/task-10-11-pendency-actions.js` | `pendencies.cancel` | Exige justificativa obrigatória e apenas marca `Cancelada` (soft-delete), sem opção de apagar fisicamente pendência aberta por erro. | Manter `Cancelar` para casos reais e criar `delete_pendency`, `delete_attempt` e `delete_review` para remover erros de lançamento com recomposição de estado. |
| `src/integration/quality-provisional-ux.js` | Trava em `status === 'open'` | Após identificar uma saída provisória em uma Ação Integrada, não permite desfazer o vínculo nem excluir o conjunto se o programa escolhido estava errado. | Criar `undo_quality_identification` (exclui a NF derivada e reabre a saída provisória como `open`) e `delete_quality_movement`. |

### 2.2. Matriz do Que Liberar In-Place vs. O Que Resolver por Exclusão Simples
1. **NÃO editar in-place (resolver via Exclusão Simples + Novo Cadastro):**
   - **Escola (`schoolId`), Exercício e Competência/Mês (`compKey`)**: particionam `verifications`, `registeredInvoices` e `pendencies`. Transferir in-place exigiria mutação cruzada entre duas matrizes mensais e risco de colisão com bonificações consolidadas no destino.
   - **Programa (`programId`)**: cada programa tem documentos e regras próprias (`Boleto de Internet` exclusivo do `CONECTADA`, vínculo com `quality_provisional_movements` exclusivo das ações integradas do Qualidade).
   - **Documento-alvo (`documentoKey`) de uma Pendência**: pendências de `extCC`/`extINV` não têm `registered_invoice_id`, enquanto `notaFiscal`/`consAssessoria` dependem de FK individual.
   - **Solução para erro de mês ou programa:** Ação explícita **`Excluir lançamentos deste programa neste mês` (`delete_context`)**, seguida de atalho opcional na UI para posicionar o `RadarCompetenceContext` diretamente no mês/programa correto.
2. **LIBERAR para edição direta ou coordenada in-place (sem justificativa obrigatória):**
   - Número/referência, descrição, valor, data e observação da NF (sincronizando bem derivado em `assets` quando `permanente` e preservando o mesmo ID).
   - Troca de classificação da despesa (`consumo` ↔ `servico` ↔ `permanente` ↔ `boleto_internet`), com limpeza automática do efeito lateral que deixou de existir (pendência de Assessoria ou bem patrimonial não aplicável).
   - Marcações de Bonificação (`Sim`, `Não`, `N/A`, limpar marca) e resultados de Análise Técnica (`Não analisado`, `Correto`, `Correto (Atrasado)`, `Incorreto`), inclusive em bens `Inventariada` lançados por engano.

---

## Parte 3 — Comparativo com os Documentos do Outro Agente (`5db04f4` e `30f08ec`) e Contribuições para o Plano Integrado

Após leitura integral de `docs/superpowers/specs/2026-11-14-flexibilizacao-correcao-exclusao-lancamentos.md` (`5db04f4`) e `docs/superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md` (`30f08ec`), validamos que a arquitetura `T0` a `T6` proposta pelo outro agente é excelente e propomos **5 contribuições técnicas pontuais** para o outro agente (ou a execução conjunta) incorporar ao plano `T0–T6`:

### 3.1. O Que Deve Ser Mantido Integralmente do Plano `30f08ec` (Outro Agente)
1. **Contrato `OperationalCorrectionService.preview(request)` → `planDigest` → `apply({request, planDigest, operationKey})`:** A validação em duas etapas via RPCs `preview_operational_change` e `apply_operational_change` com lock determinístico no servidor (`concurrent-child-and-stale-retry`) é a forma mais segura de impedir exclusões parciais ou ampliação silenciosa de alcance.
2. **Cuidado com Triggers e Idempotência no PostgreSQL:**
   - Respeitar a ordem do trigger `AFTER UPDATE OF linked_asset_id` em `registered_invoices` para não conflitar com a deleção explícita do bem em `assets`.
   - Reconciliar o cache de idempotência de `save_invoice_with_effects_v2_impl` para que retries tardios não recriem uma despesa já excluída.
   - Atualizar simultaneamente a tabela normalizada `pendency_attempts`, o campo JSONB `pendencies.payload` e o estado regido por `sync_pendency_attempt_statuses`.
3. **Separação entre `clear_analysis` e `clear_item_history` e Proteção `na-bonus-with-valid-invoices`:**
   - `clear_analysis` remove apenas a avaliação atual e a pendência gerada pelo erro atual, preservando histórico anterior independente (`legacy-scope-does-not-consume-independent-history`).
   - Marcar `N/A` na bonificação de `Notas Fiscais` não apaga NFs válidas nem força análise `Correto` nelas (regra restrita a `declBBAgil`).

### 3.2. Cinco Contribuições da Frente Gemini para Incorporar aos Lotes `T1`–`T6`

| # | Lote Alvo | Lacuna ou Oportunidade Identificada em `30f08ec` | Solução Técnica Recomendada para Incorporação |
| :--- | :--- | :--- | :--- |
| **1** | **`T3` / `T5`** | Na `T5` (item 9 de `30f08ec`), a troca de classificação da NF (`consumo` ↔ `servico` ↔ `permanente` ↔ `boleto_internet`) quando já há pendência de Assessoria ou bem vinculado foi deixada como fallback de "excluir e refazer". | Adicionar a ação **`change_invoice_classification`** ao `OperationalCorrectionService`: como a `T3` já implementa a remoção transacional de pendência de `consAssessoria` e de bem exclusivo em `assets`, o próprio modal de edição da NF pode exibir o preview de impacto (*"Mudar de Serviço para Consumo removerá 1 pendência de Assessoria vinculada"*) e aplicar a troca sem obrigar o usuário a redigitar a NF. |
| **2** | **`T2`** | Em `src/integration/evaluation-retification.js`, selecionar `Correto` quando `bonificacao === 'Não'` e consolidada dispara erro bloqueante `LATE_ANALYSIS_REQUIRED`. | Na `T2`, quando `requiresLateCorrect(bonusResult, deliveryStatus)` for verdadeiro e o operador selecionar `Correto`, **normalizar automaticamente para `Correto (Atrasado)`** (ou pré-selecionar a opção correta na UI), eliminando o erro de validação. |
| **3** | **`T4` / `T5`** | As 2 pendências fiscais/Assessoria legadas sem `registered_invoice_id` (`notaFiscal / Aguardando reanálise` e `consAssessoria / Cancelada`) ficam protegidas contra exclusão acidental em `T3`, mas continuam órfãs se o usuário quiser regularizá-las sem apagá-las. | Adicionar no painel contextual das pendências de `notaFiscal`/`consAssessoria` com `registered_invoice_id IS NULL` a ação opcional **`link_legacy_pendency_to_invoice`** (*"Vincular a uma NF existente desta competência"*), permitindo sanear o passivo legado com prova determinística (além de permitir `delete_pendency` individual). |
| **4** | **`T4`** | Na ação `delete_context` (*"Excluir lançamentos deste programa neste mês"*), após apagar os dados lançados no mês ou programa errado, o usuário ainda precisa navegar manualmente até o mês/programa correto. | No modal de confirmação de `delete_context`, incluir um seletor opcional ***"Após excluir, abrir diretamente o contexto:"* (`Mês` / `Programa`)**, trocando o `RadarCompetenceContext` imediatamente após o commit para agilizar o recadastro no local certo. |
| **5** | **`T2` a `T5`** | A validação dos modelos de exportação Excel SME (`excel-sme-export-model.js`, `pendency-excel-export-model.js`, `excel-integral-certification.js`) e do índice de busca (`global-search-index.js`) está concentrada na `T6`. | Incluir asserções automatizadas de `excel-integral-certification` e de reconstrução de `global-search-index.js` nos testes de integração de **cada lote (`T2`, `T3`, `T4` e `T5`)**, garantindo detecção imediata caso qualquer cascata deixe referência órfã nas projeções de exportação. |
