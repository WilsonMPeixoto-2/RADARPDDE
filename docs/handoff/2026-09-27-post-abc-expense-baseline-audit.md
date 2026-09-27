# Handoff corrente — baseline pós-A+B+C da jornada Despesa a identificar / Pendências

**Estado:** corrente  
**Data:** 27 de setembro de 2026  
**Objetivo desta etapa:** observar e certificar o comportamento atual antes de qualquer nova correção  
**Escopo prioritário:** desktop  
**Fase D:** adiada deliberadamente; não iniciar nesta execução

## 1. Contexto macro

A frente principal do RADAR vinha trabalhando, ao longo de muitos PRs e agentes, na jornada:

```text
Despesa a identificar
→ Pendência individual
→ correção de dados provisórios
→ primeiro documento / identificação da despesa
→ novo envio
→ Aguardando reanálise
→ reanálise
→ resolução ou retorno à escola
→ novo envio posterior quando necessário
```

A mesma frente também inclui a navegação Prontuário ↔ Pendências, geração de comunicação, registro de contato, encontrabilidade das ações, feedback de gravação, preservação de contexto e comunicação visual.

Essa evolução acumulou acertos, defeitos reais, regressões e também falsos defeitos causados por testes, timing, fixture, provenance de SHA/merge-ref e validação visual inadequada. Portanto, **não assumir que o próximo item de um handoff histórico é a próxima tarefa correta**.

Enquanto essa frente estava em andamento, o projeto fez uma pausa deliberada para modernização técnica em quatro fases planejadas. A+B+C foram concluídas; D foi adiada para retomarmos a frente funcional principal com ferramentas melhores.

## 2. O que A+B+C mudaram

### A — tooling e supply chain

Encerrada pelo PR #378.

Principais ganhos relevantes para esta retomada:

- versões e dependências mais controladas;
- Supabase JS alinhado;
- Actions pinadas por SHA;
- Dependency Review;
- `devEngines`;
- ambiente mais reproduzível.

### B — qualidade, Playwright e regressão visual

Também encerrada pelo PR #378.

Ganhos relevantes:

- Stylelint errors-only;
- baselines visuais críticas versionadas;
- traces Playwright enriquecidos com DOM/ARIA/screen/sources;
- locks seletivos para estado compartilhado;
- governança explícita de testes;
- snapshots não podem ser atualizados só para obter verde.

Baselines visuais atuais incluem Dashboard, Pendências, Prontuário, modal de Despesa a identificar, drawer/feedback de Despesa a identificar e modal de reanálise.

### C — redução de risco técnico

- C1 / PR #384: ExcelJS 4.4.0 preservado e `uuid@11.1.1` homologado.
- C2 / PR #385: Supabase CLI 2.118.0 reprovada por falhas reais de pgTAP/RLS; 2.114.0 preservada.
- C3 / PR #386: servidor Node canônico `scripts/serve-radar.mjs`, remoção de `http-server`, reconciliação de dependências e correção de dois achados CodeQL.

O head homologado da C3 foi `bbe78d66d6aec0261ddf2f068d2ff5b1ac8f2c67`; o merge funcional que encerrou A+B+C foi `e6b692a97dd5148877c788da11e0c8ae4c8fcd19`.

A C3 terminou com 17/17 workflows aplicáveis verdes e, na suíte E2E completa, 237 casos descobertos, 183 aprovados e 54 skips condicionais.

A/B/C **não alteraram as regras de negócio dessa jornada**. O benefício desta pausa é tornar a investigação e a validação atuais mais confiáveis.

## 3. Estado de repositório

No momento em que este handoff foi preparado, a `main` anterior a esta atualização documental era:

`05848f7a03953bca89d278eb7bafa823d7b53f40`

Esse SHA **não deve ser tratado como constante**. O commit/merge deste próprio handoff pode avançar a `main` e disparar deployment Vercel sem mudança funcional.

Antes da execução:

1. consultar o head real de `main`;
2. confirmar working tree limpa;
3. registrar o SHA que será auditado;
4. não misturar evidência de outro SHA/runtime.

## 4. Leitura mínima obrigatória antes de executar

