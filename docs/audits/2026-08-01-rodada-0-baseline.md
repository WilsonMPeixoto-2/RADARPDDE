# Rodada 0 — baseline de preparação obrigatória

**Data:** 1º de agosto de 2026  
**Branch de execução:** `prep/rodada-0-20260801`  
**Base da branch:** `main` em `32a2f860cba7d45ecd3c09d232007a1f4b79adbd`

## Objetivo

Preparar o RADAR PDDE para as rodadas combinadas de atualização técnica e modernização do produto, eliminando falhas artificiais de CI e registrando uma linha de base verificável. Esta rodada não atualiza pacotes, não altera funcionalidades e não modifica Supabase ou Vercel Production.

## Linha de base técnica

### Runtime e dependências declaradas

- Node.js: `24.x`;
- ExcelJS: `4.4.0`;
- Supabase JS: `2.110.8`;
- Supabase CLI: `2.109.1`;
- Playwright: `1.61.1`;
- ESLint: `10.7.0`;
- Acorn: `8.17.0`;
- TypeScript: `7.0.2`;
- esbuild: `0.28.1`;
- Lighthouse: `13.4.1`;
- Prettier: `3.9.6`;
- Knip: `6.29.0`.

As versões permanecem fixadas e o `package-lock.json` continua canônico. Nenhuma versão foi modificada nesta rodada.

### Controles existentes preservados

- `npm ci` reproduzível;
- lint de segurança e E2E;
- testes de domínio, unidade, integração, banco e E2E;
- auditoria funcional de persistência;
- `npm audit` e política específica do ExcelJS;
- assinaturas e proveniência npm;
- SBOM CycloneDX;
- inventário Knip;
- Playwright desktop e mobile;
- Lighthouse;
- readiness, migrations, RLS, backup e restauração Supabase;
- certificação integral e homologação automatizada do Excel SME.

## Defeito de preparação identificado

O workflow `.github/workflows/excel-sme-homologation.yml` referenciava `tests/unit/excel-sme-original-contract.test.js`, arquivo inexistente na `main`. Uma alteração futura em `package.json`, `package-lock.json` ou no Excel SME poderia acionar um job inevitavelmente quebrado, mesmo com a funcionalidade correta.

O mesmo workflow ainda declarava como pendente a abertura manual no Microsoft Excel desktop. Esse gate foi concluído em 1º de agosto de 2026, sem reparo ou aviso de conteúdo inválido, e o Excel SME foi publicado em Production.

## Correção aplicada

- removida a referência ao teste inexistente;
- preservados os sete testes reais do Excel SME e a certificação integral;
- resumo do workflow atualizado para classificá-lo como proteção regressiva;
- homologação humana registrada como concluída, sem reabrir o gate de release já cumprido.

## Controle preventivo novo

Foi criado `scripts/check-workflow-references.mjs`, sem dependência externa. O verificador percorre `.github/workflows/*.yml` e `.yaml` e valida referências locais verificáveis usadas por:

- `node` e `node --test`;
- `npm run`;
- `playwright test` e `--config`;
- `cache-dependency-path`;
- `working-directory`;
- Actions locais com `uses: ./...`.

Globs são aceitos quando correspondem a pelo menos um caminho. Expressões dinâmicas, heredocs e artefatos gerados em runtime são deliberadamente ignorados para evitar falsos positivos.

O controle foi integrado a:

- `.github/workflows/validate.yml`;
- `.github/workflows/dependency-health.yml`.

Os testes unitários cobrem referências válidas, teste inexistente, script npm inexistente, referências dinâmicas e caminhos YAML inexistentes.

## Limites deliberados

O verificador não pretende substituir parser YAML, `actionlint` ou análise de segurança de workflows. Ele resolve o risco concreto desta rodada: referências locais estáticas que deixam de existir. Validações sintáticas e de segurança mais amplas permanecem candidatas às rodadas posteriores.

## PRs Dependabot revisados

Em 1º de agosto de 2026, os quatro PRs abaixo permaneciam abertos e tecnicamente mescláveis, porém foram criados sobre bases anteriores à `main` atual:

| PR | Atualização | Base original | Decisão da Rodada 0 |
|---|---|---|---|
| `#52` | `actions/checkout` 7.0.0 → 7.0.1 | `baeea252` | não mesclar agora; recriar ou atualizar na rodada técnica de baixo risco |
| `#79` | Playwright 1.61.1 → 1.62.0 | `baeea252` | manter isolado para rodada com navegadores e E2E completos |
| `#81` | ESLint 10.7.0 → 10.8.0 | base anterior à preparação | recriar ou atualizar na rodada técnica de baixo risco |
| `#83` | Acorn 8.17.0 → 8.18.0 | `7becad35` | recriar ou atualizar na rodada técnica de baixo risco |

A classificação “mesclável” do GitHub não substitui rebase, nova execução dos gates nem avaliação do escopo atual. Nenhum desses PRs integra a Rodada 0.

## Fora do escopo

- atualização de qualquer pacote npm ou GitHub Action;
- instalação de biblioteca de produto;
- alteração de HTML, CSS, JavaScript funcional ou regras de negócio;
- mudança de dados, migrations, RLS, Auth, Edge Functions ou Storage;
- deploy ou promoção em Vercel;
- alteração de Supabase Production;
- fechamento automático dos PRs Dependabot.

## Critério de encerramento

A Rodada 0 pode ser encerrada quando:

1. o verificador aprovar as referências locais da árvore real;
2. os testes unitários novos passarem;
3. o workflow do Excel SME gerar e validar o candidato sem o caminho inexistente;
4. os workflows gerais aplicáveis passarem;
5. o diff confirmar ausência de alteração funcional e de produção.

## Referências

- plano: `docs/superpowers/plans/2026-08-01-rodada-0-preparacao-obrigatoria.md`;
- arquitetura do Excel SME: `docs/architecture/excel-sme-mensal.md`;
- evidência de publicação: `docs/evidence/releases/2026-08-01-excel-sme-production.json`;
- decisões: `docs/DECISION_LOG.md`.
