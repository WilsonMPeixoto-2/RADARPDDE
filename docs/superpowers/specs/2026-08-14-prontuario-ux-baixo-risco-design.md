# Prontuário — pacote UX de baixo risco

**Data:** 14 de agosto de 2026  
**Estado:** em implementação  
**Baseline:** `9e584f199e21d3749be01e4fe92a3bea6ce0bbea`

## Objetivo

Refinar a apresentação do acompanhamento mensal sem alterar regras de negócio, persistência, permissões, schema, RLS, RPCs, Excel ou cálculo da avaliação mensal.

## Escopo

### Consulta à Assessoria por NF

Cada NF de serviço já possui uma caixa detalhada na linha **Consulta Assessoria**, além de estado individual de envio e análise técnica. O refinamento deve:

- mover o checkbox existente `Enviada à Assessoria` para dentro da caixa detalhada da respectiva NF;
- manter a caixa da NF na própria linha **Consulta Assessoria**;
- preservar o mesmo checkbox, `aria-label`, estado `checked`, handler e persistência;
- preservar um seletor de análise técnica por NF e o resumo mensal agregado;
- nunca criar estado duplicado nem permitir que uma NF controle outra.

### Separação visual entre programas

- marcar visualmente o início de cada programa;
- aumentar a hierarquia de competência e nome do programa;
- usar borda, espaçamento e fundo sutil da paleta existente;
- não dividir a avaliação em tabelas independentes nem duplicar cabeçalhos.

## Arquitetura

O repositório já possui uma cadeia oficial de extensões pós-`app.js`. Para reduzir o risco, o núcleo monolítico não é alterado.

A solução usa:

- `src/integration/prontuario-operational-ux.js` para envolver o `renderProntuario` final e reorganizar somente o DOM já renderizado;
- `src/styles/prontuario-operational-ux.css` para os estilos isolados;
- `src/integration/product-extensions-bootstrap.js` para carregar a extensão por último;
- `tests/e2e/prontuario-ux-baixo-risco.spec.js` para o contrato funcional.

O checkbox é movido como o mesmo nó DOM para sua caixa detalhada. Não é clonado nem recriado. A análise individual e o resumo mensal permanecem na mesma linha.

A separação de programas usa a estrutura já existente: cada grupo começa na linha que contém a célula `rowspan` de competência/programa e recebe apenas classes de apresentação.

## Preservações obrigatórias

Não alterar `RadarFluxoOperacional.evaluateMonthlyEvaluation()`, `InvoiceService`, `VerificationService`, bonificação, consolidação, Supabase, migrations, Auth, RLS, RPCs, tipos de banco ou exportações.

## Validação

- cada checkbox deve estar dentro da caixa detalhada da sua NF;
- os dois controles de NFs distintas permanecem independentes;
- os selects individuais de análise permanecem funcionais;
- o resumo mensal continua agregado automaticamente;
- múltiplos programas recebem marcadores visuais distintos;
- gates amplos devem ser comparados com a baseline para não atribuir ao pacote falhas preexistentes.

## Critério de conclusão

Concluir somente após testes focados verdes, revisão do diff, merge na `main` e confirmação do novo SHA em Production.