# Auditoria — backup e restauração Supabase em ambiente descartável

**Data:** 30 de julho de 2026  
**PR:** #112  
**Escopo:** comprovação lógica de recuperabilidade sem acesso a Production

## 1. Objetivo

Comprovar que um backup lógico gerado com a Supabase CLI pode ser restaurado em uma segunda pilha Supabase e produzir estado equivalente ao da origem, incluindo:

- schema público;
- dados públicos;
- usuários e identidades do Supabase Auth;
- histórico de migrations.

Também registrar a retirada da checagem de senhas comprometidas dos bloqueadores, pois o recurso é restrito ao plano Pro ou superior e o projeto opera no plano Free sem autorização de despesa.

## 2. Arquitetura do teste

```text
pilha Supabase descartável de origem
→ 25 migrations + seed versionado
→ sete identidades Auth efêmeras
→ dumps lógicos
→ segunda pilha isolada
→ restauração transacional
→ comparação de schema, dados, Auth e migrations
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
- nenhum segredo remoto no workflow;
- nenhum uso de `--linked`;
- nenhum acesso ao projeto Supabase Production;
- senha Auth aleatória e mascarada;
- chave administrativa restrita à pilha local e mascarada;
- portas e `project_id` distintos no destino;
- seed desativado na pilha restaurada;
- Analytics e pooler desativados no destino;
- restauração com `ON_ERROR_STOP=1` e transação única;
- limpeza em bloco `finally`;
- somente `evidence.json` é publicado;
- dumps SQL permanecem no runner efêmero.

## 4. Conteúdo do backup

A Supabase CLI gera:

- `roles.sql` — papéis;
- `schema.sql` — schema e objetos suportados pela CLI;
- `data.sql` — dados, inclusive tabelas Auth incluídas pelo procedimento oficial;
- `history-schema.sql` — estrutura do histórico de migrations;
- `history-data.sql` — registros das migrations.

Cada arquivo recebe tamanho e SHA-256 no relatório sanitizado. Os arquivos SQL não são publicados como artefatos.

## 5. Critérios de equivalência

### 5.1 Schema público

O fingerprint cobre:

- colunas;
- constraints;
- índices;
- políticas RLS;
- funções;
- triggers.

### 5.2 Dados públicos

Para cada uma das 20 tabelas públicas são comparados:

- número de registros;
- fingerprint determinístico do conteúdo serializado.

### 5.3 Supabase Auth

São comparados somente contagens e hashes determinísticos de:

- `auth.users`;
- `auth.identities`.

E-mails, hashes de senha, tokens e conteúdos individuais não são publicados.

### 5.4 Histórico de migrations

São comparados versão, nome e conteúdo das statements de `supabase_migrations.schema_migrations`.

## 6. Desenvolvimento orientado por regressão

### 6.1 Contrato inicial

O primeiro teste reprovou pela ausência de `scripts/verify-supabase-backup-restore.mjs`.

### 6.2 Isolamento da segunda pilha

A primeira execução encontrou conflito na porta padrão de Analytics. O destino foi isolado com Analytics e pooler desativados.

### 6.3 Segurança do artefato

Uma execução inicial publicou o diretório integral de dumps. Foi criado novo teste vermelho, e o workflow passou a publicar exclusivamente:

```text
artifacts/backup-restore/evidence.json
```

### 6.4 Cobertura Auth

A revisão constatou que os dados Auth eram restaurados, mas ainda não comparados. Um terceiro teste vermelho exigiu `authFingerprint`, `auth.users`, `auth.identities` e criação de fixtures Auth. A implementação passou a criar sete identidades descartáveis e comprovar sua equivalência no destino.

## 7. Execução funcional ampliada

```text
GitHub Actions run: 30538395958
Job: Dump, restauração e equivalência
Conclusão: success
```

Etapas aprovadas:

- Node 24;
- dependências reproduzíveis;
- cliente PostgreSQL;
- pilha de origem;
- reset com 25 migrations e seed;
- criação de sete identidades Auth;
- geração dos cinco dumps;
- segunda pilha isolada;
- restauração transacional;
- comparação de schema, dados públicos, Auth e migrations;
- publicação exclusiva de `evidence.json`;
- limpeza integral.

## 8. Resultado da equivalência

```text
schema: true
data: true
auth: true
migrations: true
```

Fingerprints de origem e destino:

```text
schema:     0edda0a68fdbd4a6984f68d4d0332a3f4b8fe9965ea34911f1ea17b7a3150948
dados:      ba4e33c2189455a676d52d0ef5f7f0ec7f816a4348641c0cf85b0043643a2d84
Auth:       e3776cc47f5628c5f2a8365dd105837cefffdc79952df683787addda0ed4b477
migrations: 18caf36e3032a4c2dfb2064b18ad2cf1c0dbf59df8c12ff8319ab7d7bd679e6b
```

Contagens Auth:

```text
auth.users: 7
auth.identities: 7
```

Foram comparadas 20 tabelas públicas. Entre as fixtures restauradas estavam configuração global, competência, Controladores, Inventário, perfis, programa, escolas, vínculos, escopos e eventos de auditoria.

## 9. Artefato sanitizado

O artefato da execução final:

```text
backup-restore-disposable-30538395958
conteúdo: evidence.json
arquivo compactado: 1.441 bytes
dumps SQL: ausentes
```

O relatório contém somente hashes, tamanhos, contagens e resultado.

## 10. Limites

Esta auditoria comprova o procedimento de backup lógico e restauração, mas não:

- copia dados reais de Production;
- define retenção institucional;
- substitui armazenamento externo protegido;
- constitui teste de desastre autorizado;
- habilita recursos pagos de recuperação contínua;
- substitui exportação periódica do projeto remoto.

## 11. Conclusão

O gate de backup e restauração em ambiente descartável foi tecnicamente comprovado. Schema, dados públicos, identidades Auth e histórico restaurados são equivalentes à origem, sem acesso ou alteração de Production.

O blocker correspondente pode ser retirado após os gates do SHA final e a integração do PR.
