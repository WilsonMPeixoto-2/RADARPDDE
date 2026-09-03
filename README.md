# RADAR PDDE 2026

Sistema institucional de acompanhamento operacional do PDDE da 4ª CRE/SME-Rio. O produto organiza competência mensal, carteira de unidades, prontuário, análise documental, pendências, contatos, notas fiscais, patrimônio, Gestão de Equipe, acompanhamento gerencial e exportações.

> **Estado reconciliado em 3 de setembro de 2026:** o último **baseline funcional auditado** é o PR #249 (`75237c6ec5c22e8f7be9eb39fd21481f6d608010`). A reconciliação documental foi integrada depois desse baseline e, por ser exclusivamente documental, pode produzir SHA/deployment posterior em `main` e na Vercel sem mudança de runtime. Para SHA e deployment correntes, consulte o remoto; para estado funcional e sequência vigente, use [`docs/CURRENT_STAGE.md`](docs/CURRENT_STAGE.md) e [`docs/handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md`](docs/handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md).

## Fontes de verdade

Para saber o que existe de fato:

1. código da `main` ou SHA analisado;
2. Supabase efetivo, incluindo migrations, Auth, RLS, funções e dados;
3. deployment Vercel e SHA publicado;
4. decisões vigentes;
5. testes e evidências reproduzíveis que representem o contrato atual;
6. documentação canônica;
7. históricos e planos.

Documentação antiga não redefine o código para ficar “coerente”. Quando diverge, a documentação é que deve ser reconciliada.

## Produto publicado

### Operação do PDDE

- competência global e exercício;
- Dashboard, Carteira e Competências;
- Prontuário e timeline;
- bonificação e análise técnica;
- Pendências, tentativas, reanálises e contatos;
- notas fiscais e efeitos associados;
- bens permanentes, encaminhamento e inventariação;
- Registros Internos;
- busca e navegação contextual.

### Perfis

- **Controlador:** operação autorizada na própria CRE, com carteira como responsabilidade principal;
- **Assistente de Verbas Federais:** operação transversal e Gestão de Equipe da CRE;
- **Gestão SME:** acompanhamento gerencial e configurações atualmente autorizadas;
- **Equipe de Inventário:** fluxo patrimonial autorizado;
- **Administrador técnico:** papel técnico de infraestrutura, escopos, importação, auditoria e homologação.

`technical_admin` não é quinto perfil funcional cotidiano.

## Correções consolidadas e diagnóstico atual

A reauditoria source-first de 03/09 reabriu os códigos-fonte das frentes remanescentes e substituiu a antiga fila numerada por um plano executável R1–R9. G0/PR1/PR2/PR6B/PR7B/PR9B permanecem fora da fila; PR4 antigo continua superado; a antiga PR7A virou gate de equivalência sem redesign obrigatório. O trabalho real começa retirando a autoridade de consistência que ainda vive em wrappers de performance, antes da expansão sistêmica de readiness.

O baseline atual incorpora, entre outros:

- PR #150: transição segura entre perfis da equipe usando a mesma conta Auth;
- PR #154: redistribuição de carteira bloqueada ao Controlador também no serviço e banco;
- PR #157: criação de exercício com lote correto de doze competências;
- PR #160: sincronização de competências remotas antes do primeiro render;
- PR #161: remoção da dependência de `listUsers`, lookup Auth exato e reparo de resíduos legados;
- PR #162: remediações `SCH-01`, `CFG-02`, `INV-01`, `ASSET-02`, `PEND-02`, `EXP-01` e `EXP-02`.

A correção de `ASSET-02`, por exemplo, já existe no código com `saveAssetWithLog`, versão esperada e auditoria. A matriz continua distinguindo **correção implementada** de **prova ponta a ponta completa**.

A reconciliação de 03/09 reclassificou o diagnóstico de 24/08:

- o duplo submit imediato foi contido pelo PR1/#202, mas retry/perda de resposta ainda não têm idempotência durável no servidor;
- o no-op semântico e o planejador de efeitos já existem pelo PR2/#206; não devem ser reimplementados;
- os contextos históricos inconsistentes de Consulta Assessoria sem NF de serviço não permanecem como dívida atual: a leitura de Production em 03/09 encontrou zero estados legados não vazios inconsistentes; 15 avaliações vazias/não iniciadas não devem ser normalizadas automaticamente;
- readiness sistêmico ainda é lacuna real porque o registry planejado não existe e há polling residual em integrações;
- Pendências já possui fila, filtros, detalhe, mobile, exportação e layout aprovados; o trabalho remanescente é remover duplicidade semântica e provar apenas gaps funcionais atuais, sem restaurar o redesign histórico.

