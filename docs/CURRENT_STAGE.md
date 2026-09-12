# RADAR PDDE — Estado atual do projeto

**Classe documental:** Canônico — estado mutável e retomada futura  
**Atualizado em:** 12 de setembro de 2026

## Frente vigente — arquitetura de consultas Supabase, isolada de Production

Esta seção substitui a prioridade temporal das seções de 07/09 preservadas abaixo. Elas explicam o histórico, mas **não autorizam retomar R5 ou o PR #284 como próxima tarefa automática**.

### Alvo e limites

- Repositório: `WilsonMPeixoto-2/RADARPDDE`.
- Branch autorizada: `fix/supabase-query-architecture-2026-09-11`.
- Base desta retomada: `4c10fdd17ae24633de0260b200f6e9ebf5dcee58`.
- O merge do PR #299, `d2663f1ae7554516caf315f53b2509fbcd295e01`, é ancestral comprovado da branch. Preservar suas retificações auditáveis.
- `main` observada somente por leitura em `2eff1321a8abaccd46d9627ee2eed060741ce3b7`. Isso não certifica o deployment ou o banco de Production.
- Não alterar `main`, fazer merge, executar migrations, alterar banco/secrets/configurações ou publicar em Production sem autorização explícita separada de Wilson.

### Contexto causal e decisão aprovada

O Supabase é a persistência oficial. O problema relatado no handoff foi o frontend carregar coleções históricas inteiras durante a entrada e reconstruir cópias operacionais persistentes no navegador. O caso mais grave era `administrativeLogs`, que não é necessário às telas operacionais iniciais. O handoff informa cerca de 3.562 logs e 46 segundos de processamento para sua leitura pelo perfil Controlador; esses números são evidência histórica recebida, não medição repetida nesta retomada.

A decisão é **não buscar histórico sem solicitação da superfície**. A missão não é acelerar o download de todos os logs. Registrar uma nova ação também não deve reler a coleção inteira. O banco preserva o histórico; Auditoria e histórico escolar consultam páginas delimitadas e contextualizadas.

O handoff registra que um rollback anterior do frontend, não autorizado, associou indevidamente a falha de acesso ao PR #299 e não resolveu o problema. Registra também que a migration daquele PR permaneceu aplicada. Nesta retomada, sua aplicação em Production não foi revalidada; a ancestralidade funcional do candidato foi comprovada no Git. Não reconstruir a correção a partir do rollback.

Autenticação aprovada e preparação do ambiente operacional são etapas diferentes. Falha na segunda deve ser apresentada como falha de carregamento do ambiente, sem sugerir senha incorreta.

### Preservação funcional

Análise, Bonificação, Pendências, reanálises, notas, documentos, inventário e navegação por escola/programa/competência têm prioridade. Preservar opções, subopções, estados anteriores, confirmações visuais, persistência e releitura. Escritas confirmadas usam retorno autoritativo e atualização incremental.

Não fazer reescrita geral, não remover estruturas sem mapear dependentes e não tornar todas as coleções sob demanda indiscriminadamente. Dados operacionais ainda necessários ao bootstrap permanecem carregados conforme a política central. Não apagar histórico, não enfraquecer RLS e não tratar o volume atual como sobrecarga comprovada do PostgreSQL.

### Implementação presente no candidato

- `ENTITY_LIFECYCLE` e `REMOTE_BOOTSTRAP_ENTITIES`, em `src/data/repository-contract.js`, distinguem bootstrap, Auth, histórico sob demanda e manutenção.
- `administrativeLogs` sai do bootstrap; Auditoria consulta páginas de 100 registros, com limite máximo de 200 no modelo de leitura. Histórico escolar filtra pela escola.
- `SupabaseRepository.loadAfterId()` usa limite explícito e continuação por ID para as coleções percorridas; logs possuem consulta contextual específica.
- `AuditService` e a política de atualização evitam releitura integral de coleções append-only após escrita confirmada.
- O bootstrap remoto não reconstrói cópia operacional persistente; a limpeza seletiva de caches antigos preserva outras chaves do navegador.
- `auth-gate.js` distingue falha posterior à autenticação.

Esses itens descrevem **a branch candidata**, não uma publicação certificada em Production.

### Causa exata das três falhas de integração

Reproduzidas em `tests/integration/remote-bootstrap-flow.test.js`: 1 teste passou e 3 falharam com `MISSING_KEYSET_PAGINATION`, primeiro em `appConfig`.

