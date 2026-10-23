# Pilotos A1 de capacidades: Knip profundo e TypeScript 7 em JavaScript

**Data:** 22/10/2026. **Estado:** pilotos **executados e validados** em GitHub Actions, em branch isolada; o resultado detalhado e os falsos positivos classificados estão em [evidência A1](../../evidence/2026-10-22-ts7-knip-capability-a1/README.md). Nenhum check obrigatório foi alterado.

## Contrato do piloto (preservado como baseline)

1. **Knip 6.42.1**, diagnóstico não bloqueante em `scripts/audit/inspect-knip-deep.mjs`. Executar após `npm ci` com `node scripts/audit/inspect-knip-deep.mjs`. Escreve JSON em `artifacts/tooling/knip-deep-diagnostic.json` (artefato não versionado). O script exige execução bem-sucedida e JSON válido, mas não transforma achados em falhas ou exclusões. Classificar cada possível arquivo/export sem uso antes de alterar código, confrontando `index.html`, bootstrap de módulos IIFE e consumidores dinâmicos. O Knip atual só verifica dependências no comando `analyze:unused`, que permanece intacto.
2. **TypeScript 7.0.2**, diagnóstico inicial de JS com `tsconfig.js-contract-pilot.json`. Executar após `npm ci` com `npx --no-install tsc -p tsconfig.js-contract-pilot.json --noEmit`; escopo **somente** `src/domain/operation-key.js` (chaves de intenção/idempotência). O compilador novo é usado para JS com `allowJs/checkJs/noEmit`, sem converter JavaScript para TypeScript nem produzir novos arquivos. `noImplicitAny: false` é uma tolerância *explícita e apenas do piloto* para código histórico não anotado; os tipos de domínio ainda precisam de JSDoc antes de elevar a proteção. Não confundir zero erros deste piloto com tipagem forte do domínio.

## Critérios de passagem

- Comparar baseline e resultado, com SHA, comando e exit code reproduzíveis; verificar separadamente ao menos uma mutação negativa de campo/tipo JSDoc antes de declarar efetividade do gate TS7.
- Confirmar que `npm run analyze:unused`, `npm run typecheck:database`, bundle do navegador e testes existentes seguem inalterados.
- O relatório Knip é **inventário de candidatos**, nunca uma lista de arquivos autorizados para exclusão.
- Não criar CI integral nem deploy apenas pelo resultado do diagnóstico; elevar cada gate somente com evidência e risco proporcional.
- Se TypeScript 7 apresentar diagnóstico no arquivo histórico, registrar local/linha/causa; **não** adicionar `any`, `@ts-ignore` ou mudar código produtivo apenas para ficar verde.

## Escopo e não objetivos

Esta branch não muda `package.json`, os workflows canônicos de CI, RLS, banco de dados, UX, autenticação, API ou Production. Inclui apenas `.github/workflows/tooling-capability-pilots.yml`, restrito à própria branch experimental, para executar as contraprovas sem disparar as suites oficiais. **Não reabrir o alerta conhecido de senhas vazadas**, recurso indisponível no plano atual; decisão registrada na auditoria canônica. Próximas trilhas: diagnóstico Axe/WCAG 2.2 em estados de tela e eventual redesenho proporcional da CI, preservando required checks.

## Resultado adicional A2

O [run 39887138715](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39887138715) homologou a contraprova da **API real** `persistentId()` com TS2322, mapeou automaticamente **34/34 referências dinâmicas** do inventário Knip e comprovou a detecção de um arquivo artificial realmente sem referência (**35º achado**). [Evidências e interpretação](../../evidence/2026-10-22-ts7-knip-capability-a1/README.md#5-contraprova-independente-a2--contrato-real-e-controle-positivo-de-descoberta). Estes são diagnósticos, não uma aprovação para apagar módulos ou tornar o typecheck de todo o produto obrigatório.
