# RADAR PDDE 2026

Sistema institucional de acompanhamento operacional do PDDE da 4ª CRE/SME-Rio. O produto organiza competência mensal, carteira de unidades, prontuário, análise documental, pendências, contatos, notas fiscais, patrimônio, Gestão de Equipe, acompanhamento gerencial e exportações.

> **Estado reconciliado em 7 de agosto de 2026:** GitHub `main`, Vercel Production e Supabase Production estão operacionais e alinhados ao pacote funcional do PR #162. O baseline mutável completo fica exclusivamente em [`docs/CURRENT_STAGE.md`](docs/CURRENT_STAGE.md) e deve ser revalidado antes de qualquer ação dependente do ambiente.

## Fontes de verdade

Para saber o que existe de fato:

1. código da `main` ou SHA analisado;
2. Supabase efetivo, incluindo migrations, Auth, RLS, funções e dados;
3. deployment Vercel e SHA publicado;
4. testes e evidências reproduzíveis;
5. decisões vigentes;
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

## Correções consolidadas recentes

O baseline atual incorpora, entre outros:

- PR #150: transição segura entre perfis da equipe usando a mesma conta Auth;
- PR #154: redistribuição de carteira bloqueada ao Controlador também no serviço e banco;
- PR #157: criação de exercício com lote correto de doze competências;
- PR #160: sincronização de competências remotas antes do primeiro render;
- PR #161: remoção da dependência de `listUsers`, lookup Auth exato e reparo de resíduos legados;
- PR #162: remediações `SCH-01`, `CFG-02`, `INV-01`, `ASSET-02`, `PEND-02`, `EXP-01` e `EXP-02`.

A correção de `ASSET-02`, por exemplo, já existe no código com `saveAssetWithLog`, versão esperada e auditoria. A matriz continua distinguindo **correção implementada** de **prova ponta a ponta completa**.

## Garantia operacional

O projeto possui:

- monitor geral de Production;
- gestão automática de incidentes;
- auditoria agregada de vinte invariantes de integridade;
- backup/restauração em pilhas descartáveis;
- gate remoto por perfil e viewport;
- matriz funcional executável de 41 operações;
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
3. [`docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`](docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md);
4. [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md);
5. [`docs/ROADMAP_ATUALIZACOES_2026.md`](docs/ROADMAP_ATUALIZACOES_2026.md);
6. [`docs/DECISION_LOG.md`](docs/DECISION_LOG.md);
7. [`docs/reference/STATUS_DOCUMENTOS.md`](docs/reference/STATUS_DOCUMENTOS.md).

A reconciliação integral vigente está registrada em [`docs/audits/2026-08-07-reconciliacao-documental-integral-pos-pr162.md`](docs/audits/2026-08-07-reconciliacao-documental-integral-pos-pr162.md).

## Próxima sequência

1. fechar a divergência histórica do PR #156 sem merge cego;
2. retomar a auditoria funcional remanescente a partir da `main` atual;
3. executar provas controladas das operações ainda parciais;
4. decidir separadamente sobre ativação do smoke autenticado;
5. verificar a demanda pendente da tela de detalhes da escola;
6. tratar dependências em PRs isolados;
7. realizar UAT e decisão formal de liberação.

Nenhum PR, documento ou Preview autoriza por si só merge, migration ou mudança de Production fora do escopo aprovado.
