# Runbook — conexão controlada com Supabase

## Situação atual

O projeto remoto autorizado é `scnryinorqeucbfkioxo`. O schema, a carga canônica e os vínculos funcionais de Auth já foram concluídos e validados para os usuários cadastrados.

O conjunto versionado contém atualmente **19** migrations.

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

Comandos canônicos:

```bash
supabase migration list --linked
supabase db push --linked --dry-run
supabase db push --linked
```

O contrato pós-aplicação está em `supabase/verification/remote-post-apply.sql` e deve reconhecer exatamente as 19 migrations versionadas.

As migrations patrimoniais finais são:

- `20260721152515_inventory_cre_read_access.sql` — registra o primeiro ajuste aplicado remotamente;
- `20260721152634_inventory_capital_section_scope.sql` — separa o acesso patrimonial do predicado genérico;
- `20260721153758_inventory_capital_section_inline_scope.sql` — consolida o estado final diretamente nas políticas RLS e remove a helper transitória.

A terceira migration é o contrato final vigente. As anteriores permanecem versionadas porque integram o histórico remoto real.

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

## 3. Publicação automática do Preview

A integração Git–Vercel já existente cria deployments Preview para branches e pull requests.

O build `scripts/build-vercel.mjs` aplica automaticamente a configuração pública abaixo quando:

- `VERCEL_ENV=preview`; e
- nenhuma variável `RADAR_*` de runtime foi definida explicitamente.

```text
RADAR_DATA_MODE=supabase-preview
RADAR_ENVIRONMENT=preview
RADAR_SUPABASE_REPOSITORY_ENABLED=true
RADAR_SUPABASE_URL=https://scnryinorqeucbfkioxo.supabase.co
RADAR_SUPABASE_PUBLISHABLE_KEY=<chave sb_publishable_ versionada>
RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED=false
```

A URL e a chave publicável fazem parte da configuração pública do cliente Supabase. Não utilizar:

- `VERCEL_TOKEN`;
- `VERCEL_ORG_ID`;
- `VERCEL_PROJECT_ID`;
- chave `service_role`;
- chave `sb_secret_`;
- senha de banco.

Configuração RADAR explícita prevalece sobre o padrão automático. Isso permite testes controlados sem alterar o contrato normal.

O manifesto do Preview deve apresentar:

```text
runtimeEnvironment: preview
dataMode: supabase-preview
supabaseRepositoryEnabled: true
productionActivationApproved: false
```

Production deve continuar apresentando:

```text
runtimeEnvironment: local
dataMode: local
supabaseRepositoryEnabled: false
productionActivationApproved: false
```

## 4. Homologar autenticação e autorização

Para cada acesso, comprovar:

- login e logout;
- restauração de sessão após recarregar;
- perfil institucional correto;
- menus, abas, telas e ações esperadas;
- ausência de funções indevidas;
- funcionamento em desktop e celular.

Perfis mínimos da homologação:

- Administrador técnico;
- Assistente de Verbas Federais;
- Controladores;
- Equipe de Inventário;
- SME (Gestão), quando houver conta de homologação disponível.

## 5. Matriz funcional mínima

### Administrador técnico

- gerencia perfis, escopos e auditoria;
- não herda a operação cotidiana da Assistente;
- não aparece como perfil operacional comum.

### Assistente de Verbas Federais

- acessa toda a 4ª CRE;
- gerencia controladores e carteiras;
- gerencia a equipe de Inventário;
- acompanha dashboards, pendências e próximas ações.

### Controladores

- acessam e executam ações operacionais em todas as escolas da 4ª CRE;
- iniciam o Dashboard pela própria carteira, usada como recorte padrão e atribuição de responsabilidade;
- podem consultar outras carteiras e cobrir férias, licenças, ausências ou sobrecarga da equipe;
- mantêm a autoria individual de cada ação no histórico e na auditoria;
- não transferem automaticamente a responsabilidade principal da escola ao atuar fora da própria carteira;
- não acessam escolas de outra CRE sem exceção explícita registrada em `user_school_scopes`.

### Equipe de Inventário

- entra automaticamente no perfil operacional `inventario`;
- acessa o menu e o painel **Capital e Inventário**;
- consulta as 163 escolas e os 430 vínculos escola–programa da própria `cre_scope` para compor o acompanhamento patrimonial;
- consulta e atualiza bens patrimoniais da própria CRE, inclusive a ação de concluir a inventariação;
- não recebe escrita cadastral nas escolas;
- não recebe bonificação, análise técnica, pendências operacionais, contatos ou configuração global;
- não acessa escolas ou bens de outra CRE.

## 6. Persistência e auditoria

No Preview conectado:

1. criar registro de homologação claramente identificado;
2. recarregar e confirmar persistência;
3. atualizar o registro;
4. confirmar incremento e conflito de `row_version`;
5. confirmar entrada correspondente em `audit_events`;
6. confirmar ausência de duplicidade;
7. remover ou reverter o dado de homologação ao final.

Para o Inventário, o teste deve usar um bem patrimonial de homologação em estado `Encaminhada`, concluir a inventariação e confirmar responsável, data, status e auditoria.

## 7. Gestão de Equipe

Homologar o ciclo completo:

1. convidar integrante;
2. confirmar conta Auth e perfil;
3. atribuir carteira ou vínculo funcional;
4. editar dados permitidos;
5. desativar acesso;
6. redistribuir carteira quando necessário;
7. confirmar bloqueio do usuário desativado;
8. preservar histórico e auditoria;
9. repetir a operação para comprovar idempotência.

Credenciais administrativas permanecem exclusivamente na Edge Function.

## 8. Segurança e recuperação

Antes de Production:

- executar RLS positiva e negativa por perfil;
- confirmar que usuário anônimo não lê dados institucionais;
- confirmar colaboração entre Controladores da mesma CRE e bloqueio entre CREs sem exceção;
- confirmar que Inventário vê somente a superfície patrimonial da própria CRE;
- confirmar ausência de chave administrativa no bundle;
- analisar Security e Performance Advisors;
- tratar bloqueadores reais de segurança;
- testar backup e restauração;
- testar rollback;
- definir política de MFA para perfis privilegiados;
- manter CI verde no mesmo commit implantado.

## 9. Critérios para Production

A ativação futura de `supabase-production` exige simultaneamente:

- Preview homologado por todos os perfis;
- todas as abas e telas avaliadas;
- persistência, RLS e auditoria aprovadas;
- Gestão de Equipe aprovada;
- rollback, backup e restauração comprovados;
- Advisors tratados;
- MFA definido;
- autorização funcional e técnica específica.

Sem esses requisitos, `RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED` permanece `false` e a aplicação deve continuar fail-closed.
