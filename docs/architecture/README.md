# Arquitetura do RADAR PDDE

**Atualizado em:** 7 de agosto de 2026  
**Estado:** referência vigente

Esta pasta registra contratos técnicos e funcionais estáveis. Valores mutáveis do ambiente ficam em [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md). Planos e auditorias datadas não substituem estes contratos.

## 1. Fluxo arquitetural

```text
interface e navegação
→ domínio e serviços de aplicação
→ RepositoryContract / UnitOfWork
→ SupabaseRepository
→ PostgREST / RPC / Edge Function
→ Auth + RLS + PostgreSQL
→ resposta
→ estado em memória
→ renderização
→ releitura quando aplicável
```

A confiabilidade funcional exige provar o percurso completo, incluindo autorização negativa, concorrência e compensação quando houver mutação composta.

## 2. Produto e regras operacionais

- [`competencias.md`](competencias.md) — chave mensal, contexto global e disponibilidade;
- [`avaliacao-mensal.md`](avaliacao-mensal.md) — bonificação, análise técnica e pendências;
- [`modelo-operacional.md`](modelo-operacional.md) — projeção compartilhada das superfícies;
- [`timeline-unidade.md`](timeline-unidade.md) — linha do tempo derivada;
- [`navigation-contextual.md`](navigation-contextual.md) — rotas e retorno seguro;
- [`estatisticas.md`](estatisticas.md) — denominadores de escolas e programas;
- [`retificacoes.md`](retificacoes.md) — histórico e correções operacionais.

## 3. Frontend e integração

- [`frontend-load-order.md`](frontend-load-order.md) — ordem efetiva de carregamento;
- [`product-extensions-load-order.md`](product-extensions-load-order.md) — integrações posteriores ao núcleo;
- [`testing.md`](testing.md) — estratégia de testes e gates;
- [`supabase-readiness.md`](supabase-readiness.md) — prontidão do backend.

O frontend não é fonte independente de dados. A interface deve consumir serviços/repositórios definidos e refletir o resultado retornado pelo backend autorizado.

## 4. Correções arquiteturais recentes incorporadas

### Exercícios e competência

A criação de exercício envia exatamente as doze competências do novo exercício, exige versão esperada e valida janeiro a dezembro. A restauração remota sincroniza as competências antes do primeiro render.

### Escolas

Novas escolas exigem identidade institucional informada. O serviço não gera identidade artificial e o banco protege não-vazio e unicidade normalizada de INEP, CNPJ e SICI.

### Gestão de Equipe

Fluxo:

```text
interface
→ DirectoryService
→ TeamAccountGateway
→ team-account-management
→ Auth Admin + RPC transacional
→ diretórios, perfis, escopos e auditoria
```

A função administrativa usa lookup Auth exato pela RPC `resolve_team_auth_user_id_by_email`, restrita a `service_role`; não depende de `listUsers`. Reutilização de conta, transições entre perfis, compensação e histórico são contratos permanentes.

### Patrimônio

`ASSET-02` não usa mais persistência genérica: edição rápida é restrita ao campo permitido, usa `saveAssetWithLog`, versão esperada e log. Nota permanente e bem derivado mantêm integridade transacional ao trocar/desvincular o vínculo.

### Pendências

`pendency_attempts` é sincronizada com o agregado de tentativas da pendência, com reconciliação idempotente para histórico existente.

### Exportações

`RadarExcelExportAudit` exige registro inicial via `AuditService` antes do download e neutraliza duplicação do log legado. A conclusão da exportação também é registrada.

## 5. Exportações

- [`excel-export.md`](excel-export.md) — relatório institucional;
- [`excel-workbook-plan.md`](excel-workbook-plan.md) — plano declarativo do workbook;
- [`excel-xlsx-runtime.md`](excel-xlsx-runtime.md) — renderer e integração;
- [`excel-sme-mensal.md`](excel-sme-mensal.md) — produto mensal da SME;
- [`excel-integral-certification.md`](excel-integral-certification.md) — certificação célula a célula e OOXML.

Contrato estável do Excel SME:

```text
template-fonte: 30 colunas
produto público: 27 colunas A:AA
competência: mensal
motor: ExcelJS 4.4.0
homologação desktop: obrigatória após mudança material
```

## 6. Supabase, Auth e permissões

- [`../reference/SUPABASE_DATA_DICTIONARY.md`](../reference/SUPABASE_DATA_DICTIONARY.md);
- [`../reference/SUPABASE_FUNCTIONAL_COVERAGE.md`](../reference/SUPABASE_FUNCTIONAL_COVERAGE.md);
- [`../reference/SUPABASE_INTEGRATION_AUDIT.md`](../reference/SUPABASE_INTEGRATION_AUDIT.md);
- [`../reference/SUPABASE_PERMISSIONS_MATRIX.md`](../reference/SUPABASE_PERMISSIONS_MATRIX.md);
- [`../runbooks/SUPABASE_CONNECTION.md`](../runbooks/SUPABASE_CONNECTION.md);
- [`../runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](../runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md).

Consultar `CURRENT_STAGE.md` e o próprio Supabase para números de migrations e versão de Edge Function.

## 7. Garantia operacional

A arquitetura possui:

- monitor geral de Production;
- incidentes automáticos;
- auditoria agregada de vinte invariantes;
- matriz funcional executável de 41 operações;
- backup/restauração descartáveis;
- gate por perfil/viewport;
- infraestrutura integrada do smoke autenticado de leitura.

A última permanece deliberadamente desativada até provisionamento autorizado de identidades técnicas.

## 8. Matriz funcional

A fonte JSON executável diferencia:

- `covered`: evidência suficiente para o estágio atual;
- `partial`: contrato implementado, mas prova padronizada ainda incompleta;
- `gap`: lacuna técnica comprovada;
- `decision`: implementação existente cuja regra ainda precisa de decisão.

Após a reconciliação pós-PR #162: 9 `covered`, 32 `partial`, 0 `gap`, 0 `decision`.

Correção implementada não é sinônimo de cobertura total. `ASSET-02`, por exemplo, migra de lacuna para parcial.

## 9. Documento histórico

[`roadmap-pre-supabase.md`](roadmap-pre-supabase.md) é planejamento anterior à ativação remota e não representa o estágio atual.

## 10. Precedência

1. código, migrations, tipos e contratos executáveis;
2. ambientes efetivos;
3. evidências do mesmo SHA;
4. decisões vigentes;
5. documentos desta pasta;
6. históricos.

A classificação completa está em [`../reference/STATUS_DOCUMENTOS.md`](../reference/STATUS_DOCUMENTOS.md).
