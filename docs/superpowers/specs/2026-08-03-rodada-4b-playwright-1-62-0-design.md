# Rodada 4B — Playwright 1.62.0

**Data:** 3 de agosto de 2026  
**Estado:** aprovado para execução  
**Base:** `main` após a Rodada 4A

## Objetivo

Atualizar `@playwright/test`, `playwright` e `playwright-core` de `1.61.1` para `1.62.0`, regenerar o lockfile pelo npm e comprovar compatibilidade com a matriz E2E vigente do RADAR PDDE.

## Motivação

O Playwright 1.62.0 é a próxima atualização técnica aprovada no roadmap canônico. A versão eleva o requisito mínimo para Node.js 20, compatível com o Node.js 24 fixado pelo projeto, e atualiza os navegadores empacotados. Os novos recursos da versão não serão forçados artificialmente nesta rodada; o valor imediato é manter o motor de testes e os navegadores de CI atualizados e validar regressões reais.

## Escopo

- `package.json`: `@playwright/test` `1.61.1 → 1.62.0`;
- `package-lock.json`: regeneração pelo npm, sem edição manual da árvore transitiva;
- instalação dos navegadores Chromium e WebKit correspondentes à versão;
- execução dos testes unitários, integração, readiness, E2E, mobile, perfis/viewports, Lighthouse, Excel SME, Supabase local e backup/restauração;
- atualização do roadmap, estágio corrente e auditoria da rodada;
- encerramento documental do antigo PR Dependabot `#79`, já fechado sem merge.

## Fora do escopo

- component testing;
- adoção imediata de `AbortSignal`, WebP ou novos hooks de reporter;
- ampliação da matriz para Firefox;
- alterações no frontend, regras de negócio, banco, migrations, Auth, RLS ou Edge Functions;
- Vercel Production ou Supabase Production.

## Estratégia de lockfile

O lockfile será regenerado pelo npm em Node.js 24 dentro do GitHub Actions. Um workflow temporário e restrito à branch da Rodada 4B poderá gerar e publicar o lockfile; ele será removido antes do PR final. A mudança esperada inclui a atualização dos três pacotes Playwright e a reorganização do `fsevents` opcional.

## Critérios de aceite

1. `npm ci` conclui com Node.js 24;
2. `npx playwright --version` retorna `1.62.0`;
3. Chromium e WebKit são instalados pela versão atualizada;
4. todos os gates obrigatórios do projeto passam no SHA final;
5. `npm audit` não introduz vulnerabilidade alta ou crítica;
6. o diff funcional permanece restrito às dependências, documentação e eventuais ajustes comprovadamente necessários aos testes;
7. nenhum deployment ou alteração remota de Production ocorre.

## Rollback

Reverter `package.json` e `package-lock.json` ao estado anterior. Como não há alteração de dados ou Production, o rollback é exclusivamente de código e dependências.