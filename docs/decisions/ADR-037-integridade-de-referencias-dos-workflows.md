# ADR-037 — integridade de referências locais dos workflows

**Estado:** aceito  
**Data:** 1º de agosto de 2026

## Contexto

O workflow de homologação do Excel SME permaneceu com uma chamada para `tests/unit/excel-sme-original-contract.test.js`, arquivo que não existia na árvore ativa. A falha não afetava o produto publicado, mas tornaria futuras alterações do Excel ou de dependências artificialmente vermelhas.

A validação atual cobria sintaxe JavaScript, testes, dependências e políticas de segurança, mas não verificava se caminhos locais escritos dentro dos comandos dos workflows continuavam existindo.

## Decisão

1. manter um verificador próprio e sem dependências externas em `scripts/check-workflow-references.mjs`;
2. validar referências estáticas verificáveis em todos os arquivos `.github/workflows/*.yml` e `.yaml`;
3. cobrir chamadas por `node`, `node --test`, `npm run`, Playwright, `cache-dependency-path`, `working-directory` e Actions locais;
4. aceitar glob somente quando ele corresponder a pelo menos um caminho da árvore;
5. ignorar expressões dinâmicas, heredocs e artefatos produzidos durante a execução;
6. executar o gate na validação principal e na saúde das dependências;
7. manter testes unitários próprios para evitar falso positivo e regressão;
8. não tratar esse verificador como substituto de parser YAML, `actionlint` ou análise de segurança de Actions.

## Consequências positivas

- caminhos removidos ou renomeados passam a falhar antes de consumir etapas longas do CI;
- PRs de dependências deixam de ser bloqueados por referências obsoletas não relacionadas;
- workflows e árvore ativa passam a ter um contrato verificável;
- a solução não adiciona pacote npm nem altera o lockfile;
- a mensagem de falha identifica workflow, tipo e caminho inválido.

## Custos e limites

- comandos shell arbitrários não são interpretados integralmente;
- referências geradas em runtime não são verificadas;
- validação sintática YAML e riscos de segurança exigem ferramentas próprias em rodadas posteriores;
- novas formas de invocação local podem exigir extensão explícita do parser conservador.

## Aplicação inicial

- removida a referência inexistente no workflow do Excel SME;
- homologação desktop do Excel SME registrada como concluída em 1º de agosto de 2026;
- gate integrado a `.github/workflows/validate.yml` e `.github/workflows/dependency-health.yml`;
- baseline registrado em `docs/audits/2026-08-01-rodada-0-baseline.md`.
