# Bootstrap remoto de dados do RADAR PDDE

**Classificação:** procedimento histórico e restrito  
**Estado atual:** carga inicial concluída; Production usa Supabase como fonte canônica  
**Atualizado em:** 29 de julho de 2026

## 1. Finalidade original

Este procedimento foi criado para preparar a carga inicial de um snapshot canônico local em um projeto Supabase vazio ou contendo apenas o baseline institucional permitido.

Ele não é mecanismo de sincronização cotidiana, atualização incremental de Production, restauração geral, correção manual de dados ou migração de schema.

Não executar novamente sobre o projeto Production autorizado sem plano operacional específico, cópia aprovada da origem, backup, dry-run, reconciliação, responsáveis e autorização expressa.

## 2. Quando pode ser usado

Somente em:

1. novo projeto Supabase isolado e autorizado;
2. ambiente descartável de recuperação;
3. reconstrução formal a partir de snapshot aprovado;
4. operação excepcional em destino comprovadamente compatível com o contrato de bootstrap.

Para importação, promoção, reconciliação ou rollback de dados em ambiente já operacional, usar [`SUPABASE_MIGRATION_AND_ROLLBACK.md`](SUPABASE_MIGRATION_AND_ROLLBACK.md).

## 3. Segurança

- executar somente em ambiente administrativo controlado;
- armazenar snapshot fora do repositório;
- não registrar snapshot, credenciais ou erro bruto em ticket, commit ou log compartilhado;
- nunca disponibilizar `service_role` ao navegador;
- confirmar projeto e ambiente antes de qualquer escrita;
- interromper diante de conflito;
- não apagar registros automaticamente para “limpar” o destino;
- não usar o procedimento para contornar a divergência do histórico de migrations.

## 4. Exportação da fonte

O exportador abre instância limpa em `http://127.0.0.1:4175`, aguarda o contexto de dados e usa `LocalStorageRepository` como contrato de exportação.

Ele remove do snapshot de carga inicial:

- `userProfiles`;
- `userSchoolScopes`;
- `auditEvents`;
- `dataImportRuns`.

Com a aplicação local controlada em execução:

```powershell
npm run snapshot:export:local
```

Definir `RADAR_SNAPSHOT_FILE` para caminho fora do repositório. Conferir somente formato, versão, hash e contagens sanitizadas.

## 5. Validação e plano

Disponibilizar exclusivamente ao processo:

- `RADAR_SUPABASE_URL`;
- `RADAR_SUPABASE_SERVICE_ROLE_KEY`;
- `RADAR_SNAPSHOT_FILE`.

Executar:

```powershell
npm run bootstrap:supabase:validate
npm run bootstrap:supabase:plan
```

Esses comandos não escrevem no destino.

O snapshot deve:

- declarar o formato e a versão suportados;
- conter as coleções canônicas esperadas pelo script da versão executada;
- passar contratos JSON e referências;
- possuir IDs coerentes;
- não conter identidade ou auditoria artificial;
- ter hash e origem registrados.

Não congelar neste documento um número de coleções como invariante. O contrato exato deve ser verificado no código e nos testes do mesmo SHA, pois o schema funcional evoluiu desde a carga inicial.

## 6. Estado pré-existente permitido

O bootstrap original admite somente o baseline institucional exato dos perfis quando a fonte não os fornece.

Qualquer registro adicional, ausente ou divergente deve interromper a operação. A ferramenta não usa upsert para sobrescrever conteúdo incompatível.

Metadados gerados pelo banco, como `row_version`, timestamps e eventos de triggers, são tratados segundo a projeção definida no script.

## 7. Importação e reconciliação

Depois de revisar e aprovar o plano:

```powershell
npm run bootstrap:supabase:import
npm run bootstrap:supabase:reconcile
```

O importador:

- grava apenas linhas ausentes;
- respeita ordem e lotes;
- não usa upsert destrutivo;
- interrompe em colisão incompatível;
- permite repetição idempotente do mesmo snapshot;
- não chama exclusão;
- não substitui registros existentes.

`bootstrap:supabase:reconcile` é diagnóstico e falha diante de qualquer divergência após a normalização autorizada.

## 8. Recuperação

Em conflito ou reconciliação reprovada:

1. interromper a operação;
2. preservar snapshot, hash, plano e saída sanitizada;
3. não apagar dados automaticamente;
4. classificar a divergência;
5. consultar o responsável pelo ambiente;
6. preparar plano específico de rollback ou reconstrução;
7. não repetir com novo snapshot para mascarar o conflito.

## 9. Relação com Production atual

Production já contém dados institucionais, perfis, Auth, RLS, logs e histórico. Portanto, o bootstrap inicial não deve ser confundido com:

- atualização funcional;
- migration de schema;
- importação incremental;
- sincronização LocalStorage → Supabase;
- recuperação de usuário;
- restauração de backup;
- rollback do frontend.

## 10. Referências

- [`SUPABASE_CONNECTION.md`](SUPABASE_CONNECTION.md);
- [`SUPABASE_MIGRATION_AND_ROLLBACK.md`](SUPABASE_MIGRATION_AND_ROLLBACK.md);
- [`../architecture/supabase-readiness.md`](../architecture/supabase-readiness.md);
- [`../reference/SUPABASE_DATA_DICTIONARY.md`](../reference/SUPABASE_DATA_DICTIONARY.md);
- [`../reference/STATUS_DOCUMENTOS.md`](../reference/STATUS_DOCUMENTOS.md).
