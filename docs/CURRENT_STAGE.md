# RADAR PDDE — Estado atual do projeto

- **Atualizado em:** 1º de agosto de 2026
- **Commit funcional do Excel SME:** `baeea25201ed304f351ea7e3144b0f13147bc3a7`
- **Commit do artefato publicado:** `b15718ecdd57e82baeaf2116de34af51f8ed1cc0`
- **Deployment Production:** `dpl_HjpGHuFNzgTRKDsofzzogbBTAe5h` — `READY`
- **Hardening atual:** Node 24, gates remotos, backup/restauração, autenticação e Excel SME compatível concluídos
- **Próxima frente sugerida:** homologação manual do relatório institucional no Microsoft Excel desktop

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
- reconciliação do histórico da migration SME;
- correção de desempenho do login e da restauração de sessão;
- Excel SME mensal reconstruído sobre o template canônico de 30 colunas com ExcelJS 4.4.0, vinculado à competência ativa e homologado no Microsoft Excel desktop.

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
production deployment: dpl_HjpGHuFNzgTRKDsofzzogbBTAe5h
state: READY
artifactCommitSha: b15718ecdd57e82baeaf2116de34af51f8ed1cc0
functionalMergeCommit: baeea25201ed304f351ea7e3144b0f13147bc3a7
nodeVersion: 24.x
git.deploymentEnabled: false
```

O Excel SME compatível foi publicado por janela controlada. O bloqueio automático foi restaurado após o deployment ficar `READY` e os contratos publicados passarem pelos smokes HTTP e visual.

Evidência: `docs/evidence/releases/2026-08-01-excel-sme-production.json`.

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

A publicação do Excel SME não alterou schema, dados, RLS, Auth remoto ou migrations.

## 4. Desempenho do login e da restauração de sessão

### 4.1 Defeito comprovado

A tela de acesso permanecia por vários segundos em **Verificando a sessão**, inclusive quando o navegador já possuía sessão válida. O login manual também acumulava espera antes de liberar a aplicação.

Causas:

1. evento Auth e chamada explícita podiam validar a mesma sessão duas vezes;
2. perfil, papel efetivo e escopos escolares eram consultados em série;
3. o bootstrap carregava todas as 19 entidades do repositório em sequência;
4. entidades não necessárias ao estado inicial, como `audit_events`, entravam no caminho crítico.

### 4.2 Correção publicada

- validação em voo único por usuário autenticado;
- deduplicação entre restauração, login e `onAuthStateChange`;
- perfil, papel efetivo e escopos iniciados em paralelo;
- snapshot remoto com subconjunto explícito;
- leituras concorrentes limitadas a seis;
- bootstrap inicial restrito às 14 entidades operacionais;
- snapshot integral preservado para operações que o exigem;
- aplicação mantida inerte até o carregamento autorizado terminar.

Nova sequência visual:

```text
Verificando a sessão existente…
→ Sessão reconhecida. Carregando os dados autorizados…
→ ambiente de trabalho liberado
```

Redução estrutural:

```text
antes: até 6 consultas Auth duplicadas/serializadas
       + até 24 leituras HTTP em fila no escopo técnico observado

depois: 3 consultas Auth em uma rodada paralela
        + 14 entidades operacionais em lotes concorrentes limitados
```

A duração absoluta ainda depende da rede do usuário e da resposta do Supabase, mas as esperas desnecessárias do frontend foram removidas.

### 4.3 Evidências

PR funcional: `#113`.

SHA validado:

```text
f647941feffe89ccd4bcb2b75ed19faf999007b2
```

Gates aprovados:

- snapshot canônico — run `30548549278`;
- Supabase readiness — run `30548549003`;
- Playwright E2E — run `30548549099`;
- perfis × desktop, Android e iPhone — run `30548548995`;
- Lighthouse CI — run `30548549280`.

