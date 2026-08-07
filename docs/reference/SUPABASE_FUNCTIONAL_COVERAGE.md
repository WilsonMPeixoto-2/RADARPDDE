# Cobertura funcional — Supabase

**Estado:** referência vigente em Preview e Production  
**Atualizado em:** 7 de agosto de 2026

## 1. Baseline

O baseline mutável fica em [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md). Este documento registra o contrato de cobertura e não duplica SHA, contagem de migrations ou versão de Edge Function.

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

## 3. Cobertura por domínio

Legenda:

- **Comprovado:** possui integração e evidência suficiente para o estágio atual;
- **Parcial:** contrato implementado, mas falta prova padronizada de uma ou mais jornadas/negações/releituras;
- **Controlado:** execução remota depende de pacote/janela/autorização.

| Domínio ou fluxo | Estado | Backend principal | Evidência atual | Próxima prova |
|---|---|---|---|---|
| Sessão, perfil e escopos | Parcial | Auth + `user_profiles` + RPC | unitários, pgTAP, perfil/viewport | smoke autenticado recorrente em Production |
| Bootstrap das entidades | Parcial | PostgREST | integração e E2E | leitura autenticada protegida |
| Competência global | Comprovado | estado + `competences`/`app_config` | rotas, carteira, sincronização pós-PR #160 | manter regressão |
| Configuração e exercícios | Parcial | `app_config`, `competences`, RPC | serviço, pgTAP, E2E e remediação de CFG-02 | escrita/releitura controladas |
| Programas | Parcial | `programs`, RPC de programa e log | serviço, RLS, E2E | escrita/releitura controladas |
| Escolas e programas vinculados | Parcial | `schools`, `school_programs`, RPC | RLS, serviço, E2E, identidade institucional | criação/edição controlada por perfil |
| Carteiras | Parcial | `schools.controller_id` | Gestão de Equipe, PR #154, E2E | redistribuição e reversão controladas |
| Gestão de Controladores | Comprovado | Edge Function + Auth Admin + RPC | PRs #150/#161, testes e observação | observação contínua |
| Gestão do Inventário | Comprovado | Edge Function + Auth Admin + RPC | PRs #150/#161, testes e observação | observação contínua |
| Bonificação mensal | Parcial | `verifications` + RPC | domínio, pgTAP, E2E | escrita/releitura controladas |
| Análise técnica | Parcial | `verifications` + RPC | serviço, RLS, E2E | conflito e releitura controlados |
| Pendências | Parcial | `pendencies` + RPCs | serviço, RLS, E2E | ciclo completo por estado |
| Tentativas | Parcial | `pendency_attempts` + trigger de sincronização | serviço, remediação PEND-02 | escrita/releitura controladas |
| Contatos/cobranças | Parcial | `pendency_contacts` | idempotência e E2E | persistência/releitura controladas |
| Notas fiscais | Parcial | `registered_invoices` + RPC/trigger | atomicidade, remediação INV-01 | casos controlados de vínculo/desvínculo |
| Bens permanentes | Parcial | `assets` + `saveAssetWithLog` | inventário, PR #162, testes | escrita/releitura por perfil |
| Inventariação | Parcial | `assets` | RLS, perfil/viewport | releitura recorrente por perfil |
| Registros administrativos | Parcial | `administrative_logs` | autoria, políticas e testes | recorte/leitura controlados |
| Gestão SME | Parcial | leitura + configuração/programas | interface, serviços, RPCs, RLS | provas controladas dos comandos |
| Importação/promoção | Controlado | staging + RPCs | ambiente descartável | pacote real somente com autorização |
| Rollback de importação | Controlado | RPCs | testes descartáveis | procedimento específico quando houver operação real |
| Relatório institucional | Parcial | memória autorizada + AuditService | renderer, export audit, E2E | observação/homologação quando priorizada |
| Excel SME mensal | Comprovado | memória + assets + AuditService | PRs #136/#137/#162, OOXML, desktop | manter regressão |
| Monitor geral de Production | Comprovado | GitHub Actions + Vercel + Supabase | PRs #139/#153 e execuções recorrentes | manter regressão |
| Incidentes automáticos | Comprovado | GitHub Issues | PR #140 | observação contínua |
| Integridade lógica dos dados | Comprovado | RPC privilegiada + workflow | PR #141 e `totalIssues=0` no baseline corrente | manter regressão |

