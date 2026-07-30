# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 30 de julho de 2026  
**Commit funcional publicado:** `dfc8aa3030b02edb73f764f5f56bd6759a7a1d77`  
**Deployment Production:** `dpl_7tLM3RZ7MEuRRTzvGmc9EiAARmDY` — `READY`  
**Reconciliação da migration SME:** `79cb67c84720b1850879d9c50c262e1623d5d8cc`  
**Hardening atual:** Node 24, gate perfil/viewport e backup/restauração descartáveis concluídos  
**Próxima frente sugerida:** homologação manual dos relatórios no Microsoft Excel desktop

## 1. Como usar este documento

Antes de iniciar tarefa:

1. consultar a `main` atual e os PRs abertos;
2. verificar workflows e checks do SHA candidato;
3. confirmar deployment e SHA na Vercel;
4. confirmar projeto e estado do Supabase;
5. comparar migrations local/remoto quando houver assunto de banco;
6. ler `PROJECT_CONTEXT.md` e `DECISION_LOG.md`;
7. verificar os gates exigidos pela camada alterada;
8. atualizar este arquivo quando o estado material mudar.

Código, banco e deployment prevalecem sobre plano, relatório ou memória de chat.

## 2. Situação executiva

A integração entre frontend, Supabase Auth, PostgREST, RLS, PostgreSQL e Vercel Production está ativa.

Concluídos e publicados:

- governança da Gestão SME;
- competência global de janeiro a dezembro de 2026;
- avaliação mensal canônica;
- timeline cronológica da unidade;
- relatórios XLSX institucional e SME;
- CSV legado preservado como fallback;
- navegação contextual;
- reconciliação do histórico da migration SME.

Concluídos no hardening anterior ao release:

- Node.js fixado em `24.x`;
- gate remoto de cinco papéis em três viewports;
- correção do logout do Administrador técnico no mobile;
- backup lógico com Supabase CLI;
- restauração em segunda pilha Supabase descartável;
- equivalência comprovada de schema, dados públicos, identidades Auth e migrations;
- evidência sanitizada sem publicação dos dumps SQL.

A liberação oficial do produto ainda não foi declarada.

## 3. Produção

### 3.1 Vercel

```text
project: radarpdde-fix
production deployment: dpl_7tLM3RZ7MEuRRTzvGmc9EiAARmDY
state: READY
artifactCommitSha: dfc8aa3030b02edb73f764f5f56bd6759a7a1d77
nodeVersion: 24.x
```

O hardening deste ciclo não exige publicação funcional. O artefato Production permanece inalterado até nova janela deliberada.

### 3.2 Supabase

```text
project: scnryinorqeucbfkioxo
status: ACTIVE_HEALTHY
PostgreSQL: 17
runtime Production: supabase-production
activeRepository: supabase
migrations correspondentes: 25
```

Estado de configuração confirmado:

```text
closing_competence = 2026-12
app_config.row_version = 5
```

O teste de backup/restauração não acessa esse projeto. Origem e destino são pilhas locais descartáveis no runner do GitHub Actions.

## 4. Runtime Node.js

```text
package.json        engines.node = 24.x
package-lock.json   packages[""].engines.node = 24.x
.nvmrc              24
.node-version       24
GitHub Actions      node-version: 24
Vercel              nodeVersion: 24.x
```

Proteção: `tests/unit/release-hardening-contract.test.js`.

## 5. Gate remoto por papel e viewport

Workflow:

```text
.github/workflows/gate-remoto-perfis-viewports.yml
```

Papéis:

- Administrador técnico;
- Assistente de Verbas Federais;
- Controlador;
- Equipe de Inventário;
- Gestão SME.

Viewports:

- Desktop Chrome;
- Pixel 7 / Chromium;
- iPhone 15 / WebKit.

A matriz contém 15 cenários de papel × viewport. Auth/RLS mutáveis são executados uma única vez no desktop.

## 6. Backup e restauração descartáveis

```text
.github/workflows/backup-restore-disposable.yml
scripts/verify-supabase-backup-restore.mjs
tests/unit/backup-restore-gate-contract.test.js
npm run test:backup-restore
```

