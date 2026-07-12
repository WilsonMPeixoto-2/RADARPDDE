# Modelo operacional compartilhado

Este documento registra a projeção derivada usada por Dashboard, Carteira, Pendências, alertas e integrações do Prontuário.

## Princípio

A projeção operacional não cria uma nova fonte de verdade. Ela deriva informações das escolas, verificações, pendências, contatos, programas e controladores já persistidos.

## Dimensões preservadas

- resultado da bonificação;
- situação da análise técnica;
- situação da pendência documental;
- próxima ação e responsável;
- última movimentação;
- antiguidade operacional.

Essas dimensões não se alteram automaticamente umas às outras.

## Estados ativos

`Aberta` e `Aguardando reanálise` são estados ativos. O primeiro aguarda providência da escola; o segundo aguarda conferência do Controlador.

## Data-base da antiguidade

- Aberta: abertura ou último evento que devolveu a ação à escola;
- Aguardando reanálise: registro do envio corretivo mais recente ainda aguardando análise;
- Resolvida: resolução;
- Cancelada: cancelamento.

## Próxima ação

A interface deve apresentar uma ação concreta e contextual, como `Registrar novo envio do Extrato Conta Corrente` ou `Reanalisar Extrato Investimento`, sempre acompanhada dos identificadores necessários para abrir o destino exato.