A investigação refinou a hipótese do handoff: `exportSnapshot → load → loadAfterId` já fornece `this.pageSize`. O erro é lançado porque o cliente Supabase **simulado pelo teste** não possui `.limit()`; também lhe falta `.gt()` para continuar páginas. Não era necessário mudar o código do produto para fornecer o limite.

Correção nesta retomada: atualizar esse simulador para aplicar limite e filtro por cursor, mantendo a proteção de produção intacta. Uma regressão com cinco escolas fora de ordem e páginas de dois registros verifica reconciliação completa, cursores, limites e reexecução sem inserção/duplicação/sobrescrita. Duas regressões unitárias confirmam bloqueio quando limite ou continuação não estão disponíveis.

O `bootstrapRemoteSnapshot` desse teste é a ferramenta administrativa de importação/reconciliação de snapshot. Não confundir sua inspeção explícita do destino com o bootstrap de entrada do frontend: a exclusão dos logs neste último continua obrigatória.

### Certificação desta retomada

| Prova local, Node 24.19.0 | Resultado |
|---|---|
| Regressão de integração + paginação | 9/9 passaram |
| `npm run test:integration` | 8/8 passaram |
| `npm run test:unit` | 984/984 passaram |
| `npm run check` | passou |
| `npm run check:architecture` | passou: 180 módulos, 254 dependências, nenhuma violação |
| `npm run lint:security` | passou: zero erros e 42 avisos dentro do limite existente |
| `npm run lint:e2e` | passou |
| E2E desktop da branch | pendente de execução; download local do Chromium encontrou timeout |

Os resultados acima correspondem à base informada mais as alterações desta retomada. Nenhum resultado de Supabase real ou homologação visual pode ser inferido desses testes locais. O workflow isolado `architecture-remediation-branch-ci.yml` define a suíte desktop prioritária; sua execução remota ainda deve ser conferida no commit resultante.

### Próximo passo

Concluir a execução desktop prevista no workflow da branch, classificar qualquer falha pela causa e inspecionar evidência visual das superfícies afetadas. Não declarar certificação integral antes disso. Continuar na branch isolada, sem intervenções em Production.

---

## Registro histórico de 07/09/2026 — não controla a prioridade atual

## 1. Estado corrente

Este arquivo contém somente estado mutável, prioridade e trabalho em andamento. O modelo funcional integrado do sistema fica em [`reference/SYSTEM_CANONICAL_MODEL.md`](reference/SYSTEM_CANONICAL_MODEL.md).

A reconstrução contextual source-first de 07/09 foi realizada antes de qualquer nova mudança funcional. Ela confrontou:

- código da `main`;
- Vercel Production;
- schema/RPC/RLS/triggers do Supabase Production;
- documentação versionada e decisões vigentes.

Baseline funcional imediatamente anterior a esta reconstrução documental:

- `main`: `cafef971b902fd206ce26208445e27aeacbc9a0f`;
- Vercel Production: `READY` no mesmo SHA;
- deployment observado: `dpl_DWSLXhgTktiphBs7CMbk18wM2UCL`.

Esses valores são voláteis e devem ser revalidados ao vivo antes de qualquer operação que dependa deles. A reconstrução documental não altera comportamento funcional.

## 2. Correção de governança documental

A revisão confirmou que o problema recente de contexto não decorreu de falta de documentação. O repositório já possuía rota, classificação e fontes especializadas, mas:

- a rota de leitura não foi seguida de forma consistente;
- `AGENTS.md` acumulou estados temporais demais;
- novos documentos entraram sem reconciliação suficiente dos roteadores;
- algumas referências envelheceram após hotfixes e decisões posteriores.

A correção adotada é estrutural:

- `AGENTS.md` volta a ser um roteador estável;
- `SYSTEM_CANONICAL_MODEL.md` integra o conhecimento funcional/arquitetural;
- este arquivo permanece responsável pelo estado mutável;
- `STATUS_DOCUMENTOS.md` classifica validade;
- novo documento canônico passa a exigir atualização dos roteadores na mesma entrega.

## 3. Estado funcional consolidado

A cadeia funcional #265–#279 permanece integrada e seus guardrails devem ser preservados.

Depois dela:

- PR #281 consolidou o rebaseline documental pós-#279;
- PR #282 retirou autoridade funcional do wrapper de performance, que hoje atua como diagnóstico/tracing;
- PR #287 tornou permanente o gate de validação real pelo frontend;
- PR #284 permanece **Draft e PAUSADO**, sem autorização de merge/deploy no estado atual;
- R4/Pendências foi reavaliada e encerrada sem alteração funcional: antiguidade histórica na tela de Pendências e tempo da ação corrente em Dashboard/Carteira são métricas deliberadamente diferentes.

