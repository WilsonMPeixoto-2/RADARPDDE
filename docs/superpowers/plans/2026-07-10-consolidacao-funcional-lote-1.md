# Consolidação Funcional do RADAR PDDE - Lote 1

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir as regras que hoje tornam os indicadores SME enganosos e interrompem o fluxo operacional de nota fiscal, consolidação e pendência.

**Architecture:** Regras determinísticas ficam em módulos UMD testáveis em Node e carregados antes de `app.js`. A interface continua em JavaScript simples, mas passa a consumir essas regras e deixa de criar estado durante renderização.

**Tech Stack:** JavaScript ES2020, Node test runner, Playwright, HTML/CSS estáticos.

## Global Constraints

- Cada escola deve aparecer uma única vez nos indicadores escolares; vínculos escola-programa permanecem apenas no detalhamento.
- A situação geral de um programa só pode ser `apta` quando a bonificação estiver consolidada como apta e todas as análises técnicas estiverem concluídas sem erro.
- Uma Nota Fiscal marcada como correta exige ao menos uma nota cadastrada, mas o cadastro da primeira nota deve estar disponível antes da análise correta.
- Marcar Nota Fiscal como `Não se aplica` não pode excluir notas ou bens implicitamente.
- Alteração retroativa de campo consolidado deve reabrir a consolidação e excluí-la dos relatórios até nova consolidação explícita.
- Pendência automática deve preservar escola, competência, programa e documento, inclusive para IDs como `ED_FAMILIA`.
- Abrir o prontuário não pode criar verificações vazias nem alterar alertas ou indicadores.

---

### Task 1: Indicadores SME por escola

**Files:**
- Modify: `src/domain/estatisticas.js`
- Modify: `tests/estatisticas.test.js`
- Modify: `index.html`
- Modify: `app.js`
- Create: `tests/e2e/functional-core.spec.js`

**Interfaces:**
- Consumes: `getSchoolAggregateStatus(escola, competencia)`.
- Produces: `RadarEstatisticas.calculateSchoolStats(records, { getStatus })` aceitando `nao-lancado` e `out-of-scope`.

- [ ] Adicionar primeiro testes Node que normalizem `nao-lancado` para `naoAnalisada` e `out-of-scope` para `foraEscopo`.
- [ ] Executar `node --test tests/estatisticas.test.js` e confirmar falha nas novas asserções.
- [ ] Adicionar teste Playwright que abra o perfil SME no conjunto inicial e espere 163 escolas não analisadas, não 430 vínculos.
- [ ] Executar o teste Playwright focado e confirmar que ele falha mostrando 430.
- [ ] Carregar `competencia.js` e `estatisticas.js` antes de `app.js`, criar adaptador escolar no `app.js` e usar esse adaptador no painel SME e por CRE.
- [ ] Manter o detalhamento SME em granularidade escola-programa.
- [ ] Executar os testes focados até passarem.

### Task 2: Fluxo de Nota Fiscal e consolidação

**Files:**
- Create: `src/domain/fluxo-operacional.js`
- Create: `tests/fluxo-operacional.test.js`
- Modify: `index.html`
- Modify: `app.js`
- Modify: `tests/e2e/functional-core.spec.js`

**Interfaces:**
- Produces: `createEmptyVerification()`, `evaluateBonification(bonificacao)`, `getProgramOperationalStatus(verificacao)`, `canRegisterFiscalNote(profile, bonificacaoNotaFiscal)` e `shouldRequireFiscalNote(input)` em `window.RadarFluxoOperacional`.

- [ ] Criar primeiro testes Node para: seis campos obrigatoriamente respondidos; resultado apta/inapta; programa apto apenas com consolidação apta e seis análises corretas; permissão de cadastrar NF após entrega `Sim`; bloqueio de análise correta sem nota.
- [ ] Executar `node --test tests/fluxo-operacional.test.js` e confirmar falha porque o módulo ainda não existe.
- [ ] Implementar o módulo UMD mínimo e carregá-lo antes de `app.js`.
- [ ] Fazer `getProgramVerificationStatus()` delegar à regra pura.
- [ ] Renderizar verificação vazia sem gravá-la; criar estado apenas no primeiro comando do usuário.
- [ ] Exibir “Adicionar Nota” depois de Nota Fiscal = `Sim`; ao tentar marcar correta sem nota, manter a análise anterior e abrir o cadastro; com nota existente, aceitar sem abrir outro modal.
- [ ] Declarar os bloqueios antes dos ramos de Nota Fiscal e Consulta Assessoria para eliminar o erro temporal de `isBonifLocked`.
- [ ] Recusar `Não se aplica` enquanto houver notas, orientando exclusão explícita.
- [ ] Reabrir `resultadoBonif` quando o assistente alterar uma bonificação consolidada e registrar a ação.
- [ ] Consolidar apenas quando os seis campos possuírem respostas válidas.
- [ ] Executar testes Node e Playwright focados até passarem.

### Task 3: Vínculo e resolução de pendências

**Files:**
- Modify: `src/domain/fluxo-operacional.js`
- Modify: `tests/fluxo-operacional.test.js`
- Modify: `index.html`
- Modify: `app.js`
- Modify: `tests/e2e/functional-core.spec.js`

**Interfaces:**
- Consumes: `RadarCompetencia.splitCompetenciaContext(compProgKey)`.
- Produces: `buildPendencyContext(input)` e `pendencyMatchesContext(pendency, context)`.

- [ ] Criar primeiro testes Node que preservem `ED_FAMILIA`, distingam o mesmo documento em dois programas e mantenham compatibilidade com pendências textuais antigas.
- [ ] Confirmar falha dos testes antes da implementação.
- [ ] Adicionar campos ocultos de programa e documento ao modal e salvar `programaId`/`documentoKey` junto do rótulo completo.
- [ ] Usar a mesma correspondência contextual no prontuário para pendências abertas e resolvidas.
- [ ] Ao resolver uma pendência contextual, redefinir somente a análise correspondente para `Não analisado`, deixando o dashboard em andamento até reanálise.
- [ ] Substituir `split('_')` pelos separadores canônicos nos fluxos tocados e na serialização de verificações.
- [ ] Validar em Playwright que a pendência nasce na linha correta, é resolvida e não mantém o programa como inapto por um `Incorreto` obsoleto.

### Verification

- [ ] `npm run check`
- [ ] `node --test tests/*.test.js`
- [ ] `npx playwright test tests/e2e/functional-core.spec.js --project=desktop-chromium`
- [ ] `npm run test:mobile`
- [ ] Revisão de diff e verificação de que `app.js`, módulos e scripts carregam sem `pageerror`.
