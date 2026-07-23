# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 21 de julho de 2026  
**Commit-base da ativação:** `1d500884ddec0424c1e6dab59eb474dc9cde6fe1`  
**Natureza:** documento operacional e transitório

## 1. Regra de leitura

Antes de iniciar tarefa:

1. confirme o HEAD remoto da `main`;
2. verifique PRs e workflows posteriores;
3. confirme o deployment Vercel correspondente;
4. confirme o estado real do projeto Supabase;
5. atualize este documento quando o estado mudar.

Relatórios históricos não substituem este estado operacional.

## 2. Estado consolidado

O RADAR PDDE possui:

- quatro perfis funcionais e um papel técnico separado;
- dashboard, carteira, competências, pendências, prontuário, Gestão de Equipe, Capital e Inventário e registros;
- `SupabaseRepository` como backend de Preview e Production;
- `LocalStorageRepository` preservado somente para rollback emergencial;
- concorrência otimista por `row_version`;
- **24 migrations SQL versionadas; 23 já aplicadas em Production e a migration de hardening de segurança aguardando homologação antes da aplicação**;
- acesso colaborativo dos Controladores da mesma CRE;
- escopo específico de Capital e Inventário para a própria CRE;
- RLS, auditoria, importação, reconciliação e rollback;
- Edge Function `team-account-management` ativa e protegida por JWT;
- testes unitários, integração, E2E e pgTAP.

A integração técnica entre site, Auth, RLS, banco e Vercel está concluída. A etapa seguinte é operação real pelos usuários, não nova construção da conexão.

## 3. Dados e ponto de restauração

Projeto autorizado: `scnryinorqeucbfkioxo`.

| Entidade estrutural | Quantidade |
|---|---:|
| Configuração geral | 1 |
| Programas | 8 |
| Controladores | 5 |
| Equipe de Inventário no diretório | 3 |
| Competências | 12 |
| Escolas | 163 |
| Vínculos escola–programa | 430 |

Antes da ativação de Production foi registrado o backup lógico:

```text
import_id: PROD-ACTIVATION-BACKUP-20260721
finalidade: restauração pré-ativação
```

Todos os registros operacionais identificados por `HML-*` foram removidos após o backup. Pendências, tentativas, contatos, verificações, notas e bens iniciam sem massa artificial. Escolas, programas, carteiras, perfis e auditoria foram preservados.

## 4. Identidades configuradas

Foram vinculados e validados:

- um Administrador Técnico;
- uma Assistente de Verbas Federais;
- cinco Controladores;
- dois integrantes operacionais da Equipe de Inventário.

As nove contas possuem e-mail confirmado, senha configurada, perfil ativo e `cre_scope = '4ª CRE'`.

Observações:

- a integrante Juliana permanece apenas no diretório de Inventário, sem conta Auth;
- não existe conta ativa de `sme_management`;
- essas ausências não bloqueiam a operação dos usuários já autorizados.

## 5. Controladores

A carteira individual é responsabilidade principal, filtro inicial e organização do trabalho. Não é barreira de acesso entre os cinco Controladores da 4ª CRE.

- as carteiras somam 163 escolas;
- cada Controlador consulta e opera todas as escolas da 4ª CRE;
- atuação fora da carteira não transfere responsabilidade;
- autoria permanece vinculada ao executor;
- outra CRE permanece bloqueada sem exceção explícita.

## 6. Capital e Inventário

Odair e Aylane possuem conta Auth, perfil `inventory` e `cre_scope = '4ª CRE'`.

O perfil:

- consulta as 163 escolas da própria CRE;
- consulta os 430 vínculos escola–programa;
- consulta, cria e atualiza bens patrimoniais permitidos pela interface;
- pode concluir a inventariação de bem encaminhado;
- não recebe escrita cadastral nas escolas;
- não recebe bonificação, análise técnica, contatos ou configuração global;
- não acessa escolas ou bens de outra CRE.

## 7. Contrato Vercel

### Production

```text
runtimeEnvironment: production
dataMode: supabase-production
supabaseRepositoryEnabled: true
productionActivationApproved: true
```

O build de `VERCEL_ENV=production` aplica esse contrato automaticamente, utilizando somente URL e chave publicável do Supabase.

### Preview

```text
runtimeEnvironment: preview
dataMode: supabase-preview
supabaseRepositoryEnabled: true
productionActivationApproved: false
```

Preview e Production são construídos separadamente; nenhum artefato de Preview é promovido.

### Rollback emergencial

Definir na Vercel Production:

```text
RADAR_PRODUCTION_FORCE_LOCAL=true
```

O build retorna ao modo local, sem apagar ou modificar o banco. A remoção da variável restaura o Supabase Production no deployment seguinte.

## 8. Segurança operacional

- usuário anônimo não acessa dados institucionais;
- o frontend recebe apenas chave `sb_publishable_`;
- `service_role`, senha de banco e chaves secretas não entram no bundle;
- RLS restringe leituras e escritas por papel e `cre_scope`;
- a Edge Function exige JWT;
- alterações são registradas em auditoria;
- o backup pré-ativação permanece disponível para restauração controlada.

## 9. Próxima tarefa única

A conexão está encerrada tecnicamente. A próxima atividade é a entrada em operação:

1. cada usuário realiza o primeiro login com sua senha;
2. os Controladores iniciam os lançamentos reais;
3. a Assistente acompanha competências e verificações;
4. Odair e Aylane iniciam os registros de Capital e Inventário;
5. o Administrador Técnico acompanha Auth, auditoria e eventuais bloqueios.

Não criar nova camada de integração ou fallback paralelo sem uma falha comprovada no contrato atual.
