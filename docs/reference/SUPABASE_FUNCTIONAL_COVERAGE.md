# Cobertura funcional — Gate de Pré-conexão Supabase

## Situação

O RADAR PDDE possui um contrato único de persistência e foi preparado para operar com dois adaptadores:

- `LocalStorageRepository` — backend vigente e padrão;
- `SupabaseRepository` — backend preparado e comprovado na pilha Supabase local.

A conexão remota permanece desativada. O objetivo deste gate é demonstrar que a futura ativação não exigirá reconstrução de formulários, regras de negócio, permissões, modelo relacional, migração ou layout.

## Matriz de cobertura

| Domínio ou fluxo | LocalStorageRepository | Supabase local | Evidência principal |
|---|---:|---:|---|
| Bootstrap e hidratação canônica | Sim | Sim | serviços de dados e E2E |
| Configuração, exercícios e 12 competências | Sim | Sim | serviço + RPC transacional |
| Programas, controladores e equipe de inventário | Sim | Sim | serviços e RLS |
| Escolas, programas e atribuição de controlador | Sim | Sim | serviço + RPC transacional |
| Bonificação e análise técnica | Sim | Sim | serviço de verificações |
| Abertura e ciclo completo de pendências | Sim | Sim | serviço + RPC de reanálise |
| Tentativas, contatos, cancelamento e reabertura | Sim | Sim | serviços e histórico auditável |
| Retificação administrativa | Sim | Sim | fluxo funcional preservado |
| Notas de consumo, serviço e permanente | Sim | Sim | RPCs atômicas de notas |
| Bem derivado, encaminhamento e inventariação | Sim | Sim | serviço de inventário |
| Auditoria administrativa e técnica | Sim | Sim | unidade de trabalho + triggers |
| Concorrência otimista | Não aplicável ao modo local | Sim | `row_version` e testes de conflito |
| Sessão expirada e autorização negada | Não aplicável ao modo local | Sim | Auth local, RLS e UX de falhas |
| Rede e indisponibilidade remota | Não aplicável ao modo local | Simulada | retry apenas de leitura e E2E |
| Exportação, staging, retomada e idempotência | Sim | Sim | coordenador e RPCs de importação |
| Promoção atômica, reconciliação e rollback | Sim | Sim | integração e E2E Supabase local |
| Desktop, Android e iPhone | Sim | Sim nos fluxos do gate | Playwright |
| Acessibilidade automatizada e teclado | Sim | Sim | axe, foco, Escape e retorno ao acionador |

## Perfis comprovados

Os cinco perfis institucionais estão modelados e testados:

1. `technical_admin`;
2. `sme_management`;
3. `federal_assistant`;
4. `controller`;
5. `inventory`.

Também são testados usuário inativo, usuário sem perfil, escopo somente leitura e escopo de escrita por escola.

## Contratos de dados

A validação ocorre em duas camadas coordenadas:

- navegador: Ajv `8.20.0`, por meio de `src/domain/json-contracts.js` e `vendor/ajv.js`;
- PostgreSQL: `pg_jsonschema`, constraints relacionais e testes pgTAP.

Os contratos abrangem bonificação, análise, pendências, tentativas, erros, cancelamento, resolução, retificação, auditoria e compatibilidade legada.

## Resiliência

As categorias públicas de falha são:

- `NETWORK_UNAVAILABLE`;
- `SESSION_EXPIRED`;
- `PERMISSION_DENIED`;
- `OPTIMISTIC_CONFLICT`;
- `VALIDATION_FAILED`;
- `TRANSACTION_FAILED`;
- `REMOTE_UNAVAILABLE`;
- `IMPORT_RECONCILIATION_FAILED`.

Validações de negócio mantêm mensagens específicas. Retry é permitido somente em leituras seguras e falhas transitórias; gravações não são repetidas automaticamente.

## Migração operacional

O fluxo preparado é:

```text
exportar → validar → planejar → staging por importId
        → retomar lotes → reconciliar staging
        → promover atomicamente → reconciliar destino
        → concluir ou executar rollback controlado
```

O relatório contém hash SHA-256, contagens, estado de lotes e diferenças resumidas, sem registros integrais nem credenciais.

## Fora do escopo deste gate

Dependem necessariamente de um projeto Supabase remoto:

- `project_ref`, URL e chave publicável;
- aplicação remota das migrations;
- usuários reais de homologação;
- Auth e RLS remotos;
- Security Advisor e Performance Advisor;
- backups, restauração e MFA;
- importação controlada de dados reais;
- autorização de ativação em produção.
