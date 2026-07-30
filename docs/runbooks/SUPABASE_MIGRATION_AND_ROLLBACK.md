# Runbook — migrations, reconciliação e rollback Supabase

**Estado:** vigente; próxima migration de Production bloqueada até reconciliação  
**Atualizado em:** 29 de julho de 2026

## 1. Objetivo

Controlar duas classes distintas de operação:

1. evolução do schema por migrations versionadas;
2. importação, promoção, reconciliação e rollback de dados.

Nenhuma etapa deste runbook constitui autorização automática para operar Production. Projeto, responsáveis, janela, backup, comando e evidências devem ser aprovados para cada execução.

## 2. Salvaguardas

- nunca usar `service_role` no navegador;
- nunca registrar chaves, senhas ou registros integrais em relatórios;
- não usar seed automático em tabela vazia;
- não promover quando staging ou referências divergirem;
- manter origem, backup e snapshot de rollback imutáveis;
- realizar primeiro em ambiente local e descartável;
- não editar manualmente `supabase_migrations.schema_migrations`;
- não reaplicar SQL já presente apenas para corrigir histórico;
- não criar migration vazia para mascarar divergência;
- não executar `db push` real enquanto o histórico estiver desalinhado.

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

CLI de dados:

```bash
npm run migration:plan -- --snapshot <snapshot.json>
npm run migration:validate -- --snapshot <snapshot.json>
npm run migration:dry-run -- --snapshot <snapshot.json>
npm run migration:import:local -- --snapshot <snapshot.json> --state <estado.json> --checkpoints <diretorio>
npm run migration:reconcile -- --snapshot <snapshot.json> --state <estado.json> --checkpoints <diretorio>
npm run migration:rollback -- --import-id <id> --state <estado.json> --checkpoints <diretorio>
```

Arquivos de estado e checkpoint devem usar permissão restrita. Relatórios são sanitizados contra material com aparência de credencial.

# Parte I — evolução do schema

## 4. Preflight obrigatório

Antes de criar ou aplicar migration:

1. confirmar branch e SHA;
2. confirmar projeto Supabase vinculado;
3. executar `supabase migration list --linked`;
4. comparar arquivos locais e registros remotos;
5. revisar divergências por versão e nome;
6. verificar o estado real do schema;
7. registrar backup e plano de rollback;
8. bloquear a operação se houver desvio não explicado.

O `db push --linked --dry-run` é inspeção adicional, não substitui a comparação do histórico.

## 5. Divergência conhecida da migration SME

### 5.1 Identificadores

```text
arquivo local: 20260728182226_sme_access_governance.sql
versão remota: 20260728190344
nome remoto: sme_access_governance
```

### 5.2 Equivalência comprovada

```text
comprimento local = 1.411 caracteres
comprimento remoto = 1.411 caracteres
SHA-256 local = cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e
SHA-256 remoto = cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e
```

Conclusão:

- não há divergência funcional identificada;
- o schema e as políticas não devem ser reaplicados;
- existe divergência do identificador no histórico;
- a próxima migration de Production está bloqueada.

Auditoria: [`../audits/2026-07-29-rastreabilidade-migration-sme.md`](../audits/2026-07-29-rastreabilidade-migration-sme.md).

## 6. Procedimento de reconciliação do histórico