O plano executável corrente está em [`docs/superpowers/plans/2026-09-03-plano-remanescente-source-first.md`](docs/superpowers/plans/2026-09-03-plano-remanescente-source-first.md), sustentado pela [`reauditoria direta do código-fonte`](docs/audits/2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md). O plano de 26/08 permanece referência histórica/técnica, não fila de implementação. O antigo item 20, a proteção de senhas vazadas, o PR #195 e a deduplicação de NF por conteúdo permanecem fora desta frente.

## Garantia operacional

O projeto possui:

- monitor geral de Production;
- gestão automática de incidentes;
- auditoria agregada de vinte invariantes de integridade;
- backup/restauração em pilhas descartáveis;
- gate remoto por perfil e viewport;
- matriz funcional executável de 44 operações;
- infraestrutura integrada de smoke autenticado somente leitura.

O smoke autenticado de Production permanece desativado até provisionamento explícito de cinco identidades técnicas exclusivas. Contas pessoais ou operacionais não devem ser reutilizadas para monitoramento.

## Exportações

### Relatório institucional

- histórico multicompetência;
- abas `BONIFICACOES`, `SINTESE`, `QUALIDADE_DADOS` e `METADADOS`;
- CSV secundário e de contingência;
- auditoria inicial obrigatória antes de liberar download.

### Excel SME

- uma competência mensal por arquivo;
- uma aba;
- 27 colunas A:AA;
- template-fonte de 30 colunas usado apenas como base visual;
- designação textual;
- certificação OOXML e reabertura;
- homologação no Microsoft Excel desktop;
- auditoria inicial obrigatória antes do download.

### Planilha de Pendências

- exportação XLSX diretamente da tela de Pendências;
- respeita busca e filtros atuais;
- abas `RESUMO` e `PENDÊNCIAS`;
- identidade editorial própria;
- sem IDs/UUIDs técnicos;
- ExcelJS sob demanda;
- auditoria antes e depois do download.

## Desenvolvimento e verificação

```bash
npm ci
npm run test:readiness
npm run test:e2e
npm run test:mobile
```

Supabase descartável:

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
```

Matriz funcional:

```bash
npm run generate:functional-matrix
npm run check:functional-matrix
```

## Documentação

Ordem de leitura:

1. [`AGENTS.md`](AGENTS.md);
2. [`docs/superpowers/plans/2026-09-03-plano-remanescente-source-first.md`](docs/superpowers/plans/2026-09-03-plano-remanescente-source-first.md);
3. [`docs/CURRENT_STAGE.md`](docs/CURRENT_STAGE.md);
4. [`docs/audits/2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md`](docs/audits/2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md);
5. [`docs/handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md`](docs/handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md);
6. [`docs/decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md`](docs/decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md) e [`ADR-052`](docs/decisions/ADR-052-autoridade-unica-fluxos-criticos.md);
7. [`docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`](docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md) e [`docs/reference/STATUS_DOCUMENTOS.md`](docs/reference/STATUS_DOCUMENTOS.md);
8. [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) e [`docs/DECISION_LOG.md`](docs/DECISION_LOG.md);
9. [`docs/handoff/2026-09-02-dependency-governance.md`](docs/handoff/2026-09-02-dependency-governance.md);
10. somente depois, planos/handoffs históricos de 26/08–31/08.

A porta de entrada executável vigente é o plano source-first de 03/09.

## Próxima sequência

```text
R1 — retirar autoridade funcional dos wrappers de performance
→ R2A — contrato mínimo de readiness e loader tolerante
→ R2B — readiness crítico
→ R2C — readiness restrito/opcional e inventário final
→ R3 — IDs persistentes + intent/idempotência + contrato remoto v2 inativo
→ R4 — semântica única de Pendências
→ R5 — ativação autoritativa/incremental de save/remove de NF
→ R6 — gate de equivalência da superfície de Pendências
→ R7 — instrumentação causal do bootstrap
→ R8 — otimizações somente por hipótese medida
→ R9 — fechamento funcional e rebaseline
→ reavaliar ADR-051 em frente separada
```

Os identificadores R1–R9 são fases do programa, não números de Pull Request do GitHub.
