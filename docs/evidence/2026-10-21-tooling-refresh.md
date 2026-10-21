# Manutenção isolada de tooling — 21/10/2026

**Classe:** evidência datada / continuidade, não nova regra funcional.
**Base revalidada:** `main@d1f1dad60778c1b8f67bb660e8ad06736b9ab219`.

## Limites desta rodada

Atualizações independentes de ferramentas existentes. Não alterar produto, layout,
Auth/RLS, migrations, dados institucionais ou configurações de Production para
homologar dependências. Node 24, Ubuntu 26.04 e Supabase CLI 2.114.0 preservados.
Os PRs #446/#447 e a issue #460 continuam separados. Atualização de ferramenta
não demonstra correção de lentidão, prontidão ou geometria do produto.

## Candidatos já existentes aproveitados

### Playwright — #461

- HEAD inspecionado: `f5fbfd0c83f860352bbb3072ff2b99e8efb9284e`.
- Somente `@playwright/test`, `playwright` e `playwright-core`: 1.64.0 → 1.64.1.
  Axe permanece em 4.13.0; não incorporar o agrupamento do #456.
- Inspeção estrutural confirmou somente package.json e package-lock.json alterados.
- CI consultada: 18 dos 19 workflows sem falha; 36 jobs/checks aprovados e dois
  checks condicionais ignorados. Não contar ignorados como testes executados.
- E2E desktop [39534955769](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39534955769),
  job `119009353845`: 224 aprovados, 68 ignorados, uma falha.
  `unidentified-expense-user-journey.spec.js:218` mediu y=123.7938461303711 contra
  borda inferior do cabeçalho=125.56483459472656 (diferença ≈1,771 px).
  O retry terminou por timeout ao capturar screenshot em outra etapa.
- A mesma asserção e ordem de grandeza constam da issue #460 antes deste patch.
  Isso identifica uma reprodução do caso conhecido, não demonstra que o patch
  causou ou resolveu a condição. Não alterar tolerância/CSS nem repetir o job
  indefinidamente. Homologação pré-production, em run separado
  [39534952105](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39534952105),
  passou; isso não apaga a falha desktop. Manter Draft até decisão com evidência.

### Prettier — #462

- HEAD inspecionado: `b00333d3a3f0ab7622eb1e547047531e52f148c6`.
- Prettier 3.9.9 → 3.9.10 e uma expectativa literal correspondente em
  `tests/unit/tooling-contract.test.js`. Não executar formatação global.
- CI consultada: 19 workflows sem falha, 37 jobs/checks aprovados e dois checks
  condicionais ignorados; nenhum job pendente. Desktop
  [39535123225](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39535123225),
  pré-production [39535123334](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39535123334)
  e uso real [39535123212](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39535123212)
  aprovados. Não inferir ganho de CPU/performance do produto desses resultados.
- O #442 contém a mesma atualização sem a expectativa reconciliada; não integrar
  os dois como mudanças diferentes. Encerrar a duplicação quando um for integrado.

## GitHub Actions — #444

A branch Dependabot foi reconciliada com a main atual, preservando os três
commits documentais posteriores à base original. As versões e SHAs foram
conferidos nas referências oficiais do GitHub, inclusive tags anotadas:

| Action | Versão | SHA |
|---|---|---|
| actions/setup-node | 7.1.0 | `949feb2413d6458794dcd2491c4babbbce0c15c1` |
| actions/upload-artifact | 7.0.2 | `cf430e030ddbb5b0abf93d22962f4752f3646cd9` |
| actions/download-artifact | 8.0.2 | `9000827ccba6bdab643e8b6fd33ac0654aef8333` |
| github/codeql-action | 4.39.0 | `6f2ac81f5cd81fe351a197ba0b00d91d03cd2aee` |

Comparação das 37 definições de workflow com a main, normalizando somente os
cinco SHAs antigos e comentários de versão: nenhuma mudança adicional de
execução. Inputs, permissões, condições, secrets, paths, retenção, runner e
escopo do override GHCR permanecem iguais. Checkout não foi atualizado.

### RED / GREEN local

Ambiente: Node 24.19.0, npm 11.9.0. Para esta branch sem mudança de pacotes,
reutilizada instalação cujo lockfile coincide com o da main; a instalação limpa
`npm ci` e a execução das Actions novas continuam sendo provas dos runners.

1. Antes de corrigir os contratos, executar:
   `node --test tests/unit/production-data-integrity-workflow.test.js tests/unit/production-system-workflow.test.js`.
   Resultado: **10 aprovados / 2 reprovados**, exclusivamente por exigirem o SHA
   anterior de setup-node. Não houve falha funcional nesses dois testes.
2. Atualizar somente os dois literais para o SHA de setup-node 7.1.0 conferido.
   Mesma execução: **12 aprovados / 0 reprovados / 0 ignorados**. Preservadas todas
   as asserções de SHA imutável, permissões, credenciais, comandos e recuperação.
3. Suíte unitária completa, relatório JUnit: **1.368 aprovados / 0 reprovados /
   0 ignorados**, exit 0. Não adicionar esses números aos 12 como testes distintos.
4. `node scripts/check-workflow-references.mjs`: 39 workflows, 351 referências
   locais, todas válidas. `git diff --check`: exit 0.

### Critérios ainda dependentes da CI do novo HEAD

- Confirmar setup-node e CodeQL com as novas versões em runner real.
- Confirmar publicação/download dos artifacts e comparador de uso real. Os
  workflows continuam produzindo nomes separados por variante e run; não mudar
  `pattern`, diretórios ou `merge-multiple` para compensar incompatibilidade.
- Inspecionar toda falha nova antes de classificar; comparar com #460 quando
  houver falha de geometria/prontidão. Não enfraquecer gates nem declarar toda a
  CI aprovada a partir dos unitários locais.
- Não executar jobs administrativos manuais de Production para testar Actions.

## Fronteiras preservadas para próximas atualizações

- CLI Supabase: aguardar reconciliação de grants/bootstrap/pgTAP, conforme
  `docs/audits/2026-10-18-supabase-cli-rls-parity.md`; não mexer em RLS para upgrade.
- SDK Supabase #457: pacote e Edge Function precisam acompanhar a mesma versão,
  com bundle reproduzível. O PR atual de somente package/lock está incompleto.
- Axe #456: novos achados de nome acessível devem ser classificados separadamente
  do patch Playwright. Não desabilitar regras para obter verde.
- MSW #443: mudança principal em branch antiga; reconciliar antes de reutilizar CI.
- PostgreSQL hospedado, chaves de API, tokens e Preview isolado são manutenções
  separadas. Este documento não autoriza migração remota ou criação de recursos.

Nenhum merge, deploy ou mudança de Production foi realizado neste checkpoint.
Resultados de CI posteriores devem ser vinculados ao SHA efetivamente testado
na descrição do PR; o presente arquivo preserva a prova local e os limites.
