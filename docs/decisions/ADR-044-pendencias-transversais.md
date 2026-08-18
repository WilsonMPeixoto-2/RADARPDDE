# ADR-044 — Pendências Operacionais são transversais entre competências

**Data:** 18 de agosto de 2026  
**Status:** Aprovada e implementada

## Contexto

A competência mensal é contexto global do RADAR e deve permanecer visível e persistente entre as superfícies. Esse comportamento é correto para Dashboard, Carteira, Competências, Prontuário, timeline e exportações.

Em Pendências Operacionais, porém, aplicar automaticamente a competência global como filtro produz um efeito contrário ao objetivo da página: pendências de meses anteriores desaparecem da visão quando o usuário está na competência corrente.

Uma pendência representa passivo ainda não resolvido e deve permanecer encontrável até sua conclusão.

## Decisão

Pendências Operacionais constitui exceção deliberada ao filtro automático da competência global.

A competência global:

- continua visível;
- continua persistente como contexto de navegação;
- não limita automaticamente a lista de Pendências.

A página abre com o filtro local em **Todas as competências**.

O usuário pode aplicar um filtro local de competência quando quiser restringir a investigação, sem alterar a regra padrão transversal.

## Ordenação

- `Aberta`: mais antiga primeiro;
- `Aguardando reanálise`: maior tempo de espera primeiro;
- `Resolvida`: resolução mais recente primeiro;
- `Cancelada`: cancelamento mais recente primeiro.

## Navegação

A pendência deve ser clicável para abrir detalhes/histórico.

Abrir o detalhe não altera a competência global.

Ao navegar da pendência para o Prontuário, o RADAR assume a competência de origem daquela pendência, pois o Prontuário volta a exigir o recorte mensal.

## Consequências

- o usuário não precisa navegar mês a mês à procura de passivos antigos;
- zero pendências na competência corrente não é confundido com zero pendências no sistema;
- a competência global continua coerente nas demais telas;
- qualquer módulo futuro que volte a sincronizar automaticamente o filtro local de Pendências com a competência global viola esta ADR.

## Relação com decisões anteriores

Esta ADR **especializa e substitui parcialmente a ADR-025** apenas quanto à página de Pendências Operacionais.

A competência continua global como contexto; apenas deixa de ser filtro automático nessa superfície.
