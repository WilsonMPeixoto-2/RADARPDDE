# ADR-047 — Vulnerabilidades conhecidas são acompanhadas sem atualização forçada

**Data:** 23 de agosto de 2026  
**Status:** Aprovada

## Contexto

O baseline atual possui duas vulnerabilidades moderadas conhecidas na cadeia transitiva ExcelJS/UUID. O `npm audit` oferece correção apenas mediante mudança forçada que altera a versão do ExcelJS de forma potencialmente incompatível com o contrato institucional de exportação já homologado.

## Decisão

O risco atual é conscientemente aceito e permanece em acompanhamento.

Nesta frente não será executado:

- `npm audit fix --force`;
- downgrade/upgrade rompente do ExcelJS apenas para zerar o relatório;
- substituição oportunista de biblioteca;
- alteração em massa de dependências sem necessidade funcional ou de segurança material.

O gate continua bloqueando vulnerabilidades de severidade `high` ou superior.

## Reavaliação

A decisão deve ser reavaliada quando ocorrer pelo menos uma destas condições:

1. existir atualização compatível que corrija a cadeia vulnerável;
2. a severidade ou exposição do problema aumentar;
3. o caminho vulnerável passar a ser materialmente explorável no RADAR;
4. houver mudança do contrato Excel que permita atualização segura;
5. requisito institucional de segurança determinar tratamento diferente.

## Consequência

Aceitar temporariamente o risco não significa ignorá-lo. Significa evitar trocar uma vulnerabilidade moderada transitiva por uma quebra deliberada de uma funcionalidade institucional já certificada, mantendo o tema explícito e monitorado.
