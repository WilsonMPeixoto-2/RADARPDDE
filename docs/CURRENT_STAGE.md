# RADAR PDDE — estado atual e retomada

**Classe documental:** Canônico — estado mutável  
**Atualizado em:** 26 de setembro de 2026

## 1. Baseline confirmada

- `main`: `bb7246438b8c6b72ef068b21bb40d492a7049af2` — merge do PR #374.
- Production: mesmo SHA `bb7246438b8c6b72ef068b21bb40d492a7049af2`.
- Deployment Production: `dpl_BztNyEgnHjFxAKJvkPcQGeV6GGWm`, `READY`.
- Nenhum commit da frente #375/#376 foi integrado em `main` ou Production.
- A frente não altera schema, migrations, RPCs, RLS, serviços de domínio nem persistência canônica.

## 2. Estratégia corrente — #376 é o candidato único

### PR #376

- título: **Concluir contexto escolar e jornada desktop de Despesa a identificar**;
- branch: `fix/desktop-expense-journey-2026-09-25`;
- base atual: `main`;
- head validado: `8d44b1d18f96b1dddb96f1d92af2cd816587e759`;
- runtime funcional/UI: idêntico ao commit `4994aeb331f643c09ab4b76f66e5c831be9cd5d2`;
- aberto, draft e mergeable;
- comparação contra `main`: ahead 74 / behind 0 no checkpoint de 26/09;
- contém integralmente os commits do antigo #375 e as melhorias desktop do #376.

O retarget para `main` foi feito sem rebase/force-push, preservando o histórico Git. A integração em duas etapas deixou de ser a estratégia vigente.

### PR #375

- branch: `fix/pendency-context-mobile-preview-2026-09-25`;
- head: `d591b231eb06e95a1c09ba2fb6e40d2c7bb83f7d`;
- seu conteúdo está integralmente contido no #376;
- **substituído pelo #376 como candidato de integração**;
- não deve ser mergeado separadamente.

### PR #377

PR técnico de sincronização entre as branches antigas. Está fechado/merged e permanece somente como histórico da incorporação dos dois commits finais do #375 ao #376.

## 3. Diagnóstico do “vermelho do #375”

A comparação anterior entre uma execução verde e uma vermelha do mesmo head do #375 era enganosa.

O run vermelho `36261864567` / job `108465025843` não executou o #375 isolado. O checkout foi do merge temporário do PR técnico #377:

`refs/remotes/pull/377/merge`  
SHA `b79f4d93f6fea3a336dfd0389878ce914f2c3ba6`

Esse estado combinava:

- runtime novo do #376, que foca `.reanalysis-guidance`;
- teste antigo ainda exigindo foco em `#reanalisar-resultado`.

O run verde `36252023185` executou o merge-ref real do #375:

`refs/remotes/pull/375/merge`  
SHA `97d3431131c730fadc002208d0852c1b315487d5`

e passou **182 testes**.

Conclusão: não há evidência de corrida de foco ou regressão determinística no #375 isolado. O vermelho era produto de um merge-ref diferente associado ao mesmo head SHA pela interface do GitHub.

## 4. Contratos funcionais confirmados no candidato

- filtro escolar de Pendências usa o estado real da Task 9 e não substitui a coleção transversal;
- limpar o filtro atualiza a rota global antes de limpar o estado;
- abrir Prontuário usa `/escolas/<id>`;
- voltar às Pendências restaura rota, escola, busca, aba, seleção e contexto quando aplicável;
- `a_identificar` continua nascendo `Incorreto + Pendência` atomicamente;
- identificação preserva o mesmo ID da despesa, a mesma Pendência e o histórico;
- identificação abre pelo topo/contexto;
- reanálise abre pelo topo e foca `.reanalysis-guidance`;
- documento → tentativa → contexto → decisão permanecem zonas distintas;
- ação longa da identificação permanece contida na tabela desktop;
- feedback não fica oculto pelo drawer;
- nenhum contrato de domínio/persistência foi alterado para satisfazer testes.