Auditoria: `docs/audits/2026-07-30-performance-login-restauracao-sessao.md`.

## 5. Runtime Node.js

```text
package.json        engines.node = 24.x
package-lock.json   packages[""].engines.node = 24.x
.nvmrc              24
.node-version       24
GitHub Actions      node-version: 24
Vercel              nodeVersion: 24.x
```

Proteção: `tests/unit/release-hardening-contract.test.js`.

## 6. Gate remoto por papel e viewport

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

## 7. Backup e restauração descartáveis

```text
.github/workflows/backup-restore-disposable.yml
scripts/verify-supabase-backup-restore.mjs
tests/unit/backup-restore-gate-contract.test.js
npm run test:backup-restore
```

O gate comprova, sem acessar Production:

1. origem Supabase descartável;
2. reset com 25 migrations e seed;
3. criação de sete identidades Auth efêmeras;
4. dumps de papéis, schema, dados e histórico;
5. restauração transacional em segunda pilha;
6. equivalência de schema, dados públicos, `auth.users`, `auth.identities` e migrations;
7. limpeza dos ambientes.

O artefato publicado contém somente `evidence.json`; os SQLs permanecem no runner efêmero.

## 8. Recurso dependente de plano

A checagem de senhas comprometidas é disponibilizada pelo Supabase apenas no plano Pro ou superior. Como o projeto opera no plano Free e não há autorização de despesa, ela não integra os critérios atuais de liberação. Reavaliar se houver mudança de plano.

## 9. Migrações

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

## 10. Relatórios Excel

### Institucional

- modelo, renderer, quatro abas e certificação: concluídos;
- botão principal integrado ao XLSX;
- CSV preservado como secundário e fallback;
- abertura manual no Excel desktop: pendente.

### SME mensal

- template canônico, modelo de tradução, renderer ExcelJS, integração e certificação: concluídos;
- 30 colunas literais do modelo original e uma aba associada à competência mensal ativa;
- botão próprio habilitado apenas para competência mensal válida;
- `dataValidations`: ausente por contrato;
- abertura manual no Excel desktop: aprovada sem aviso de reparo, com conteúdo visível e alinhamentos revisados.

## 11. Gates remanescentes antes da liberação oficial

1. abrir o relatório institucional de quatro abas no Microsoft Excel desktop sem reparo;
2. revisar Advisors quando aplicável;
3. concluir UAT funcional;
4. realizar polimento editorial e visual sem alterar produto;
5. registrar decisão formal de release.

Node, matriz remota, backup/restauração e desempenho do login estão cumpridos e não integram mais os bloqueadores.

## 12. Próxima frente recomendada

### Homologação manual do relatório institucional no Microsoft Excel desktop

- abrir o relatório institucional de quatro abas;
- confirmar ausência de aviso de reparo;
- conferir fórmulas, estilos, filtros, congelamento, larguras e impressão;
- registrar versão do Excel, arquivos, data e resultado;
- corrigir divergências e repetir a certificação automatizada.

O Excel SME mensal já cumpriu esse gate. Depois do relatório institucional, seguir para Advisors, UAT, polimento e decisão de release.

## 13. Documentos de continuidade

- `AGENTS.md`;
- `README.md`;
- `docs/PROJECT_CONTEXT.md`;
- `docs/DECISION_LOG.md`;
- `docs/architecture/testing.md`;
- `docs/reference/STATUS_DOCUMENTOS.md`;
- `docs/audits/2026-07-30-performance-login-restauracao-sessao.md`;
- `docs/evidence/releases/2026-08-01-excel-sme-production.json`;
- `docs/evidence/releases/2026-07-30-login-performance-production.json`;
- `docs/audits/2026-07-30-backup-restore-disposable.md`;
- `docs/audits/2026-07-30-node24-gate-remoto-perfis-viewports.md`;
- `docs/audits/2026-07-29-reconciliacao-migration-sme-evidencias.md`.
