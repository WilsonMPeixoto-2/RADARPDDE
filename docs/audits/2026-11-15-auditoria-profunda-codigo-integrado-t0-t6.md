# Auditoria independente de código — Prontuário integrado T0–T6

**Data:** 15/11/2026 (Brasília). **Natureza:** análise estática independente de código remoto e confronto de relatórios/planos; não é uma nova homologação de banco nem de UI autenticada.
**Branch canônica examinada:** `fix/prontuario-integrado-validado-20261115@a45f3ca4483b2daf6e45d9de4079d039914e44ce` (último commit documental); código funcional em `a869b2dfd89097d866e908e4081b042bea8321e0`.
**Main:** `4011a2b8e2ce39e048d5ecb68026c9f041b74cb0`. **Não houve merge, deploy, edição de runtime ou uso de escrita no Supabase institucional nesta auditoria.**
**Prioridade:** continuar o plano aprovado do Astra; não reconstruir a aplicação e não confundir testes com transporte RPC simulado com autenticação, consistência transacional e reload reais.

## 1. Fontes primárias e precedência

1. [Contrato aprovado](../reference/PRONTUARIO_CORRECAO_CONTRATO.md).
2. [Plano Astra T0–T6](../superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md) e [estudo de flexibilização](../superpowers/specs/2026-11-14-flexibilizacao-correcao-exclusao-lancamentos.md).
3. [Direção visual original](../superpowers/specs/2026-11-13-prontuario-exploracao-visual.md), com as substituições funcionais expressas no plano posterior.
4. Código e testes da branch integrada: `app.js`, `src/application/invoice-service.js`, `src/domain/invoice-effects.js`, `src/domain/service-advisory.js`, `src/application/operational-correction-client.js`, `src/integration/operational-correction-dialog.js`, `src/integration/operational-context-refresh.js`, `src/integration/evaluation-retification-ui.js`, `src/integration/prontuario-operational-ux.js`, `src/integration/invoice-history-lock.js`, `src/domain/pendency-correction.js`, `src/domain/pendencias-view-model.js`, `src/domain/global-search-index.js`, migration e pgTAP T2/T3.
5. [Auditoria inicial do Manus](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a87e9e0e6e7fa9dbff3f4daefdd534d2834f1116/docs/audits/2026-11-14-manus-auditoria-frente-integrada/RELATORIO.md), adendo e branches `audit/manus-t1-astra-reconstruida-20261114@300ac6d1`, `audit/manus-sugestoes-correcao-20261114@f0fa7335`.
6. [Auditoria e matriz do Antigravity](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/audit/antigravity-argon-prontuario-20261115/docs/audits/2026-11-15-antigravity-argon-prontuario/RELATORIO.md), branch `audit/antigravity-argon-prontuario-20261115@52ff0871`, [reconciliação oficial](2026-11-15-antigravity-reconciliacao-final.md).

**Histórico não equivale a bug presente:** a primeira migration de Argon `55001ccd` (RPC `SECURITY DEFINER` aberta a anônimos, digest incompleto, efeitos incorretos, falsas confirmações), o serviço que mutava estado local sem persistência, o DOM T1 incompleto e os testes quebrados foram auditados pelo Manus e substituídos na branch integrada. Não fazer merge integral daquela branch. A nova migration foi revisada, tem grants/perfil/escopo, digest de plano, livro-razão, lock por operação e pgTAP. A proposta Gemini `6b4efb5d` também não deve ser importada literalmente: quebrou `open(root,input)`, introduziu confirmação textual e fallback silencioso de tentativa. O Antigravity recompôs o helper T5 e o diálogo, mas sua proposta de **excluir `note` do fingerprint** e a **mutação de `pendency.item` só na memória** não foram incorporadas: o código consolidado preserva fingerprint integral e projeta a identificação atual da NF sem sobrescrever histórico.

## 2. Contratos de negócio de destino — não confundir com regras antigas

