# Auditoria — backup e restauração Supabase em ambiente descartável

**Data:** 30 de julho de 2026  
**PR:** #112  
**Escopo:** comprovação lógica de recuperabilidade sem acesso a Production

## 1. Objetivo

Comprovar que um backup lógico gerado com a Supabase CLI pode ser restaurado em uma segunda pilha Supabase e produzir estado equivalente ao da origem.

Também registrar a retirada da checagem de senhas comprometidas dos bloqueadores, pois o recurso é restrito ao plano Pro ou superior e o projeto opera no plano Free sem autorização de despesa.

## 2. Arquitetura do teste

```text
pilha Supabase descartável de origem
→ 25 migrations + seed versionado
→ dumps lógicos
→ segunda pilha isolada
→ restauração transacional
→ comparação de schema, dados e migrations
→ destruição das duas pilhas
```

Componentes:

```text
.github/workflows/backup-restore-disposable.yml
scripts/verify-supabase-backup-restore.mjs
tests/unit/backup-restore-gate-contract.test.js
```

## 3. Salvaguardas

- execução bloqueada sem `RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE=true`;
- nenhum segredo de GitHub Actions;
- nenhum uso de `--linked`;
- nenhum acesso ao projeto Supabase Production;
- portas e `project_id` distintos no destino;
- seed desativado na pilha restaurada;
- restauração com `ON_ERROR_STOP=1` e transação única;
- limpeza em bloco `finally`;
- somente `evidence.json` é publicado;
- dumps SQL permanecem no runner efêmero.

## 4. Conteúdo do backup

A Supabase CLI gera:

- papéis;
- schema;
- dados com `COPY`;
- schema do histórico de migrations;
- registros do histórico de migrations.

Cada arquivo recebe tamanho e SHA-256 no relatório sanitizado.

## 5. Critérios de equivalência

### Schema

O fingerprint cobre:

- colunas;
- constraints;
- índices;
- políticas RLS;
- funções;
- triggers.

### Dados

Para cada tabela pública são comparados:

- número de registros;
- fingerprint determinístico do conteúdo serializado.

### Histórico

São comparados versão, nome e conteúdo das statements de `supabase_migrations.schema_migrations`.

## 6. Desenvolvimento orientado por regressão

### Ciclo vermelho inicial

O teste reprovou pela ausência de `scripts/verify-supabase-backup-restore.mjs`.

### Primeira execução funcional

A segunda pilha encontrou conflito na porta padrão de Analytics. O destino foi endurecido com Analytics e pooler desativados, mantendo apenas os serviços necessários à restauração.

### Execução funcional aprovada

```text
GitHub Actions run: 30537076528
Job: Dump, restauração e equivalência
Conclusão: success
```

Etapas aprovadas:

- Node 24;
- dependências reproduzíveis;
- cliente PostgreSQL;
- pilha de origem;
- reset com migrations e seed;
- geração dos cinco dumps;
- segunda pilha isolada;
- restauração;
- comparação;
- publicação de evidência;
- limpeza.

### Endurecimento do artefato

A inspeção mostrou que o diretório integral de dumps era inicialmente publicado. Foi criado novo teste vermelho para vedar `*.sql`; o workflow passou a publicar exclusivamente `artifacts/backup-restore/evidence.json`.

## 7. Resultado da equivalência

```text
schema: true
data: true
migrations: true
```

Fingerprints de origem e destino:

```text
schema:     0edda0a68fdbd4a6984f68d4d0332a3f4b8fe9965ea34911f1ea17b7a3150948
dados:      fa1f775a1eae802d59dfa889347cbe013e30b6b20b45b74e4694db750dff0cc7
migrations: 18caf36e3032a4c2dfb2064b18ad2cf1c0dbf59df8c12ff8319ab7d7bd679e6b
```

Foram comparadas 20 tabelas públicas. Entre as fixtures restauradas estavam:

- 1 configuração global;
- 1 competência;
- 2 Controladores;
- 1 integrante de Inventário;
- 5 perfis;
- 1 programa;
- 2 escolas;
- 2 vínculos escola-programa;
- 10 eventos de auditoria.

## 8. Limites

Esta auditoria comprova o procedimento de backup lógico e restauração, mas não:

- copia dados reais de Production;
- define retenção institucional;
- substitui armazenamento externo protegido;
- constitui teste de desastre autorizado;
- habilita recursos pagos de recuperação contínua.

## 9. Conclusão

O gate de backup e restauração em ambiente descartável foi tecnicamente comprovado. Schema, dados e histórico restaurados são equivalentes à origem, sem acesso ou alteração de Production.

O blocker correspondente pode ser retirado após a bateria final no SHA consolidado e integração do PR.
