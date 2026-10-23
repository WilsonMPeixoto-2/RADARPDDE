# Axe 4.14: nome acessível do controle de filtros em Pendências

**Classe:** correção pontual de acessibilidade baseada em prova real; código/experiência preservados.
**Base:** main `7141489e084691722a1bef814bea0c9c1c5f8023` (RADAR PDDE 2026, 22/10/2026).

## Reproduzido no navegador

A [execução 39887802231](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39887802231)
rodou Axe 4.14.0 + Playwright 1.64.1 em Chromium desktop, fixture local.
Comparou WCAG 2.1 e WCAG 2.2 nas telas Dashboard, Prontuário e Pendências.

- Dashboard e Prontuário: **0 violações** em ambos os conjuntos de tags.
- Pendências: **1 violação séria** de `label-content-name-mismatch` em
  `summary`, tanto no conjunto antigo quanto no novo.
- Acrescentar `wcag22aa` aumentou a contagem de regras examinadas de
  65 para 66 nas duas primeiras superfícies e de 67 para 68 em Pendências,
  sem acrescentar nova violação. **Não equivale a certificar WCAG 2.2.**
- Itens Axe `incomplete` permanecem para investigação manual
  (por exemplo, contrastes); não foram tratados como violações confirmadas.

## Causa e correção

`src/integration/pendency-passive-queue-ux.js` cria
`<summary>Mais filtros</summary>` e em seguida lhe atribuía
`aria-label="Exibir filtros adicionais de pendências"`. Esse nome alternativo
não contém o texto visual `Mais filtros`. A correção remove apenas o
`aria-label`, permitindo que o navegador utilize a semântica nativa de
`<summary>` e o próprio texto visível como nome acessível. Nenhum texto da
interface, CSS, permissão, filtro ou regra de negócio muda.

## Contraprova exigida

O teste introduzido em `tests/e2e/accessibility-scans.spec.js` verifica:
1. o rótulo visível e o nome acessível coincidem exatamente;
2. Axe com a regra específica `label-content-name-mismatch` não sinaliza
   o bloco de filtros;
3. o controle abre por `Enter` e preserva o foco.

Esse teste reprovaria a versão antiga no passo do nome acessível. A execução
GREEN da alteração será comprovada nos checks vinculados ao HEAD do PR,
sem transportar automaticamente o PASS anterior. Não se pretende corrigir
incompletos de contraste com mudanças de cor nesta entrega.

**Não executa** alterações no Supabase, PostgreSQL, migrations, permissões,
autenticação ou dados institucionais.
