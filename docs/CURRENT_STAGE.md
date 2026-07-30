# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 29 de julho de 2026  
**Baseline funcional da `main`:** `598361dd784563f4d70d1e25df3818f4ee066da8`  
**Commit funcional publicado:** `dfc8aa3030b02edb73f764f5f56bd6759a7a1d77`  
**Deployment Production:** `dpl_7tLM3RZ7MEuRRTzvGmc9EiAARmDY` — `READY`  
**Reconciliação do histórico SME:** `79cb67c84720b1850879d9c50c262e1623d5d8cc`  
**Frente documental atual:** alinhamento integral concluído nesta linha de trabalho  
**Próxima frente:** ainda não escolhida

## 1. Como usar este documento

Antes de iniciar tarefa:

1. consultar o `main` atual e commits posteriores à baseline funcional;
2. verificar PRs e workflows abertos;
3. confirmar deployment e SHA na Vercel;
4. confirmar projeto e estado do Supabase;
5. comparar migrations local/remoto quando houver assunto de banco;
6. executar o teste de alinhamento da migration SME antes de nova migration;
7. ler `PROJECT_CONTEXT.md` e `DECISION_LOG.md`;
8. verificar a arquitetura da frente escolhida;
9. atualizar este arquivo quando o estado material mudar.

Código, banco e deployment prevalecem sobre plano, relatório ou memória de chat.

## 2. Situação executiva

A integração entre frontend, Supabase Auth, PostgREST, RLS, PostgreSQL e Vercel Production está ativa.

Concluídos e publicados:

- governança da Gestão SME;
- competência mensal global;
- disponibilização de janeiro a dezembro de 2026;
- avaliação mensal canônica;
- timeline cronológica da unidade;
- certificação automatizada integral dos relatórios Excel;
- integração dos botões XLSX institucional e Excel SME, com CSV legado preservado;
- navegação contextual com retorno seguro;
- restauração do bloqueio de deployments automáticos;
- reconciliação do identificador da migration SME sem reaplicação do SQL;
- teste de regressão do histórico da migration SME.

Concluído na documentação:

- reconciliação de contratos de competências e avaliação;
- atualização da ordem de carregamento;
- atualização da estratégia de testes;
- correção da arquitetura e cobertura Supabase;
- atualização do dicionário de dados;
- correção dos contratos Excel;
- classificação dos bootstraps e documentos de pré-conexão;
- atualização de `AGENTS.md`, índices, ADRs e catálogo de superfícies.

A liberação oficial do produto ainda não foi declarada.

## 3. Produção

### 3.1 Vercel

```text
project: radarpdde
production deployment: dpl_7tLM3RZ7MEuRRTzvGmc9EiAARmDY
state: READY
artifactCommitSha: dfc8aa3030b02edb73f764f5f56bd6759a7a1d77
```

O commit funcional publicado é anterior ao commit operacional que restaurou o bloqueio automático. A reconciliação documental e do histórico de migration não alterou o artefato funcional.

### 3.2 Supabase

```text
project: scnryinorqeucbfkioxo
status: ACTIVE_HEALTHY
PostgreSQL: 17
runtime Production: supabase-production
activeRepository: supabase
```

Estado de configuração confirmado na data de corte:

```text
closing_competence = 2026-12
app_config.row_version = 5
```

Contagens operacionais devem ser consultadas novamente quando forem necessárias. Não tratá-las como invariantes.

## 4. Ciclos concluídos

### Ciclo 1 — competência global

- seletor mensal transversal;
- persistência e recarga;
- janeiro a dezembro de 2026;
- alteração auditada de `closing_competence` para `2026-12`;
- ausência de seletor concorrente.

### Ciclo 2 — avaliação mensal

- regra canônica APTA/INAPTA;
- bonificação, análise técnica e pendência separadas;
- persistência atômica e `row_version`;
- mesma projeção nas superfícies.

### Ciclo 3 — timeline

- projeção cronológica somente leitura;
- autoria, data, origem e vínculos;
- visibilidade por perfil;
- deduplicação sem eliminar fatos legítimos.

### Ciclo 4 — certificação e integração Excel

- institucional histórico de quatro abas;
- botão principal institucional integrado ao XLSX;
- Excel SME mensal de uma aba integrado em botão próprio;
- CSV legado preservado como botão secundário e fallback;
- comparação até a célula OOXML;
- equivalência com CSV;
- hashes e manifesto sintético;
- ausência deliberada de `dataValidations` no produto SME.

