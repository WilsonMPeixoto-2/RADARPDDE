# Cobertura funcional — Supabase

**Estado:** vigente em Preview e Production  
**Atualizado em:** 5 de agosto de 2026

## 1. Baseline

```text
projeto: scnryinorqeucbfkioxo
estado: ACTIVE_HEALTHY
região: sa-east-1
PostgreSQL: 17.6.1.147
migrations aplicadas em Production: 25
closing_competence: 2026-12
app_config.row_version: 20
Edge Function: team-account-management v95, ACTIVE, JWT obrigatório
```

O PR nº 141 contém proposta de 26ª migration apenas em sua branch. Até integração e aplicação autorizada, Production permanece com 25.

## 2. Contrato de persistência

- `SupabaseRepository` — backend canônico de Preview e Production;
- `LocalStorageRepository` — desenvolvimento controlado e contingência por novo build.

Fluxo normal:

```text
interface
→ serviço de aplicação
→ DataService/UnitOfWork
→ SupabaseRepository
→ PostgREST, RPC ou Edge Function
→ Auth/RLS/PostgreSQL
→ resposta
→ estado em memória
→ renderização
```

## 3. Matriz de cobertura

Legenda:

- **Comprovado:** possui integração e evidência automatizada específica;
- **Parcial:** existe e é testado, mas falta prova completa de releitura ou Production;
- **Controlado:** execução remota depende de janela e autorização;
- **Em expansão:** próxima frente de confiabilidade.

| Domínio ou fluxo | Estado | Backend principal | Evidência atual | Lacuna seguinte |
|---|---|---|---|---|
| Sessão, perfil e escopos | Comprovado | Auth + `user_profiles` + RPC | unitários, pgTAP, perfil/viewport | smoke autenticado em Production |
| Bootstrap das entidades operacionais | Comprovado | PostgREST | integração e E2E | monitor de leitura autenticada |
| Configuração, exercícios e competência | Comprovado | `app_config`, `competences`, RPC | serviço, RLS, pgTAP | confirmar regra funcional de programas |
| Escolas e programas vinculados | Comprovado | `schools`, `school_programs` | RLS, serviço, E2E | matriz de todas as mutações |
| Carteiras dos Controladores | Comprovado | `schools.controller_id` | Gestão de Equipe e E2E | releitura sistemática após cada alteração |
| Gestão de Controladores | Comprovado | Edge Function + Auth Admin + RPC | PR nº 138, ciclo integral | manter smoke e compensação |
| Gestão do Inventário | Comprovado | Edge Function + Auth Admin + RPC | PR nº 138, ciclo integral | manter smoke e compensação |
| Bonificação mensal | Comprovado | `verifications` + serviço | domínio, pgTAP, E2E | catálogo ponta a ponta por ação |
| Análise técnica | Comprovado | `verifications` | serviço, RLS, E2E | conflito de versão na interface |
| Pendências | Comprovado | `pendencies` + RPCs | serviço, RLS, E2E | releitura e falhas por estado |
| Tentativas de regularização | Comprovado | `pendency_attempts` | serviço e histórico | matriz de todas as transições |
| Contatos e cobranças | Comprovado | `pendency_contacts` | serviço e E2E | prova de persistência após refresh |
| Notas fiscais | Comprovado | `registered_invoices` + RPC | atomicidade, E2E | ampliar casos de conflito |
| Bens permanentes | Comprovado | `assets` + RPC | inventário, E2E | ampliar compensação nota/bem |
| Inventariação | Comprovado | `assets` | RLS, perfil/viewport | releitura recorrente por perfil |
| Registros administrativos | Comprovado | `administrative_logs` | autoria, políticas e testes | confirmar recortes em Production |
| Gestão SME | Parcial | tabelas de configuração e leitura | interface, serviços, RLS | confirmar regras de programas e calendário |
| Importação e promoção | Controlado | staging + RPCs | ambiente descartável | executar somente com pacote autorizado |
| Rollback de importação | Controlado | RPCs | testes descartáveis | runbook específico por operação real |
| Relatório institucional XLSX | Comprovado | dados em memória autorizados | modelo, renderer, equivalência | homologação desktop se priorizada |
| Excel SME mensal | Comprovado e publicado | dados em memória + assets Vercel | PRs nº 136/137, OOXML, desktop | monitorar assets e competência |
| Monitor geral de Production | Comprovado e publicado | GitHub Actions + Vercel + Supabase | PR nº 139 | smoke autenticado |
| Incidentes automáticos | Comprovado e publicado | GitHub Issues | PR nº 140 | observar ocorrência real |
| Integridade lógica dos dados | Em expansão | RPC service-role | PR nº 141 em rascunho | revisar e integrar com autorização |

