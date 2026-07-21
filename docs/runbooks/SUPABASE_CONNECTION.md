# Runbook — conexão controlada com Supabase

## Situação atual

O projeto remoto autorizado é `scnryinorqeucbfkioxo`. O schema, a carga canônica e os vínculos funcionais de Auth já foram concluídos e validados para os usuários cadastrados.

O conjunto versionado contém atualmente **20** migrations.

A carga remota contém:

- 1 configuração geral;
- 8 programas;
- 5 controladores;
- 3 integrantes no diretório de Inventário;
- 12 competências;
- 163 escolas;
- 430 vínculos escola–programa.

Production continua em `localStorage`, com repositório Supabase desabilitado e `productionActivationApproved: false`.

## Regras permanentes

- Não reutilizar projeto Supabase de outra aplicação.
- Não inserir chave administrativa no frontend, bundle ou artefatos.
- Usar somente chave `sb_publishable_` no navegador.
- Não promover deployment Preview para Production.
- Não ativar Production antes da homologação completa dos perfis, telas e permissões.
- Manter apenas um perfil institucional ativo por usuário.

## 1. Contrato de migrations

Os arquivos em `supabase/migrations` são a única fonte da ordem. Não manter lista manual paralela.

```bash
supabase migration list --linked
supabase db push --linked --dry-run
supabase db push --linked
```

O contrato pós-aplicação está em `supabase/verification/remote-post-apply.sql` e deve reconhecer exatamente as 20 migrations versionadas.

As migrations patrimoniais são:

- `20260721152515_inventory_cre_read_access.sql` — primeiro ajuste remoto de leitura por CRE;
- `20260721152634_inventory_capital_section_scope.sql` — separação do escopo patrimonial;
- `20260721153758_inventory_capital_section_inline_scope.sql` — consolidação nas políticas RLS e remoção da helper transitória;
- `20260721160100_inventory_generic_asset_scope_by_cre.sql` — correção final da fronteira de CRE no predicado genérico do Inventário.

As quatro permanecem versionadas porque integram o histórico remoto real. A migration 20 complementa o estado final ao impedir acesso a escola de outra CRE apenas por possuir bem cadastrado.

## 2. Estado de dados e Auth

Antes de publicar um Preview, confirmar:

- 163 escolas;
- 430 vínculos escola–programa;
- ausência de referências órfãs;
- perfil institucional ativo para cada usuário autorizado;
- vínculo funcional correto com Controlador ou integrante do Inventário;
- nenhum usuário com múltiplos perfis ativos;
- e-mail confirmado e senha configurada no Auth.

As senhas não são armazenadas no repositório nem tratadas por workflows operacionais.

## 3. Preview e Production

O Preview usa:

```text
RADAR_DATA_MODE=supabase-preview
RADAR_ENVIRONMENT=preview
RADAR_SUPABASE_REPOSITORY_ENABLED=true
RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED=false
```

Production deve continuar com:

```text
runtimeEnvironment: local
dataMode: local
supabaseRepositoryEnabled: false
productionActivationApproved: false
```

Nunca publicar no navegador `service_role`, `sb_secret_`, senha de banco ou tokens operacionais da Vercel.

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

### Assistente, SME e Administrador técnico

Mantêm as permissões previstas na matriz canônica `docs/reference/SUPABASE_PERMISSIONS_MATRIX.md`.

## 5. Homologação

Para cada perfil, comprovar:

- login, logout e restauração de sessão;
- menus, abas, telas e ações esperadas;
- ausência de funções indevidas;
- funcionamento em desktop e celular;
- persistência após recarregar;
- incremento de `row_version` quando aplicável;
- auditoria e autoria;
- bloqueio de operações negativas.

Para o Inventário, usar um bem de homologação em estado `Encaminhada`, concluir a inventariação e confirmar responsável, data, status e auditoria. Remover ou reverter o dado ao final.

## 6. Segurança e recuperação

Antes de Production:

- executar RLS positiva e negativa por perfil;
- confirmar que usuário anônimo não lê dados institucionais;
- confirmar colaboração entre Controladores da mesma CRE;
- confirmar que Inventário vê somente a superfície patrimonial da própria CRE;
- analisar Security e Performance Advisors;
- testar backup, restauração e rollback;
- definir MFA para perfis privilegiados;
- manter CI verde no mesmo commit implantado.

Sem homologação completa e autorização específica, Production permanece local e fail-closed.