Ler nesta ordem, sem reconstruir todo o histórico do repositório:

1. `AGENTS.md`;
2. `docs/reference/SYSTEM_CANONICAL_MODEL.md`;
3. `docs/reference/PRODUCT_SURFACE_CATALOG.md`;
4. `docs/CURRENT_STAGE.md`;
5. **este handoff**;
6. `docs/reference/ENGINEERING_METHOD.md`;
7. `docs/reference/FRONTEND_USER_VALIDATION_GATE.md`;
8. `docs/reference/TEST_GOVERNANCE.md`;
9. `docs/architecture/frontend-load-order.md`;
10. `docs/architecture/product-extensions-load-order.md`.

Documentação histórica útil, apenas para entender erros/decisões anteriores:

- `docs/handoff/2026-09-25-desktop-expense-journey.md`;
- `docs/evidence/2026-09-26-final-preview/README.md`;
- `docs/evidence/2026-09-26-postfix-preview/README.md`;
- `docs/evidence/2026-09-26-desktop-final-preview/README.md`;
- `docs/evidence/2026-09-27-phase-c3-codeql.md`;
- `docs/handoff/2026-09-26-tooling-modernization-a-b.md`.

Esses documentos históricos **não formam uma fila de implementação**.

## 5. Erros metodológicos históricos que NÃO podem ser repetidos

Já ocorreram, entre outros:

- teste/validação executando merge-ref ou candidato diferente do atribuído;
- screenshot de Preview anterior sendo considerado evidência de commit posterior;
- medição geométrica feita antes da estabilização de CSS/classe visual;
- expectativa de teste superada sendo interpretada como regressão de produto;
- correção funcional proposta para falha que era fixture/timing/infra;
- branches visuais construídas sobre baseline funcional obsoleta;
- tentativa de satisfazer teste vermelho alterando produto antes de classificar a falha;
- validação de função/serviço interno usada como se provasse experiência real do usuário.

Regra desta retomada:

> **classificar antes de corrigir.**

Categorias mínimas:

- defeito de domínio/persistência;
- autorização;
- sincronização/convergência;
- navegação/contexto;
- comunicação/UX;
- visual/layout;
- defeito de teste/harness/fixture/timing;
- infraestrutura/ambiente;
- dívida arquitetural sem impacto de usuário demonstrado.

## 6. Estado funcional já protegido

Não reabrir estas regras sem evidência concreta contrária no SHA atual:

- nova `a_identificar` nasce atomicamente `Incorreto + Pendência`;
- retificação provisória preserva identidade e histórico;
- identificação posterior ocorre pelo fluxo de novo envio;
- mesma invoice e mesma Pendência são preservadas;
- novo envio não resolve automaticamente;
- após identificação, documento vai para `Não analisado` e Pendência para `Aguardando reanálise`;
- reanálise correta resolve;
- reanálise incorreta devolve a mesma Pendência para `Aberta`;
- serviço cria sua dimensão própria de Consulta Assessoria;
- permanente cria efeito patrimonial correspondente;
- `boleto_internet` só existe em Educação Conectada;
- bonificação, análise técnica e Pendência são dimensões independentes.

## 7. Testes existentes que devem ser reutilizados

### Autoridade principal de experiência para esta primeira rodada

`tests/e2e/unidentified-expense-user-journey.spec.js`

Especialmente:

- `conduz um usuário do débito sem documento até a reanálise sem atalhos internos`;
- `permite retificar os dados provisórios pelo drawer sem identificar a despesa`;
- `separa preparar comunicação de registrar contato efetivamente realizado`.

Esse arquivo usa os controles visíveis para executar a jornada e deve orientar a observação de UX. Não transformá-lo em autoridade absoluta de regra se divergir do contrato atual.

### Autoridade principal de UI + Supabase real + reload

`tests/e2e/supabase-operational-uat.spec.js`

Cenário prioritário nesta primeira execução:

- `a identificar: abertura atômica, retificação sem perder vínculos, identificação e resolução sobrevivem ao reload`.

Ele já cobre pela UI uma jornada `a_identificar → retificação → identificação como consumo → reanálise → reload` com consultas ao Supabase real local.

