# Auditoria de integração — Supabase e frontend

**Classificação:** referência vigente  
**Atualizado em:** 5 de agosto de 2026

## 1. Parecer executivo

O Supabase é o backend canônico de Production. A integração cobre Auth, autorização, leitura, escrita, operações atômicas, Gestão de Equipe, auditoria, importação e recuperação.

A arquitetura está funcionalmente estabelecida, mas a prioridade seguinte é provar de forma uniforme cada percurso visível até o backend. Os defeitos recentes do Excel SME e da Gestão de Equipe mostraram que cobertura ampla não elimina lacunas entre camadas.

## 2. Baseline auditado

```text
main: f812e5dbf3aaa18fb9851948445b0820ac7a5435
Production Vercel: dpl_7G3Wmh1YiV4c4aXVwe2P5tN7N7Y4
Supabase: scnryinorqeucbfkioxo
estado: ACTIVE_HEALTHY
PostgreSQL: 17.6.1.147
migrations: 25
closing_competence: 2026-12
app_config.row_version: 20
Edge Function: team-account-management v95, JWT obrigatório
```

O PR nº 141 está aberto em rascunho. Seus contratos e sua proposta de 26ª migration não pertencem ao baseline.

## 3. Camadas da integração

```text
index.html e app.js
→ módulos de domínio e integração
→ serviços de aplicação
→ DataService e UnitOfWork
→ RepositoryContract
→ SupabaseRepository
→ PostgREST / RPC / Edge Function
→ Auth / RLS / PostgreSQL
→ resposta e estado em memória
→ renderização
```

### Frontend

- não usa chave administrativa;
- recebe somente configuração pública;
- aplica gate de autenticação antes da operação;
- usa serviços de aplicação para mutações;
- mantém compatibilidade local por adaptador separado;
- exibe erros mapeados por operação.

### Repositório

- paginação e lotes;
- leitura seletiva de entidades;
- tradução entre modelo de aplicação e banco;
- `row_version` e conflitos otimistas;
- RPCs para operações compostas;
- snapshots, staging, promoção e rollback.

### Banco

- RLS ativa nas tabelas expostas;
- políticas separadas por operação;
- funções privilegiadas com autorização interna;
- `search_path` fixo;
- grants mínimos;
- autoria e logs administrativos;
- constraints e relacionamentos.

## 4. Auth e autorização

O bootstrap autenticado:

1. restaura ou cria sessão;
2. deduplica validações simultâneas;
3. consulta perfil, papel e escopos em paralelo;
4. rejeita perfil inativo ou ausência de autorização;
5. cria cliente autenticado;
6. carrega entidades operacionais autorizadas;
7. aplica a organização visual do perfil.

Papéis:

- `controller`;
- `federal_assistant`;
- `sme_management`;
- `inventory`;
- `technical_admin`.

A simulação visual do administrador técnico não altera o JWT.

## 5. Integração da Gestão de Equipe

### Percurso

```text
formulário
→ DirectoryService
→ TeamAccountGateway
→ fetch da Edge Function
→ CORS + JWT + papel
→ Auth Admin
→ RPC transacional
→ diretório, perfil, escopo e auditoria
→ resposta
→ renderEquipe()
```

### Correções consolidadas no PR nº 138

- preflight deixou de depender obrigatoriamente de segredo ausente;
- allowlist canônica de origens estáveis;
- origem indevida retorna rejeição;
- erros de origem, configuração e indisponibilidade são classificados;
- vínculos históricos são recuperados por `user_profiles` quando seguros;
- divergência de identidade é bloqueada;
- cadastro, edição, redistribuição e desativação foram homologados;
- compensação protege Auth e banco contra estado parcial.

### Estado remoto

```text
slug: team-account-management
version: 95
status: ACTIVE
verify_jwt: true
```

## 6. Integração de dados operacionais

