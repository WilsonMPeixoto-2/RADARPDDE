# Runbook — migrations, backup, restauração e rollback Supabase

**Estado:** vigente  
**Atualizado em:** 30 de julho de 2026

## 1. Objetivo

Controlar quatro classes de operação:

1. evolução do schema por migrations versionadas;
2. backup lógico e restauração;
3. importação, promoção e reconciliação de dados;
4. rollback funcional ou recuperação.

Nenhuma etapa constitui autorização automática para operar Production. Projeto, responsáveis, janela, backup, comando e evidências devem ser aprovados para cada execução remota.

## 2. Salvaguardas

- nunca usar `service_role` no navegador;
- nunca registrar chaves, senhas ou registros integrais em relatórios;
- não publicar dumps SQL como artefato do CI;
- não usar seed automático em tabela institucional vazia;
- manter origem, backup e snapshot de rollback imutáveis;
- realizar primeiro em ambiente local e descartável;
- não editar manualmente `supabase_migrations.schema_migrations`;
- não reaplicar SQL já presente para corrigir histórico;
- não criar migration vazia para mascarar divergência;
- não executar `db push` real sem histórico alinhado, dry-run e autorização.

## 3. Ferramentas locais

```bash
npm ci
npm run test:readiness
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
npm run supabase:gen:types
npm run typecheck:database
```

Backup/restauração descartáveis:

```bash
RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE=true npm run test:backup-restore
```

O comando acima exige uma pilha Supabase local de origem já iniciada e é deliberadamente bloqueado sem a variável explícita.

# Parte I — evolução do schema

## 4. Estado do histórico

O histórico local e o Supabase Production possuem 25 migrations correspondentes.

Migration SME canônica:

```text
arquivo local: 20260728182226_sme_access_governance.sql
registro remoto: 20260728182226_sme_access_governance
registro derivado 20260728190344: ausente
SHA-256: cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e
```

A reconciliação foi executada com `supabase migration repair`, alterando somente o histórico. O SQL funcional não foi reaplicado nem revertido.

## 5. Preflight de migration

Antes de criar ou aplicar migration:

1. confirmar branch e SHA;
2. confirmar projeto Supabase vinculado;
3. executar `supabase migration list --linked`;
4. comparar arquivos locais e registros remotos;
5. executar o teste de alinhamento SME;
6. verificar o estado real do schema;
7. executar reset local, pgTAP e lint;
8. regenerar e conferir tipos;
9. executar backup/restauração descartáveis;
10. registrar plano de rollback;
11. executar `db push --linked --dry-run`;
12. bloquear a operação se houver desvio não explicado.

O dry-run não substitui a comparação do histórico.

## 6. Criação de migration nova

1. gerar timestamp posterior ao último arquivo;
2. escrever SQL determinístico e idempotente quando aplicável;
3. aplicar por `supabase db reset --local`;
4. executar pgTAP e lint;
5. regenerar tipos;
6. executar readiness e E2E aplicáveis;
7. executar o gate de backup/restauração;
8. validar em ambiente descartável ou Preview;
9. revisar Advisors;
10. produzir plano de rollback;
11. executar dry-run remoto;
12. obter autorização antes do push real.

Mudanças diretas no SQL Editor ou Table Editor remoto que alterem schema são proibidas porque contornam o histórico versionado.

## 7. Aplicação remota

Na janela autorizada:

1. confirmar SHA e arquivos;
2. confirmar backup externo apropriado ao ambiente;
3. confirmar histórico alinhado;
4. confirmar gates do SHA;
5. confirmar dry-run;
6. aplicar a migration;
7. executar verificação pós-aplicação;
8. executar pgTAP remoto quando previsto;
9. revisar logs e Advisors;
10. validar jornadas afetadas;
11. registrar versão, horário, responsável e resultado.

Falha bloqueia novas alterações até classificação e plano de recuperação.

## 8. Rollback de schema

Migration aplicada não deve ser “desfeita” apagando arquivo ou alterando histórico.

O rollback funcional ocorre por:

- migration compensatória revisada;
- restauração de backup quando tecnicamente necessária;
- rollback de deployment quando a incompatibilidade estiver no frontend;
- plano específico para dados afetados.

`migration repair --status reverted` altera histórico, não reverte SQL.

# Parte II — backup e restauração

## 9. Gate descartável automatizado

Componentes:

```text
.github/workflows/backup-restore-disposable.yml
scripts/verify-supabase-backup-restore.mjs
tests/unit/backup-restore-gate-contract.test.js
```

