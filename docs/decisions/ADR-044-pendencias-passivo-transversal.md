# ADR-044 — Pendências Operacionais usa visão transversal entre competências

**Status:** Aprovada e implementada

**Data:** 17 de agosto de 2026

## Decisão

A competência mensal continua sendo o contexto global único do RADAR PDDE e permanece visível durante a navegação.

A tela **Pendências Operacionais** é a exceção funcional ao uso da competência como filtro automático de dados. Nessa tela, a competência global não limita a fila exibida.

Por padrão, Pendências Operacionais apresenta o passivo de **todas as competências**. O filtro local de competência continua disponível para consultas específicas e inicia em **Todas as competências**.

## Organização da fila

- **Abertas:** mais antigas primeiro;
- **Aguardando reanálise:** maior tempo de espera primeiro;
- **Resolvidas:** resolução mais recente primeiro;
- **Canceladas:** cancelamento mais recente primeiro.

A prioridade é impedir que pendências antigas desapareçam da operação apenas porque o usuário está trabalhando em uma competência mais recente.

## Navegação

Cada registro da fila deve permitir acesso direto aos seus detalhes e histórico.

Abrir apenas o detalhe da pendência não altera a competência global. Ao seguir da pendência para o **Prontuário**, a competência de origem da pendência passa a ser o contexto global, porque o Prontuário continua obedecendo ao recorte mensal.

## Relação com a ADR-025

Esta decisão **refina a ADR-025**, sem revogar o contexto global único. A competência continua transversalmente persistida entre as telas, mas Pendências Operacionais não a utiliza como filtro implícito da fila.
