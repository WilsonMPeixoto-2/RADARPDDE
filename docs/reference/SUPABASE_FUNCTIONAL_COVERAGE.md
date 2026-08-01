# Cobertura funcional — Supabase

**Estado:** vigente em Preview e Production  
**Atualizado em:** 29 de julho de 2026

## 1. Situação

O RADAR PDDE possui contrato único de persistência e dois adaptadores:

- `SupabaseRepository` — backend canônico de Preview e Production;
- `LocalStorageRepository` — desenvolvimento controlado e contingência explícita.

Production está conectada ao projeto `scnryinorqeucbfkioxo` com Auth, PostgREST, PostgreSQL, RLS, RPCs, auditoria e concorrência otimista.

O repositório e o Supabase Production possuem 25 versões correspondentes de migration. O histórico SME foi reconciliado para o identificador canônico `20260728182226`, sem reaplicação do SQL, e está protegido por teste de regressão.

## 2. Matriz de cobertura

| Domínio ou fluxo | Local/contingência | Supabase local | Preview/Production | Evidência principal |
|---|---:|---:|---:|---|
| Bootstrap e hidratação canônica | Sim | Sim | Sim | serviços, runtime e E2E |
| Configuração, exercícios e competências | Sim | Sim | Sim | serviço + RPC transacional |
| Competência global janeiro–dezembro | Sim | Sim | Sim | domínio, integração e E2E |
| Escolas, programas e responsável principal | Sim | Sim | Sim | serviço + RLS/RPC |
| Colaboração entre Controladores da mesma CRE | Sim | Sim | Sim | RLS, pgTAP e E2E |
| Gestão da equipe pela Assistente | Parcial | Sim | Sim | gateway, Edge Function e RPCs |
| Convite e conta Auth | Não aplicável | Sim | Sim | Edge Function + Auth Admin |
| Bonificação e avaliação mensal | Sim | Sim | Sim | domínio + serviço + persistência |
| Análise técnica | Sim | Sim | Sim | serviço de verificações |
| Pendências, tentativas e contatos | Sim | Sim | Sim | serviços, RLS e histórico |
| Timeline cronológica | Sim | Sim | Sim | projeção somente leitura |
| Notas e bens derivados | Sim | Sim | Sim | RPCs atômicas e inventário |
| Capital e Inventário por CRE | Sim | Sim | Sim | RLS, pgTAP e E2E |
| Registros Internos | Sim | Sim | Sim | autoria, políticas e RLS |
| Gestão SME somente leitura | Sim | Sim | Sim | capacidades, handlers, serviços e RLS |
| Navegação contextual | Sim | Sim | Sim | sessão, rotas e Playwright |
| Relatório institucional XLSX | Sim | Sim | Sim | modelo, renderer, integração e manifesto sintético |
| CSV institucional de fallback | Sim | Sim | Sim | função legada preservada e botão secundário |
| Excel SME mensal | Sim | Sim | Sim | modelo, renderer, integração e manifesto sintético |
| Auditoria | Sim | Sim | Sim | UnitOfWork + triggers/logs |
| Concorrência otimista | Não aplicável | Sim | Sim | `row_version` |
| Importação, reconciliação e rollback | Sim | Sim | Controlado | coordenador + RPCs |
| Histórico de migrations | Não aplicável | Sim | Sim | `migration list`, evidência e teste SME |
| Desktop, Android e iPhone | Sim | Sim | Sim | Playwright |
| Acessibilidade automatizada | Sim | Sim | Sim | axe, foco e teclado |

`Controlado` significa que a capacidade existe, mas sua execução sobre Production depende de janela, responsáveis, cópia autorizada, backup e plano específico.

## 3. Perfis

A interface possui quatro perfis funcionais visíveis:

1. `controller` — Controlador;
2. `federal_assistant` — Assistente de Verbas Federais;
3. `sme_management` — Gestão SME;
4. `inventory` — Equipe de Inventário.

`technical_admin` é papel técnico separado do seletor operacional.

### 3.1 Controlador

A carteira identifica responsabilidade principal e organiza o trabalho. O perfil pode consultar e executar ações operacionais nas escolas da mesma `cre_scope`, preservando autoria e responsável principal, sem acesso a outra CRE salvo exceção explícita.

### 3.2 Assistente

A Assistente acompanha transversalmente a CRE e administra Controladores e integrantes de Inventário. No modo Supabase, o `TeamAccountGateway` chama Edge Function autenticada, que valida JWT e usa Auth Admin e RPCs restritas.