- Operações fiscais por usuário autorizado e escola no respectivo escopo, independentemente da carteira pessoal e autoria do lançamento (ADR-056); `sme`/Inventário não adquirem automaticamente a capacidade fiscal.
- Alteração de número, descrição e valor da NF mantém seu ID e vínculos; histórico de Pendência (documentSnapshot/item) é preservado e as superfícies que consultam a NF exibem sua identificação atual por `registeredInvoiceId`.
- `correct_analysis` / `clear_analysis` reparam erro de lançamento sem inventar novo envio, sem reanálise fictícia e sem exigir justificativa. `delete_pendency` remove o alvo identificado e dependentes, não históricos independentes.
- `delete_invoice` remove NF e Pendências fiscais/Assessoria vinculadas, tentativas, contatos específicos e bem **exclusivo** mesmo Inventariada quando transação e capacidade autorizarem; NF vizinha, bem compartilhado e contatos gerais permanecem. Exclusão de NF oriunda de provisória Qualidade reabre a origem; uma provisória `a_identificar` é outro contrato e não fica isolada de sua Pendência.
- Exclusão/correção fiscal ordinária não reabre bonificação consolidada (ADR-055). As dimensões derivadas de Assessoria e Inventário necessitam reconciliação explícita com o domínio existente; corrigir **a própria bonificação** é comando distinto.
- Erro de escola, competência ou programa: excluir o **contexto exato** e cadastrar novamente, não transferir silenciosamente. `clear_analysis`, `clear_item_history`, `delete_invoice` e `delete_context` têm alcances diferentes.
- T5: recompor tentativa, reanálise, histórico, contatos, pendência manual e inventário conforme eventos remanescentes e autorizações. Não presumir sempre a última tentativa quando o alvo for ambíguo.
- Nova capacidade só pode ser exposta quando comando, backend, autorização, isolamento, atualização do estado e prova autenticada estiverem disponíveis.

## 3. Mapa de estágios verificados no código

| Lote | Implementado no repositório | Ausente / não comprovado |
|---|---|---|
| T0 | Contrato e 9 casos estruturados em `tests/fixtures/prontuario-correction-cases.json` | Imagens aprovadas e registros completos de antes/depois por SHA; fixtures não constituem UAT |
| T1 | `app.js` usa `tr[data-program-header]`, contexto horizontal por programa, resumos independentes; `prontuario-operational-ux.js` lê a estrutura real; CSS e Playwright local | Homologação humana dos estados densos, zoom/foco/perfis e persistência autenticada após reload |
| T2 | SQL de `clear_analysis`, `correct_analysis` e `delete_pendency`; cliente `preview/apply`, congelamento do retry; diálogo piloto com `Limpar análise` e seleção explícita; botão documental ligado sob flag OFF | `delete_pendency` no UI, análise **individual** de NF/Assessoria no novo diálogo, jornada completa Incorreto→Envio→Reanálise, autorização real, reload/duas sessões |
| T3 | SQL planejador/aplicador `delete_invoice`: IDs de pendências, tentativas, contatos, asset e provisória; testes pgTAP e concorrência mesma chave | UI de exclusão composta, delegação de `InvoiceService.remove`, reconciliação Assessoria/Inventário, recibo completo, testes de rollback/concorrência/criação de novo filho e UAT |
| T4 | Regras no plano | `correct_bonification`, `clear_item_history`, `delete_context` em SQL/serviço/UI/testes; liberação de competência futura **para correção/exclusão existente** |
| T5 | Helper puro `src/domain/pendency-correction.js` com estados reais e rejeição de alvo ambíguo; 5 testes unitários | RPCs, serviços e UI para tentativas/contatos/inventário/pendência manual, efeito na análise e provas reais |
| T6 | Gates parciais de unidade, pgTAP e Playwright controlado; checkpoint versionado | Cobertura autenticada completa, Preview com backend descartável, evidências visuais aprovadas, documentação final/recuperação e publicação autorizada |

A configuração institucional de Supabase é fonte de verdade operacional. A migration nova existe no GitHub, mas não foi aplicada institucionalmente. Os totais anteriores de `1.414` unitários, `8` integrações, `40` Playwright aprovados, `1` ignorado e `61` pgTAP são **relatos das execuções anteriores**, não reexecuções deste parecer.

## 4. Lacunas concretas observadas diretamente no código atual

### A — T3 conserva deliberadamente a exclusão antiga durante a preparação (cutover pendente, não regressão atual)

