# RADAR PDDE 2026

Sistema institucional de acompanhamento operacional do PDDE da 4ª CRE/SME-Rio. O produto organiza competência mensal, carteira de unidades, prontuário, análise documental, pendências, contatos, notas fiscais, patrimônio, Gestão de Equipe, acompanhamento gerencial e exportações.

> **Estado reconciliado em 30 de agosto de 2026:** a frente prioritária é o PR #211, ainda em Draft, para individualizar análise e Pendências de Notas Fiscais. O hardening foi publicado e validado no SHA `530ca6c`: todos os gates funcionais, de banco, segurança, E2E, backup e Preview passaram. O único vermelho efetivo é o Lighthouse móvel, não bloqueante por decisão expressa; o desktop passou na medição de confirmação. O gate agregado falha apenas por herdar o mobile. Production, Supabase Production e Vercel Production permanecem sem alterações do PR #211. O estado mutável completo fica em [`docs/CURRENT_STAGE.md`](docs/CURRENT_STAGE.md).

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

O plano mestre pós-auditoria permanece vigente, mas está temporariamente pausado pelo PR #211. O hotfix mantém a bonificação de Notas Fiscais agregada, individualiza análise e Pendência por `registered_invoice_id`, cria nova `a_identificar` apenas como `Incorreto + Pendência`, preserva 16 registros legítimos como **Registro legado** e remove somente fixtures técnicas comprovadas por uma limpeza fail-closed. A regra e a continuidade entre sessões estão documentadas no handoff de 30/08 indicado abaixo.

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
- matriz funcional executável de 43 operações;
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
2. [`docs/handoff/2026-08-30-pr211-retomada-work.md`](docs/handoff/2026-08-30-pr211-retomada-work.md);
3. [`docs/CURRENT_STAGE.md`](docs/CURRENT_STAGE.md);
4. [`docs/handoff/2026-08-28-pr211-hotfix-notas-fiscais.md`](docs/handoff/2026-08-28-pr211-hotfix-notas-fiscais.md);
5. [`docs/superpowers/plans/2026-08-28-hotfix-individualizacao-notas-fiscais.md`](docs/superpowers/plans/2026-08-28-hotfix-individualizacao-notas-fiscais.md);
6. [`docs/decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md`](docs/decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md);
7. [`docs/evidence/2026-08-29-pr211-classificacao-dados-legados.md`](docs/evidence/2026-08-29-pr211-classificacao-dados-legados.md);
8. [`docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`](docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md);
9. [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md), [`docs/DECISION_LOG.md`](docs/DECISION_LOG.md) e [`docs/reference/STATUS_DOCUMENTOS.md`](docs/reference/STATUS_DOCUMENTOS.md);
10. somente depois, o handoff e o plano mestre de 26/08 para a retomada pós-hotfix.

A porta de entrada vigente é o handoff de 30/08. Auditorias e planos anteriores permanecem históricos e não podem restaurar decisões superadas.

## Próxima sequência

1. concluir o hardening e os gates remotos do PR #211 em Draft;
2. repetir o preflight fail-closed imediatamente antes de eventual migration;
3. somente com autorização explícita, retirar Draft, integrar, aplicar migration e publicar;
4. revalidar `main`, Supabase Production e Vercel Production e reconciliar o PR #211 com o plano mestre;
5. só então retomar PR3.1, PR3.2 e PR3.3, cada qual com gate próprio, e seguir as demais fases na ordem aprovada;
6. executar PR8A antes de PR8B;
7. medir em PR9A, estabilizar a metodologia em PR9B e só então otimizar por hipótese em PR9C.

Nenhum PR, documento ou Preview autoriza por si só merge, migration ou mudança de Production fora do escopo aprovado.
