# Runbook — conexão controlada com Supabase

## Situação atual

O projeto remoto autorizado é `scnryinorqeucbfkioxo`. O schema, a carga estrutural e os vínculos funcionais de Auth estão concluídos.

O conjunto versionado contém atualmente **20** migrations.

A carga estrutural contém:

- 1 configuração geral;
- 8 programas;
- 5 controladores;
- 3 integrantes no diretório de Inventário;
- 12 competências;
- 163 escolas;
- 430 vínculos escola–programa.

Production utiliza `SupabaseRepository` em `supabase-production`. O `LocalStorageRepository` permanece somente como rollback emergencial explícito.

## Regras permanentes

- Não reutilizar projeto Supabase de outra aplicação.
- Não inserir chave administrativa no frontend, bundle ou artefatos.
- Usar somente chave `sb_publishable_` no navegador.
- Não promover deployment Preview para Production.
- Manter apenas um perfil institucional ativo por usuário.
- Não reintroduzir registros de homologação `HML-*` na base operacional.
- Não criar novo fallback paralelo sem falha comprovada.

## 1. Contrato de migrations

Os arquivos em `supabase/migrations` são a única fonte da ordem.

```bash
supabase migration list --linked
supabase db push --linked --dry-run
supabase db push --linked
```

O contrato pós-aplicação em `supabase/verification/remote-post-apply.sql` reconhece exatamente as 20 migrations versionadas.

As migrations patrimoniais são:

- `20260721152515_inventory_cre_read_access.sql` — primeiro ajuste remoto de leitura por CRE;
- `20260721152634_inventory_capital_section_scope.sql` — separação do escopo patrimonial;
- `20260721153758_inventory_capital_section_inline_scope.sql` — consolidação nas políticas RLS e remoção da helper transitória;
- `20260721160056_inventory_generic_asset_scope_by_cre.sql` — correção final da fronteira de CRE no predicado genérico do Inventário.

## 2. Estado de dados e Auth

Confirmar periodicamente:

- 163 escolas;
- 430 vínculos escola–programa;
- ausência de referências órfãs;
- perfil institucional ativo para cada usuário autorizado;
- vínculo funcional correto;
- nenhum usuário com múltiplos perfis ativos;
- e-mail confirmado e senha configurada no Auth.

As senhas não são armazenadas no repositório nem tratadas por workflows operacionais.

O backup lógico anterior à ativação está registrado em `data_import_runs` com:

```text
import_id: PROD-ACTIVATION-BACKUP-20260721
```

A massa `HML-*` foi removida após o backup. As tabelas operacionais iniciam limpas para os lançamentos reais.

## 3. Preview e Production

### Preview

```text
RADAR_DATA_MODE=supabase-preview
RADAR_ENVIRONMENT=preview
RADAR_SUPABASE_REPOSITORY_ENABLED=true
RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED=false
```

### Production

```text
RADAR_DATA_MODE=supabase-production
RADAR_ENVIRONMENT=production
RADAR_SUPABASE_REPOSITORY_ENABLED=true
RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED=true
```

O build da Vercel aplica automaticamente o contrato correspondente ao `VERCEL_ENV`. A URL e a chave publicável estão no runtime público; `service_role`, `sb_secret_`, senha de banco e tokens da Vercel são proibidos.

### Rollback emergencial

Definir em Production:

```text
RADAR_PRODUCTION_FORCE_LOCAL=true
```

O deployment seguinte retorna a:

```text
runtimeEnvironment: local
dataMode: local
supabaseRepositoryEnabled: false
productionActivationApproved: false
```

O rollback não apaga, reverte ou modifica dados do Supabase. Para restaurar a conexão, remover o sinal e publicar novo deployment.

## 4. Perfis funcionais

### Controladores

- iniciam pelo recorte da própria carteira;
- acessam e executam ações operacionais nas 163 escolas da 4ª CRE;
- preservam responsabilidade principal e autoria individual;
- não acessam outra CRE sem exceção explícita.

### Equipe de Inventário

- entra automaticamente no perfil operacional `inventario`;
- acessa o menu e o painel **Capital e Inventário**;
- consulta as 163 escolas e os 430 vínculos escola–programa da própria `cre_scope`;
- consulta, cria e atualiza bens patrimoniais permitidos pela interface;
- pode concluir a inventariação de bem encaminhado;
- não recebe escrita cadastral nas escolas;
- não recebe bonificação, análise técnica, contatos ou configuração global;
- não acessa escolas ou bens de outra CRE.

### Assistente, SME e Administrador Técnico

Mantêm as permissões previstas em `docs/reference/SUPABASE_PERMISSIONS_MATRIX.md`.

## 5. Homologação de deployment

O workflow de Production deve comprovar em desktop, Android e iPhone:

- manifesto `supabase-production`;
- tela de login obrigatória;
- aplicação operacional inerte antes da autenticação;
- chave pública sem qualquer segredo administrativo;
- usuário anônimo recebendo zero escolas pela RLS;
- ausência de erro fatal e overflow.

Os fluxos autenticados são exercitados pelos usuários reais e permanecem cobertos pelos testes locais de Auth, RLS, pgTAP e E2E.

## 6. Segurança e recuperação

- usuário anônimo não lê dados institucionais;
- Controladores colaboram somente dentro da própria CRE;
- Inventário vê somente a superfície patrimonial da própria CRE;
- a Edge Function `team-account-management` exige JWT;
- Security e Performance Advisors devem ser revisados após mudanças de schema;
- o backup pré-ativação deve ser mantido;
- MFA deve ser priorizado para perfis privilegiados;
- CI deve permanecer verde no mesmo commit implantado.