- Em `app.js`, perto de L10522–L10607, o botão Excluir só existe com `!hasPendencyHistory`; um documento com Pendência não recebe essa ação.
- Em `src/application/invoice-service.js`, L1302–L1380, `InvoiceService.remove()` ainda chama `assertDeletionHistorySafe` e `assertDeletionAssetSafe`, monta `planInvoiceEffects` e usa `invoice:remove` / `delete_invoice_with_effects`, **não** `apply_operational_change`.
- O comando SQL `delete_invoice` existe, mas não foi exposto. **O bloqueio anterior permanece propositalmente correto enquanto o novo protocolo não está completo**. Não remover as guardas antes de concluir a transação e sua integração; a tarefa futura é a substituição coordenada, não um hotfix para desbloquear precocemente.

### B — T2 só aciona o diálogo piloto em documentos agregados (integração em preparação sob flag OFF)

- `src/integration/evaluation-retification-ui.js` L485–L495 abre `RadarOperationalCorrectionDialog.open` para `Editar análise` com flag `RADAR_OPERATIONAL_CORRECTION_PREVIEW === true`; a flag é desligada por padrão.
- `app.js` L11533–L11618 usa `beginInvoiceDocumentAnalysisEdit()` + `radarInvoiceService.updateDocumentAnalysis()` para NF; L11792+ usa `updateServiceAdvisory()` para Assessoria. Ainda não passam pelo novo diálogo quando usuário quer **retificar** o estado individual.
- O diálogo aceita apenas modo de análise, mesmo com quatro ações já implementadas no cliente/SQL. Falta entrada para `delete_pendency` e `delete_invoice`.

### C — Refresh do diálogo conflita com bloqueio canônico de edição (incompatibilidade estática presente)

- `operational-correction-dialog.js` cria `section role="dialog" aria-modal="true"` e, **sem fechá-la**, chama `RadarOperationalContextRefreshController.refreshSchool(...,{force:true})` em `synchronizeConfirmed()`, L225–L249.
- `operational-context-refresh.js` L154–L163 classifica qualquer diálogo modal realmente aberto como `editing`; L249–L254 devolve `{skipped:true,reason:'editing'}` **mesmo com force:true**.
- Em consequência, o diálogo interpreta `skipped` como falta de atualização e oferece atualizar a página depois de um commit exitoso. Deve haver RED de tela com o controller real; escolher integração controlada que **não interrompa outra edição independente** nem perca contexto/foco.

### D — Alteração de análise pode deixar Pendência ativa quando o cliente envia seleção vazia (risco de integridade no SQL)

- Migration L625–L648: se `v_current='Incorreto'` e `selectedPendencyIds` está presente, aceita `v_selected <@ v_candidates`, condição verdadeira inclusive para o conjunto vazio.
- Consequentemente `selectedPendencyIds: []` pode produzir plano com atualização de análise para `Correto`/ `Não analisado` e **zero Pendências excluídas**, preservando Pendência ativa originalmente vinculada ao `Incorreto`.
- A unicidade de Pendência ativa no banco torna várias candidatas pouco usuais para o mesmo alvo, mas **não corrige o caso de uma candidata e seleção explicitamente vazia**.
- Criar primeiro pgTAP negativo de servidor e ajustar regra para exigir seleção coerente com o novo estado; não deixar somente a UI decidir.

### E — Recomputação das dimensões derivadas não foi transportada integralmente para T3 (diferença efetiva de código)

- `src/domain/invoice-effects.js`, em `planInvoiceRemoval()` (aprox. L290–L345), após remover NF recalcula `bonificacao.consAssessoria`, `bonificacao.consEnviada`, `analise.consAssessoria`, análise fiscal e situação de encaminhamento patrimonial.
- `src/domain/service-advisory.js` devolve, na ausência de notas de serviço, `delivery: 'Não se aplica', sent:false, analysis:'Correto'`.
- Migration T3 L413–L437 recalcula apenas `analysis.notaFiscal`; L435–L438 adiciona **aviso textual**, não atualização transacional de Assessoria. Também não consta cálculo da dimensão `encampInventario`.
- Isso exige decisão de porte fiel das **projeções derivadas** sem adulterar bonificação manual consolidada (ADR-055). Caso mínimo: excluir última NF de serviço ou último item permanente, verificar fatos derivados e mesmo estado após F5/segunda sessão/Excel.

### F — Exclusão direta de Pendência ativa de Assessoria não recompõe agregado (lacuna no plano de efeitos)

