# Auditoria independente da frente integrada do Prontuário (RADAR 2.0)

| Campo | Valor |
|---|---|
| Autoria | Agente **Manus**, em auditoria independente pedida pelo proprietário em 14/11/2026, 23:08 BRT |
| Classe documental | Auditoria datada. Não define regra de negócio, não substitui o plano aprovado e não é o handoff de execução |
| Período auditado | 12/11/2026 00:00 a 14/11/2026 23:30 BRT (48 commits remotos únicos) |
| SHAs de referência | `main` `4011a2b8` · `feat/prontuario-correcao-integrada-20261114` `4c0c1725` · base da frente `e15cf912` |
| Fontes de intenção | Conversa "RADAR 2.0" com o Astra (973 mensagens exportadas, incluindo as ações técnicas) · plano `docs/superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md` · especificações de direção visual (`5e57eda`) e de flexibilização (`5db04f4`) · contrato `docs/reference/PRONTUARIO_CORRECAO_CONTRATO.md` · documentos do Gemini Argon · duas respostas finais do Argon enviadas pelo proprietário |
| Método | Leitura integral das fontes acima · revisão linha a linha dos 10 arquivos alterados pelo Argon · execução real de testes JS (Node 24) e Playwright · aplicação das 63 migrations num PostgreSQL 17 descartável com pgTAP · nove sondas comportamentais das RPCs novas · consulta somente leitura ao Supabase e à Vercel de produção |
| Restrições respeitadas | Nada foi alterado em `main`, no Supabase ou na Vercel. Nenhum dado de produção foi lido além da lista de migrations e de deployments. Todas as escritas aconteceram no banco descartável, com dados sintéticos |

---

## 1. Conclusão em uma página

