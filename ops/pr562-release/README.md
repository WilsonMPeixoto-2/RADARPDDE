# PR562 — aplicação controlada da migration 68

Este procedimento aplica exclusivamente `20261124000100_extend_bonification_correction.sql`
do candidato `0b082bf49470d7bc549ed4865544203971168728`, no projeto institucional
`scnryinorqeucbfkioxo`. Não integra o PR nem publica frontend.

## Ativação e bloqueios

`release-config.json` começa com `configured: false`. O integrador deve preencher o
ID e SHA-256 integral do ZIP do **backup efetivamente conferido**, confirmar seu
run/SHA e só então mudar `configured` para `true`. Enquanto faltar qualquer campo,
o job falha antes de acessar os segredos Supabase. O upload desses arquivos sem
ativação é apenas preparação, sem DDL.

O workflow responde apenas a push dos arquivos desta pasta ou do próprio workflow
na branch `ops/pr562-publicacao-controlada`. Usa o ambiente GitHub `Production`,
preserva suas proteções e tem apenas permissões de leitura do GitHub. Um novo push
após uma aplicação bem-sucedida não reaplica a migration: o contrato inicial exige
exatamente as 67 migrations anteriores e somente a migration 68 pendente.

## Sequência executável

1. Revalidar PR562, SHAs de candidato/main, preflight institucional e os 21 workflows
   com `ops/pr562-backup/release-gate.mjs`, antes de acessar os segredos Supabase.
2. Conferir run de backup concluído com sucesso, SHA de operações, artifact ID,
   nome, validade, tamanho e digest SHA-256 do GitHub. Baixar por `gh` e conferir
   também o hash dos bytes recebidos. Extrair apenas os sete arquivos previstos
   para `runner.temp`; o dump permanece cifrado.
3. Exigir os certificados originais `sourceReadOnly`, `sourceSnapshotConsistent`,
   `restoreVerified` e `authenticatedDecryptionVerified`, candidato/projeto/run/SHA
   correspondentes. Revalidar a decifragem autenticada com `backup-key.mjs verify`
   e a senha atual do banco, sem escrever plaintext. Uma rotação de senha entre o
   backup e a operação bloqueia a aplicação.
4. Checkout fixo do candidato, Node 24, lockfile e CLI 3.2.0. Conferir SHA-256 exato
   da migration. Consultar `postflight.sql` pela CLI 3.2.0 com URL explícita do
   Session pooler e `--read-only`, que executa `BEGIN READ ONLY` e `ROLLBACK`.
   Exigir `transactionReadOnly: true` no próprio resultado. O usuário já autorizado
   preserva o acesso ao monitor institucional; não alterar ACLs para conceder
   execução ao papel restrito da Management API. A URL permanece somente em memória:
   histórico de 67 migrations alinhado, quatro assinaturas e ACLs esperadas para o
   estado anterior, baseline de 20 controles com somente as três ocorrências
   conhecidas de `permanent_invoices_without_linked_asset`. Os hashes do conjunto
   desses três IDs e do corpo da implementação anterior estão fixados na leitura
   institucional de 25/11/2026, sem publicar os próprios IDs.
5. Vincular o projeto explícito e executar `db push --remote --dry-run --skip-vault`.
   Exigir plano estruturado contendo apenas a migration 68, sem seed ou roles.
   Revalidar os gates GitHub e o contrato somente leitura imediatamente antes do
   único `db push --remote --skip-vault --yes`.
6. Reconsultar o mesmo SELECT: exatamente 68 migrations, quatro RPCs com assinatura,
   proprietário, tipo de retorno, `search_path`, `SECURITY DEFINER`, volatilidade e
   privilégios corretos; corpos novos iguais ao SQL fixado; corpo `_r4` preservado.
   Os 20 controles e o fingerprint dos IDs das três ocorrências devem permanecer
   iguais. Nenhuma RPC de correção é executada em registros reais.

## Evidência e interrupção

O único artifact deste workflow contém JSON sanitizado: gates GitHub, hashes,
catálogos, contagens e resultado. Não recebe dumps, ZIP de backup, chaves, senhas,
payloads de escolas ou logs brutos da CLI/API. Os sete arquivos cifrados ficam
somente no diretório temporário do runner de aplicação e são removidos ao final.

Uma falha antes de `applyStartedAt` bloqueia a escrita. Uma falha a partir desse
marco exige consultar o histórico antes de qualquer nova tentativa: o SQL pode
ter sido aplicado mesmo se houver falha de transporte ou de postflight. Nunca
usar `migration repair`, apagar histórico ou reexecutar SQL para encobrir o erro.

Se o postflight falhar, não integrar o PR nem publicar. A migration altera funções
e preserva a implementação anterior como `_r4`; manter o frontend publicado e
classificar o problema. Recuperação, quando necessária, usa uma migration
compensatória revisada ou o backup validado primeiro em PostgreSQL isolado, seguindo
`docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`. Não há rollback automático nem
restauração destrutiva em Production neste workflow.
