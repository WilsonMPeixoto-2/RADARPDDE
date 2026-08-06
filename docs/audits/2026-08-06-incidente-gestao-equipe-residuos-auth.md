# Incidente P0 — Gestão de Equipe bloqueada por resíduos Auth de homologação

**Data da reprodução:** 6 de agosto de 2026  
**Ambiente:** Production  
**Status:** causa-raiz confirmada; correção em desenvolvimento no PR nº 161

## Sintomas relatados

- exclusão de integrante sintético do Inventário retorna falsa indisponibilidade;
- controlador sintético permanece associado a escola de homologação;
- controladora cuja transição partiu do Inventário não aparece como destino de carteira;
- confiabilidade de cadastro, edição e desativação da equipe fica indeterminada para o usuário.

## Evidência remota

A tentativa de desativar o integrante HML percorreu corretamente:

```text
sessão autenticada
→ current_app_role = perfil autorizado
→ inventory_team_members
→ user_profiles
→ Auth Admin getUserById
```

A última etapa respondeu HTTP 500. O Auth registrou:

```text
error finding user: sql: Scan error on column confirmation_token:
converting NULL to string is unsupported
```

A consulta direta ao banco confirmou treze usuários Auth. Somente os dois usuários sintéticos HML possuíam simultaneamente:

- `confirmation_token is null`;
- `recovery_token is null`;
- `email_change_token_new is null`.

Essas contas foram inseridas por homologação direta e não pelo ciclo normal do GoTrue.

## Causa-raiz estrutural

A Edge Function usa `auth.admin.listUsers` para procurar uma conta por e-mail. Essa operação percorre o catálogo Auth inteiro. Um único registro legado malformado pode fazer o GoTrue falhar antes de alcançar o usuário procurado, bloqueando o cadastro de qualquer novo controlador ou integrante não relacionado.

Na desativação, a consulta direta da própria conta HML também falha pelo mesmo motivo. A Edge Function recebe o erro administrativo e o gateway termina exibindo a mensagem genérica de indisponibilidade.

## Estado dos resíduos HML

Foram confirmados exclusivamente:

- um controlador sintético HML ativo;
- um integrante sintético HML ativo;
- uma escola temporária de homologação;
- um vínculo de programa;
- uma verificação;
- dois escopos de escola;
- logs administrativos históricos;
- dois usuários Auth sintéticos malformados.

Não foram encontrados para a escola HML:

- pendências;
- contatos;
- bens patrimoniais;
- notas fiscais.

As FKs existentes permitem excluir o conjunto sintético preservando os logs: dependências operacionais usam `CASCADE` e referências históricas em logs usam `SET NULL`.

## Estado da transição real Inventário → Controlador

A desativação do vínculo de Inventário foi concluída e auditada. A etapa posterior de criação do controlador não foi concluída no incidente anterior. O estado atual contém:

- diretório de Inventário preservado e inativo;
- perfil de Inventário preservado e inativo;
- conta Auth existente e bloqueada;
- ausência de registro no diretório `controllers`;
- ausência de perfil ativo `controller`.

Por isso, a pessoa não pode aparecer no seletor de redistribuição de carteira. O PR nº 150 corrigiu o código para novas tentativas, mas deliberadamente não conciliou esse dado real já interrompido.

## Evento não relacionado

Os registros PostgreSQL `permission denied for table schools` observados no mesmo período vieram de preflights anônimos automatizados executados por Node. Eles não correspondem ao clique do usuário e não constituem a causa desta falha.

## Correção definida

1. substituir `listUsers` por RPC administrativa que resolve somente o UUID do e-mail solicitado;
2. restringir a RPC a `service_role`;
3. normalizar campos textuais Auth nulos incompatíveis com GoTrue;
4. definir defaults vazios para impedir nova inserção direta com os mesmos nulos;
5. remover exclusivamente o conjunto HML conhecido;
6. homologar cadastro, transição, desativação e redistribuição com releitura e limpeza;
7. concluir separadamente a criação da controladora real, preservando o histórico de Inventário e sem mover escolas automaticamente.

## Critérios de encerramento

- nenhuma conta Auth com os três tokens textuais nulos;
- nenhum registro HML nos diretórios, perfis, Auth ou escolas;
- Edge Function sem `listUsers`;
- lookup por e-mail acessível somente ao `service_role`;
- cadastro de integrante válido não afetado por registro Auth legado não relacionado;
- transição Inventário → Controlador comprovada após recarga;
- controladora real visível no seletor;
- carteira real inalterada até decisão operacional explícita;
- monitores, pgTAP, E2E, readiness e backup/restauração aprovados.