## 5. Gates do head candidato

Head `8d44b1d18f96b1dddb96f1d92af2cd816587e759`:

- Testes E2E Playwright — **success**;
- Validar RADAR PDDE — **success**;
- snapshot canônico — **success**;
- Retificação auditável direcionada — **success**;
- Lighthouse CI — **success**;
- Supabase readiness — **success**;
- contratos-fonte Excel SME — **success**.

O head está ahead de `main` e behind 0. O PR permanece mergeable.

## 6. Preview desktop final

Branch efêmera:

`preview/desktop-final-2026-09-26`

A branch parte do mesmo candidato de produto e possui somente alterações temporárias em `vercel.json` para permitir o Preview.

Primeiro commit de Preview:
`795a8cac4767b2794836722ee35ac44545ea6773`

Deployment:
`dpl_4wFGj3QbqQRwuFdKXCNhCJL9qjaJ` — **ERROR**

Causa: o build ainda executava os testes unitários que, corretamente, exigem a política Vercel “somente main”. A exceção de Preview conflitava deliberadamente com esses guardrails.

Correção efêmera:
`9aa59f5a0fea47bbb03036dfa6eda0ee001eac15` — `chore(preview): separar build efêmero dos gates da política main-only`

Deployment válido:
`dpl_EcLDqaAPe7aWo5dwNyR6G3TuwQSy` — **READY**

URL:
`https://radarpdde-4ja1codbg-wilson-m-peixotos-projects.vercel.app`

A branch de Preview está ahead 2 do candidato e behind 0; o único arquivo diferente é `vercel.json`.

**Nunca mergear a branch `preview/*` nem transportar seu `vercel.json` temporário para o produto.**

## 7. Lacuna real restante

A homologação visual/navegada do Preview desktop final foi iniciada, mas não concluída antes da interrupção da sessão Work.

Ainda precisa ser comprovado no Preview atual, em desktop:

1. filtro escolar → detalhe → alternância de abas → limpar filtro → fila global;
2. URL `/pendencias` após limpar;
3. abrir Prontuário → URL `/escolas/<id>` → reload;
4. voltar às Pendências preservando o contexto;
5. ação longa de `a_identificar` contida;
6. modal de identificação abrindo pelo topo;
7. feedback visível com drawer aberto;
8. reanálise abrindo pelo topo com orientação/contexto;
9. hierarquia documento → tentativa → contexto → decisão;
10. ausência de overflow, cortes e sobreposições materiais.

Não transformar ausência dessa inspeção em aprovação presumida.

## 8. Integração e Production

A configuração vigente da Vercel publica pushes em `main` automaticamente.

Portanto, nesta frente:

**merge do #376 em `main` = decisão de integração + publicação em Production.**

Não fazer merge enquanto a homologação visual final não estiver concluída e não houver autorização explícita para publicar.

Não existe mais etapa de “merge #375 primeiro”.

## 9. Próxima ação exata

1. homologar visualmente o deployment `dpl_EcLDqaAPe7aWo5dwNyR6G3TuwQSy`;
2. registrar screenshots/evidências do mesmo runtime;
3. se não houver defeito, atualizar o checkpoint final do #376;
4. deixar #376 pronto para a decisão explícita de merge/publicação;
5. Production somente após essa autorização.

## 10. Rota de retomada

1. `AGENTS.md`
2. `docs/reference/SYSTEM_CANONICAL_MODEL.md`
3. `docs/reference/PRODUCT_SURFACE_CATALOG.md`
4. este arquivo
5. `docs/handoff/2026-09-25-desktop-expense-journey.md`
6. `docs/reference/FRONTEND_USER_VALIDATION_GATE.md`
7. `docs/reference/TEST_GOVERNANCE.md`
8. `docs/reference/STATUS_DOCUMENTOS.md`