Também existe:

- `a identificar → consumo: identifica, resolve a Pendência documental e não cria efeitos indevidos`.

### Apoio, não autoridade principal da experiência

- `tests/e2e/unidentified-expense-identification-matrix.spec.js` — matriz consumo/serviço/permanente/boleto; possui atalhos internos úteis para invariantes;
- `tests/e2e/supabase-invoice-lifecycle-reliability.spec.js` — persistência/RPC/reload; usa bastante serviço interno;
- `tests/e2e/pendency-cycle.spec.js` — regressão ampla; não iniciar por ela;
- `tests/e2e/supabase-pendency-operations-uat.spec.js` — contato/cancelamento/reabertura pela UI com Supabase real e reload;
- `tests/e2e/pendency-reanalysis-auth.spec.js` — autorização real da reanálise;
- `tests/e2e/global-visual-polish.spec.js` e `tests/e2e/unidentified-expense-visual.spec.js` — regressão visual complementar.

A matriz funcional de 09/09 pode estar atrasada em relação a testes posteriores. Um campo `partial` nela é hipótese de cobertura, não tarefa automática.

## 8. Achado conhecido que não deve virar correção automática nesta rodada

O handler `confirmarReanalisePendencia` ainda contém a mensagem:

`Reanálise permitida somente ao perfil Controlador.`

A autorização vigente, porém, permite Controlador, Assistente de Verbas Federais e `technical_admin`, e isso é protegido por domínio, policy, SQL e teste autenticado.

Classificação preliminar: **dívida de comunicação/texto legado**, não defeito de autorização.

Registrar se for observado; não corrigir durante a baseline.

## 9. PRIMEIRA TAREFA — baseline observacional

Executar **somente** uma baseline controlada da jornada principal. Não implementar melhorias nesta etapa.

### Cenário

Perfil operacional autorizado, desktop.

```text
Prontuário
→ Registrar despesa a identificar
→ confirmar criação da Pendência
→ observar drawer e próximo passo
→ retificar dados provisórios
→ registrar o primeiro documento
→ identificar como Material de Consumo
→ confirmar Aguardando reanálise
→ abrir reanálise pela interface
→ marcar documento correto
→ confirmar resolução
→ recarregar
→ reencontrar o mesmo estado final
```

Material de Consumo é proposital nesta primeira rodada porque elimina efeitos adicionais de Assessoria, patrimônio e Educação Conectada.

## 10. Preparação do ambiente

Reutilizar o fluxo oficial de `.github/workflows/functional-reliability-lifecycle.yml` em vez de inventar setup novo.

Esse workflow documenta a pilha de referência:

1. Node 24;
2. `npm ci`;
3. Chromium Playwright;
4. `npm run supabase:start`;
5. `npm run supabase:reset`;
6. fixture `tests/fixtures/operational-uat.sql`;
7. bootstrap de usuários Auth com senha efêmera;
8. runtime config em `supabase-preview`;
9. variáveis `RADAR_E2E_SUPABASE_LOCAL=1`, `RADAR_E2E_OPERATIONAL_UAT=1` e `RADAR_E2E_CAPTURE=1`;
10. Playwright `desktop-chromium`, `workers=1`.

Antes de copiar comandos, conferir o workflow no SHA auditado. Se ele tiver mudado, seguir o SHA atual.

## 11. Ordem de execução

### 11.1 Sanidade/proveniência

Registrar:

- SHA de `main`;
- branch/working tree;
- Node/npm;
- Playwright;
- Supabase CLI;
- servidor canônico em uso;
- runtime data mode;
- se o ambiente é descartável/local e não Production.

### 11.2 Jornada visual/local já existente

Executar de forma direcionada o cenário principal de:

`tests/e2e/unidentified-expense-user-journey.spec.js`

Objetivo: observar encontrabilidade, textos, foco, modais/drawers, feedback, próximo passo, transições e composição.

Não rodar a suíte completa como primeira ação.

### 11.3 Jornada equivalente com Supabase real descartável

Executar o cenário dirigido de:

`tests/e2e/supabase-operational-uat.spec.js`