## 4. Perfis

### Controlador

- lê escolas da própria `cre_scope`;
- carteira define responsável principal e filtro inicial;
- pode colaborar em escolas da mesma CRE conforme regra vigente;
- executa bonificação, análise, pendências, contatos, notas e bens autorizados;
- não acessa outra CRE sem escopo explícito.

### Assistente de Verbas Federais

- acesso transversal à CRE;
- Gestão de Equipe;
- redistribuição de carteiras;
- ações operacionais autorizadas;
- relatórios e exportações.

### Gestão SME

- leitura gerencial de identificação e bonificação;
- sem análise técnica nas superfícies restritas;
- Pendências sem mutações operacionais;
- Registros Internos limitados à própria autoria;
- configurações globais autorizadas pelo frontend e RLS.

A extensão exata sobre programas e calendário deve ser confirmada antes de nova mudança.

### Inventário

- lê escolas e bens da própria CRE;
- opera encaminhamento e inventariação;
- não altera bonificação, análise técnica, carteiras ou configuração global.

### Administrador técnico

- infraestrutura, perfis, escopos, importação e auditoria;
- pode simular visualmente perfis sem alterar o papel efetivo do JWT.

## 5. Gestão de Equipe

Fluxo vigente:

```text
DirectoryService
→ TeamAccountGateway
→ team-account-management
→ Auth Admin
→ RPC transacional
→ controllers/inventory_team_members/user_profiles/auditoria
```

Contratos comprovados:

- preflight CORS institucional retorna sucesso;
- origem indevida é rejeitada;
- JWT e papel autorizado são obrigatórios;
- cadastro cria diretório, conta, perfil e vínculo;
- edição altera diretório e conta quando necessário;
- desativação bloqueia acesso e preserva histórico;
- carteira é redistribuída de forma explícita;
- vínculo legado pode ser recuperado quando não há ambiguidade;
- falha parcial executa compensação.

## 6. Migrations e banco

As 25 migrations de Production cobrem:

- schema e constraints;
- grants e RLS;
- Auth, perfis e escopos;
- Gestão de Equipe;
- inventário e notas;
- operações compostas;
- importação e rollback;
- Gestão SME;
- histórico e auditoria.

Migration SME canônica:

```text
20260728182226_sme_access_governance
SHA-256: cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e
```

## 7. Excel

### Relatório institucional

- quatro abas;
- histórico multicompetência;
- equivalência com CSV;
- CSV secundário e fallback.

### Excel SME

- uma competência e uma aba;
- 27 colunas A:AA;
- template-fonte de 30 colunas apenas visual;
- remoção de K, R e Y na projeção;
- designação textual;
- bordas e cabeçalho normalizados;
- ausência deliberada de `dataValidations` incompatíveis;
- assets protegidos por manifesto e hash;
- homologado no Microsoft Excel desktop.

## 8. Próxima expansão da cobertura

```text
matriz perfil × tela × ação × backend
→ smoke autenticado somente leitura
→ provas controladas de escrita
→ releitura após refresh
→ conflito e compensação
→ integridade contínua dos dados
```

## 9. Referências

- [`SUPABASE_PERMISSIONS_MATRIX.md`](SUPABASE_PERMISSIONS_MATRIX.md);
- [`SUPABASE_DATA_DICTIONARY.md`](SUPABASE_DATA_DICTIONARY.md);
- [`SUPABASE_INTEGRATION_AUDIT.md`](SUPABASE_INTEGRATION_AUDIT.md);
- [`../architecture/supabase-readiness.md`](../architecture/supabase-readiness.md);
- [`../architecture/excel-sme-mensal.md`](../architecture/excel-sme-mensal.md);
- [`../runbooks/SUPABASE_CONNECTION.md`](../runbooks/SUPABASE_CONNECTION.md);
- [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md).
