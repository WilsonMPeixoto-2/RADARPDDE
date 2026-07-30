# Arquitetura de persistência e prontidão Supabase

**Estado:** vigente; conexão de Production ativa  
**Atualizado em:** 29 de julho de 2026

## 1. Estado arquitetural

```text
Frontend
   ↓
Serviços de aplicação e UnitOfWork
   ↓
Contrato único de persistência
   ├── SupabaseRepository — Preview e Production
   └── LocalStorageRepository — contingência explícita
   ↓
Supabase Auth + PostgREST + PostgreSQL + RLS + RPCs + auditoria
```

Production opera com `SupabaseRepository` como persistência canônica. O modo local não é o backend normal de Production e permanece apenas para desenvolvimento controlado e rollback emergencial por novo build.

## 2. Runtime de referência

### Preview

```text
environment: preview
dataMode: supabase-preview
supabaseRepositoryEnabled: true
productionActivationApproved: false
```

### Production

```text
environment: production
dataMode: supabase-production
supabaseRepositoryEnabled: true
productionActivationApproved: true
```

Projeto autorizado:

```text
scnryinorqeucbfkioxo
```

A configuração pública contém somente URL e chave publicável. `service_role`, `sb_secret_*`, senha do banco e tokens administrativos são proibidos no navegador, GitHub, logs e artefatos.

## 3. Componentes

### 3.1 Interface

Handlers cuidam de DOM, mensagens, modais e renderização. Regras institucionais e mutações não são persistidas diretamente pela camada visual.

### 3.2 Serviços de aplicação

Serviços especializados cobrem:

- configurações, exercícios e competências;
- diretórios e contas da equipe;
- escolas, vínculos e carteira;
- verificações e avaliação mensal;
- pendências, tentativas e contatos;
- notas fiscais;
- bens e inventário;
- auditoria.

### 3.3 Unidade de trabalho

`DataService` e `UnitOfWork` capturam estado anterior, executam a regra, persistem e restauram memória e repositório em caso de falha.

### 3.4 Porta de estado

A porta traduz o modelo legado do frontend para o snapshot canônico e realiza o caminho inverso. Chaves `radar_pdde_*` são preservadas para compatibilidade e contingência, não como fonte normal de Production.

### 3.5 Repositórios

Ambos implementam o contrato comum:

- `load`;
- `save`;
- `remove`;
- `exportSnapshot`;
- `restoreSnapshot`;
- `healthCheck`;
- `capabilities`.

O adaptador Supabase acrescenta paginação, lotes, concorrência otimista, RPCs compostas, Auth, RLS e protocolo de importação.

## 4. Modelo de dados

O banco normaliza entidades funcionais e mantém JSONB somente para estruturas variáveis. Contratos JSON compartilhados são validados por Ajv no navegador e `pg_jsonschema` no PostgreSQL.

Tabelas expostas possuem RLS. A Data API exige grants explícitos e não concede dados institucionais ao papel `anon`.

Entidades canônicas incluem configuração, programas, competências, escolas, vínculos, perfis, escopos, Controladores, Inventário, verificações, pendências, tentativas, contatos, notas, bens, logs, importações e auditoria.

## 5. Autenticação e autorização

No modo Supabase, identidade e perfil efetivo derivam da sessão Auth e das tabelas protegidas.

A autorização combina:

- perfil institucional ativo;
- `cre_scope`;
- carteira como responsabilidade principal;
- exceções explícitas por escola;
- distinção entre leitura e escrita;
- capacidades específicas de Inventário;
- governança somente leitura da Gestão SME;
- privilégios técnicos separados.

A simulação visual de perfil não altera o JWT nem concede capacidade remota.

## 6. Gestão de contas

```text
DirectoryService
→ TeamAccountGateway
→ Edge Function autenticada
   ├── Supabase Auth Admin
   └── RPC PostgreSQL transacional
```

A credencial administrativa permanece server-side. Convite, edição e desativação usam idempotência e compensação para impedir divergência entre Auth e diretório funcional.

## 7. Operações atômicas

RPCs e transações evitam persistência parcial em:

- exercício e competências;
- escola e programas;
- verificação e log;
- reanálise e efeitos documentais;
- contato, pendência, nota e bem;
- Gestão de Equipe;
- importação, promoção e rollback.

Conflitos de `row_version` não são sobrescritos silenciosamente.

## 8. Migrations

O repositório e o Supabase Production possuem 25 versões correspondentes.

Estado canônico da migration SME:

```text
arquivo local: 20260728182226_sme_access_governance.sql
registro remoto: 20260728182226_sme_access_governance
registro derivado 20260728190344: ausente
comprimento do SQL: 1.411 caracteres
SHA-256: cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e
```

A reconciliação utilizou o mecanismo oficial de reparo do histórico, sem executar, reaplicar ou reverter o SQL funcional. O schema e as políticas permaneceram inalterados, `migration list` terminou alinhado e `db push --dry-run` não apresentou migration pendente.

O teste `tests/unit/sme-migration-history-alignment.test.js` protege:

- o identificador canônico do arquivo;
- a ausência do identificador derivado;
- o hash do SQL.

Antes de qualquer migration futura:

1. executar `supabase migration list --linked`;
2. executar o teste de alinhamento SME;
3. aplicar reset local;
4. executar pgTAP e lint SQL;
5. regenerar e validar tipos;
6. revisar o dry-run;
7. preparar backup e rollback;
8. manter aprovação e evidências no mesmo SHA.

`migration repair` altera o histórico e não substitui rollback funcional de SQL.

Runbook: [`../runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](../runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md).

## 9. Importação, reconciliação e rollback

```text
snapshot
→ validação
→ plano
→ dry-run
→ staging
→ retomada
→ reconciliação
→ promoção atômica
→ reconciliação do destino
→ rollback comprovado
```

Seed local não é dado institucional. Importação administrativa não ocorre no navegador e não é disparada implicitamente por banco vazio.

## 10. Resiliência e UX

Falhas são convertidas em categorias estáveis e mensagens funcionais. Formulários permanecem abertos, foco é preservado e tecnologias assistivas recebem anúncios em `aria-live`.

Retry automático é limitado a leituras seguras com erro transitório. Escritas não são repetidas silenciosamente.

## 11. Rollback emergencial de runtime

```text
RADAR_PRODUCTION_FORCE_LOCAL=true
```

O sinal exige novo build e retorna o frontend ao repositório local sem apagar ou alterar o Supabase. É contingência excepcional e exige:

- decisão registrada;
- diagnóstico do incidente;
- evidência do build;
- plano de retorno ao Supabase;
- comunicação sobre a ausência de sincronização automática entre os modos.

## 12. Invariantes de segurança

- Production normal usa Supabase;
- acesso remoto exige configuração explícita e válida;
- nenhum segredo no frontend ou repositório;
- nenhuma migration remota automática;
- nenhum seed implícito;
- Auth e RLS permanecem obrigatórios;
- autoria e auditoria acompanham mutações;
- rollback local não redefine o banco canônico;
- mudança de backend não pode alterar regras de produto;
- histórico de migrations não é editado diretamente.

## 13. Estado de hardening

Comprovado:

- usuário anônimo sem acesso institucional;
- RLS por perfil e escopo;
- chave exclusivamente publicável no frontend;
- Edge Function protegida por JWT;
- operações compostas auditáveis;
- histórico de migrations alinhado e protegido por teste;
- deployments automáticos bloqueados fora de janelas controladas.

Pendente antes da liberação oficial:

- proteção contra senhas vazadas no Supabase Auth;
- fixação deliberada da major operacional do Node;
- backup e restauração em ambiente descartável;
- homologação manual dos relatórios Excel;
- matriz remota por perfil e viewport;
- UAT;
- polimento editorial/visual;
- decisão formal de release.

## 14. Verificação obrigatória

```bash
npm run test:readiness
node --test tests/unit/sme-migration-history-alignment.test.js
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
npm run typecheck:database
npm run test:e2e
npm run test:mobile
npm run build:vercel
```

Mudança de schema também exige Advisors, comparação local/remota de migrations, tipos regenerados, backup, rollback e aprovação no mesmo SHA.

## 15. Referências

- [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md);
- [`../reference/SUPABASE_DATA_DICTIONARY.md`](../reference/SUPABASE_DATA_DICTIONARY.md);
- [`../reference/SUPABASE_PERMISSIONS_MATRIX.md`](../reference/SUPABASE_PERMISSIONS_MATRIX.md);
- [`../reference/SUPABASE_FUNCTIONAL_COVERAGE.md`](../reference/SUPABASE_FUNCTIONAL_COVERAGE.md);
- [`../runbooks/SUPABASE_CONNECTION.md`](../runbooks/SUPABASE_CONNECTION.md);
- [`../runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](../runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md);
- [`../audits/2026-07-29-reconciliacao-migration-sme-evidencias.md`](../audits/2026-07-29-reconciliacao-migration-sme-evidencias.md).
