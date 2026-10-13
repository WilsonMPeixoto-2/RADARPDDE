# Runbook — migrations, backup, restauração e rollback Supabase

**Estado:** vigente  
**Atualizado em:** 7 de agosto de 2026

## 1. Objetivo

Controlar:

1. evolução do schema;
2. backup lógico e restauração;
3. importação, promoção e reconciliação;
4. rollback funcional ou recuperação.

Nenhuma etapa autoriza automaticamente operação em Production.

## 2. Baseline

Projeto, quantidade de migrations, versão mais recente e saúde do ambiente ficam em [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md) e devem ser confirmados no Supabase antes da operação.

Não manter neste runbook uma segunda lista manual de “quantas migrations estão aplicadas”.

## 3. Salvaguardas

- segredo administrativo nunca vai ao navegador;
- chaves/dados integrais não entram em relatório;
- dumps SQL não são artefatos públicos do CI;
- seed não é aplicado implicitamente em Production;
- histórico de migrations não é editado manualmente;
- SQL já aplicado não é reaplicado para corrigir histórico;
- migration vazia não mascara divergência;
- primeiro validar em ambiente local/descartável;
- aplicação remota exige dry-run, backup, reversão e escopo autorizado;
- função/trigger privilegiado deve usar `search_path` controlado e grants mínimos;
- qualquer DML corretiva em migration precisa de guardas que impeçam atingir registros fora do conjunto comprovado.

## 4. Ferramentas locais

```bash
npm ci
npm run test:readiness
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
npm run supabase:gen:types
npm run typecheck:database
RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE=true npm run test:backup-restore
```

## 5. Preflight de migration

1. confirmar branch e SHA;
2. confirmar projeto vinculado;
3. executar `supabase migration list --linked`;
4. comparar arquivos e histórico remoto;
5. executar gates de alinhamento;
6. verificar schema atual;
7. resetar localmente;
8. executar pgTAP e lint;
9. regenerar tipos;
10. executar backup/restauração;
11. revisar privilégios, `search_path`, RLS e efeitos em dados existentes;
12. documentar reversão;
13. executar `supabase db push --linked --dry-run`;
14. interromper diante de desvio não explicado.

## 6. Criação de migration

- timestamp posterior ao último arquivo integrado;
- SQL determinístico;
- teste/regressão correspondente;
- reset local completo;
- pgTAP para regra e permissões;
- lint e tipos;
- documentação de schema/permissões/cobertura;
- backup/restauração;
- Preview ou ambiente descartável;
- dry-run remoto;
- plano de reversão;
- aplicação remota somente dentro do escopo aprovado.

Mudança direta de schema pelo painel remoto é proibida quando contorna histórico versionado.

## 7. Aplicação remota

Na janela autorizada:

1. confirmar SHA/arquivo exato;
2. confirmar backup apropriado;
3. confirmar histórico e dry-run;
4. confirmar checks do SHA;
5. aplicar pelo mecanismo oficial;
6. verificar versão no histórico;
7. executar consultas/testes pós-aplicação;
8. revisar logs e Advisors quando aplicável;
9. validar jornadas afetadas;
10. executar auditoria de integridade;
11. registrar horário, responsável, resultado e evidência.

Falha bloqueia nova alteração até classificação e recuperação.

## 8. Remediações recentes como referência de padrão

As migrations recentes incorporaram três tipos de correção que devem servir como exemplo de desenho cuidadoso:

### Reparo de Auth legado

- normalização restrita dos campos incompatíveis comprovados;
- RPC de lookup exato por e-mail restrita a `service_role`;
- remoção de resíduos sintéticos condicionada por guardas que verificam identidade e ausência de vínculos reais.

### Integridade funcional

- criação de exercício com `row_version` e contrato mensal estrito;
- trigger controlado para remover bem derivado desvinculado de nota;
- trigger para sincronizar tentativas de pendência e reconciliação idempotente do histórico.

### Identidade escolar

- constraint de não-vazio;
- índices únicos normalizados de INEP, CNPJ e SICI.

Esses arquivos já pertencem ao histórico aplicado do baseline corrente. Não copiá-los para nova migration sem nova necessidade comprovada.

## 9. Rollback de schema

Não apagar migration aplicada nem alterar histórico para simular reversão.

Opções:

- migration compensatória;
- restauração de backup;
- rollback de frontend quando o problema é compatibilidade;
- correção específica dos dados afetados.

`migration repair --status reverted` altera histórico, não desfaz SQL.

## 10. Backup/restauração descartáveis

```text
.github/workflows/backup-restore-disposable.yml
scripts/verify-supabase-backup-restore.mjs
tests/unit/backup-restore-gate-contract.test.js
```

Fluxo:

```text
pilha de origem
→ migrations + seed/fixtures efêmeros
→ dumps de papéis, schema, dados e histórico
→ segunda pilha isolada
→ restauração transacional
→ comparação de schema, dados, Auth e migrations
→ evidence.json sanitizado
→ limpeza
```

O gate não usa Production e não substitui DR institucional.

## 10-A. Backup cifrado da Production no release do PR #438

**Registro pontual de 13/10/2026, diferente do gate descartável do item 10.** Não pressupor validade após o prazo de retenção.