### 3.3 Gestão SME

- consulta identificação e bonificação nas visões mensal e do Prontuário;
- não recebe análise técnica nessas superfícies;
- consulta Pendências sem mutações operacionais;
- consulta em Registros Internos somente linhas cujo `actor_user_id` corresponda ao próprio `auth.uid()`;
- mantém recorte somente leitura na interface, serviços e RLS.

### 3.4 Inventário

O perfil pode:

- ler escolas e vínculos da própria CRE necessários ao painel;
- ler, criar e atualizar bens autorizados;
- concluir inventariação de bem encaminhado;
- operar apenas a superfície patrimonial;
- permanecer bloqueado para escolas e bens de outra CRE.

### 3.5 Administrador técnico

Opera infraestrutura, perfis, escopos, importações e auditoria. Não herda automaticamente a operação cotidiana da Assistente.

## 4. Contratos de dados

A validação ocorre em camadas:

- navegador: Ajv;
- domínio e serviços;
- Edge Function;
- PostgreSQL: tipos, constraints, `pg_jsonschema`, RLS e pgTAP.

Escritas não são repetidas automaticamente. Operações compostas usam transação, idempotência, concorrência otimista ou compensação explícita.

## 5. Cobertura das migrations

As migrations versionadas cobrem:

- schema canônico;
- grants e RLS;
- Auth e perfis;
- escopos por CRE e escola;
- Gestão de Equipe;
- inventário;
- operações atômicas;
- pgTAP remoto;
- funções privilegiadas e CORS;
- governança da Gestão SME.

### Histórico SME reconciliado

```text
local e remoto: 20260728182226_sme_access_governance
identificador derivado 20260728190344: ausente
SQL: 1.411 caracteres
SHA-256: cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e
```

A operação alterou somente o histórico e não reaplicou o SQL. O teste `tests/unit/sme-migration-history-alignment.test.js` protege versão, ausência do alias derivado e hash.

Antes de migration futura, exigir histórico alinhado, teste, reset local, pgTAP, lint, tipos, dry-run, backup e rollback.

## 6. Importação operacional

```text
exportar
→ validar
→ planejar
→ dry-run
→ staging
→ retomar lotes
→ reconciliar
→ promover atomicamente
→ reconciliar destino
→ rollback controlado
```

O protocolo não autoriza seed implícito nem importação pelo navegador.

## 7. Relatórios

### 7.1 Institucional

O produto XLSX histórico de quatro abas está implementado, certificado e integrado ao botão principal.

A integração:

- captura a função CSV legada;
- substitui `exportDataExcel` pela geração XLSX;
- configura o botão principal para o workbook de quatro abas;
- mantém o CSV como botão secundário;
- oferece fallback CSV quando a geração XLSX falha;
- observa renderizações tardias de forma idempotente.

### 7.2 SME mensal

O produto mensal de uma aba e 30 colunas literais do template canônico está implementado, certificado, homologado no Microsoft Excel desktop e integrado em botão próprio, habilitado somente para competência mensal.

A ausência de `dataValidations` é requisito atual para evitar reparo no Microsoft Excel.

### 7.3 Gate externo

A homologação manual do Excel SME foi concluída. A abertura do relatório institucional no Microsoft Excel desktop ainda é bloqueador de release.

## 8. Gates pendentes de liberação oficial

- habilitar proteção contra senhas vazadas;
- fixar deliberadamente a major operacional do Node;
- testar backup e restauração em ambiente descartável;
- homologar os arquivos no Microsoft Excel desktop;
- executar matriz remota por perfil e viewport;
- concluir UAT;
- realizar polimento editorial/visual;
- registrar decisão formal de release.

## 9. Referências

- [`../architecture/supabase-readiness.md`](../architecture/supabase-readiness.md);
- [`SUPABASE_PERMISSIONS_MATRIX.md`](SUPABASE_PERMISSIONS_MATRIX.md);
- [`SUPABASE_DATA_DICTIONARY.md`](SUPABASE_DATA_DICTIONARY.md);
- [`../architecture/excel-export.md`](../architecture/excel-export.md);
- [`../architecture/excel-sme-mensal.md`](../architecture/excel-sme-mensal.md);
- [`../runbooks/SUPABASE_CONNECTION.md`](../runbooks/SUPABASE_CONNECTION.md);
- [`../runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](../runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md);
- [`../audits/2026-07-29-reconciliacao-migration-sme-evidencias.md`](../audits/2026-07-29-reconciliacao-migration-sme-evidencias.md);
- [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md).
