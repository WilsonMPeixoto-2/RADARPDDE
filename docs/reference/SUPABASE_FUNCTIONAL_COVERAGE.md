# Cobertura funcional — Supabase

**Estado:** referência vigente da baseline funcional do PR #260  
**Atualizado em:** 5 de setembro de 2026

> Para retomar o projeto, comece em [`../../START_HERE.md`](../../START_HERE.md). Esta referência descreve cobertura técnica; não substitui `CURRENT_STATE.md`, a matriz funcional nem o plano vigente.

## 1. Contrato de persistência

Production usa `SupabaseRepository` como backend canônico. Desenvolvimento/testes podem usar adaptadores locais explicitamente configurados; Production não cai silenciosamente para seed/LocalStorage.

Fluxo normal:

```text
interface
→ serviço de aplicação
→ DataService/UnitOfWork
→ SupabaseRepository
→ PostgREST / RPC / Edge Function
→ Auth/RLS/PostgreSQL
→ resposta
→ estado em memória
→ renderização/reconciliação
```

## 2. O que a estabilização do PR #260 acrescentou

O PR #260 elevou a evidência de várias operações que antes apareciam somente como “parciais”. Passaram a existir jornadas com Supabase local descartável e Auth real que verificam não apenas o clique, mas também persistência, leitura, reload e releitura.

Cobertura adicionada/reforçada:

- ciclo de NF: criar, editar, converter consumo ↔ permanente, remover e reler;
- NF permanente + bem + Prontuário;
- bloqueio de inventariação antes de `Encaminhada`;
- encaminhamento posterior com sincronização de `encampInventario` e log na mesma RPC;
- bloqueio de edição isolada do número fiscal no bem vinculado;
- avaliação mensal, preenchimento, reload, consolidação e releitura;
- novo envio/reanálise continuam cobertos por jornada autenticada específica;
- guards de gesto repetido em novo envio, reanálise, encaminhamento e inventariação;
- 46 migrations, pgTAP, RLS/Auth, backup/restauração e demais gates permanecem na baseline.

## 3. Estado por domínio

| Domínio/fluxo | Estado na baseline | Evidência principal / observação |
|---|---|---|
| Sessão, perfil e escopos | implementado; smoke recorrente de Production continua prova operacional separada | Auth, RLS, fixtures, perfis/viewports |
| Bootstrap/leitura | implementado | integração/E2E; readiness arquitetural ainda tem dívida própria no plano |
| Competência global | comprovado no contrato atual | domínio + navegação + regressões |
| Configuração/exercícios | implementado, provas controladas ainda específicas por operação | serviço/RPC/pgTAP |
| Programas | implementado | serviço/RLS; UAT controlado permanece quando exigido |
| Escolas/programas vinculados | implementado | identidade institucional, serviço/RPC/RLS |
| Carteiras | implementado | redistribuição protegida e autorização |
| Gestão de Controladores | comprovada | Edge Function + Auth Admin + RPC + compensação |
| Gestão do Inventário | comprovada | Edge Function + Auth Admin + RPC + compensação |
| Bonificação/análise mensal | comprovada para a jornada crítica do #260 | persistência + leitura + reload + consolidação |
| Pendências | implementada, com jornadas críticas reais | #254/#256 + E2E/pgTAP; operações auxiliares mantêm seus testes específicos |
| Tentativas/reanálise | comprovadas nos fluxos críticos | RPCs especializadas + jornada autenticada |
| Contatos/cobranças | implementados | contrato idempotente/atomicidade; prova específica permanece na matriz |
| Notas Fiscais | comprovada para lifecycle crítico | jornada real do #260 + testes de efeitos |
| Análise fiscal individual | implementada e protegida | PR #211/#215/#254, E2E/pgTAP |
| Consulta Assessoria individual | implementada e protegida | autoridade separada + RPCs + regressões |
| `a_identificar` | implementado | criação atômica e identificação preservando ID |
| Bens derivados de NF | comprovados no lifecycle crítico | #257/#258/#260 |
| Encaminhamento patrimonial | comprovado | `save_asset_with_verification_and_log` + jornada real |
| Conclusão da inventariação | comprovada no fluxo crítico | serviço + guard + jornada real |
| Registros administrativos | implementados | logs vinculados às operações; recorte de leitura por papel continua política própria |
| Gestão SME | implementada nas capacidades autorizadas | configurações/programas + RLS/serviços |
| Importação/rollback | controlados | só executar em procedimento especificamente autorizado |
| Relatório institucional | implementado; homologação humana pode ser necessária quando a entrega for priorizada | renderer + auditoria de exportação |
| Excel SME mensal | comprovado | 27 colunas A:AA + gates dedicados |
| XLSX de Pendências | comprovado | modelo/renderer + filtros + auditoria |
| Monitor/integridade Production | comprovados na baseline | workflows + `production_integrity_check()` |

