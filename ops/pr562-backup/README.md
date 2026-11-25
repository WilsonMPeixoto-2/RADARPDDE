# Backup institucional do PR #562

Operação de publicação do RADAR PDDE, separada do candidato funcional. O proprietário aprovou expressamente as telas do PR #562 e a guarda da cópia cifrada nos artefatos do repositório público, usando o padrão de outubro. A autorização de produção e essas duas aprovações foram confirmadas na conversa de continuidade de 25/11/2026.

## Escopo fixo

- Repositório: `WilsonMPeixoto-2/RADARPDDE`.
- Projeto Supabase: `scnryinorqeucbfkioxo`, RADAR PDDE 2026.
- Candidato: `0b082bf49470d7bc549ed4865544203971168728`.
- Main anterior: `32245854763fe43d74223d6772826855f1bd4bd9`.
- [Dry-run institucional aprovado](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45539820847): 67 migrations remotas alinhadas e uma pendente, `20261124000100_extend_bonification_correction.sql`.
- SHA256 da migration 68: `4fcac2ce2ca94118d7670264aa12b1a727e58653083d5ab27aab894dd767a1b1`.
- 21 workflows `pull_request` aprovados no candidato; a execução confere novamente cada workflow por seu caminho e bloqueia em caso de alteração do candidato, de main ou das verificações exigidas.

## Execução e recuperação

O workflow `pr562-production-backup.yml` é acionado exclusivamente por alterações nestes helpers ou no próprio workflow na branch `ops/pr562-publicacao-controlada`. Essa branch operacional parte da main anterior. Ela não deve ser integrada integralmente em main e não altera o PR #562. O workflow não aplica migration nem publica frontend.

O procedimento adapta os helpers da publicação de outubro, no commit `69fc8e31d1c1d26d5c1e3284bbd3e71b112cf5b0`, cujo [backup do PR #494 foi validado](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/40122540213). Usa somente os secrets existentes `SUPABASE_ACCESS_TOKEN` e `SUPABASE_DB_PASSWORD` no runner efêmero.

A origem usa transações somente leitura e um snapshot consistente. O arquivo lógico completo inclui dados e definições do banco, além dos papéis sem senhas. Os schemas `public`, `radar_private`, `auth`, `storage` e `supabase_migrations` são conferidos após restauração em PostgreSQL 17 isolado, com todas as redes do container desconectadas antes de executar o SQL restaurado. O verificador usa `--no-owner` e os papéis locais; o arquivo original preserva as definições de ownership e a cópia separada dos papéis. Storage e Vault precisam continuar sem objetos/segredos para este plano de recuperação ser suficiente.

Somente o arquivo cifrado, a chave privada cifrada, a chave pública, o envelope, instruções de recuperação e evidências sanitizadas são enviados como artefato. O conteúdo é cifrado com AES-256-GCM; a chave é envolvida com RSA-OAEP-SHA256 de 3072 bits. A chave privada PKCS#8 é cifrada com a senha de produção vigente no instante do backup. Essa senha histórica deve permanecer sob custódia institucional mesmo se a senha do banco for rotacionada. Ela não é publicada nem solicitada no chat. A decifragem é verificada por streaming e comparada ao hash do arquivo original, sem gravar uma segunda cópia em claro.

O artefato tem retenção de 90 dias, como em outubro. Retenção mais longa exige conservar uma cópia controlada fora do artefato antes da expiração. A prova no runner não certifica, por si só, a custódia externa da senha pelo responsável.

Uma falha pode produzir diagnóstico cifrado com `restoreVerified: false`. Isso não é um backup certificado. Somente um run concluído com sucesso, artefato preservado e `restoreVerified`, `sourceReadOnly`, `sourceSnapshotConsistent` e `authenticatedDecryptionVerified` verdadeiros satisfaz o bloqueio antes da migration.

## Situação anterior à operação

A conferência somente leitura de 25/11/2026 encontrou as 67 migrations esperadas, nenhum objeto em Storage e nenhum segredo em Vault. `production_integrity_check()` retornou os três vínculos patrimoniais ausentes já documentados antes do PR; os outros 19 controles retornaram zero. Esse baseline deve ser comparado depois da publicação, preservando os registros reais.

## Validação

`node --test ops/pr562-backup/*.test.mjs` exercita o fechamento real do processo de snapshot, decifragem, senha incorreta, adulteração autenticada mesmo com hashes públicos recalculados, separação entre pastas privadas e publicáveis e recusa de metadados de release divergentes. Esses testes são sintéticos; a restauração dos dados institucionais será comprovada somente pelo run remoto.

A aplicação da migration 68 exige uma operação posterior, vinculada ao artefato efetivamente certificado. Após a aplicação e a conferência do banco, será possível concluir o merge do candidato e verificar a publicação na Vercel.
