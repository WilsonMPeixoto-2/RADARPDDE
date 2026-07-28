# Dependency and Quality Tooling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover a dependência residual do ExcelJS, alinhar versões e instalar ferramentas efetivas de análise de dependências, segurança do DOM, qualidade Playwright e desempenho Lighthouse.

**Architecture:** As alterações permanecem restritas ao toolchain, aos contratos de CI e ao import versionado da Edge Function. O renderer XLSX interno não é modificado. Knip bloqueia dependências residuais ou não resolvidas; o ESLint impede o crescimento da dívida de HTML inseguro; o plugin Playwright bloqueia erros de teste de alta confiança; e o Lighthouse mede categorias, métricas, oportunidades e acessibilidade, com pisos conservadores contra regressões graves.

**Tech Stack:** Node.js 24, npm lockfile v3, ESLint flat config, Knip, Lighthouse 13, Playwright, Supabase Edge Functions e GitHub Actions.

## Global Constraints

- Preservar integralmente os dois relatórios XLSX existentes e o CSV.
- Não adicionar dependência de produção para geração de planilhas.
- Manter `@supabase/supabase-js` da Edge Function alinhado à versão fixada no projeto.
- Não ocultar vulnerabilidades altas ou críticas do gate `dependency-health`.
- Não aceitar crescimento do número atual de usos potencialmente inseguros de HTML.
- Executar Lighthouse em mobile e desktop e bloquear somente regressões abaixo dos pisos homologados.
- Validar no Node.js 24 usado pelo CI do repositório.

---

### Task 1: Contrato do toolchain

**Files:**
- Create: `tests/unit/tooling-contract.test.js`
- Modify: `package.json`
- Modify: `package-lock.json`

- [x] Remover `exceljs` e confirmar que nenhum módulo do projeto o importa.
- [x] Atualizar Prettier para `3.9.6`.
- [x] Adicionar `knip@6.29.0`, `eslint-plugin-no-unsanitized@4.1.5`, `eslint-plugin-playwright@2.10.5` e `lighthouse@13.4.1` como dependências de desenvolvimento.
- [x] Regenerar o lockfile no Node.js 24.
- [x] Aplicar override transitivo seguro para `brace-expansion@5.0.8`.
- [x] Validar `npm ci` e `npm audit` sem vulnerabilidades conhecidas.

### Task 2: ESLint de segurança e Playwright

**Files:**
- Create: `eslint.config.js`
- Modify: `package.json`

- [x] Criar configuração flat compatível com scripts clássicos, módulos ES e CommonJS.
- [x] Ativar regras estruturais de alta confiança do ESLint.
- [x] Ativar `nounsanitized/method` e `nounsanitized/property` como avisos.
- [x] Fixar `--max-warnings 42` para impedir aumento da dívida atual de HTML inseguro.
- [x] Aplicar as regras recomendadas do Playwright como avisos e manter violações críticas como erros.
- [x] Integrar `lint:security` e `lint:e2e` ao readiness.

### Task 3: Auditoria de dependências com Knip

**Files:**
- Create: `knip.config.cjs`
- Modify: `.github/workflows/dependency-health.yml`
- Modify: `package.json`

- [x] Configurar as entradas explícitas da arquitetura híbrida do RADAR.
- [x] Fornecer uma URL local somente durante a análise estática, preservando o fail-fast da homologação remota.
- [x] Evitar a execução indevida de configurações Playwright dependentes de ambiente real.
- [x] Tratar os protocolos `jsr:` e `npm:` da Edge Function sem ocultar pacotes reais.
- [x] Limitar a análise a dependências, dependências não declaradas e imports não resolvidos.
- [x] Tornar o Knip bloqueante e rejeitar também mensagens de erro interno mesmo quando o processo retornar código zero.

### Task 4: Auditoria Lighthouse acionável

**Files:**
- Create: `lighthouserc.cjs`
- Create: `scripts/run-lighthouse-baseline.mjs`
- Create: `.github/workflows/lighthouse-ci.yml`
- Modify: `package.json`

- [x] Auditar a aplicação local em modo local, sem credenciais institucionais.
- [x] Medir performance, acessibilidade e boas práticas em desktop e mobile.
- [x] Registrar FCP, LCP, Speed Index, TBT, CLS e TTI.
- [x] Registrar oportunidades prioritárias e achados automáticos de acessibilidade.
- [x] Publicar relatórios JSON, HTML e Markdown como artefatos e resumo do workflow.
- [x] Bloquear regressões abaixo de pisos conservadores por perfil.
- [x] Usar o pacote oficial `lighthouse`, sem o CLI legado vulnerável do LHCI.

### Task 5: Alinhamento da Edge Function

**Files:**
- Modify: `supabase/functions/team-account-management/index.ts`
- Test: `tests/unit/team-account-edge-contract.test.js`
- Test: `tests/unit/tooling-contract.test.js`

- [x] Alterar o import fixado de `2.110.7` para `2.110.8`.
- [x] Tornar o teste dependente da versão canônica do `package.json`.
- [x] Executar os testes do domínio de gestão de equipe e o contrato da Edge Function.

### Task 6: Verificação e integração

**Files:**
- Review: todos os arquivos alterados

- [x] Executar `npm ci` no Node.js 24.
- [x] Executar `npm audit` com zero vulnerabilidades.
- [ ] Executar `npm run test:readiness` após a configuração dinâmica final do Knip.
- [ ] Executar a suíte Playwright completa após a configuração dinâmica final do Knip.
- [ ] Confirmar relatório Knip limpo, sem achados nem erros internos mascarados.
- [ ] Executar Lighthouse com pisos bloqueantes e resumo acionável.
- [ ] Revisar o diff, integrar somente com todos os gates verdes e implantar a Edge Function atualizada.