O Supabase CLI fornece `supabase migration repair` para alterar apenas o status do histórico remoto, sem executar ou reverter SQL. Documentação oficial: [CLI — migration repair](https://supabase.com/docs/reference/cli/supabase-migration-repair).

### 6.1 Princípio

O objetivo é fazer o histórico representar o SQL que já está efetivamente aplicado, sem modificar o schema funcional.

Para a divergência SME, a hipótese de reparo deve ser tratada como plano candidato, não como comando autorizado:

1. marcar o identificador remoto divergente como `reverted` no histórico;
2. marcar o identificador local canônico como `applied` no histórico;
3. confirmar que nenhum SQL foi executado;
4. confirmar que schema, políticas e hashes permanecem inalterados.

Sintaxe suportada pela CLI:

```bash
supabase migration repair <version> --status reverted --linked
supabase migration repair <version> --status applied --linked
```

### 6.2 Proibição de execução direta em Production

Não executar os comandos acima diretamente em Production a partir deste documento.

Antes, criar plano operacional específico contendo:

- versões exatas;
- versão fixada da CLI;
- responsável e revisor;
- ambiente descartável ou branch Supabase;
- cópia do histórico e do schema;
- comandos de inspeção antes e depois;
- rollback do histórico;
- critérios de aborto;
- evidência de que o SQL não mudou.

### 6.3 Dry-run em ambiente descartável

No ambiente descartável:

1. reproduzir o histórico divergente;
2. registrar `supabase migration list`;
3. calcular hashes do schema e das políticas relevantes;
4. executar o reparo candidato;
5. repetir `migration list`;
6. executar reset ou aplicação completa das migrations locais;
7. rodar pgTAP e lint;
8. comparar schema e políticas antes/depois;
9. testar nova migration fictícia ou segura para comprovar continuidade;
10. documentar rollback do histórico.

### 6.4 Gate para Production

A reconciliação real somente pode ocorrer quando:

- o dry-run reproduzível estiver aprovado;
- backup estiver disponível;
- nenhuma migration nova estiver misturada ao reparo;
- hashes funcionais permanecerem iguais;
- `migration list` final alinhar local e remoto;
- `db push --linked --dry-run` não tentar reaplicar a migration SME;
- responsáveis autorizarem a janela;
- documentação canônica for atualizada no mesmo ciclo.

## 7. Criação de migration nova

Somente após reconciliação:

1. gerar migration com timestamp posterior;
2. escrever SQL idempotente quando aplicável;
3. aplicar por `supabase db reset --local`;
4. executar pgTAP e lint;
5. regenerar tipos;
6. executar readiness e E2E aplicáveis;
7. validar em ambiente descartável/Preview;
8. revisar Advisors;
9. produzir plano de rollback;
10. executar `db push --linked --dry-run`;
11. obter autorização antes do push real.

Mudanças diretas no SQL Editor ou Table Editor remoto que alterem schema são proibidas porque contornam o histórico versionado.

## 8. Aplicação remota

Na janela autorizada:

1. confirmar SHA e arquivos;
2. confirmar backup;
3. confirmar histórico alinhado;
4. confirmar dry-run;
5. aplicar a migration;
6. executar verificação pós-aplicação;
7. rodar pgTAP remoto quando previsto;
8. revisar logs e Advisors;
9. validar jornadas afetadas;
10. registrar versão, horário, responsável e resultado.

Falha bloqueia novas alterações até classificação e plano de recuperação.

## 9. Rollback de schema

Migration aplicada não deve ser “desfeita” apagando o arquivo ou alterando o histórico.

O rollback funcional deve ocorrer por:

- migration compensatória revisada;
- restauração de backup quando tecnicamente necessária;
- rollback de deployment quando a incompatibilidade estiver no frontend;
- plano específico para dados afetados.

`migration repair --status reverted` altera histórico, não reverte SQL. Não usar como rollback funcional.

# Parte II — importação e promoção de dados

## 10. Exportação

Exportar snapshot canônico pela porta de estado e registrar:

- data e responsável;
- versão do formato;
- `importId` único;
- contagens por entidade;
- hash SHA-256;
- origem da cópia.

Guardar fora do GitHub, em repositório controlado.

## 11. Validação

Executar `plan`, `validate` e `dry-run`.

Critérios:

- formato reconhecido;
- IDs presentes e não duplicados;
- entidades permitidas;
- referências válidas;
- zero escrita no dry-run;
- hash e contagens registrados.

Qualquer rejeição bloqueia a continuidade.

## 12. Staging

Abrir execução em `data_import_runs` e gravar lotes associados a:

- `importId`;
- entidade;
- índice do lote;
- hash da origem.

O mesmo lote pode ser reenviado sem duplicação. Um `importId` não pode representar conteúdo com hash diferente.

## 13. Retomada

Após interrupção:

1. conservar snapshot, estado e checkpoints;
2. repetir com o mesmo `importId` e hash;
3. confirmar que lotes concluídos são ignorados;
4. verificar contagem total do staging.

Não criar novo `importId` para contornar falha.

## 14. Reconciliação do staging

Comparar origem e staging por entidade:

- contagem;
- IDs ausentes;
- IDs inesperados;
- registros alterados.

Representações ISO equivalentes do mesmo instante podem ser normalizadas. Datas civis não são alteradas.

Qualquer divergência bloqueia promoção.

## 15. Promoção atômica

A RPC de promoção opera em transação única. Tabelas técnicas de Auth, perfis, escopos, importação e auditoria devem ser preservadas conforme o contrato da função.

Em falha, o PostgreSQL reverte a transação.

## 16. Reconciliação do destino

Após promoção:

1. exportar o destino;
2. repetir comparação integral;
3. confirmar contagens;
4. confirmar ausência de itens faltantes, excedentes ou alterados;
5. armazenar relatório resumido.

A execução só pode ser marcada como reconciliada com resultado integralmente aprovado.

## 17. Rollback de dados

O rollback usa o snapshot anterior registrado na abertura da execução.

Após rollback:

1. reconciliar o estado restaurado;
2. registrar data, responsável e motivo;
3. preservar evidências;
4. classificar a causa;
5. impedir nova tentativa sem correção comprovada.

## 18. Critérios cumulativos de homologação

- histórico de migrations alinhado;
- migrations aplicadas sem desvio;
- Auth e cinco papéis técnicos/funcionais testados;
- RLS de leitura e escrita comprovada;
- importação interrompida e retomada testadas;
- promoção e rollback testados;
- Security e Performance Advisors revisados;
- proteção contra senhas vazadas habilitada antes do release;
- backup e restauração comprovados;
- Preview aprovado;
- documentação e evidências atualizadas;
- autorização expressa para Production.