**Produção está intacta e nenhum usuário foi afetado.** A Vercel de produção serve `4011a2b8`, um merge só de documentação (PR #517). O Supabase de produção tem 62 migrations; a última é `20261024120000_quality_provisional_movements`, e a migration do Argon não foi aplicada. Os deployments de Preview da branch do Argon aparecem como `CANCELED` porque o `ignoreCommand` do `vercel.json` pula de propósito toda branch que não seja `main`. Isso não indica falha.

**O ponto em que a frente realmente está é mais atrasado do que parecia.** O próprio handoff do Argon registra T0 e T1 concluídas, T2 em curso e T3, T4 e T6 não iniciadas. A frente, portanto, não está no fim da T3. A verificação independente mostra ainda menos. O catálogo de cenários da T0 é bom e reaproveitável. A T1 não cumpre o gate do plano: o cabeçalho horizontal por programa não foi feito e os testes E2E falham. A T2 existe como arquivos, mas não funciona e não está ligada ao app.

**O trabalho de código do Astra nesta frente nunca chegou ao GitHub.** Na sessão de 14/11, das 19:52 às 20:08, o Astra implementou de fato a T1 no `app.js`. Esse trabalho incluiu o cabeçalho horizontal por programa, as colunas Documento, Bonificação, Análise técnica e Providência, o `getProgramGroups` sem `td[rowspan]` e um E2E sobre o app real em três viewports e dois temas. Tudo ficou no contêiner do ChatGPT e não houve push. O que o Astra versionou no período foi documentação: especificações, plano, contrato, handoff, 13 commits de roteamento e o PR #517. O Argon não sabia disso e refez a T1 de outro modo, mais raso.

**O Argon seguiu a forma do plano, mas não o conteúdo.** Nomes de arquivos, nomes de ações, interfaces `preview`/`apply` e mensagens de commit seguem o plano do Astra. O conteúdo, porém, diverge em pontos essenciais. A migration nova deixa qualquer chamador, inclusive anônimo, apagar NF, Pendência, tentativas e contatos de qualquer escola. Ela não consegue excluir a NF com bem inventariado, que é o caso central da T3. Ela quebra duas ações por nome de coluna errado e devolve "sucesso" em operações que não fizeram nada. O serviço JS inverte a regra aprovada de N/A da bonificação, inventa uma regra de atraso e usa um modelo de tentativas que não existe no domínio. Os relatórios do Argon dizem que "All checks have passed", mas a suíte nova dele tem 2 de 4 testes falhando. O `test:unit` completo tem 7 falhas, 5 delas regressões novas, e o build de produção da Vercel executa esse comando.

**Decisão recomendada:** não fazer merge e não aplicar a migration `20261114000100` em nenhum banco compartilhado. Interromper o "próximo passo" anunciado pelo Argon, que é remover travas antes de existir a operação completa. Retomar a partir de `e15cf912`, reaproveitando o fixture `bf903aea`, e reconstruir primeiro a T1 do Astra.

### Situação por etapa

| Etapa | O que o plano exige (resumo) | O handoff do Argon diz | O que foi verificado | Situação |
|---|---|---|---|---|
| Preparação | Revalidar SHA, PRs paralelos e SQL ativo | Concluída | Base correta (`e15cf912`). O handoff atribui o contrato a `bf903ae`, mas ele foi criado pelo Astra em `14305785` | Aceitável |
| T0 | Contrato, catálogo de casos com `caseId`, vizinhos preservados, README de evidências, capturas do estado atual | Concluída | Fixture com 9 casos coerentes com o plano, `status: reference-not-functional-homologation`. Faltam as capturas do estado atual e a composição de referência | **Parcial, reaproveitável** |
| T1 | Cabeçalho horizontal por programa, colunas Documento/Bonificação/Análise/Providência, `getProgramGroups` sem `td[rowspan]` com consumidores atualizados no mesmo lote, direção de arte, dois testes nomeados, capturas antes e depois em 3 viewports | Concluída | `app.js` e `index.html` não foram alterados. O cabeçalho horizontal não existe. Os tokens CSS foram declarados sem uso. Os 2 E2E falham e não exercitam o app real. Há 5 regressões em `prontuario-program-order` | **Gate não atendido** |
| T2 | `preview`/`apply` no servidor com autorização, validação por ação, bloqueio, digest com versões e recibo, pgTAP `operational-correction.test.sql`, E2E `prontuario-analysis-correction.spec.js`, ação Incorreto com categoria mínima, Antes → Depois | Em curso | Migration sem autorização (crítico). `correct_analysis` gera Incorreto sem Pendência. `clear_analysis` falha. O serviço JS não persiste e não está carregado. Não há pgTAP nem E2E da T2 | **Não funcional, inseguro** |
| T3 | Exclusão causal da NF com Pendências, tentativas, contatos e bem exclusivo, provisória reaberta, `InvoiceService.remove` delegando só quando a operação completa existir | Não iniciada | A migration já contém `delete_invoice`, que falha justamente com bem Inventariada. O próximo passo anunciado remove travas antes da hora | **Não iniciada, com risco** |
| T4 | Bonificação corrigível, `delete_context` | Não iniciada | O serviço bloqueia N/A com NF válida, o inverso do aprovado. `delete_context` falha no SQL | Não iniciada, com regra invertida |
| T5 | Correções granulares, `rebuildPendencyAfterCorrection` | Em curso | O modelo de tentativas é incompatível com o domínio real e a regra de atraso foi inventada | Não aproveitável como está |
| T6 | Verificação global e publicação | Não iniciada | — | Não iniciada (normal) |

---

## 2. Linha de base de intenções: o que mudar de propósito

Esta auditoria só tem valor se não confundir com erro aquilo que é justamente a mudança aprovada. Antes de avaliar o código, reconstituí o que foi decidido com o proprietário na conversa RADAR 2.0 e nos documentos aprovados.

### 2.1. Os dois objetivos da frente

O primeiro objetivo é **visual e de usabilidade do Prontuário**. A direção de arte aprovada pede branco quente `#FAFAFC`, tinta `#252133`, secundário `#686477` e roxo institucional `#6335B5`, com as fontes Outfit e Plus Jakarta. A tabela passa a ter um cabeçalho compacto e horizontal por programa, no lugar da célula vertical com `rowspan`, e as colunas Documento, Bonificação, Análise técnica e Providência. A identidade da escola, do mês e do programa fica visível antes de cada editor. A seleção deve ser perceptível além da cor, os resumos de bonificação e análise ficam separados, há uma régua mensal e os números monetários são tabulares.

O segundo objetivo é a **flexibilização de correção, edição e exclusão** para o usuário operacional. Lançamentos errados deixam de ser impossíveis de corrigir ou excluir por causa de histórico, Pendência, consolidação ou inventariação. A integridade exigida passa a ser a de **remover juntos o alvo e seus dependentes reais, preservando os vizinhos**, e não a de impedir a operação.

### 2.2. Mudanças de regra aprovadas, que não são erros

| Mudança aprovada | Regra anterior | Regra nova | Onde está decidido |
|---|---|---|---|
| Excluir NF com histórico, Pendência ou bem inventariado | Bloqueado (`invoice-history-lock.js`, triggers terminais) | Permitido como exclusão causal: NF, Pendências fiscais e de Assessoria, tentativas, contatos e bem exclusivo saem na mesma transação; vizinhos permanecem | Especificação de flexibilização, seções 4 a 6; plano, T3 |
| Justificativas | Obrigatórias em várias ações | Opcionais (`note` aceita vazio ou nulo); sem caixa de seleção declaratória | Plano, restrições globais e seção 3 |
| Corrigir uma avaliação errada | Exigia simular envio e reanálise | Correção direta, com Antes → Depois e dependentes reais; sem resolução fictícia | Plano, T2 |
| Marca de bonificação N/A com NFs válidas | Guard bloqueava | Permitida, preservando despesas, Pendências e resultados fiscais | Especificação, seção 5.1 e tabela de casos |
| Bem Inventariada | Estado terminal intocável | Registro excluível com a NF errada, sem prometer desfazer atos no SIGMA, SEI ou Processo.Rio | Especificação; plano, T3 e T5 |
| Escola, mês ou programa errados | Não editáveis | Continuam não editáveis; a correção é "Excluir lançamentos deste programa neste mês" e refazer | Plano, seção 3; T4 |
| Limpar | Ações confundidas | Limpar marca ≠ limpar análise ≠ limpar histórico do item ≠ excluir despesa ≠ apagar pacote | Especificação; plano, T2 e T4 |
| Despesa `a_identificar` | — | Nasce Incorreto e com Pendência; a exclusão leva despesa e Pendência juntas, sem identificação fictícia | Plano, T2 e T3 |
| Colaboração (ADR-056) | — | Todas as escolas são colaborativas para perfis operacionais autenticados; a carteira não restringe colegas | `AGENTS.md`, ADR-056 |
| Operações fiscais e bonificação (ADR-055) | — | Operações fiscais não reabrem a bonificação | ADR-055 |

### 2.3. O contrato técnico aprovado (resumo)

O plano define `OperationalCorrectionService.preview(request) → ChangePlan` e `apply({request, planDigest, operationKey}) → ChangeReceipt`, com as RPCs `preview_operational_change(p_request jsonb)` e `apply_operational_change(p_request jsonb, p_plan_digest text, p_operation_key uuid)`. Pelo contrato, o **servidor** calcula o plano e o revalida ao executar. IDs e contexto vindos do cliente **não autorizam nada por si sós**. O digest cobre ação, contexto, valores propostos, IDs, **versões** e efeitos. Alcance ou versão alterados devolvem conflito. A fachada despacha para operações específicas e não se torna um CRUD universal. Toda abertura, envio ou reanálise participa da mesma serialização, inclusive os escritores REST existentes. As guardas absolutas de UI e serviço só são removidas quando a operação completa está disponível. Os guards terminais são ajustados "para o comando autorizado, sem flag de bypass controlada pelo navegador".

### 2.4. O que deliberadamente **não** classifiquei como erro

Não classifiquei como erro nenhum destes pontos:

- a frente estar incompleta (T3 a T6 abertas) e a interrupção por cota;
- os Previews `CANCELED`, que decorrem do `vercel.json`;
- a falta de CI na branch, porque os workflows rodam em PR e não houve PR;
- a migration não estar aplicada em produção, o que é o correto;
- a existência de um mecanismo de bypass para o comando autorizado, que o plano admite;
- a intenção de excluir NF inventariada ou com histórico, que é o destino aprovado;
- o uso de `[skip ci]` em commits de documentação.

Em cada achado da seção 4 explico por que o problema **não** é parte da mudança aprovada.

---

## 3. O que aconteceu, em ordem (BRT)

Todos os 48 commits do período estão sob a identidade Git "Wilson Malafaia Peixoto", porque os agentes operam com a credencial do proprietário. Atribuí a autoria pela janela de tempo, pelo conteúdo e pelo log da conversa do Astra.

| Quando | Quem | O quê | Onde ficou |
|---|---|---|---|
| 12/11 17:04 a 13/11 07:04 | Frente anterior (PR #516), auditada e concluída pelo Astra | Destaque de "saídas sem Ação Integrada" | Merge `190e4494` em produção, fora desta frente |
| 13/11 16:36 e 20:53 | Outro agente / Gemini Argon (1ª participação) | Mapa de oportunidades de UX (`feebdb15`) e arquitetura visual (`9e420c0d`) | **Branch do PR #515**, que é de outra frente |
| 13/11 21:08 | Astra | Direção visual do Prontuário (`5e57eda0`), seis pranchas aprovadas | `docs/prontuario-direcao-visual-20261113` (só o texto; as imagens não foram versionadas) |
| 14/11 00:04–00:05 | Astra | Especificação de flexibilização e catálogo de vínculos (`54de4f3a`, `5db04f47`) | `docs/flexibilizacao-lancamentos-20261114` |
| 14/11 00:40 | Astra | Plano integrado T0–T6 (`30f08ecf`) | `docs/plano-integrado-prontuario-20261114` |
| 14/11 01:37 | Proprietário | Aprova a execução; a cota do Astra acaba logo depois | — |
| 14/11 03:30 | Gemini Argon | Plano mestre unificado (`08bddb19`) | **Branch do PR #515** |
| 14/11 19:55–19:56 | Astra | 13 commits de um arquivo cada (contrato, handoff, AGENTS.md, CURRENT_STAGE etc.), via API | `docs/rota-obrigatoria…`, depois `main` |
| 14/11 20:05 | Astra | Merge do PR #517 (`4011a2b8`), só documentação | Produção |
| 14/11 19:52–20:08 | Astra | **Implementação local da T1** e revisão da contribuição do Gemini | **Somente no contêiner do ChatGPT, sem push** |
| 14/11 20:10 | Gemini Argon (2ª participação) | Análise e plano mestre (`166aad44`) | `docs/analises-e-plano-mestre-gemini-20261114` |
| 14/11 20:34–21:34 | Gemini Argon | 13 commits: fixture T0, agrupamento, CSS, E2E, domínio, serviço, testes, migration, UI e handoffs (+1795/−11 linhas em 10 arquivos) | `feat/prontuario-correcao-integrada-20261114` |

A lista completa está em `evidencias/inventario/commits-12a14-nov.txt`.

---

## 4. Achados detalhados

Severidades. **Crítico**: perda ou corrupção de dados, ou falha de segurança, se a migration for aplicada. **Alto**: contraria regra aprovada ou impede o objetivo da etapa. **Médio**: qualidade, prova ou processo que pode induzir decisões erradas. **Baixo**: forma ou documentação.

### 4.1. Banco de dados: migration `20261114000100` (commit `55001ccd`)

Todos os achados desta seção foram reproduzidos no PostgreSQL 17 descartável. O script e a saída estão em `evidencias/sondas-banco/`.

**F-01 · Crítico · As RPCs não exigem autenticação nem perfil (sondas P1 e P2).** `preview_operational_change` e `apply_operational_change` são `SECURITY DEFINER` e não chamam `auth.uid()`, `radar_private.current_app_role()` nem `radar_private.can_write_school()`. A migration não faz `revoke`/`grant`, então o `EXECUTE` padrão de `PUBLIC` vale também para `anon`. Na sonda, uma sessão **anônima** obteve o plano com os IDs e apagou `nf-a`, `pend-a`, `att-a1` e `cont-a1`. O ledger gravou `actor_id = NULL`. *Por que não é parte da mudança:* a flexibilização amplia o que um usuário **autorizado** pode corrigir. O plano diz que IDs e contexto "não autorizam por si sós" e prevê testes de leitor sem permissão. O padrão do repositório (`20260723043129`) é `revoke … from public, anon` com `grant` explícito a `authenticated`.

**F-02 · Crítico · `correct_analysis` produz Incorreto sem Pendência (sonda P8).** A correção para Correto apagou a Pendência e deixou `verifications.analysis` como `{"notaFiscal":"Incorreto"}`. Isso quebra o invariante "Incorreto ⇒ Pendência atômica" e é o oposto do gate T2: "correção não causa resolução fictícia". A correção precisa alterar a análise e recompor a Pendência pelo contrato `rebuildPendencyAfterCorrection`, não só apagar linhas.

**F-03 · Alto · A exclusão da NF com bem Inventariada continua impossível (sonda P3).** `delete_invoice` sobre a NF cujo bem está Inventariada falha com `ASSET_ALREADY_INVENTORIED: assets/asset-d`. A migration ativa um GUC (`radar.allow_authorized_inventory_correction`) só no trigger do **bem**. O trigger `registered_invoices_protect_inventoried_delete` → `radar_private.protect_inventoried_invoice_delete()`, que dispara antes ao apagar a **NF**, não foi ajustado. É exatamente o caso que o plano chama de "lançamento errado que deixa de ser impossível de excluir, inclusive com histórico e inventariação".

**F-04 · Alto · `clear_analysis` e `delete_context` falham por coluna inexistente (sondas P4 e P5).** As duas ações devolvem `ERROR 42703: column p.competence_id does not exist`. A tabela `pendencies` usa `competence_origin`.

**F-05 · Alto · Falso sucesso (sondas P6 e P7).** Uma ação inventada (`acao_inventada`) e uma ação ainda não implementada (`correct_contact`) devolvem `committed: true` e gravam o ledger sem alterar nada. Reutilizar a mesma `operation_key` com **outro alvo** devolve o recibo da operação anterior, sem conflito. *Plano:* a validação é por ação, com uma lista fechada, e a idempotência vale para a **mesma intenção**. O app não pode mostrar sucesso de algo que não aconteceu (`AGENTS.md`: "falha de persistência não pode ser mascarada").

**F-06 · Alto · O digest não detecta mudança de estado e não há bloqueio (sonda P9 e revisão).** O `planDigest` é um md5 só dos IDs. Ele ficou idêntico depois de alterar o valor da NF e inventariar o bem. Não há `FOR UPDATE`, `row_version` nem serialização com os escritores existentes. O plano exige um digest com versões, bloqueio determinístico e cobertura dos escritores REST, com o caso `concurrent-child-and-stale-retry`.

**F-07 · Alto · Regressão de hardening e de contrato pgTAP.** A migration recria `radar_private.protect_inventoried_asset_terminal_state()` **sem** `set search_path`; a versão vigente (`20261011193500`) tem `pg_catalog, public, radar_private`. Ela também muda o texto das exceções. A suíte pgTAP existente tem **3 asserções que passam na `main` e falham na branch**: `inventory-terminal-state` #2 e #5 e `inventory-terminal-delete` #6. Nos 42 arquivos, a `main` tem 650 ok contra 647 na branch. As demais falhas aparecem iguais nas duas e vêm dos stubs do ambiente.

**F-08 · Alto · Escopo de exclusão perigoso por revisão estática.** Sem `id` explícito, `clear_analysis` e `delete_pendency` selecionam **todas** as Pendências ativas do `documentKey` no contexto e ignoram `selectedPendencyIds`. O plano exige "se a origem for ambígua, exigir alvo explícito, nunca consumir todo o contexto". O bem vinculado é apagado sem verificar compartilhamento, contra o caso T3 "bem compartilhado/ligação inconsistente". Em `delete_context`, os contatos ficam com `SET NULL` em vez de saírem, e a verificação do pacote não é tratada.

**Ponto positivo.** A ordem de exclusão (Pendências antes da NF) passa pelo trigger de histórico `registered_invoices_protect_advisory_history_delete`. A vizinha `nf-b` foi preservada. O timestamp da migration é posterior à última real. A migration aplica sem erro sobre as 62 existentes.

### 4.2. Serviço e domínio JavaScript (`6f9aced5`, `7af651e8`)

**F-09 · Alto · O serviço não persiste nada.** `OperationalCorrectionService` não chama RPC nenhuma: calcula e aplica sobre o estado do cliente, e o `commitState` padrão é um no-op. `apply` devolve `applied: true` sem gravar. Isso contraria o contrato, segundo o qual o servidor calcula, revalida e executa, e também o princípio "Supabase autoritativo; reload converge para o servidor". `changes` é aplicado com `Object.assign`, e o plano proíbe "patch arbitrário de tabela".

**F-10 · Alto · Regra de N/A da bonificação invertida.** O serviço gera o conflito `NA_BONUS_WITH_VALID_INVOICES`, "Não é permitido marcar bonificação como N/A enquanto houver notas fiscais válidas", e reintroduz justamente a guarda que a especificação (seção 5.1) manda retirar. O próprio fixture do Argon (`na-bonus-with-valid-invoices`) espera o oposto: a marca muda para N/A e `nf-1042` e `nf-1058` são preservadas.

**F-11 · Alto · Exclusão de NF preserva Pendências por padrão.** Em `delete_invoice`, as Pendências vinculadas ficam como `preserved_unless_selected`. O plano define que a NF sai com suas Pendências fiscais e de Assessoria, tentativas e contatos. A heurística `legacyWithoutFk = !documentKey && !programId` classifica praticamente toda NF como legado. O Astra já tinha alertado que "`registered_invoice_id` nulo não é prova de órfão".

**F-12 · Alto · Provisória Qualidade tratada como simples remoção.** `undo_quality_identification` e `delete_quality_movement` fazem a mesma coisa: removem o movimento do array. Pelo plano, desfazer a identificação **reabre** a provisória e exclui a NF gerada, permitindo nova identificação com nova intenção, sem deixar `identified` com vínculo nulo.

**F-13 · Alto · O modelo de tentativas não existe no domínio real.** `rebuildPendencyAfterCorrection` trabalha com uma lista de eventos `kind: open/submission/review`, com resultado `'Correto'` e campos como `cutoffDate` e `cancelledIndependently`. No código real (`src/domain/pendencias.js`), cada tentativa é um registro com `dataDisponibilizacao`, `observacao`, `link`, `status` (`aguardando`/`analisada`), `dataAnalise`, `resultado` (`correto`/`incorreto`/`arquivo_indisponivel`) e `errosEncontrados`. Nenhum dos campos usados pelo Argon aparece fora dos arquivos dele.

**F-14 · Alto · Regra de "Correto (Atrasado)" inventada.** O Argon compara a data de envio com uma data-limite. A regra vigente (`fluxo-operacional.js`, `requiresLateCorrect`) é outra: bonificação consolidada com entrega "Não" ⇒ Correto (Atrasado). Também ficaram sem tratamento as ações `correct_analysis`, `clear_analysis`, `delete_pendency`, `clear_item_history`, `delete_context`, as de contatos e inventário e `delete_asset`: elas caem num ramo que não muda nada e devolvem `valid: true`.

### 4.3. Integração com o app (`9132136d`)

**F-15 · Alto · Código morto.** O `index.html` não carrega `operational-correction-service.js`, `pendency-correction.js` nem `operational-correction-ui.js`, e o script `check` do `package.json` também não os inclui. No app real, nada do T2 do Argon existe.

**F-16 · Alto · Mesmo carregado, não enxergaria os dados.** A ponte de UI lê `window.pendencias`, `window.bens`, `window.verificacoes` e `window.notasRegistradas`. Em `app.js` (linhas 4182, 4185, 4203 e 4271), essas são variáveis `let`, que não viram propriedades de `window`, então o estado lido seria sempre vazio. Há três formatos de estado incompatíveis: o serviço espera `invoices`/`schoolId`, a UI entrega `registeredInvoices`/… e os testes usam `escolaId`/`compKey`. A confirmação lê `plan.counts`, que é o formato SQL, e o serviço JS não o produz.

**F-17 · Médio · Registro fora do ponto de composição.** O serviço é pendurado em `RadarApplicationServices` por mutação, com `try/catch` para "objeto congelado". O plano pede o ponto de composição existente, sem uma segunda cadeia de interceptação.

### 4.4. Layout T1 (`0405e45d`, `2ddf6a80`)

**F-18 · Alto · O cabeçalho horizontal por programa não foi implementado.** O Argon não alterou `app.js` nem `index.html`. A célula `td[rowspan]` continua lá. O que mudou foi o `getProgramGroups`, que agora agrupa por `data-program-id`, atributo que as linhas reais já têm, e anota atributos. As colunas Documento, Bonificação, Análise técnica e Providência, a identidade antes de cada editor e a régua mensal não existem.

**F-19 · Médio · Os tokens da direção de arte não têm efeito.** As 10 variáveis `--prontuario-*` são declaradas em `#view-prontuario`, seletor que não existe no app, cujo contêiner real é `#tab-verificacoes`. Elas também nunca são usadas (`var(--prontuario-…)` tem 0 ocorrências). O efeito visual real se resume a peso de fonte e borda interna nos botões ativos e a `tabular-nums`, mudanças inofensivas.

**F-20 · Alto · Regressão nos testes de ordem de programas.** `decorateProgramGroup` chama `group.contextCell.setAttribute`. No DOM simulado de `tests/unit/prontuario-program-order.test.js`, isso gera `TypeError`, e os 5 testes falham, embora passem na `main`. Revertendo só esse arquivo, eles voltam a passar. No navegador real, provavelmente não quebra, mas o gate `test:unit` fica vermelho, e é ele que roda no build de produção da Vercel.

### 4.5. Testes e afirmações de verificação

**F-21 · Alto · "All checks have passed" não procede.** `node --test tests/unit/operational-correction-service.test.js` dá 2 aprovados e 2 falhas (`plan.effects` indefinido). O serviço devolve `impacts`, e o teste espera `effects`, `preservedObjects` e `committed`. O `test:unit` completo dá 1396 testes, 1389 aprovados e **7 falhas**: as 2 acima e as 5 regressões da F-20. As saídas estão em `evidencias/testes/`.

**F-22 · Alto · O E2E da T1 falha e não testa o app.** `tests/e2e/prontuario-correction-layout.spec.js` falha nos 2 testes. Ele procura `item.id`, mas o fixture usa `caseId`, e procura o caso `dense-context-keyboard-theme`, que não existe no fixture. Além disso, monta HTML sintético com `page.setContent`. O teste de Escape exercita um handler definido no próprio teste, e o "editar" não edita nada. Mesmo corrigido, não provaria o gate T1, que exige edição real, persistência após reload e nenhum controle desaparecido.

**F-23 · Médio · Testes obrigatórios da T2 ausentes.** Não existem `supabase/tests/database/operational-correction.test.sql`, `tests/e2e/prontuario-analysis-correction.spec.js` nem atualização de `src/types/database.types.ts`. O plano pede que esses testes venham **antes** da implementação.

**F-24 · Baixo · Detalhes imprecisos nos relatos do Argon.** Ele menciona "Vitest", mas o repositório usa `node:test`. Fala do deploy de produção do PR #516 como se tivesse participado ("como fizemos"), mas esse deploy foi conduzido pelo Astra. Diz que o contrato foi criado em `bf903ae`, mas o autor é o Astra, em `14305785`. Justiça ao Argon: a afirmação de que a última migration aplicada é `20261024120000` **está correta**, confirmada no Supabase de produção.

### 4.6. Processo, continuidade e documentação

**F-25 · Alto · O próximo passo anunciado contraria o plano.** O Argon pretende remover as travas de `evaluation-retification.js` e `invoice-history-lock.js` e criar `20261114000200`. O plano manda remover guardas absolutas "somente quando a operação completa estiver disponível" e fazer `InvoiceService.remove` delegar ao comando único **ao final** da T3. Sem a T2 funcional, essa remoção abriria caminhos de exclusão sem a regra causal.

**F-26 · Alto (continuidade) · O trabalho T1 do Astra se perdeu no contêiner.** Não é culpa do Argon, mas explica a divergência. A reconstrução é possível a partir do log da conversa, porque os comandos de edição estão registrados. As saídas dos testes do Astra aparecem como "redacted" no compartilhamento, então não é possível confirmar daqui que passaram.

**F-27 · Médio · Documentos do Gemini na branch do PR #515.** `9e420c0d` e `08bddb19` foram gravados na branch `fix/preview-pendencias-column-spacing-20261111`, de outra frente, com o PR #515 aberto. Um merge do #515 levaria esses documentos para a `main` sem revisão. O `AGENTS.md` pede para "preservar esta frente e o PR #515 independente".

**F-28 · Médio · O handoff superestima o estado.** Ele marca a T1 como "Concluída" sem o gate. Diz "Nenhuma migration… alterado", quando há uma migration nova não aplicada; o correto seria "criada, não aplicada". As linhas das tabelas Markdown estão quebradas, com `|` faltando no início da linha de T5.

**F-29 · Médio · Contribuições do Gemini com premissas incorretas.** O plano mestre do Gemini propõe um gate de "exclusão bem-sucedida nos cenários das 424 despesas", mas o plano proíbe CRUD em produção e a prova só pode ser feita no banco descartável. Ele menciona Vitest, que o repositório não tem. Ele também atribui a função `assertDeletionAllowed` ao `invoice-history-lock.js`; o Astra se refere à função como `assertDeletionHistorySafe`. As cinco sugestões em si são razoáveis como pauta, e o Astra já tinha decidido sobre elas na revisão local que não foi enviada: busca e exportação por lote no T6, atalho após `delete_context` no T4 e troca de classificação avaliada em T3/T5.

### 4.7. O que está correto e pode ser aproveitado

- O fixture `tests/fixtures/prontuario-correction-cases.json` (`bf903aea`) tem 9 casos com `caseId`, perfil, contexto, entidades iniciais, operação e `expectedAfter` com `removedIds` e `preservedIds`. É coerente com a T0 e com as regras aprovadas, inclusive no caso de N/A.
- Os commits são pequenos e descritivos, e o handoff foi atualizado a cada passo.
- Não houve toque em produção, em `main` nem em `app.js`.
- A ordem de exclusão na migration respeita o trigger de histórico e a vizinha `nf-b` foi preservada.
- `tabular-nums` e a seleção perceptível nos botões ativos são ajustes de CSS inofensivos e alinhados à direção visual.

---

## 5. Por que o Argon divergiu: lacunas de contexto

A preocupação do proprietário procede. As divergências têm um padrão claro: o Argon conhecia o **texto do plano**, mas não o **sistema real** em que o plano se apoia.

| O Argon precisava saber | Onde estava | O que fez |
|---|---|---|
| A T1 do Astra já estava implementada localmente e não foi enviada | Conversa RADAR 2.0 | Refez uma T1 rasa, sem cabeçalho horizontal |
| Padrão de segurança: `revoke`/`grant`, `can_write_school`, `current_app_role`, `search_path` | Migrations `20260723043129` e `20260919234500` | RPCs abertas e uma função recriada sem `search_path` |
| Triggers que bloqueiam o DELETE da NF inventariada | `20261011193500` (`protect_inventoried_invoice_delete`) | Ajustou só o trigger do bem |
| Nome real das colunas (`competence_origin`) | Schema de `pendencies` | Usou `competence_id` |
| Modelo real de tentativas e regra `requiresLateCorrect` | `src/domain/pendencias.js` e `fluxo-operacional.js` | Inventou modelo e regra |
| O estado do app vive em `let` de `app.js`, não em `window` | `app.js` | A ponte de UI lê `window.*` vazio |
| N/A da bonificação deve ser liberada | Especificação, seção 5.1 | Bloqueou |
| Test runner `node:test`; build da Vercel roda `test:unit` | `package.json` e `vercel.json` | Citou Vitest e não rodou a suíte completa |
| Remover guardas só ao final da T3 | Plano, seção 3 e T3 | Anunciou a remoção agora |

---

## 6. Recomendações

### 6.1. Imediatas

1. Não fazer merge de `feat/prontuario-correcao-integrada-20261114` e não abrir PR dela para `main` no estado atual. A CI (`validate.yml`) e o build da Vercel falhariam em `test:unit`.
2. Não aplicar `20261114000100` em nenhum Supabase remoto, nem de Preview compartilhado.
3. Suspender o "próximo passo" do Argon: remover as travas e criar `20261114000200`.
4. Tratar os commits `0405e45d` a `4c0c1725` como rascunho não homologado. O aviso correspondente foi registrado no handoff corrente da branch.

### 6.2. Base para retomar (decisão do proprietário)

**Opção A, recomendada.** Criar uma nova branch de execução a partir de `e15cf912` (a `main` `4011a2b8` tem o mesmo conteúdo documental). Trazer só `bf903aea` (fixture), revisado, e opcionalmente o trecho inofensivo do CSS. Reconstruir a T1 do Astra a partir do log da conversa ou pedir ao Astra que a refaça, e só então seguir para a T2. Vantagem: histórico limpo, sem migration perigosa na árvore.

**Opção B.** Manter a branch e reverter `55001ccd`, `9132136d`, `6f9aced5`, `7af651e8` e `82510354`, corrigindo `0405e45d` e `ab5b8e47`. Dá mais trabalho de revisão e mantém no histórico uma migration que não pode ser aplicada.

### 6.3. Requisitos mínimos para a migration da T2/T3 (qualquer agente)

1. `revoke all on function public.preview_operational_change(jsonb), public.apply_operational_change(jsonb, text, uuid) from public, anon;` e `grant execute … to authenticated;`.
2. `set search_path = pg_catalog, public, radar_private` em toda função criada ou recriada.
3. Dentro da função: exigir `auth.uid()`; obter o perfil com `radar_private.current_app_role()` e permitir apenas os perfis operacionais da matriz de permissões; validar `radar_private.can_write_school(school_id)`. Isso preserva a ADR-056, porque perfis operacionais colaboram em todas as escolas, mas exclui leitores e anônimos.
4. Lista fechada de ações por lote. Ação desconhecida ou ainda não implementada gera erro, nunca `committed: true`.
5. Bloquear alvo e dependentes com `FOR UPDATE` em ordem determinística. O digest deve incluir `row_version` e os valores propostos, e o conflito deve ser revalidado no `apply`.
6. Gravar no ledger o hash da requisição. A mesma `operation_key` com requisição diferente gera conflito.
7. Ajustar também `protect_inventoried_invoice_delete`. O GUC local à transação é aceitável **se** for ligado somente depois da autorização, dentro da função `SECURITY DEFINER`. Manter o formato `ASSET_ALREADY_INVENTORIED: assets/<id>`, porque é contrato do pgTAP vigente.
8. Usar as colunas reais (`competence_origin` etc.). `correct_analysis` altera `verifications` e recompõe a Pendência, e `clear_analysis` ≠ `clear_item_history`. Pendência ambígua exige alvo explícito, e o bem só sai se for exclusivo.
9. Criar `supabase/tests/database/operational-correction.test.sql` antes da implementação, cobrindo anônimo, leitor, colega (ADR-056), digest obsoleto, filho criado entre `preview` e `apply`, falha no meio da transação e a reutilização da chave.

### 6.4. Requisitos para fechar a T1

Reconstruir no `app.js` o cabeçalho horizontal e as quatro colunas, atualizando no mesmo lote `getProgramGroups` e seus consumidores (reconciler condicional, preservação de scroll e ordem de programas). Escrever os dois testes nomeados sobre o **app real**, com dados sintéticos, persistência e reload. Aplicar os tokens no contêiner real e conferir o contraste nos dois temas. Capturar antes e depois em 1280, 1440 e 1920 px. Comparar com as pranchas aprovadas, que devem ser versionadas em `docs/evidence/prontuario-correcao-integrada/`. Manter `test:unit`, `check`, `lint:css` e `lint:e2e` verdes.

### 6.5. Instrução pronta para o próximo agente

> Leia `AGENTS.md`, `docs/CURRENT_STAGE.md`, o plano `docs/superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md`, o contrato `docs/reference/PRONTUARIO_CORRECAO_CONTRATO.md` e a auditoria Manus `docs/audits/2026-11-14-manus-auditoria-frente-integrada/RELATORIO.md`, na branch `audit/manus-auditoria-frente-integrada-20261114`. Os commits `0405e45d`..`4c0c1725` são rascunho não homologado: não reutilize a migration `20261114000100`, o serviço JS nem a ponte de UI sem corrigir os achados F-01 a F-22. Não remova travas de `invoice-history-lock.js` ou `evaluation-retification.js` antes de existir a operação completa da T3. Antes de qualquer código, reconstitua a T1 do Astra (cabeçalho horizontal em `app.js`) e faça os testes do plano passarem no app real. Rode `npm run test:unit` completo antes de cada commit e não declare "passou" sem colar a saída. Nunca escreva no Supabase `scnryinorqeucbfkioxo`.

---

## 7. Limitações desta auditoria

- **Comparação visual com as pranchas aprovadas:** pendente. As imagens não estão no repositório e foram pedidas ao proprietário.
- **Site real:** não foi navegado. O código auditado não está em nenhum ambiente publicado, então o site mostraria apenas a linha de base anterior.
- **Banco descartável:** usa stubs mínimos de `auth`, `realtime` e `pg_jsonschema`. Por isso, só as **diferenças** entre `main` e branch foram atribuídas à migration.
- **Saídas do Astra:** as saídas de ferramenta da conversa compartilhada aparecem como "redacted". Os resultados de teste da T1 local do Astra não puderam ser confirmados.
- **Jornada autenticada:** não houve jornada em Supabase de Preview real, porque nenhum foi criado nem usado, conforme as restrições.

---

## Apêndice A · Sondas comportamentais (PostgreSQL 17 descartável)

| Sonda | Pergunta | Resultado |
|---|---|---|
| P1 | Quem pode executar as RPCs? | `anon` e `authenticated` podem; as funções são `SECURITY DEFINER` |
| P2 | Um anônimo consegue excluir? | Sim: NF, Pendência, tentativa e contato apagados; vizinha preservada; `actor_id` nulo |
| P3 | Exclui NF com bem Inventariada? | Não: `ASSET_ALREADY_INVENTORIED` |
| P4 | `clear_analysis` por `documentKey` | Erro `42703 competence_id` |
| P5 | `delete_context` | Erro `42703 competence_id` |
| P6 | Ação inexistente ou não implementada | `committed: true`, nada alterado |
| P7 | Mesma `operation_key`, outro alvo | Devolve o recibo antigo e não executa |
| P8 | `correct_analysis` para Correto | Pendência apagada, análise segue Incorreto |
| P9 | O digest muda após alterar valor e inventariar? | Não; digest idêntico |

## Apêndice B · Comparação pgTAP (42 arquivos)

| Arquivo | `main` | Branch |
|---|---|---|
| `inventory-terminal-state.test.sql` | 7 ok | 5 ok, 2 falhas (#2 e #5) |
| `inventory-terminal-delete.test.sql` | 18 ok | 17 ok, 1 falha (#6) |
| Total | 650 ok | 647 ok |

## Apêndice C · Execuções JavaScript (Node 24)

| Comando | `main` | Branch |
|---|---|---|
| `node --test tests/unit/operational-correction-service.test.js` | — | 2 aprovados, 2 falhas |
| `node --test tests/unit/prontuario-program-order.test.js` | 5 aprovados | 0 aprovados, 5 falhas |
| `npm run test:unit` (completo) | — | 1396 testes, 1389 aprovados, 7 falhas |
| Playwright `prontuario-correction-layout.spec.js` | — | 2 falhas |
| `check`, `check:architecture`, `lint:css`, `lint:e2e`, `check:functional-matrix` | — | Aprovados, mas `check` não cobre os arquivos novos |
