# RADAR PDDE — Estado atual do projeto

**Classe documental:** Canônico — estado mutável e retomada futura  
**Atualizado em:** 7 de setembro de 2026

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