### Ciclo 5 — navegação contextual

- retorno para origem real;
- preservação de competência e filtros;
- restauração do scrollport efetivo;
- foco no controle visível e acionável;
- suporte desktop, Android e iPhone.

## 5. Governança da Gestão SME

Permanece vigente:

- identificação e bonificação nas visões mensal e do Prontuário;
- ausência de análise técnica e controles operacionais nessas superfícies;
- Pendências em somente leitura;
- Registros Internos limitados a `actor_user_id = auth.uid()`;
- restrição cumulativa em interface, serviço e RLS;
- configuração de programas por exercício fora deste pacote.

## 6. Migrações

O repositório e o Supabase Production possuem 25 versões correspondentes.

Estado canônico da migration SME:

```text
arquivo local: 20260728182226_sme_access_governance.sql
registro remoto: 20260728182226_sme_access_governance
registro derivado 20260728190344: ausente
comprimento do SQL: 1.411 caracteres
SHA-256: cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e
```

A reconciliação:

- utilizou o mecanismo oficial de reparo do histórico;
- marcou o identificador derivado como revertido;
- marcou o identificador canônico como aplicado;
- não reaplicou nem reverteu o SQL funcional;
- preservou schema e políticas;
- deixou `db push --dry-run` sem migration pendente;
- acrescentou teste unitário de regressão.

Proteção obrigatória antes de migration futura:

1. `supabase migration list --linked`;
2. `node --test tests/unit/sme-migration-history-alignment.test.js`;
3. reset local;
4. pgTAP e lint SQL;
5. tipos regenerados;
6. dry-run, backup e rollback;
7. comparação do mesmo SHA.

Runbook: `docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`.

## 7. Estado dos relatórios Excel

### Institucional

- modelo, renderer, quatro abas e certificação: concluídos;
- botão principal: integrado ao XLSX em runtime;
- CSV: preservado em botão secundário e fallback em falha;
- abertura manual no Excel desktop: pendente.

### SME mensal

- modelo, renderer, integração e certificação: concluídos;
- botão próprio: habilitado somente para competência mensal;
- `dataValidations`: ausente por contrato;
- abertura manual no Excel desktop: pendente.

## 8. Gates antes da liberação oficial

1. habilitar proteção contra senhas vazadas no Supabase Auth;
2. fixar deliberadamente a major operacional do Node;
3. testar backup e restauração em ambiente descartável;
4. abrir os dois produtos no Microsoft Excel desktop sem reparo;
5. executar matriz remota por perfil e viewport;
6. revisar Advisors quando aplicável;
7. concluir UAT;
8. realizar polimento editorial e visual sem alterar produto;
9. registrar decisão formal de release.

## 9. Próximas frentes elegíveis

Nenhuma foi escolhida ainda.

### A. Polimento editorial e visual

Escopo possível:

- hierarquia;
- espaçamento;
- densidade;
- tabelas e cartões;
- ícones e estados;
- responsividade;
- mensagens operacionais.

Restrições:

- preservar paleta e logomarca;
- preservar capacidades;
- preservar nomenclatura canônica;
- não misturar configuração de programas;
- não esconder conteúdo mobile.

### B. Hardening e release

Escopo possível:

- proteção de senha;
- fixação do Node;
- backup/restauração;
- homologação Excel;
- matriz remota;
- UAT;
- decisão de release.

### C. Configuração de programas por exercício

Frente funcional separada. Exige desenho próprio e não deve ser misturada com Gestão SME ou polimento.

## 10. Regra de escolha

A próxima frente deve ser escolhida expressamente. Antes de implementar:

1. criar spec ou confirmar contrato existente;
2. registrar escopo e fora de escopo;
3. trabalhar em branch própria;
4. verificar impacto em produto, banco e deployment;
5. definir gates;
6. atualizar documentação no mesmo ciclo.

## 11. Documentos de continuidade

- `AGENTS.md`;
- `README.md`;
- `docs/README.md`;
- `docs/PROJECT_CONTEXT.md`;
- `docs/DECISION_LOG.md`;
- `docs/reference/STATUS_DOCUMENTOS.md`;
- `docs/audits/2026-07-29-alinhamento-documental-integral-pos-pr108.md`;
- `docs/audits/2026-07-29-reconciliacao-migration-sme-evidencias.md`.