Fluxo comprovado:

1. origem Supabase descartável;
2. reset com 25 migrations e seed;
3. criação de sete identidades Auth efêmeras;
4. dumps de papéis, schema, dados e histórico;
5. segunda pilha isolada por `SUPABASE_WORKDIR`;
6. restauração transacional com `psql`;
7. comparação de schema, dados públicos, `auth.users`, `auth.identities` e migrations;
8. limpeza das duas pilhas.

Evidência funcional ampliada:

```text
GitHub Actions run: 30538395958
job: Dump, restauração e equivalência
conclusão: success
```

Fingerprints coincidentes:

```text
schema:     0edda0a68fdbd4a6984f68d4d0332a3f4b8fe9965ea34911f1ea17b7a3150948
dados:      ba4e33c2189455a676d52d0ef5f7f0ec7f816a4348641c0cf85b0043643a2d84
Auth:       e3776cc47f5628c5f2a8365dd105837cefffdc79952df683787addda0ed4b477
migrations: 18caf36e3032a4c2dfb2064b18ad2cf1c0dbf59df8c12ff8319ab7d7bd679e6b
```

Contagens Auth restauradas:

```text
auth.users: 7
auth.identities: 7
```

O artefato publicado possui 1.441 bytes e contém somente `evidence.json`. Os SQLs permanecem no runner efêmero.

## 7. Recurso dependente de plano

A checagem de senhas comprometidas é disponibilizada pelo Supabase apenas no plano Pro ou superior. Como o projeto opera no plano Free e não há autorização de despesa, ela foi retirada dos critérios de liberação. Reavaliar se houver mudança de plano.

## 8. Migrações

O GitHub e o Supabase Production possuem 25 versões correspondentes.

```text
arquivo local: 20260728182226_sme_access_governance.sql
registro remoto: 20260728182226_sme_access_governance
registro derivado 20260728190344: ausente
SHA-256: cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e
```

Migration futura exige:

1. `supabase migration list --linked`;
2. teste de alinhamento SME;
3. reset local;
4. pgTAP e lint SQL;
5. tipos regenerados;
6. backup/restauração descartáveis;
7. `db push --linked --dry-run`;
8. plano de rollback;
9. evidência no mesmo SHA.

## 9. Relatórios Excel

### Institucional

- modelo, renderer, quatro abas e certificação: concluídos;
- botão principal integrado ao XLSX;
- CSV preservado como secundário e fallback;
- abertura manual no Excel desktop: pendente.

### SME mensal

- modelo, renderer, integração e certificação: concluídos;
- botão próprio por competência mensal;
- `dataValidations`: ausente por contrato;
- abertura manual no Excel desktop: pendente.

## 10. Gates remanescentes antes da liberação oficial

1. abrir os dois produtos no Microsoft Excel desktop sem reparo;
2. revisar Advisors quando aplicável;
3. concluir UAT funcional;
4. realizar polimento editorial e visual sem alterar produto;
5. registrar decisão formal de release.

Node, matriz remota e backup/restauração estão cumpridos e não integram mais os bloqueadores.

## 11. Próxima frente recomendada

### Homologação manual no Microsoft Excel desktop

- abrir o relatório institucional de quatro abas;
- abrir o Excel SME mensal;
- confirmar ausência de aviso de reparo;
- conferir fórmulas, estilos, filtros, congelamento, larguras e impressão;
- registrar versão do Excel, arquivos, data e resultado;
- corrigir divergências e repetir a certificação automatizada.

Depois disso, seguir para Advisors, UAT, polimento e decisão de release.

## 12. Documentos de continuidade

- `AGENTS.md`;
- `README.md`;
- `docs/PROJECT_CONTEXT.md`;
- `docs/DECISION_LOG.md`;
- `docs/architecture/testing.md`;
- `docs/reference/STATUS_DOCUMENTOS.md`;
- `docs/audits/2026-07-30-backup-restore-disposable.md`;
- `docs/audits/2026-07-30-node24-gate-remoto-perfis-viewports.md`;
- `docs/audits/2026-07-29-reconciliacao-migration-sme-evidencias.md`.
