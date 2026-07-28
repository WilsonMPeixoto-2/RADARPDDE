# Dependency and Quality Tooling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover a dependência residual do ExcelJS, alinhar versões e instalar ferramentas graduais de análise de dependências, segurança do DOM, qualidade Playwright e desempenho Lighthouse.

**Architecture:** As alterações permanecem restritas ao toolchain, aos contratos de CI e ao import versionado da Edge Function. O renderer XLSX interno não será modificado. Knip e Lighthouse começam como auditorias informativas; ESLint bloqueia apenas violações estruturais e Playwright de alta confiança, mantendo achados de HTML não sanitizado como avisos para saneamento progressivo.

**Tech Stack:** Node.js 24, npm lockfile v3, ESLint flat config, Knip, Lighthouse CI, Playwright, Supabase Edge Functions e GitHub Actions.

## Global Constraints

- Preservar integralmente os dois relatórios XLSX existentes e o CSV.
- Não adicionar dependência de produção para geração de planilhas.
- Manter `@supabase/supabase-js` da Edge Function alinhado à versão fixada no projeto.
- Não tornar Knip ou Lighthouse bloqueadores nesta primeira adoção.
- Não ocultar vulnerabilidades altas ou críticas do gate `dependency-health`.
- Validar no Node.js 24 usado pelo CI do repositório.

---

### Task 1: Contrato do toolchain

**Files:**
- Create: `tests/unit/tooling-contract.test.js`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] Remover `exceljs` e confirmar que nenhum módulo do projeto o importa.
- [ ] Atualizar Prettier para `3.9.6`.
- [ ] Adicionar `knip@6.29.0`, `eslint-plugin-no-unsanitized@4.1.5`, `eslint-plugin-playwright@2.10.5` e `@lhci/cli@0.15.1` como dependências de desenvolvimento.
- [ ] Regenerar o lockfile no Node.js 24.
- [ ] Validar `npm ci` e `npm audit` sem vulnerabilidades altas ou críticas.

### Task 2: ESLint de segurança e Playwright

**Files:**
- Create: `eslint.config.js`
- Modify: `package.json`

- [ ] Criar configuração flat compatível com scripts clássicos e CommonJS.
- [ ] Ativar regras estruturais de alta confiança do ESLint.
- [ ] Ativar `nounsanitized/method` e `nounsanitized/property` como avisos.
- [ ] Aplicar as regras recomendadas do Playwright como avisos e manter violações críticas como erros.
- [ ] Integrar `lint:security` e `lint:e2e` ao readiness.

### Task 3: Auditoria de dependências com Knip

**Files:**
- Create: `knip.json`
- Modify: `.github/workflows/dependency-health.yml`
- Modify: `package.json`

- [ ] Configurar as entradas explícitas da arquitetura híbrida do RADAR.
- [ ] Limitar a primeira análise a dependências, dependências não declaradas e imports não resolvidos.
- [ ] Gerar evidência do Knip no workflow de saúde das dependências sem bloquear o CI.

### Task 4: Baseline Lighthouse CI

**Files:**
- Create: `lighthouserc.cjs`
- Create: `.github/workflows/lighthouse-ci.yml`
- Modify: `package.json`

- [ ] Auditar a aplicação local em modo local, sem credenciais institucionais.
- [ ] Medir performance, acessibilidade e boas práticas em desktop e mobile.
- [ ] Publicar relatórios como artefatos.
- [ ] Manter os limiares inicialmente como avisos, sem bloquear PRs.

### Task 5: Alinhamento da Edge Function

**Files:**
- Modify: `supabase/functions/team-account-management/index.ts`
- Test: `tests/unit/tooling-contract.test.js`

- [ ] Alterar o import fixado de `2.110.7` para `2.110.8`.
- [ ] Executar os testes do domínio de gestão de equipe e o contrato da Edge Function.

### Task 6: Verificação e integração

**Files:**
- Review: todos os arquivos alterados

- [ ] Executar `npm ci` no Node.js 24.
- [ ] Executar `npm run test:readiness`.
- [ ] Executar a suíte Playwright completa.
- [ ] Executar o workflow de saúde das dependências.
- [ ] Executar Lighthouse CI e publicar o baseline.
- [ ] Revisar o diff, abrir PR e integrar somente com os gates obrigatórios verdes.
- [ ] Publicar a aplicação de forma controlada e confirmar produção.