- No ramo `delete_pendency` da migration, L473–L491, a única Pendência ativa de `consAssessoria` pode produzir atualização individual `registered_invoices.payload.analiseConsultaAssessoria = 'Não analisado'`.
- Nesse ramo não há recomposição explícita do `verifications.analysis.consAssessoria` agregado; a lógica posterior de agregado atende `notaFiscal` quando `v_is_invoice_level` e `v_overrides` estão definidos.
- Testar remoção da Pendência ativa de serviço quando existem uma e duas NFs de serviço, avaliando individual + agregado + bonificação preservada + histórico independente.

### G — Contrato de concorrência ainda não possui provas suficientes

- `operational_correction_lock()` L743–L771 bloqueia NF, verificação, Pendência, contato, asset e provisória; lista versões de `pendency_attempts` no plano, mas não bloqueia explicitamente a tabela de tentativas.
- `scripts/test-operational-correction-concurrency.sh` testa **duas sessões repetindo a mesma operationKey**: um commit e um replay. É uma prova importante, mas não substitui duas operações distintas, criação/alteração de dependente entre preview/apply, escritor REST antigo, rollback forçado, resposta perdida pós-commit.
- Garantir serialização comum com criadores de dependentes e verificar `STALE_PLAN`/rollback integral sem alargamento silencioso do alcance.

### H — Recibo, clientes antigos, permissões e testes reais

- A RPC retorna `deletedIdsByEntity`, `updated`, `counts`, `preserved`, `warnings`, mas o plano aprovado pede também `updatedEntities`, `changedEntities`, `affectedContexts`, `auditId` para reconciliação; decidir contrato definitivo explícito antes de conectar o `DataService`.
- `app.js` e `InvoiceService` operam em restrições anteriores legítimas para fluxos ordinários; comandos novos precisam de caminho único sem permitir que cliente antigo contorne guardas ou recoloque objeto excluído.
- `tests/e2e/operational-correction-dialog.spec.js` usa `executeRpc` controlado em navegador, e `prontuario-correction-layout.spec.js` usa fixture local. Não há ainda `tests/e2e/prontuario-analysis-correction.spec.js`, `prontuario-causal-deletion.spec.js`, `prontuario-context-correction.spec.js`, `prontuario-history-correction.spec.js` na branch.
- O arquivo de evidências visuais `docs/evidence/prontuario-correcao-integrada/` só possui `README.md`; não contém conjunto aprovado de capturas por SHA. A aprovação humana visual e a prova em Preview isolado são etapas futuras, não concluídas.

**Classificação:** A/B são **funcionalidades novas ainda não ativadas**, com coexistência intencional da lógica anterior; não indicam defeito da versão atual em Produção. H é trabalho de preparação e documentação; C/D/E/F são **incompatibilidades/riscos identificados estaticamente na versão candidata**, ainda não demonstrados em jornada Supabase autenticada; G é cobertura insuficiente. Para a matriz integral de substituição, testes, frontend, documentação e coexistência por lote, consultar [anexo de transição T0–T6](../reference/PRONTUARIO_PLANO_TRANSICAO_INTEGRAL_T0_T6.md). Não confundir com defeitos já corrigidos da branch original do Argon.

## 5. Sequência de trabalho verificável sem reconstrução

**P0 — Contraprovas mínimas antes de expandir UI (T2/T3).** Produzir REDs para C (refresh do diálogo com controller real), D (seleção explícita vazia), E/F (assessoria/inventário e agregado após exclusão), G (dependente concorrente), rollback da exclusão causal e erro de Auth. Alterar apenas núcleo responsável para obter GREEN, preservando os testes já existentes. Não reescrever a migration original nem novo sistema de autorização.

**P1 — Fechar T2 ponta a ponta.** Finalizar diálogo único de análise agregada/individual, `delete_pendency`, ligação em `app.js` e serviço canônico, ciclo Incorreto + Pendência, novo envio, reanálise; manter operação normal distinta da retificação. Reutilizar `operational-correction-client.js` e `operational-correction-dialog.js` existentes. Provar perfil permitido/negado, Cancelar sem commit, leitura posterior, idempotency e mesma escola vista em duas sessões. Não ligar flag em Production.