| Entidade/fluxo | Interface | Serviço | Backend |
|---|---|---|---|
| configuração | SME/configuração | ConfigurationService | `app_config`, `competences`, `programs`, RPCs |
| escolas | Carteira/Prontuário | SchoolService | `schools`, `school_programs` |
| verificações | Prontuário/Competências | VerificationService | `verifications`, RPCs |
| pendências | Pendências/Prontuário | PendencyService | `pendencies`, `pendency_attempts`, `pendency_contacts` |
| notas | Prontuário | InvoiceService | `registered_invoices`, RPCs |
| bens | Capital/Inventário | InventoryService | `assets`, RPCs |
| equipe | Gestão de Equipe | DirectoryService | Edge Function + diretórios + Auth |
| logs | Registros Internos | AuditService | `administrative_logs` |
| importação | superfície técnica | ImportCoordinator | staging e RPCs de promoção/rollback |

A próxima matriz deverá decompor cada botão e transição, não apenas cada entidade.

## 7. RLS e escopos

### Controlador

- leitura e escrita autorizadas na própria CRE conforme regra vigente;
- carteira permanece responsabilidade principal;
- exceções podem usar `user_school_scopes`;
- outra CRE permanece bloqueada sem escopo.

### Assistente

- acesso transversal à CRE;
- Gestão de Equipe;
- ações operacionais autorizadas.

### Inventário

- escolas e bens da própria CRE;
- mutações patrimoniais;
- sem bonificação, análise ou configuração.

### Gestão SME

- leitura gerencial;
- sem análise técnica nas superfícies restritas;
- sem mutações de Pendências;
- logs apenas da própria autoria;
- configuração conforme políticas atuais.

### Administrador técnico

- infraestrutura, perfis, escopos, importação e auditoria.

## 8. Migrations e alinhamento

Production possui 25 migrations correspondentes. A migration SME está registrada como:

```text
20260728182226_sme_access_governance
```

O identificador derivado foi removido do histórico sem reaplicação do SQL.

Antes de nova migration:

- comparar histórico local/remoto;
- reset local;
- pgTAP;
- lint SQL;
- tipos;
- backup/restauração descartáveis;
- `db push --dry-run`;
- plano de reversão;
- autorização para aplicação.

## 9. Garantia operacional

O monitor de Production verifica:

- SHA publicado;
- manifesto e modo de dados;
- shell e assets;
- gate de autenticação;
- bloqueio anônimo;
- preflight das Edge Functions;
- incidentes automáticos.

Ele não autentica todas as contas nem executa as mutações do produto.

## 10. Lacunas prioritárias

1. catálogo `perfil × tela × ação × serviço × backend`;
2. smoke autenticado somente leitura em Production;
3. releitura após refresh como contrato padrão;
4. provas controladas de escrita por módulo;
5. conflitos de versão na experiência do usuário;
6. compensação de todas as operações compostas;
7. decisão funcional sobre configurações de programas da SME;
8. conclusão ou reavaliação do PR nº 141.

## 11. Conclusão

A integração está ativa e possui arquitetura, RLS, Auth, RPCs e Edge Function coerentes. O próximo ganho de confiança não vem de outra refatoração ampla, mas de ligar cada atividade real a uma prova ponta a ponta permanente.

## 12. Referências

- [`SUPABASE_FUNCTIONAL_COVERAGE.md`](SUPABASE_FUNCTIONAL_COVERAGE.md);
- [`SUPABASE_PERMISSIONS_MATRIX.md`](SUPABASE_PERMISSIONS_MATRIX.md);
- [`SUPABASE_DATA_DICTIONARY.md`](SUPABASE_DATA_DICTIONARY.md);
- [`../runbooks/SUPABASE_CONNECTION.md`](../runbooks/SUPABASE_CONNECTION.md);
- [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md);
- [`../audits/2026-08-05-reconciliacao-documental-integral.md`](../audits/2026-08-05-reconciliacao-documental-integral.md).
