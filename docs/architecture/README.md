# Arquitetura do RADAR PDDE

**Atualizado em:** 5 de agosto de 2026

Esta pasta registra os contratos técnicos e funcionais vigentes. Planos de implementação e auditorias datadas não substituem esses contratos.

## 1. Fluxo arquitetural

```text
interface e navegação
→ domínio e serviços de aplicação
→ contrato único de repositório
→ SupabaseRepository
→ Auth + PostgREST + RLS + RPC + Edge Function
→ PostgreSQL 17
→ retorno, estado em memória e renderização
```

A confiabilidade funcional exige provar o percurso completo, inclusive releitura após recarregar e compensação em falha parcial.

## 2. Produto e regras operacionais

- [`competencias.md`](competencias.md) — chave mensal, contexto global e disponibilidade;
- [`avaliacao-mensal.md`](avaliacao-mensal.md) — bonificação, análise técnica e pendências;
- [`modelo-operacional.md`](modelo-operacional.md) — projeção compartilhada das superfícies;
- [`timeline-unidade.md`](timeline-unidade.md) — linha do tempo derivada;
- [`navigation-contextual.md`](navigation-contextual.md) — rotas e retorno seguro;
- [`estatisticas.md`](estatisticas.md) — denominadores de escolas e programas;
- [`retificacoes.md`](retificacoes.md) — histórico e correções operacionais.

## 3. Frontend e integração

- [`frontend-load-order.md`](frontend-load-order.md) — ordem de carregamento e bootstrap;
- [`product-extensions-load-order.md`](product-extensions-load-order.md) — integrações posteriores ao `app.js`;
- [`testing.md`](testing.md) — estratégia de testes e gates;
- [`supabase-readiness.md`](supabase-readiness.md) — prontidão local/remota do backend.

O frontend não é fonte independente de dados. A interface deve consumir serviços e repositórios definidos e refletir o resultado retornado pelo Supabase.

## 4. Exportações

- [`excel-export.md`](excel-export.md) — relatório institucional;
- [`excel-workbook-plan.md`](excel-workbook-plan.md) — plano declarativo do workbook;
- [`excel-xlsx-runtime.md`](excel-xlsx-runtime.md) — renderer e integração;
- [`excel-sme-mensal.md`](excel-sme-mensal.md) — produto mensal da SME;
- [`excel-integral-certification.md`](excel-integral-certification.md) — certificação célula a célula e OOXML.

### Estado do Excel SME

```text
template-fonte: 30 colunas
produto público: 27 colunas A:AA
competência: mensal
motor: ExcelJS 4.4.0
homologação desktop: concluída
```

As posições-fonte K, R e Y são removidas antes da publicação. Designação, bordas, alinhamento, filtro, impressão e congelamento possuem regressões próprias.

## 5. Supabase, Auth e permissões

- [`../reference/SUPABASE_DATA_DICTIONARY.md`](../reference/SUPABASE_DATA_DICTIONARY.md);
- [`../reference/SUPABASE_FUNCTIONAL_COVERAGE.md`](../reference/SUPABASE_FUNCTIONAL_COVERAGE.md);
- [`../reference/SUPABASE_INTEGRATION_AUDIT.md`](../reference/SUPABASE_INTEGRATION_AUDIT.md);
- [`../reference/SUPABASE_PERMISSIONS_MATRIX.md`](../reference/SUPABASE_PERMISSIONS_MATRIX.md);
- [`../runbooks/SUPABASE_CONNECTION.md`](../runbooks/SUPABASE_CONNECTION.md);
- [`../runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](../runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md).

Baseline na data de corte:

```text
Supabase: scnryinorqeucbfkioxo
PostgreSQL: 17.6.1.147
migrations em Production: 25
team-account-management: versão 95, JWT obrigatório
```

## 6. Gestão de Equipe

Fluxo:

```text
interface
→ DirectoryService
→ TeamAccountGateway
→ Edge Function team-account-management
→ Auth Admin + RPC transacional
→ diretórios, perfis, escopos e auditoria
```

Contratos obrigatórios:

- CORS fail-closed;
- origem institucional autorizada;
- JWT e papel da Assistente;
- recuperação segura de vínculo histórico;
- redistribuição de carteira;
- desativação lógica;
- compensação de falha parcial;
- atualização da interface e persistência após recarregar.

## 7. Garantia operacional

O monitor geral de Production verifica continuamente:

- commit publicado;
- manifesto, shell e assets;
- gate de autenticação;
- bloqueio anônimo;
- preflight das Edge Functions;
- abertura e encerramento de incidente automático.

A auditoria de integridade dos dados do PR nº 141 permanece em andamento e não integra a arquitetura vigente até eventual merge e aplicação autorizada.

## 8. Documento histórico

- [`roadmap-pre-supabase.md`](roadmap-pre-supabase.md) — planejamento anterior à ativação remota; não representa o estágio atual.

## 9. Precedência

1. código, migrations, tipos e contratos executáveis;
2. ambientes efetivos;
3. decisões vigentes;
4. documentos desta pasta;
5. evidências do mesmo SHA;
6. planos e auditorias históricas.

A classificação detalhada está em [`../reference/STATUS_DOCUMENTOS.md`](../reference/STATUS_DOCUMENTOS.md).
