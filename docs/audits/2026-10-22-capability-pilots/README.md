# Pilotos A1 de capacidades: Knip profundo e TypeScript 7 em JavaScript

**Data:** 22/10/2026. **Estado:** configuração experimental isolada em branch, não ligada aos checks obrigatórios; nenhum resultado de execução ainda homologado.

## Contrato do piloto

1. **Knip 6.42.1**, diagnóstico não bloqueante em `scripts/audit/inspect-knip-deep.mjs`. Executar após `npm ci` com `node scripts/audit/inspect-knip-deep.mjs`. Escreve JSON em `artifacts/tooling/knip-deep-diagnostic.json` (artefato não versionado). O script exige execução bem-sucedida e JSON válido, mas não transforma achados em falhas ou exclusões. Classificar cada possível arquivo/export sem uso antes de alterar código, confrontando `index.html`, bootstrap de módulos IIFE e consumidores dinâmicos. O Knip atual só verifica dependências no comando `analyze:unused`, que permanece intacto.
2. **TypeScript 7.0.2**, diagnóstico inicial de JS com `tsconfig.js-contract-pilot.json`. Executar após `npm ci` com `npx --no-install tsc -p tsconfig.js-contract-pilot.json --noEmit`; escopo **somente** `src/domain/operation-key.js` (chaves de intenção/idempotência). O compilador novo é usado para JS com `allowJs/checkJs/noEmit`, sem converter JavaScript para TypeScript nem produzir novos arquivos. `noImplicitAny: false` é uma tolerância *explícita e apenas do piloto* para código histórico não anotado; os tipos de domínio ainda precisam de JSDoc antes de elevar a proteção. Não confundir zero erros deste piloto com tipagem forte do domínio.

## Critérios de passagem

- Comparar baseline e resultado, com SHA, comando e exit code reproduzíveis; verificar separadamente ao menos uma mutação negativa de campo/tipo JSDoc antes de declarar efetividade do gate TS7.
- Confirmar que `npm run analyze:unused`, `npm run typecheck:database`, bundle do navegador e testes existentes seguem inalterados.
- O relatório Knip é **inventário de candidatos**, nunca uma lista de arquivos autorizados para exclusão.
- Não criar CI integral nem deploy apenas pelo resultado do diagnóstico; elevar cada gate somente com evidência e risco proporcional.
- Se TypeScript 7 apresentar diagnóstico no arquivo histórico, registrar local/linha/causa; **não** adicionar `any`, `@ts-ignore` ou mudar código produtivo apenas para ficar verde.

## Escopo e não objetivos

Esta branch não muda `package.json`, nenhum workflow, RLS, banco de dados, UX, autenticação, API ou Production. **Não reabrir o alerta conhecido de senhas vazadas**, recurso indisponível no plano atual; decisão registrada na auditoria canônica. Próximas trilhas: diagnóstico Axe/WCAG 2.2 em estados de tela e eventual redesenho proporcional da CI, preservando required checks.