- **Origem:** Supabase Production `scnryinorqeucbfkioxo`. Snapshot de leitura consistente, sem escrita remota; os schemas `public`, `radar_private`, `auth`, `storage` e `supabase_migrations` foram contemplados.
- **Evidência:** [run `38471486995`](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38471486995), sucesso; `evidence.json` contém `restoreVerified=true`, `sourceReadOnly=true`, `authenticatedDecryptionVerified=true`. A restauração foi em PostgreSQL isolado com comparação de fingerprints.
- **Artefato:** `pr438-production-backup-encrypted-38471486995` (ID **`11852510513`**), **3.220.222 bytes**. SHA-256 **do ZIP inteiro**: `740895ff27ce3decd3b5b9b2c8a253957595e2ffacc70835796ac45736184185`. Expiração informada pelo GitHub: **11/01/2027, 21:33:22 UTC**.
- **Formato:** `backup.tar.gz.enc` com AES-256-GCM; `envelope.json`, `recipient-private.encrypted.pem` (chave privada PKCS#8 cifrada), `recipient-public.pem`, `evidence.json` e `RECOVERY.txt`. Nenhum dump em claro deve ser enviado a PRs, anexos públicos ou logs.
- **Senha histórica obrigatória:** a chave PKCS#8 foi cifrada com a variável `SUPABASE_DB_PASSWORD` **da hora da criação do backup**. Se houver rotação, a senha nova não abre esse arquivo. O responsável deve preservar separadamente a **senha histórica**, em cofre seguro sob controle institucional; credenciais não são recuperáveis a partir dos segredos mascarados do GitHub. Sem acesso a essa senha, a recuperabilidade deste ZIP é incerta.
- **Limitações:** no preflight, `pitr_enabled=false` e a consulta de backups gerenciados retornou lista vazia. Trata-se de backup lógico em momento específico, não de PITR ou de recuperação de alterações posteriores. Storage e Vault estavam vazios na verificação.
- **Custódia externa:** a existência de cópia além do GitHub e a disponibilidade da senha histórica **ainda não foram certificadas por este documento**. Os mecanismos criptográficos e de restauração, sim.

**Procedimento do custodiante autorizado:**

1. Baixar o ZIP do run antes do vencimento e guardar cópia **cifrada**, com acesso restrito e retenção própria, fora do GitHub Actions. Um arquivo temporário do ChatGPT não substitui armazenamento institucional permanente.
2. Conferir os **3.220.222 bytes** e o SHA-256 integral informado acima; registrar local e responsável pela custódia em controle privado, sem publicar nomes de usuários, segredos ou dados.
3. Preservar a **senha de banco de 13/10/2026** em cofre independente do ZIP. Não enviá-la por chat ou a commits, logs ou artifacts.
4. Em recuperação, seguir `RECOVERY.txt`: decifrar a PKCS#8 com a senha histórica, obter a chave AES via RSA-OAEP-SHA256 do `envelope.json`, decifrar o ZIP interno por AES-256-GCM e comparar `envelope.archiveSha256`.
5. Restaurar primeiro em ambiente **isolado** compatível com PostgreSQL 17/Supabase; comparar schema, dados, Auth, migrations, grants/RLS e integridade, antes de qualquer plano para Production. Não executar restauração direta ou rollback destrutivo sem autorização específica.

## 11. Importação

Registrar origem, responsável, formato, `importId`, contagens, hash e snapshot anterior fora do GitHub quando houver dados sensíveis.

Executar:

```text
plan
→ validate
→ dry-run
→ staging idempotente
→ reconciliação
→ promoção transacional
→ nova reconciliação
```

Rollback de dados usa snapshot anterior e exige nova reconciliação depois.

## 12. Gestão de Equipe

Mudança de schema/função/RPC relacionada a contas também deve validar:

- Edge Function `team-account-management`;
- CORS/JWT;
- Auth Admin;
- `resolve_team_auth_user_id_by_email` e seus grants;
- vínculos históricos;
- idempotência;
- compensação;
- transição entre perfis;
- cadastro, edição, redistribuição e desativação;
- persistência após recarregar.

## 13. Escolas

Mudança de schema relacionada a escolas deve validar:

- campos institucionais obrigatórios;
- índices de unicidade normalizada;
- cadastro novo com dados reais;
- edição legada compatível;
- autorização da identidade institucional;
- proteção de `controller_id`;
- compatibilidade dos cadastros existentes.

## 14. Pendências, notas e patrimônio

Mudança nesses domínios deve avaliar triggers/funções já ativos:

- sincronização de `pendency_attempts`;
- desvinculação de bem derivado de nota;
- `saveAssetWithLog` e versões;
- RLS de exclusão/alteração;
- efeitos sobre auditoria e integridade agregada.

## 15. Homologação cumulativa

- histórico alinhado;
- reset/migrations verdes;
- pgTAP e RLS;
- tipos/lint;
- backup/restauração;
- Auth/Edge Functions quando afetados;
- E2E por perfil/viewport;
- jornadas afetadas;
- matriz funcional/documentação/evidência;
- autorização correspondente para Production.

## 16. Referências

- [`SUPABASE_CONNECTION.md`](SUPABASE_CONNECTION.md);
- [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md);
- [`../architecture/supabase-readiness.md`](../architecture/supabase-readiness.md);
- [`../reference/SUPABASE_DATA_DICTIONARY.md`](../reference/SUPABASE_DATA_DICTIONARY.md);
- [`../reference/SUPABASE_PERMISSIONS_MATRIX.md`](../reference/SUPABASE_PERMISSIONS_MATRIX.md).