O workflow não possui segredos, não usa `--linked` e não acessa Production.

### 9.1 Origem

A origem é uma pilha Supabase descartável criada no runner. Ela recebe:

- as 25 migrations versionadas;
- `supabase/seed.sql`;
- nenhuma credencial institucional.

### 9.2 Dumps

A Supabase CLI gera:

```text
roles.sql
schema.sql
data.sql
history-schema.sql
history-data.sql
```

Os arquivos cobrem papéis, schema, dados e `supabase_migrations`. Eles permanecem somente no runner efêmero.

### 9.3 Destino

O destino é uma segunda pilha com:

- `project_id` próprio;
- portas distintas;
- seed desativado;
- Analytics e pooler desativados;
- diretório temporário selecionado por `SUPABASE_WORKDIR`.

A restauração usa `psql`, `ON_ERROR_STOP=1` e transação única.

### 9.4 Equivalência

São comparados:

- colunas;
- constraints;
- índices;
- políticas RLS;
- funções;
- triggers;
- todas as tabelas públicas;
- contagem e fingerprint de cada tabela;
- histórico e conteúdo das migrations.

A execução falha em qualquer divergência.

### 9.5 Evidência

O CI publica somente:

```text
artifacts/backup-restore/evidence.json
```

O relatório contém hashes, contagens e resultado, sem URL de banco, chave, senha ou SQL bruto.

### 9.6 Evidência inicial aprovada

```text
run: 30537076528
resultado: success
schema: true
data: true
migrations: true
```

Fingerprints:

```text
schema:     0edda0a68fdbd4a6984f68d4d0332a3f4b8fe9965ea34911f1ea17b7a3150948
dados:      fa1f775a1eae802d59dfa889347cbe013e30b6b20b45b74e4694db750dff0cc7
migrations: 18caf36e3032a4c2dfb2064b18ad2cf1c0dbf59df8c12ff8319ab7d7bd679e6b
```

## 10. Limites do gate

O gate comprova que o procedimento lógico é restaurável. Ele não representa cópia do banco Production e não substitui:

- política institucional de retenção;
- exportação periódica do projeto remoto;
- armazenamento externo protegido;
- teste de desastre com autorização;
- Point-in-Time Recovery de planos que ofereçam esse recurso.

# Parte III — importação e promoção de dados

## 11. Exportação

Exportar snapshot canônico pela porta de estado e registrar:

- data e responsável;
- versão do formato;
- `importId` único;
- contagens por entidade;
- hash SHA-256;
- origem da cópia.

Guardar fora do GitHub, em repositório controlado.

## 12. Validação

Executar `plan`, `validate` e `dry-run`.

Critérios:

- formato reconhecido;
- IDs presentes e não duplicados;
- entidades permitidas;
- referências válidas;
- zero escrita no dry-run;
- hash e contagens registrados.

## 13. Staging e retomada

Abrir execução em `data_import_runs` e gravar lotes associados a `importId`, entidade, índice e hash. O mesmo lote pode ser reenviado sem duplicação.

Após interrupção:

1. conservar snapshot, estado e checkpoints;
2. repetir com o mesmo `importId` e hash;
3. confirmar lotes já concluídos;
4. verificar contagem total do staging.

## 14. Reconciliação e promoção

Comparar origem e staging por contagem, IDs ausentes, inesperados e registros alterados. Qualquer divergência bloqueia promoção.

A RPC de promoção opera em transação única. Em falha, o PostgreSQL reverte a transação.

Após promoção:

1. exportar o destino;
2. repetir comparação integral;
3. confirmar contagens;
4. confirmar ausência de itens faltantes, excedentes ou alterados;
5. armazenar relatório resumido.

## 15. Rollback de dados

O rollback usa o snapshot anterior registrado na abertura da execução.

Após rollback:

1. reconciliar o estado restaurado;
2. registrar data, responsável e motivo;
3. preservar evidências;
4. classificar a causa;
5. impedir nova tentativa sem correção comprovada.

## 16. Critérios cumulativos de homologação

- histórico de migrations alinhado;
- migrations aplicadas sem desvio;
- backup/restauração descartáveis aprovados;
- Auth e papéis testados;
- RLS de leitura e escrita comprovada;
- importação, retomada, promoção e rollback testados quando aplicáveis;
- Advisors revisados;
- Preview aprovado quando necessário;
- documentação e evidências atualizadas;
- autorização expressa para Production.
