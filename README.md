# RADAR PDDE 2026

Sistema institucional de acompanhamento operacional do PDDE da 4ª CRE/SME-Rio. O produto organiza competência mensal, carteira de unidades, prontuário, análise documental, pendências, contatos, notas fiscais, patrimônio, Gestão de Equipe, acompanhamento gerencial e exportações.

> **Estado reconciliado em 3 de setembro de 2026:** a `main` está no merge do PR #249 (`75237c6`) e Production está `READY` no mesmo baseline funcional. O ciclo posterior ao PR #237 incorporou N/A na Declaração BB Ágil, governança de dependências, proteção da comunicação externa, planilha editorial de Pendências, PDDE Básico primeiro somente na apresentação e novo polimento visual. A reconciliação do plano mestre foi refeita a partir do código e de Production. Estado completo: [`docs/CURRENT_STAGE.md`](docs/CURRENT_STAGE.md) e [handoff de reconciliação pós-hotfixes](docs/handoff/2026-09-03-reconciliacao-plano-mestre-pos-hotfixes.md).

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

A retomada do plano mestre de 26/08 foi reconciliada contra o **código atual**, migrations, testes e Production. Não se deve mais iniciar PR3.1 e seguir a sequência antiga literalmente.

Estado reconciliado:

- G0/PR1/PR2: concluídos;
- PR3 readiness: parcial, porque a cadeia crítica foi tornada determinística pelo PR #222, mas ainda existem módulos com polling/timeout;
- PR4 reparo condicionado da Assessoria: pendente e confirmado como relevante por preflight read-only atual;
- PR5 idempotência real/IDs persistentes: pendente;
- PR6 semântica única de ação/prioridade: parcial;
- PR6B: atendido funcionalmente;
- PR7A/PR7B: atendidos em essência pela fila atual, mobile, acessibilidade e refinamentos posteriores;
- PR8: parcial, com StatePort/DataService incremental já existentes, mas contrato remoto autoritativo de NF ainda incompleto;
- PR9A: pendente;
- PR9B: concluído antecipadamente pelo PR #239 com três execuções + mediana, sem elevar pisos;
- PR9C: pendente e condicionado à medição causal.

O handoff canônico é [`docs/handoff/2026-09-03-reconciliacao-plano-mestre-pos-hotfixes.md`](docs/handoff/2026-09-03-reconciliacao-plano-mestre-pos-hotfixes.md).

Decisões posteriores ao plano que **não podem regredir** incluem: individualização fiscal/Assessoria por `registered_invoice_id`; `a_identificar` atômico com Pendência; fronteira `row_version` fora do payload; autoridade dividida da Assessoria; N/A da Declaração BB Ágil; Boleto de Internet somente como tipo de gasto em Notas Fiscais; comunicação externa sem o nome interno do sistema; fila de Pendências transversal; e PDDE Básico primeiro apenas na ordem visual.

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

### Pendências XLSX

- exportação própria da tela de Pendências;
- abas `RESUMO` e `PENDÊNCIAS`;
- respeita busca e filtros atuais;
- inclui as quatro situações canônicas;
- formatação editorial com indicadores executivos;
- sem UUIDs/chaves técnicas no relatório;
- ExcelJS sob demanda;
- auditoria antes do download e registro de conclusão.

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
2. [`docs/handoff/2026-09-03-reconciliacao-plano-mestre-pos-hotfixes.md`](docs/handoff/2026-09-03-reconciliacao-plano-mestre-pos-hotfixes.md);
3. [`docs/CURRENT_STAGE.md`](docs/CURRENT_STAGE.md);
4. [`docs/decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md`](docs/decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md);
5. [`docs/decisions/ADR-052-autoridade-unica-fluxos-criticos.md`](docs/decisions/ADR-052-autoridade-unica-fluxos-criticos.md);
6. [`docs/DECISION_LOG.md`](docs/DECISION_LOG.md), incluindo ADR-053;
7. [`docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`](docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md);
8. [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) e [`docs/reference/STATUS_DOCUMENTOS.md`](docs/reference/STATUS_DOCUMENTOS.md);
9. [`docs/handoff/2026-09-02-dependency-governance.md`](docs/handoff/2026-09-02-dependency-governance.md);
10. somente depois, planos e handoffs históricos.

O plano mestre de 26/08 continua valioso como catálogo técnico, mas sua sequência antiga está subordinada ao handoff de reconciliação de 03/09.

## Próxima sequência

```text
PR3-R — readiness remanescente
→ PR4-R — preflight/reparo condicionado da Assessoria
→ PR5-R — IDs seguros + idempotência server-side de NF
→ PR6-R — autoridade semântica única da fila
→ PR8-R — resultado remoto autoritativo/reconciliação
→ PR9A-R — instrumentação causal
→ PR9C-R — otimização por hipótese medida
→ reavaliar ADR-051
→ fechamento integral
```

PR6B, PR7A, PR7B e PR9B não devem ser recriados: seus objetivos já foram absorvidos pelo produto atual. Cada frente remanescente deve começar por inspeção do SHA corrente e preservar as decisões posteriores ao plano.

Nenhum PR, documento ou Preview autoriza por si só merge, migration ou mudança de Production fora do escopo aprovado.