## 4. Matriz funcional executável

A fonte oficial da granularidade por operação é `FUNCTIONAL_CONTRACT_MATRIX.md`/JSON.

Estado reconciliado:

| Cobertura | Operações |
|---|---:|
| Comprovada | 9 |
| Parcial | 32 |
| Lacuna | 0 |
| Decisão pendente | 0 |

A ausência de `gap` não significa UAT concluído. Significa que nenhuma das 41 operações está atualmente classificada como defeito estrutural conhecido sem remediação.

## 5. Perfis

### Controlador

- lê escolas da própria `cre_scope`;
- carteira define responsável principal/filtro, não fronteira entre Controladores da mesma CRE;
- pode atuar em escola de colega autorizada sem transferir `controller_id`;
- não altera identidade institucional da escola;
- executa bonificação, análise, pendências, contatos, notas e bens autorizados;
- não acessa outra CRE sem escopo explícito.

### Assistente de Verbas Federais

- acesso transversal à CRE;
- Gestão de Equipe e contas Auth;
- redistribuição de carteiras;
- identidade institucional das escolas;
- ações operacionais autorizadas;
- relatórios/exportações.

### Gestão SME

- leitura gerencial de identificação e bonificação;
- sem análise técnica nas superfícies restritas;
- Pendências sem mutações operacionais;
- Registros Internos conforme recorte de autoria;
- configuração de calendário/exercícios e manutenção de programas segundo o contrato atualmente implementado.

### Inventário

- lê escolas e bens da própria CRE;
- opera fluxo patrimonial autorizado;
- não altera bonificação, análise técnica, carteiras ou configuração global.

### Administrador técnico

- infraestrutura, perfis, escopos, importação e auditoria;
- pode simular visualmente perfis sem alterar o papel efetivo do JWT.

## 6. Gestão de Equipe

Fluxo vigente:

```text
DirectoryService
→ TeamAccountGateway
→ team-account-management
→ Auth Admin
→ resolve_team_auth_user_id_by_email / RPCs transacionais
→ diretórios, perfis e auditoria
```

Contratos comprovados:

- CORS oficial passa e origem indevida falha;
- JWT/papel são obrigatórios;
- cadastro/edição/desativação preservam histórico e auditoria;
- conta existente pode ser reutilizada quando não há vínculo ativo conflitante;
- diretório/perfil divergente é rejeitado;
- lookup por e-mail é exato e não depende de `listUsers`;
- falha parcial executa compensação.

## 7. Remediações do PR #162

As seguintes lacunas técnicas foram corrigidas, mas as operações correspondentes permanecem parciais quando a matriz ainda exige prova controlada:

- `SCH-01` — identidade institucional real e duplicidades;
- `CFG-02` — versão/conteúdo do novo exercício;
- `INV-01` — bem derivado ao desvincular nota;
- `ASSET-02` — edição versionada e auditada;
- `PEND-02` — sincronização de tentativas;
- `EXP-01` e `EXP-02` — auditoria obrigatória da exportação.

## 8. Smoke autenticado

A infraestrutura do PR #148 está integrada e protegida, mas não executa jornadas reais sem cinco identidades técnicas exclusivas e habilitação explícita. Essa ausência mantém seis operações de leitura como `partial`.

## 9. Auditoria funcional histórica

O PR #156 não deve ser tratado como matriz atual. Suas evidências podem ser reutilizadas após confrontação com a `main`, mas o fechamento da auditoria deve ocorrer sobre o código atual.

## 10. Referências

- [`SUPABASE_PERMISSIONS_MATRIX.md`](SUPABASE_PERMISSIONS_MATRIX.md);
- [`SUPABASE_DATA_DICTIONARY.md`](SUPABASE_DATA_DICTIONARY.md);
- [`SUPABASE_INTEGRATION_AUDIT.md`](SUPABASE_INTEGRATION_AUDIT.md);
- [`FUNCTIONAL_CONTRACT_MATRIX.md`](FUNCTIONAL_CONTRACT_MATRIX.md);
- [`../architecture/supabase-readiness.md`](../architecture/supabase-readiness.md);
- [`../runbooks/SUPABASE_CONNECTION.md`](../runbooks/SUPABASE_CONNECTION.md);
- [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md).
