# Runbook — migrations, backup, restauração e rollback Supabase

**Estado:** vigente  
**Atualizado em:** 5 de agosto de 2026

## 1. Objetivo

Controlar:

1. evolução do schema;
2. backup lógico e restauração;
3. importação, promoção e reconciliação;
4. rollback funcional ou recuperação.

Nenhuma etapa autoriza automaticamente operação em Production.

## 2. Baseline

```text
projeto Production: scnryinorqeucbfkioxo
migrations aplicadas: 25
PostgreSQL: 17.6.1.147
migration SME: 20260728182226_sme_access_governance
alias derivado: ausente
```

O PR nº 141 contém uma 26ª migration somente em sua branch. Enquanto o PR estiver aberto e a migration não tiver sido aplicada, o baseline remoto permanece 25.

## 3. Salvaguardas

- segredo administrativo nunca vai ao navegador;
- chaves e dados integrais não entram em relatório;
- dumps SQL não são artefatos do CI;
- seed não é aplicado implicitamente em Production;
- histórico de migrations não é editado manualmente;
- SQL já aplicado não é reaplicado para corrigir histórico;
- migration vazia não mascara divergência;
- primeiro validar em ambiente local ou descartável;
- aplicação remota exige dry-run, backup, reversão e autorização.

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
5. executar testes de alinhamento;
6. verificar o schema atual;
7. resetar localmente;
8. executar pgTAP e lint;
9. regenerar tipos;
10. executar backup/restauração;
11. documentar reversão;
12. executar `supabase db push --linked --dry-run`;
13. interromper diante de desvio não explicado.

## 6. Criação de migration

- timestamp posterior ao último arquivo integrado;
- SQL determinístico;
- teste que falha antes;
- reset local completo;
- pgTAP para regra e permissões;
- lint e tipos;
- documentação do schema, permissões e cobertura;
- backup/restauração;
- Preview ou ambiente descartável;
- dry-run remoto;
- plano de reversão;
- autorização antes da aplicação.

Mudança direta de schema pelo painel remoto é proibida porque contorna o histórico versionado.

## 7. Aplicação remota

Na janela autorizada:

1. confirmar SHA e arquivo exato;
2. confirmar backup apropriado;
3. confirmar histórico e dry-run;
4. confirmar checks do SHA;
5. aplicar pelo mecanismo oficial;
6. verificar versão no histórico;
7. executar consultas e testes pós-aplicação;
8. revisar logs e Advisors;
9. validar jornadas afetadas;
10. registrar horário, responsável, resultado e evidência.

Falha bloqueia nova alteração até classificação e plano de recuperação.

## 8. Rollback de schema

Não apagar migration aplicada nem alterar histórico para simular reversão.

Opções:

- migration compensatória;
- restauração de backup;
- rollback do frontend quando o problema é compatibilidade;
- correção específica dos dados afetados.

`migration repair --status reverted` altera o histórico, não desfaz SQL.

## 9. Backup/restauração descartáveis

Componentes:

```text
.github/workflows/backup-restore-disposable.yml
scripts/verify-supabase-backup-restore.mjs
tests/unit/backup-restore-gate-contract.test.js
```

Fluxo:

```text
pilha de origem
→ migrations + seed + Auth efêmero
→ dumps de papéis, schema, dados e histórico
→ segunda pilha isolada
→ restauração transacional
→ comparação de schema, dados, Auth e migrations
→ evidence.json
→ limpeza
```

O gate não usa `--linked`, segredo remoto ou Production.

## 10. Limites do backup descartável

Comprova o procedimento lógico. Não substitui:

- política institucional de retenção;
- cópia periódica do ambiente remoto;
- armazenamento externo;
- ensaio de desastre autorizado;
- recurso de recuperação oferecido pelo plano contratado.

## 11. Importação

### Exportação

Registrar:

- origem e responsável;
- versão do formato;
- `importId`;
- contagens;
- hash SHA-256;
- snapshot anterior.

Guardar fora do GitHub.

### Validação

Executar `plan`, `validate` e `dry-run` sem escrita.

### Staging

- lotes idempotentes;
- mesmo `importId` e hash em retomada;
- checkpoints;
- nenhuma promoção com divergência.

### Promoção

RPC transacional após reconciliação integral. Depois:

1. exportar destino;
2. comparar contagens e IDs;
3. verificar registros alterados;
4. armazenar resumo sanitizado.

### Rollback de dados

Usar snapshot anterior. Após rollback, reconciliar novamente e bloquear nova tentativa sem correção comprovada.

## 12. Gestão de Equipe

Mudança de schema, função ou RPC relacionada a contas deve também validar:

- Edge Function `team-account-management`;
- CORS e JWT;
- Auth Admin;
- vínculos históricos;
- idempotência;
- compensação;
- cadastro, edição, redistribuição e desativação;
- persistência após recarregar.

## 13. Homologação cumulativa

- histórico alinhado;
- reset e migrations verdes;
- pgTAP e RLS;
- tipos e lint;
- backup/restauração;
- Auth e Edge Functions;
- E2E por perfil e viewport;
- jornadas afetadas;
- documentação e evidência;
- autorização expressa para Production.

## 14. Referências

- [`SUPABASE_CONNECTION.md`](SUPABASE_CONNECTION.md);
- [`../architecture/supabase-readiness.md`](../architecture/supabase-readiness.md);
- [`../reference/SUPABASE_DATA_DICTIONARY.md`](../reference/SUPABASE_DATA_DICTIONARY.md);
- [`../reference/SUPABASE_PERMISSIONS_MATRIX.md`](../reference/SUPABASE_PERMISSIONS_MATRIX.md).