**P2 — Fechar T3 causal.** Integrar `delete_invoice` ao `InvoiceService.remove` e à superfície de exclusão; depois retirar bloqueios absolutos superados, nunca antes. Completar recibos, projeções de Assessoria/Inventário e reconciliação dos caches/contextos, asset compartilhado/inventariado, provisória Qualidade aberta/identificada, gasto a identificar, todos os estados da Pendência, rollback e operações concorrentes. Os novos testes devem clicar UI real usando Auth/Supabase descartável, e consultar as tabelas após F5.

**P3 — T4 conforme plano.** Implementar `correct_bonification`, `clear_item_history`, `delete_context`; confirmar N/A fiscal com NF válida, bonificação consolidada e contexto errado; não reprogramar contextos automaticamente. Testar competência futura para corrigir/excluir o que já existe.

**P4 — T5 conforme plano.** Reutilizar helper puro reconciliado de tentativas, padronizando nomes `delete_submission/correct_submission` no helper versus `delete_attempt/correct_attempt` no contrato de lote; adicionar SQL/RPC/UI canônicos, contatos, histórico manual, inventário terminal, ambiguidade explícita e eventos posteriores. Evitar modificar histórico válido por índice.

**P5 — T6.** Executar todos os gates no **mesmo SHA**; Supabase descartável Auth/RLS/migrations, Chromium desktop/390, screenshot comparação visual, zoom e foco, busca/Excel/inventário/consolidado com duas sessões, monitorar regressão de performance e preparar backup/restauração seletiva, versionar evidências, verificar o Preview isolado. Só submeter publicação mediante decisão posterior expressa do responsável e verificação do pipeline de produção.

## 6. Testes e evidências mínimos a adicionar

| Identificador sugerido | Prova de sucesso |
|---|---|
| `occ-dialog-refresh-real-controller` | Commit confirmado e recarga sem `editing:skip`, foco/contexto preservados |
| `occ-verified-analysis-empty-selection` | Análise `Incorreto` com Pendência ativa + seleção explícita vazia é rejeitada ou tem alcance validado |
| `occ-service-last-invoice-delete` | Zerou serviço ⇒ Consultoria `N/A/Correto` conforme domínio, sem aprovar NF indevidamente |
| `occ-inventory-last-invoice-delete` | Última permanente removida ⇒ encaminhamento/estado derivado consistente, ato externo não presumido |
| `occ-active-advisory-pendency-delete` | Nota serviço, Pendência ativa excluída ⇒ análise individual e agregado convergem |
| `occ-concurrent-child-and-stale-retry` | filho novo/alterado entre prévia/execução invalida plano sem apagar dependente não confirmado |
| `occ-after-commit-lost-response` | retry com mesma intenção retorna recibo sem segunda exclusão |
| `occ-fiscal-2d-pendency-deletion` | duas Pendências (fiscal/Assessoria) da mesma NF removidas sem alterar NF vizinha |
| `occ-undo-identified-quality` | NF excluída ⇒ provisória `open` com ID original; novo registro identificado usa intenção distinta |
| `occ-permission-matrix` | controlador/assistente/admin no próprio escopo permitidos; SME/Inventário/outro escopo negados |
| `occ-backend-compatibility-old-client` | cliente anterior não contorna protocolo nem revive registros removidos |
| `occ-prontuario-visual-acceptance` | estado denso, 200% zoom, dark/light, foco e interação comparados à referência aprovada |

Os testes SQL existentes permanecem úteis como regressão; os cenários novos devem partir de suas fixtures, não substituí-los. Não modificar Production para gerar evidências.

## 7. Instrução de continuidade

Começar sempre do HEAD verificado de `fix/prontuario-integrado-validado-20261115` e dos arquivos desta seção, não da branch original Argon. Manter as branches Manus e Antigravity como fontes históricas e de teste. Não incorporar integralmente seus commits nem repassar correções descartadas. Antes de cada nova mudança, primeiro localizar o caminho verdadeiro do usuário/serviço/RPC e escrever teste RED da condição real. Registrar por lote: arquivo alterado, contrato/autoridade, casos afetados, testes e evidências, SHA, integração e estado de Preview. Evitar novos arquivos CSS duplicados ou revisão arquitetural geral. Não tocar `main`, Vercel Production nem `scnryinorqeucbfkioxo` nesta preparação.

**Status deste documento:** relatório técnico e plano de contraprovas, não implementação, não validação em banco institucional e não aprovação para merge.