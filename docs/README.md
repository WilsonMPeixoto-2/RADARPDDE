# Documentação do RADAR PDDE

**Classe documental:** Canônico — índice e rota de leitura  
**Atualizado em:** 26 de setembro de 2026

## 1. Rota obrigatória

A documentação possui uma única porta de entrada. Não começar por plano, auditoria, PR ou handoff antigo.

Ordem:

1. [`../AGENTS.md`](../AGENTS.md) — regras de trabalho e precedência;
2. [`reference/SYSTEM_CANONICAL_MODEL.md`](reference/SYSTEM_CANONICAL_MODEL.md) — modelo integrado do produto: superfícies, perfis, entidades, fluxos, estados, autoridades, diferenças deliberadas e invariantes;
3. [`reference/PRODUCT_SURFACE_CATALOG.md`](reference/PRODUCT_SURFACE_CATALOG.md) — modelo mental do usuário: finalidade de cada tela, jornada, hierarquia visual, encontrabilidade e papel de cada superfície;
4. [`CURRENT_STAGE.md`](CURRENT_STAGE.md) — estado mutável, Production, prioridade e PRs correntes;
5. **handoff corrente explicitamente apontado em `CURRENT_STAGE.md`, quando houver** — contexto detalhado da frente ativa, sem ganhar autoridade funcional sobre o modelo canônico;
6. [`reference/ENGINEERING_METHOD.md`](reference/ENGINEERING_METHOD.md) — método permanente de engenharia;
7. [`reference/FRONTEND_USER_VALIDATION_GATE.md`](reference/FRONTEND_USER_VALIDATION_GATE.md) — gate permanente de jornada real pelo frontend;
8. [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md) — validade documental e separação entre vigente, gerado, histórico e superado;
9. [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md) e JSON fonte — operações ponta a ponta quando a frente tocar operação mapeada;
10. ADRs e referências especializadas da área afetada;
11. planos, auditorias, demais handoffs e evidências históricas apenas para compreender o seu momento/SHA.

`CURRENT_STAGE.md` aponta explicitamente para o handoff corrente. Em 26/09/2026, a frente é o fechamento da jornada de **Despesa a identificar** em dois PRs draft empilhados: #375 em `d591b231...` e #376 com candidato funcional/UI auditado em `4994aeb3...`. Código, testes e documentação foram reconciliados; o Preview combinado está READY e falta a homologação visual/navegada do mesmo candidato antes da integração ordenada. A falha remanescente de Supabase readiness é externa ao produto e ocorreu após testes SQL e lint verdes.

## 2. Função de cada documento canônico/vigente

| Documento | Função |
|---|---|
| `AGENTS.md` | roteador obrigatório e regras de trabalho |
| `reference/SYSTEM_CANONICAL_MODEL.md` | mapa integrado do sistema e seus contratos funcionais |
| `reference/PRODUCT_SURFACE_CATALOG.md` | leitura do produto pelo usuário e contrato das superfícies |
| `CURRENT_STAGE.md` | estado mutável, Production, frente ativa e handoff corrente |
| handoff corrente indicado por `CURRENT_STAGE.md` | contexto detalhado temporário da frente ativa |
| `reference/ENGINEERING_METHOD.md` | método de investigação, implementação e revisão |
| `reference/FRONTEND_USER_VALIDATION_GATE.md` | prova obrigatória pela interface real |
| `reference/STATUS_DOCUMENTOS.md` | validade e classificação da documentação |
| `DECISION_LOG.md` + ADRs | decisões duráveis e especializações |
| matriz funcional JSON/MD | contrato operacional executável/gerado |

O objetivo é impedir que o mesmo assunto volte a ser reconstruído a partir de documentos parcialmente sobrepostos ou apenas pelo código de uma função isolada.

## 3. Fontes de verdade

Para saber o que existe de fato:

1. código do SHA analisado;
2. Supabase/Auth/RLS/RPCs/Edge Functions e dados efetivos;
3. artefato Vercel do ambiente analisado;
4. decisões funcionais vigentes;
5. testes atuais que representam o contrato vigente;
6. documentação canônica/vigente;
7. históricos, planos e memória de conversa.

Documentação antiga não redefine o código. Quando há divergência, investigar qual fonte está desatualizada antes de alterar o produto.

## 4. Princípios funcionais e arquiteturais consolidados

O modelo detalhado está em `SYSTEM_CANONICAL_MODEL.md`; a finalidade humana das telas está em `PRODUCT_SURFACE_CATALOG.md`. Em resumo:

- Supabase é a persistência canônica de Production;
- memória/cache local pode acelerar o frontend quando funciona como projeção descartável e converge para o Supabase;
- no modo remoto, `localStorage` não deve virar banco operacional concorrente nem mascarar falha de persistência;
- coleções operacionais crescentes devem ser consultadas por contexto/limite, não reintroduzidas no bootstrap global;
- competência global usa `RadarCompetenceContext`;
- Pendências é passivo transversal;
- página de Pendências mede antiguidade histórica e Dashboard/Carteira podem medir tempo da ação corrente;
- bonificação, análise técnica e Pendência são dimensões independentes;
- NF usa análise/Pendência individual por `registered_invoice_id`, com bonificação agregada;
- `a_identificar` novo nasce `Incorreto + Pendência` atomicamente;
- `boleto_internet` é tipo de gasto de NF, apenas Educação Conectada;
- Consulta Assessoria é individual por NF de serviço;
- `Inventariada` é terminal;
- commit remoto confirmado e sincronização local são fronteiras diferentes;
- performance não é autoridade de negócio;
- diferença de projeção entre telas só é defeito quando contradiz a finalidade confirmada daquelas superfícies;
- mudança que afeta usuário exige validação pela interface real.

## 5. Documentação especializada vigente

Consultar conforme a área materialmente afetada:

- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — referência funcional/arquitetural detalhada; **afirmações temporais de PR, SHA, fila ou deployment nele não representam o estado corrente e cedem a `CURRENT_STAGE.md`**;
- [`handoff/2026-09-25-desktop-expense-journey.md`](handoff/2026-09-25-desktop-expense-journey.md) — **handoff corrente** da jornada desktop de Despesa a identificar, com heads, CI e ordem de retomada;
- [`handoff/2026-09-19-performance-sync-modernization.md`](handoff/2026-09-19-performance-sync-modernization.md) — handoff histórico concluído da modernização de performance/sincronização;
- [`decisions/ADR-054-sincronizacao-operacional-realtime.md`](decisions/ADR-054-sincronizacao-operacional-realtime.md) — decisão vigente sobre invalidação Realtime entre sessões;
- [`DECISION_LOG.md`](DECISION_LOG.md) — decisões duradouras;
- [`architecture/`](architecture/) — contratos arquiteturais específicos;
- [`decisions/`](decisions/) — ADRs;
- [`reference/SUPABASE_DATA_DICTIONARY.md`](reference/SUPABASE_DATA_DICTIONARY.md) — dicionário de dados;
- [`reference/SUPABASE_PERMISSIONS_MATRIX.md`](reference/SUPABASE_PERMISSIONS_MATRIX.md) — matriz de permissões;
- [`reference/TEST_GOVERNANCE.md`](reference/TEST_GOVERNANCE.md) — interpretação dos testes.

## 6. Histórico

Diretórios como `audits/`, `handoff/`, `superpowers/plans/`, `evidence/` e `history/` preservam rastreabilidade. Eles não formam uma fila implícita de execução.

A única exceção temporária é o **handoff corrente** explicitamente nomeado por `CURRENT_STAGE.md`. Quando a frente encerrar, ele volta a ser histórico sem reescrita retrospectiva.

R1–R9 são identificadores históricos. A classificação atual pertence exclusivamente a `CURRENT_STAGE.md`.

Auditorias de candidato pré-merge podem conter frases como “aguarda integração”. Depois do merge, essas frases permanecem como evidência histórica do momento em que o documento foi produzido e não devem competir com `CURRENT_STAGE.md`.

## 7. Regra de criação e manutenção da documentação

Novo documento canônico não pode ficar solto no repositório.

Na mesma entrega que criar ou alterar fonte canônica, atualizar quando aplicável:

1. `AGENTS.md`;
2. este índice;
3. `reference/STATUS_DOCUMENTOS.md`;
4. `reference/SYSTEM_CANONICAL_MODEL.md` se regra, autoridade, fluxo ou invariante mudar;
5. `reference/PRODUCT_SURFACE_CATALOG.md` se mudar finalidade, jornada, ação, encontrabilidade ou semântica visual de uma superfície;
6. `CURRENT_STAGE.md` se a mudança alterar estado/prioridade;
7. o vínculo de handoff corrente quando a frente mudar.

Documento histórico não deve ser reescrito para fingir atualidade. Deve ser preservado e, quando necessário, reclassificado por uma fonte canônica posterior.
