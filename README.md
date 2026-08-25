# RADAR PDDE 2026

Sistema institucional de acompanhamento operacional do PDDE da 4ª CRE/SME-Rio. O produto organiza competência mensal, carteira de unidades, prontuário, análise documental, pendências, contatos, notas fiscais, patrimônio, Gestão de Equipe, acompanhamento gerencial e exportações.

> **Estado reconciliado em 24 de agosto de 2026:** o diagnóstico pré-implementação foi concluído sobre a `main` `4542bbf` (PR #194 integrado) e consultas somente leitura no Supabase Production. Existem correções planejadas, mas nenhuma foi implementada neste checkpoint. O baseline mutável completo fica em [`docs/CURRENT_STAGE.md`](docs/CURRENT_STAGE.md) e deve ser revalidado antes de qualquer ação dependente do ambiente.

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

O baseline atual incorpora, entre outros:

- PR #150: transição segura entre perfis da equipe usando a mesma conta Auth;
- PR #154: redistribuição de carteira bloqueada ao Controlador também no serviço e banco;
- PR #157: criação de exercício com lote correto de doze competências;
- PR #160: sincronização de competências remotas antes do primeiro render;
- PR #161: remoção da dependência de `listUsers`, lookup Auth exato e reparo de resíduos legados;
- PR #162: remediações `SCH-01`, `CFG-02`, `INV-01`, `ASSET-02`, `PEND-02`, `EXP-01` e `EXP-02`.

A correção de `ASSET-02`, por exemplo, já existe no código com `saveAssetWithLog`, versão esperada e auditoria. A matriz continua distinguindo **correção implementada** de **prova ponta a ponta completa**.

O diagnóstico de 24/08 confirmou, sem alterar produto:

- submit repetido pode duplicar uma inclusão de despesa;
- `invoice:save` ainda possui lacunas de no-op semântico, idempotência de servidor e refresh mínimo no núcleo;
- quatro contextos possuem Consulta Assessoria vazia sem NF de serviço;
- módulos funcionais podem deixar de se instalar depois do timeout fixo de dez segundos;
- a regra transversal de Pendências está correta, mas a fila exige novo contrato de prioridade, filtros, ações e hierarquia visual.

O plano mestre está em [`docs/superpowers/plans/2026-08-24-plano-mestre-correcoes.md`](docs/superpowers/plans/2026-08-24-plano-mestre-correcoes.md). O PR #195 permanece fora desta frente.

## Garantia operacional

O projeto possui:

- monitor geral de Production;
- gestão automática de incidentes;
- auditoria agregada de vinte invariantes de integridade;
- backup/restauração em pilhas descartáveis;
- gate remoto por perfil e viewport;
- matriz funcional executável de 42 operações;
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
2. [`docs/CURRENT_STAGE.md`](docs/CURRENT_STAGE.md);
3. [`docs/handoff/2026-08-24-pre-implementacao-plano-mestre.md`](docs/handoff/2026-08-24-pre-implementacao-plano-mestre.md);
4. [`docs/superpowers/plans/2026-08-24-plano-mestre-correcoes.md`](docs/superpowers/plans/2026-08-24-plano-mestre-correcoes.md);
5. [`docs/reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx`](docs/reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx);
6. [`docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`](docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md);
7. [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md);
8. [`docs/DECISION_LOG.md`](docs/DECISION_LOG.md);
9. [`docs/reference/STATUS_DOCUMENTOS.md`](docs/reference/STATUS_DOCUMENTOS.md).

A porta de entrada vigente está registrada em [`docs/handoff/2026-08-24-pre-implementacao-plano-mestre.md`](docs/handoff/2026-08-24-pre-implementacao-plano-mestre.md). Auditorias anteriores permanecem históricas.

## Próxima sequência

1. integrar e preservar o pacote documental de 24/08;
2. congelar novamente o baseline remoto (Etapa 0);
3. executar PR 1 — contenção de submit repetido e refresh mínimo;
4. executar PR 2 — regra/efeitos canônicos da Assessoria e no-op semântico;
5. executar PR 3 — prontidão crítica por módulo;
6. reparar dados somente depois do gate do PR 2;
7. seguir os PRs 5, 6, 7A, 7B e 8 sem fundi-los num único pacote.

Nenhum PR, documento ou Preview autoriza por si só merge, migration ou mudança de Production fora do escopo aprovado.
