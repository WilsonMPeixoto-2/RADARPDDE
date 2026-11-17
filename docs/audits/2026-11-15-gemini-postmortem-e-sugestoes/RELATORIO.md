# Relatório de Incorporação e Análise de Dependências (2026-11-16)

## 1. Incorporação Integral de `fix/prontuario-integrado-validado-20261115`
- **Branch isolada:** `audit/gemini-revisao-critica-e-sugestoes-20261115` (recriada a partir de `fix/prontuario-integrado-validado-20261115`, 95 commits à frente e 1 atrás de `main`).
- **Verificação pós-`a8e4704`:** Foram identificados 10 novos commits em 2026-11-16 após `a8e4704` (`docs(stage): novo estado T2-T3 após correções da auditoria Antigravity`), culminando no HEAD `20409c1` (`docs(trace): vincular relatório independente de retomada T0–T6`).

## 2. Análise de Dependências (`package.json`)
- **Runtime / Engines:** `node` `24.x` (`devEngines`: `node ^24.0.0`, `npm ^11.0.0`).
- **Dependência de Produção (`dependencies`):** `exceljs` `4.4.0` (com `overrides.exceljs.uuid: 11.1.1`).
- **Overrides de Segurança/Resolução:** `brace-expansion@^1.0.0 -> 1.1.21`, `brace-expansion@^2.0.0 -> 2.1.7`, `brace-expansion@^5.0.0 -> 5.0.12`, `fast-uri -> 3.1.9`.
- **AllowScripts:** `esbuild@0.28.2: true`.
- **DevDependencies & PRs do Dependabot:** Todos os PRs abertos do Dependabot (`#521` `puppeteer-core 25.16.0->25.17.0`, `#520` `msw 3.0.4->3.0.5`, `#519` `knip 6.44.1->6.45.1`, `#518` `prettier 3.9.10->3.10.1`, `#511` `supabase 2.122.0->3.1.0`, `#502` `lighthouse 13.5.0->13.6.0`) apresentam falhas de checks (`Validar RADAR PDDE`, `Supabase readiness`, `Homologação integral pré-production` e `Compatibilidade controlada Ubuntu 24.04 x 26.04`). Recomenda-se não mesclá-los antes de estabilizar o CI em `main`.