## 4. Prioridade funcional vigente

A ordem atual é:

1. **R5 — Nota Fiscal:** analisar/completar convergência autoritativa e incremental da interface após `invoice:save` e `invoice:remove`, inclusive remoções retornadas por ID;
2. **retomar R2 / PR #284:** somente depois de R5 estabilizado, reconciliar o candidato com a nova `main`, corrigir por causa raiz as regressões desktop e provar equivalência funcional pelo frontend real;
3. executar o gate de equivalência;
4. avaliar otimizações adicionais apenas se medições justificarem.

Enquanto R5 estiver aberta, não retomar #284.

## 5. Classificação vigente de R1–R9

R1–R9 são identificadores históricos, não fila automática.

| Fase | Estado atual | Próxima decisão |
|---|---|---|
| R1 | **Concluída pelo PR #282** | preservar performance como diagnóstico, sem autoridade funcional |
| R2A | **Parcialmente absorvida** | resiliência do loader já preservada por trabalho posterior |
| R2B/R2C | **Pausadas / candidatas no PR #284** | não integrar antes de R5 e equivalência funcional |
| R3 | **Materialmente atendida** | não reabrir regra já coberta por #276 e posteriores sem evidência nova |
| R4 | **Encerrada sem alteração funcional** | preservar métricas distintas e deliberadas de Pendências |
| R5 | **PRÓXIMA FRENTE ATIVA** | convergência de `invoice:save`/`invoice:remove` |
| R6 | **Gate posterior** | equivalência após R5 |
| R7 | **Instrumentação parcialmente antecipada** | preservar evidência; não usar como autorização de otimização |
| R8 | **Condicional e pausada** | otimizar somente gargalo demonstrado |
| R9 | **Pendente** | fechamento/rebaseline final |

## 6. PR #284 — estado de preservação

O PR #284 permanece aberto apenas para preservar trabalho e evidência.

Preservar como candidato:

- instrumentação de bootstrap;
- análise causal dos pollings;
- conceito de readiness determinístico;
- artefatos/testes diagnósticos;
- medição local controlada de performance.

Não considerar comprovado:

- equivalência funcional do candidato;
- encerramento de R2;
- segurança de remover mais entidades do bootstrap;
- aprovação de merge/deploy;
- performance como compensação para falha funcional.

A retomada exige o gate de [`reference/FRONTEND_USER_VALIDATION_GATE.md`](reference/FRONTEND_USER_VALIDATION_GATE.md).

## 7. Guardrails funcionais que não podem regredir

O conjunto completo está no modelo canônico. Entre os mais sensíveis:

- bonificação de NF agregada, análise/Pendência individual por `registered_invoice_id`;
- resumo técnico de NF derivado;
- `a_identificar` novo nasce `Incorreto + Pendência` atomicamente;
- `boleto_internet` existe somente como tipo de gasto de NF em Educação Conectada;
- Consulta Assessoria é individual por NF de serviço;
- Pendências é transversal entre competências;
- página de Pendências preserva antiguidade histórica desde a abertura original;
- Dashboard/Carteira podem mostrar tempo da ação operacional atual;
- reanálise exige contexto/tentativa/versionamento válidos;
- `Inventariada` é terminal;
- competência global usa `RadarCompetenceContext`;
- Production é fail-closed em operações críticas;
- commit remoto confirmado não deve ser repetido apenas para recuperar estado local;
- performance não é autoridade funcional;
- layout aprovado de Prontuário/Pendências deve ser preservado;
- comunicação externa não usa o nome interno `RADAR PDDE`;
- alteração perceptível pelo usuário exige validação real pelo frontend.

## 8. Leitura obrigatória por novo chat/agente

1. `AGENTS.md`;
2. `reference/SYSTEM_CANONICAL_MODEL.md`;
3. este arquivo;
4. `reference/ENGINEERING_METHOD.md`;
5. `reference/FRONTEND_USER_VALIDATION_GATE.md`;
6. `reference/STATUS_DOCUMENTOS.md`;
7. matriz funcional/ADR/referência especializada da frente;
8. somente então históricos necessários.

Nenhuma frente funcional deve ser retomada a partir de memória de chat sem passar por essa rota.

## 9. Regra para a próxima execução funcional

A próxima frente continua sendo R5. Antes de tocar no código de Nota Fiscal, a análise deve confrontar a proposta com o `SYSTEM_CANONICAL_MODEL.md`, localizar a autoridade atual de `InvoiceService`/persistência/reconciliação e aplicar o gate de frontend real após qualquer mudança.
