# Bootstrap do primeiro administrador técnico

## Objetivo

Criar ou reconciliar de forma idempotente a primeira identidade Auth do
`technical_admin`. Este procedimento é administrativo, manual e restrito ao
projeto Supabase de Preview autorizado. Não altera a configuração pública do
RADAR, que permanece em modo local.

## Pré-requisitos

- as migrations do RADAR foram aplicadas e `profiles.id = 'technical_admin'`
  existe;
- a autorização para a operação remota foi registrada separadamente;
- um operador autorizado disponibilizou, somente no ambiente do processo, as
  quatro variáveis `RADAR_SUPABASE_URL`, `RADAR_SUPABASE_SERVICE_ROLE_KEY`,
  `RADAR_BOOTSTRAP_ADMIN_EMAIL` e `RADAR_BOOTSTRAP_ADMIN_PASSWORD`;
- nenhuma das quatro variáveis foi gravada em arquivo do repositório, enviada
  como argumento de linha de comando, exibida no terminal ou incluída em
  histórico de shell.

Use o gerenciador de segredos do ambiente ou uma sessão administrativa de curta
duração para fornecer as variáveis. Nunca use `.env`, commit, issue, chat,
log ou argumento de CLI para esse fim.

## Comandos

Com as variáveis já presentes no ambiente seguro:

```powershell
npm run bootstrap:supabase:admin -- validate
npm run bootstrap:supabase:admin -- plan
npm run bootstrap:supabase:admin
npm run bootstrap:supabase:admin -- reconcile
```

`validate` confirma apenas a presença do ambiente administrativo. `plan` não
faz chamada remota e confirma o plano estático. O comando sem argumento é
`apply`: consulta Auth, cria a identidade confirmada somente quando ausente,
garante o perfil e registra a auditoria sanitizada. `reconcile` executa a mesma
convergência idempotente de `apply`.

O relatório de sucesso contém exclusivamente `ok`, `created`, `userId`,
`profileId` e `active`. Ele nunca inclui e-mail, senha, token, chave secreta
ou chave administrativa.

## Regras de segurança e recuperação

O perfil criado é exatamente `technical_admin`, ativo, com escopo `4ª CRE` e
com `controller_id` e `inventory_member_id` nulos. A existência de usuário,
perfil ou log incompatível interrompe a operação sem sobrescrever dados.

Se o vínculo ou a auditoria falhar após a criação Auth, a ferramenta remove a
identidade recém-criada; quando essa remoção não estiver disponível, tenta
bani-la. Ela jamais compensa, bloqueia ou remove uma identidade preexistente.

Após uma execução autorizada, confirme no console administrativo que há uma
identidade confirmada e um `user_profiles` ativo sem carteira. Não copie
valores de credenciais para a evidência; registre apenas o relatório sanitizado
e o identificador do usuário quando necessário.
