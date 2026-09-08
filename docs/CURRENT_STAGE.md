# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 7 de setembro de 2026  
**Classe documental:** Canônico — estado corrente e retomada futura

## 1. Estado corrente

Este arquivo é a porta de entrada para o estado mutável do projeto. Valores voláteis de GitHub, Vercel e Supabase devem ser revalidados ao vivo antes de qualquer operação que dependa deles.

A cadeia funcional #265–#279 permanece integrada e seus guardrails devem ser preservados. Depois dela:

- PR #281 consolidou o rebaseline documental pós-#279;
- PR #282 retirou autoridade funcional do wrapper de performance, preservando performance como observação;
- PR #287 tornou permanente o gate de validação real pelo frontend;
- PR #284 investigou bootstrap/readiness e performance, mas está **Draft e PAUSADO**, sem autorização de merge/deploy no estado atual.

A decisão de pausa e a ordem vigente estão registradas em [`handoff/2026-09-07-pausa-pr284-prioridade-pendencias-nf.md`](handoff/2026-09-07-pausa-pr284-prioridade-pendencias-nf.md).

## 2. Prioridade funcional vigente

A prioridade do projeto passa a ser a estabilização das duas frentes funcionais conhecidas antes da retomada de mudanças estruturais de carregamento:

1. **R4 — Pendências:** analisar profundamente e unificar a semântica entre `operational-projection.js` e `pendencias-view-model.js`, preservando as regras de negócio vigentes e o layout aprovado;
2. **R5 — Nota Fiscal:** completar a convergência autoritativa/incremental da interface após `invoice:save` e `invoice:remove`, inclusive remoções retornadas por ID;
3. **retomar R2 / PR #284:** somente depois de R4 e R5 estabilizados, reconciliar o candidato com a nova `main`, corrigir por causa raiz as regressões desktop e provar equivalência funcional pelo frontend real;
4. executar gate de equivalência e somente então avaliar otimizações adicionais de carregamento baseadas em evidência.

Esta ordem substitui a fila anterior registrada em 06/09. Não retomar R2 apenas porque o plano histórico o colocava antes de R4/R5.

## 3. Classificação vigente de R1–R9

R1–R9 são identificadores históricos; não constituem fila automática.

| Fase | Estado atual | Próxima decisão |
|---|---|---|
| **R1** | **Concluída pelo PR #282** | Preservar performance como diagnóstico, sem autoridade funcional. |
| **R2A** | **Absorvida parcialmente** | Resiliência do loader já preservada por #270. |
| **R2B/R2C** | **Pausada / candidata no PR #284** | Não integrar agora. Retomar somente após R4/R5 e com equivalência funcional comprovada. |
| **R3** | **Materialmente atendida** | Fechamento formal pode ser feito sem reabrir regra já coberta por #276 e posteriores. |
| **R4** | **PRÓXIMA FRENTE ATIVA** | Diagnóstico source-first da semântica de Pendências e proposta de unificação mínima. |
| **R5** | **Pendente real, segunda prioridade** | Convergência de `invoice:save`/`invoice:remove` após R4. |
| **R6** | **Gate posterior** | Equivalência após R4/R5 e antes de aceitar mudança estrutural de readiness. |
| **R7** | **Instrumentação parcialmente antecipada no #284** | Preservar evidência; não usar como autorização de otimização. |
| **R8** | **Condicional e pausada** | Otimizar somente gargalo demonstrado, após equivalência funcional. |
| **R9** | **Pendente** | Fechamento final depois das frentes anteriores estabilizadas. |

## 4. PR #284 — estado de preservação

O PR #284 permanece aberto apenas para preservar trabalho e evidência. Está Draft e explicitamente pausado.

Preservar como candidato:

- instrumentação de bootstrap;
- análise causal dos pollings;
- conceito de readiness determinístico;
- artefatos e testes diagnósticos;
- medição local controlada de performance.

Não considerar comprovado:

- equivalência funcional do candidato;
- encerramento de R2;
- segurança de remover mais entidades do bootstrap;
- aprovação de merge/deploy;
- performance como compensação para falha funcional.

A retomada exige aplicar [`reference/FRONTEND_USER_VALIDATION_GATE.md`](reference/FRONTEND_USER_VALIDATION_GATE.md) e provar as jornadas reais pelo frontend desktop.

## 5. Guardrails funcionais que não podem regredir

Preservar, entre outros:

- bonificação de NF agregada, análise/Pendência individual por `registered_invoice_id`;
- resumo técnico derivado com precedência vigente;
- `a_identificar` novo nasce `Incorreto + Pendência` atomicamente; legados legítimos não recebem backfill inventado;
- `boleto_internet` existe somente como tipo de gasto de Notas Fiscais em Educação Conectada;
- Consulta Assessoria é individual por NF de serviço;
- Pendências são transversais a competências;
- bonificação, análise e Pendência são dimensões independentes;
- reanálise exige contexto/tentativa válidos segundo os invariantes server-side integrados;
- `Inventariada` é terminal;
- competência global canônica via `RadarCompetenceContext`;
- Production é fail-closed para operações críticas;
- commit remoto confirmado não deve ser repetido apenas para recuperar estado local;
- layout aprovado de Prontuário/Pendências deve ser preservado;
- comunicação externa não usa o nome interno `RADAR PDDE`;
- Supabase CLI 2.116.0 permanece rejeitado enquanto a regressão documentada não for superada;
- Lighthouse segue protocolo de três rodadas/mediana, mas performance nunca prevalece sobre equivalência funcional.

## 6. Gate permanente de conclusão pelo frontend

Para mudança que possa afetar o usuário, código/CI verde não basta.

Aplicar [`reference/FRONTEND_USER_VALIDATION_GATE.md`](reference/FRONTEND_USER_VALIDATION_GATE.md):

- navegar pela interface real;
- usar controles visíveis e cliques reais;
- executar as jornadas materialmente afetadas;
- verificar persistência e releitura após refresh quando houver escrita;
- inspecionar o resultado visual;
- testar primeira navegação/ordens relevantes quando houver bootstrap/readiness;
- comparar comportamento com a baseline estável.

## 7. Precedência

Para determinar estado presente:

1. código do SHA atual;
2. Supabase/Auth/RLS/RPCs/Edge Functions e Vercel efetivos;
3. decisões vigentes;
4. testes atuais que representam o contrato;
5. documentação canônica corrente;
6. auditorias, planos e checkpoints históricos.

Documentos históricos permanecem evidência do seu momento, mas não controlam a fila atual.

## 8. Retomada por novo chat/agente

1. ler `AGENTS.md`;
2. ler este arquivo;
3. ler `reference/ENGINEERING_METHOD.md`;
4. ler `reference/FRONTEND_USER_VALIDATION_GATE.md`;
5. ler [`handoff/2026-09-07-pausa-pr284-prioridade-pendencias-nf.md`](handoff/2026-09-07-pausa-pr284-prioridade-pendencias-nf.md);
6. revalidar `main`, PR ativo, Production e Supabase antes de qualquer mudança;
7. enquanto R4 estiver aberta, não retomar o #284;
8. continuar somente a primeira frente ativa desta documentação.
