# RADAR PDDE 2026

Sistema institucional de acompanhamento operacional do PDDE da 4ª CRE/SME-Rio. O produto organiza competência mensal, carteira de unidades, prontuário, análise documental, pendências, contatos, notas fiscais, patrimônio, Gestão de Equipe, acompanhamento gerencial e exportações.

> **Estado reconciliado em 26 de agosto de 2026:** a `main` de origem está em `0965ba8` (PR #200 integrado). O hotfix `Incorreto + Pendência` está concluído; as demais correções funcionais ainda não começaram. O plano pós-auditoria foi aprovado e substitui o plano de 24/08 como referência operacional. O baseline mutável completo fica em [`docs/CURRENT_STAGE.md`](docs/CURRENT_STAGE.md) e deve ser revalidado antes de qualquer ação dependente do ambiente.

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

O diagnóstico iniciado em 24/08 e consolidado depois do PR #200 confirmou:

- submit repetido pode duplicar uma inclusão de despesa;
- `invoice:save` ainda possui lacunas de no-op semântico, idempotência de servidor e refresh mínimo no núcleo;
- quatro contextos foram historicamente observados com Consulta Assessoria vazia sem NF de serviço; o conjunto atual deve ser recalculado por preflight;
- módulos funcionais podem deixar de se instalar depois do timeout fixo de dez segundos;
- a regra transversal de Pendências está correta, mas a fila exige novo contrato de prioridade, filtros, ações e hierarquia visual.

O plano mestre canônico está em [`docs/superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md`](docs/superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md). O antigo item 20, a proteção de senhas vazadas, o PR #195 e a deduplicação de NF por conteúdo permanecem fora desta frente.

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
3. [`docs/handoff/2026-08-26-retomada-plano-mestre-pos-pr200.md`](docs/handoff/2026-08-26-retomada-plano-mestre-pos-pr200.md);
4. [`docs/superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md`](docs/superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md);
5. [`docs/reports/2026-08-26-plano-mestre-correcoes-pos-auditoria.docx`](docs/reports/2026-08-26-plano-mestre-correcoes-pos-auditoria.docx);
6. [`docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`](docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md);
7. [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md);
8. [`docs/DECISION_LOG.md`](docs/DECISION_LOG.md);
9. [`docs/reference/STATUS_DOCUMENTOS.md`](docs/reference/STATUS_DOCUMENTOS.md).

A porta de entrada vigente está registrada em [`docs/handoff/2026-08-26-retomada-plano-mestre-pos-pr200.md`](docs/handoff/2026-08-26-retomada-plano-mestre-pos-pr200.md). Auditorias e planos anteriores permanecem históricos.

## Próxima sequência

1. executar G0 e congelar novamente GitHub, Vercel, Supabase, dados e performance;
2. executar PR1 e PR2;
3. executar PR3.1, PR3.2 e PR3.3, cada qual com gate próprio;
4. executar PR4 somente depois de PR2 publicado e de preflight fresco;
5. seguir PR5, PR6, PR6B, PR7A e PR7B na ordem aprovada;
6. executar PR8A antes de PR8B;
7. medir em PR9A, estabilizar a metodologia em PR9B e só então otimizar por hipótese em PR9C.

Nenhum PR, documento ou Preview autoriza por si só merge, migration ou mudança de Production fora do escopo aprovado.
