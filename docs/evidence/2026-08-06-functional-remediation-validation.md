# Evidências da remediação funcional — 6 de agosto de 2026

## Escopo

Este registro acompanha o PR #162 e consolida as provas executadas para as falhas confirmadas na auditoria integral do RADAR PDDE.

| Identificador | Correção implementada | Prova adicionada |
|---|---|---|
| SCH-01 | cadastro exige identidade institucional informada; geradores artificiais removidos; duplicidades bloqueadas no serviço e no banco | `school-service.test.js`, `school-form-integrity.test.js`, `school-institutional-identity-migration.test.js` |
| CFG-02 | criação de exercício exige `row_version`, bloqueia versão obsoleta e valida janeiro a dezembro | `configuration-service.test.js`, `functional-integrity-remediation.test.sql` |
| INV-01 | desvinculação da nota elimina o bem derivado na mesma transação, inclusive sob perfil Controlador e RLS | `functional-integrity-remediation.test.sql` e prova transacional em Production com `ROLLBACK` |
| ASSET-02 | edição rápida limitada à nota fiscal, com versão esperada e log atômico | `inventory-service.test.js` |
| PEND-02 | status das tentativas é sincronizado e o histórico existente é reconciliado sem exclusões | `functional-integrity-remediation.test.sql` |
| EXP-01/02 | auditoria inicial obrigatória antes do download; conclusão registrada sem duplicação do log legado | `excel-export-audit.test.js` |

## Provas SQL executadas contra o schema publicado

Todas as provas abaixo foram executadas dentro de `BEGIN ... ROLLBACK`; nenhum dado sintético, trigger ou função de teste permaneceu em Production.

1. criação válida de exercício com doze competências;
2. rejeição de uma segunda gravação baseada em `row_version` obsoleto;
3. ausência de competências parciais após conflito;
4. conversão de nota permanente para consumo com exclusão do bem derivado;
5. repetição do percurso anterior como usuário autenticado do perfil Controlador, sob RLS;
6. sincronização de `pendencies.payload.tentativas[].status` com `pendency_attempts.payload.status`;
7. criação transacional das restrições de identidade escolar sobre os 163 registros atuais.

Resultados observados nas provas finais:

```text
functional_integrity_transactional_validation_passed
controller_invoice_unlink_rls_validation_passed
school_identity_constraints_validation_passed
remaining_assets = 0
invoice_unlinked = true
```

A consulta de resíduos após o rollback retornou zero para assets, notas, pendências, tentativas, competências futuras e logs sintéticos.

## Execução da suíte JavaScript

O primeiro build de Preview executou a suíte integral de testes unitários como barreira obrigatória:

```text
tests: 590
pass: 588
fail: 2
```

As duas falhas eram das próprias expectativas de teste, não novos defeitos de runtime:

1. o inventário técnico ainda esperava 27 migrations, enquanto o branch passou a conter 30;
2. o cenário de cadastro incompleto não distinguia uma nova unidade parcialmente preenchida de uma edição apontando para id inexistente.

As duas expectativas foram corrigidas antes de uma nova execução. O build permanece bloqueante: o Preview só pode ficar `READY` quando `npm run check` e `npm run test:unit` terminarem sem falhas.

## Dados atuais compatíveis com as migrations

Antes da publicação persistente das migrations, o banco foi inspecionado:

- nenhuma escola com designação, denominação, INEP, CNPJ ou SICI vazios;
- nenhuma duplicidade normalizada de INEP, CNPJ ou SICI;
- nenhum bem órfão atual;
- nenhuma nota permanente sem bem;
- nenhuma nota não permanente ainda vinculada a bem;
- configuração atual do exercício com doze competências.

A migration de pendências contém reconciliação idempotente porque existe divergência histórica entre o agregado de uma pendência e a tabela própria de tentativas.

## Dependências

Nenhum pacote foi instalado ou atualizado. Os defeitos estavam nos contratos funcionais, nas transações SQL e na integração de auditoria; as versões existentes atendem às correções. O `package-lock.json` permanece inalterado.

## Barreiras antes de Production

1. Preview do SHA final deve concluir com o build de Vercel que executa `npm run check` e `npm run test:unit`;
2. migrations devem ser executadas pelo pipeline após aprovação e merge;
3. integridade e resíduos devem ser consultados novamente após a aplicação;
4. homologação autenticada deve confirmar os percursos visuais dos perfis Assistente, Gestão SME, Controlador e Inventário.
