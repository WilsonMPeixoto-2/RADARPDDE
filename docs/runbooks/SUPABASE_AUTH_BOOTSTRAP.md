# Bootstrap do primeiro administrador técnico

**Classificação:** procedimento histórico e restrito  
**Estado atual:** o Supabase Production está ativo; este documento não é rotina operacional  
**Atualizado em:** 29 de julho de 2026

## 1. Finalidade original

Este procedimento foi criado para estabelecer ou reconciliar, de forma idempotente, a primeira identidade Auth com perfil `technical_admin` durante a preparação de um projeto Supabase isolado.

A operação já não representa o estado normal do RADAR PDDE. Production usa Supabase e possui identidades institucionais. Não executar este bootstrap novamente no projeto autorizado sem plano específico de recuperação, evidência de ausência ou inconsistência do primeiro administrador e autorização expressa.

## 2. Quando o documento pode ser usado

Somente em uma destas situações:

1. criação de novo projeto Supabase isolado e autorizado;
2. ambiente descartável de recuperação;
3. reconstrução formal após incidente, com diagnóstico comprovado;
4. reconciliação de identidade administrativa ausente ou inconsistente, aprovada pelos responsáveis.

Não usar para:

- cadastrar administrador adicional;
- substituir Gestão de Equipe;
- alterar perfil de usuário existente;
- contornar RLS ou Edge Function;
- redefinir credenciais em Production;
- testar informalmente uma conta.

## 3. Pré-requisitos

- projeto e ambiente confirmados;
- migrations aplicadas e histórico alinhado;
- `profiles.id = 'technical_admin'` existente;
- autorização registrada;
- backup e plano de recuperação quando aplicável;
- operador autorizado;
- quatro variáveis disponíveis somente no processo:
  - `RADAR_SUPABASE_URL`;
  - `RADAR_SUPABASE_SERVICE_ROLE_KEY`;
  - `RADAR_BOOTSTRAP_ADMIN_EMAIL`;
  - `RADAR_BOOTSTRAP_ADMIN_PASSWORD`.

Nenhuma variável pode ser gravada no repositório, `.env` versionado, argumento de linha de comando, ticket, chat ou log compartilhado.

## 4. Comandos

Em ambiente autorizado e isolado:

```powershell
npm run bootstrap:supabase:admin -- validate
npm run bootstrap:supabase:admin -- plan
npm run bootstrap:supabase:admin
npm run bootstrap:supabase:admin -- reconcile
```

- `validate`: verifica somente o ambiente necessário;
- `plan`: apresenta o plano estático sem chamada remota;
- comando sem argumento: executa `apply`;
- `reconcile`: repete a convergência idempotente.

Antes de `apply`, registrar projeto, ambiente, responsável, motivo, resultado esperado e critério de aborto.

## 5. Contrato

O perfil criado ou reconciliado é:

```text
profile_id = technical_admin
active = true
cre_scope = 4ª CRE
controller_id = null
inventory_member_id = null
```

O relatório sanitizado contém somente:

- `ok`;
- `created`;
- `userId`;
- `profileId`;
- `active`.

Nunca contém e-mail, senha, token ou chave administrativa.

## 6. Compensação

Se vínculo ou auditoria falhar após criação Auth, a ferramenta tenta remover a identidade recém-criada e, quando isso não estiver disponível, bani-la.

Ela não deve:

- remover identidade preexistente;
- bloquear usuário preexistente para forçar convergência;
- sobrescrever perfil incompatível;
- criar segunda associação ativa.

Qualquer incompatibilidade interrompe a operação e exige revisão humana.

## 7. Verificação posterior

Confirmar no console administrativo:

- identidade confirmada;
- um único `user_profiles` ativo;
- papel `technical_admin`;
- escopo esperado;
- nenhuma carteira ou vínculo de Inventário;
- log sanitizado;
- ausência de segredo na evidência.

Executar também os testes de Auth e RLS aplicáveis.

## 8. Relação com o estado atual

O cadastro e manutenção cotidianos de Controladores e Inventário passam pela Gestão de Equipe, Edge Function autenticada, Auth Admin server-side e RPCs autorizadas.

Este bootstrap não substitui:

- `team-account-management`;
- `TeamAccountGateway`;
- políticas de RLS;
- runbook de conexão;
- plano de recuperação de Production.

## 9. Referências

- [`SUPABASE_CONNECTION.md`](SUPABASE_CONNECTION.md);
- [`SUPABASE_MIGRATION_AND_ROLLBACK.md`](SUPABASE_MIGRATION_AND_ROLLBACK.md);
- [`../reference/SUPABASE_PERMISSIONS_MATRIX.md`](../reference/SUPABASE_PERMISSIONS_MATRIX.md);
- [`../reference/STATUS_DOCUMENTOS.md`](../reference/STATUS_DOCUMENTOS.md).
