# Runbook — conexão controlada com Supabase

## Situação atual

O projeto remoto autorizado é `scnryinorqeucbfkioxo`. O schema, a carga canônica e os primeiros vínculos de Auth já foram concluídos e validados.

O conjunto versionado contém atualmente **14** migrations.

A carga remota contém:

- 1 configuração geral;
- 8 programas;
- 5 controladores;
- 3 integrantes de Inventário;
- 12 competências;
- 163 escolas;
- 430 vínculos escola–programa.

Production continua em `localStorage`, com repositório Supabase desabilitado e `productionActivationApproved: false`.

## Regras permanentes

- Não reutilizar projeto Supabase de outra aplicação.
- Não inserir chave administrativa no frontend, bundle ou artefatos.
- Usar somente chave publicável no navegador.
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

O contrato pós-aplicação está em `supabase/verification/remote-post-apply.sql` e deve reconhecer exatamente as 14 migrations versionadas.

## 2. Estado de dados e Auth

Antes de publicar um Preview, confirmar:

- 163 escolas;
- 430 vínculos escola–programa;
- ausência de referências órfãs;
- cinco perfis institucionais ativos;
- Administrador técnico ativo;
- Assistente de Verbas Federais ativa;
- duas Controladoras vinculadas aos respectivos cadastros;
- nenhum usuário com múltiplos perfis ativos.

As senhas não são armazenadas no repositório nem tratadas por workflows operacionais.

## 3. Configurar e publicar somente o Preview

Usar o workflow:

```text
.github/workflows/configurar-e-publicar-preview-supabase.yml
```

Parâmetros:

- `publishable_key`: chave iniciada por `sb_publishable_`;
- `confirmation`: `PUBLICAR_PREVIEW_SUPABASE_RADAR_PDDE`.

O workflow configura exclusivamente no ambiente Preview:

```text
RADAR_DATA_MODE=supabase-preview
RADAR_ENVIRONMENT=preview
RADAR_SUPABASE_REPOSITORY_ENABLED=true
RADAR_SUPABASE_URL=https://scnryinorqeucbfkioxo.supabase.co
RADAR_SUPABASE_PUBLISHABLE_KEY=<chave publicável>
RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED=false
```

Depois executa:

1. `vercel pull --environment=preview`;
2. build versionado;
3. validação de `dist/radar-build-manifest.json`;
4. `vercel deploy --prebuilt` sem `--prod`;
5. validação do manifesto publicado;
6. verificação de que Production continua local.

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

Validar os quatro acessos iniciais:

- Administrador técnico;
- Assistente de Verbas Federais;
- Controladora A;
- Controladora B.

Para cada acesso, comprovar:

- login e logout;
- restauração de sessão após recarregar;
- perfil institucional correto;
- menus, abas, telas e ações esperadas;
- ausência de funções indevidas;
- funcionamento em desktop e celular.

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

### Controladoras

- acessam somente a própria carteira e exceções autorizadas;
- não leem nem alteram a carteira da outra controladora;
- registram verificações, pendências, contatos e reanálises no escopo permitido.

## 6. Persistência e auditoria

No Preview conectado:

1. criar registro de homologação claramente identificado;
2. recarregar e confirmar persistência;
3. atualizar o registro;
4. confirmar incremento e conflito de `row_version`;
5. confirmar entrada correspondente em `audit_events`;
6. confirmar ausência de duplicidade;
7. remover ou reverter o dado de homologação ao final.

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
- confirmar ausência de chave administrativa no bundle;
- analisar Security e Performance Advisors;
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