priorizando:

`a identificar: abertura atômica, retificação sem perder vínculos, identificação e resolução sobrevivem ao reload`

Objetivo: comprovar UI → persistência → reload no mesmo eixo funcional.

### 11.4 Evidências

Preservar, quando disponíveis:

- trace Playwright;
- screenshots dos marcos;
- console/pageerror;
- erros de rede relevantes;
- resultado de persistência remoto;
- identidade da invoice e Pendência;
- estado antes/depois do reload.

Não criar screenshots redundantes se o teste já produz evidência suficiente.

## 12. Guardrail absoluto desta primeira execução

**NÃO alterar produto, teste, CSS, fixture, timeout, golden, migration, RPC, RLS, workflow ou dependência para fazer a baseline passar.**

Se algo falhar:

1. reproduzir quando necessário;
2. coletar evidência;
3. classificar preliminarmente;
4. parar antes da correção.

Exceção: somente ajuste operacional inevitável para conseguir executar o ambiente, se ele não mudar contrato nem resultado do produto. Documentar explicitamente qualquer ajuste desse tipo e não commitá-lo sem necessidade.

## 13. Como usar `page.evaluate()`

Pode ser usado para:

- observar estado;
- consultar identificadores;
- verificar persistência/coleções;
- coletar geometria de forma atômica quando o estado é efêmero;
- diagnóstico.

Não pode ser usado, nesta baseline, para executar a ação que estamos afirmando que o usuário consegue fazer pela interface.

## 14. Critérios de sucesso da baseline

A rodada é considerada executada quando for possível responder, com evidência:

1. o usuário encontra a ação inicial;
2. a criação é compreensível e abre a Pendência correta;
3. a retificação preserva invoice/Pendência;
4. o primeiro documento identifica a mesma despesa;
5. a UI comunica `Aguardando reanálise`;
6. a reanálise é encontrável e executável;
7. a resolução aparece corretamente;
8. Supabase contém o estado esperado;
9. reload reencontra o estado;
10. não surgiu erro material de console/rede relacionado;
11. o SHA das evidências é o SHA realmente auditado.

## 15. Formato obrigatório do relatório ao final

Não responder apenas “passou” ou “falhou”.

Usar:

```text
SHA auditado:
Ambiente:
Configuração relevante:

JORNADA
Etapa 1:
- ação visível executada:
- resultado observado:
- estado remoto:
- após reload:
- evidência:

...

RESULTADO GLOBAL
PASSOU / NÃO PASSOU / INCONCLUSIVO

ACHADOS
A-01
- fato observado:
- impacto para o usuário:
- camada provável:
- classificação preliminar:
- evidência:
- confiança:
- requer investigação adicional?:

LACUNAS
- o que não foi possível provar e por quê

NENHUMA CORREÇÃO FOI APLICADA
ou, se houve ajuste operacional inevitável:
- descrever exatamente o ajuste e por que não altera produto/contrato
```

## 16. Critério de parada e escalada

Parar e devolver evidência, sem corrigir, se ocorrer:

- UI, Supabase e reload divergirem;
- falha depender de timing/sincronização;
- comportamento variar entre execuções;
- merge-ref/SHA do teste não for o esperado;
- necessidade de mudar fixture/timeout/golden para prosseguir;
- erro indicar possível Realtime, concorrência, `row_version`, RLS ou pós-commit;
- o teste contradizer contrato vigente;
- o ambiente não puder ser comprovado como descartável.

Esses casos serão reavaliados antes de escolher método, modelo e nível de esforço da próxima etapa.

## 17. Fora do escopo desta execução

Não:

- iniciar Fase D;
- testar mobile;
- redesenhar telas;
- corrigir a mensagem antiga de perfil de reanálise;
- executar a matriz completa consumo/serviço/permanente/boleto;
- refatorar wrappers/composição;
- atualizar matriz funcional;
- atualizar goldens;
- fazer merge/deploy de produto;
- fazer escrita em Production;
- transformar achados históricos em tarefas sem reprodução atual.

A primeira rodada existe para produzir uma **baseline factual pós-A+B+C**, não mais um PR.