## 4. Matriz funcional

A fonte detalhada por operação continua em `reference/functional-contract-matrix/*.json` e na visão gerada `FUNCTIONAL_CONTRACT_MATRIX.md`.

A matriz é um **inventário de operações**, não uma substituição para pré-condições completas do domínio. Uma descrição curta como “Encaminhar bem” não significa que todo bem nasce em estado não encaminhado. Para mudar comportamento, ler a regra específica em `CURRENT_STATE.md`/ADR/código.

O nível `covered`/`partial` da matriz representa a prova registrada para aquela operação, e não autorização para reabrir regra já homologada.

## 5. Perfis

### Controlador

Opera as funções autorizadas da própria CRE, incluindo avaliação, Pendências, NF e patrimônio operacional permitido. Carteira é responsabilidade principal, não autorização para redistribuição pelo formulário comum.

### Assistente de Verbas Federais

Opera transversalmente na CRE, gere equipe/carteira, retifica quando autorizado e executa relatórios/operações previstas.

### Gestão SME

Realiza leitura gerencial e configurações/programas autorizados. Não recebe mutações operacionais de Pendências apenas por possuir visão gerencial.

### Inventário

Lê o recorte patrimonial e conclui inventariação autorizada. Não altera avaliação mensal, configuração global ou carteira.

### `technical_admin`

Papel técnico separado, com capacidades técnicas protegidas; simulação visual não altera JWT.

## 6. Gestão de Equipe

Fluxo:

```text
DirectoryService
→ TeamAccountGateway
→ team-account-management
→ Auth Admin + RPC transacional
```

Contratos atuais incluem CORS fail-closed, JWT/papel, lookup Auth exato, reutilização controlada de conta, rejeição de ambiguidade, desativação lógica, auditoria e compensação de falha parcial.

## 7. NF permanente e Inventário

A cobertura deve ser lida com a regra atual:

```text
NF permanente + número + processo existente
→ asset Encaminhada / Aguardando Inventariação

NF permanente sem processo
→ asset Não encaminhada
→ quando houver processo: Encaminhar
→ depois: Inventariar
```

`encampInventario` é derivado do conjunto de permanentes do contexto, e o Prontuário mostra o vínculo técnico NF ↔ bem.

## 8. Supabase readiness

O workflow de readiness valida, entre outros:

- reset local/migrations;
- preflight de contratos;
- pgTAP;
- lint PL/pgSQL;
- regeneração/reprodutibilidade dos tipos/cliente;
- Auth das identidades de teste;
- Edge Function de Gestão de Equipe;
- frontend + Auth + RLS na pilha local.

Uma falha isolada de runner deve ser reproduzida antes de alterar código. Se o mesmo SHA passa integralmente em reexecução sem mudança, classificar como falha transitória, não como regra a “corrigir” no produto.

## 9. Referências

- [`SUPABASE_PERMISSIONS_MATRIX.md`](SUPABASE_PERMISSIONS_MATRIX.md)
- [`SUPABASE_DATA_DICTIONARY.md`](SUPABASE_DATA_DICTIONARY.md)
- [`FUNCTIONAL_CONTRACT_MATRIX.md`](FUNCTIONAL_CONTRACT_MATRIX.md)
- [`../architecture/supabase-readiness.md`](../architecture/supabase-readiness.md)
- [`../runbooks/SUPABASE_CONNECTION.md`](../runbooks/SUPABASE_CONNECTION.md)
- [`../CURRENT_STATE.md`](../CURRENT_STATE.md)
