# ADR-044 — Pendências Operacionais usa visão transversal entre competências

**Status:** Aprovada, implementada e publicada em Production

**Data da decisão:** 17 de agosto de 2026  
**Conciliação final:** 18 de agosto de 2026

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

Qualquer módulo futuro que volte a sincronizar automaticamente o filtro local de Pendências com a competência global viola esta ADR.

## Implementação e publicação

A regra foi integrada pelo PR #185 e publicada no ambiente oficial. O hardening final do PR #188 removeu o acoplamento residual que ainda podia reintroduzir a competência global como filtro durante a inicialização.

No snapshot de encerramento de 18/08/2026, a regra transversal está homologada e faz parte do baseline funcional `dc77e29d9b364092361623ce185c8d1a55dde983`.
