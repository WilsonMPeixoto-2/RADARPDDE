# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 7 de setembro de 2026  
**Classe documental:** Canônico — estado corrente e retomada futura

## 1. Estado corrente

Este arquivo é a porta de entrada para o estado mutável do projeto. Valores voláteis de GitHub, Vercel e Supabase devem ser revalidados ao vivo antes de qualquer operação que dependa deles.

A cadeia funcional #265–#279 permanece integrada e seus guardrails devem ser preservados. Depois dela:

- PR #281 consolidou o rebaseline documental pós-#279;
- PR #282 retirou autoridade funcional do wrapper de performance, preservando performance como observação;
- PR #287 tornou permanente o gate de validação real pelo frontend;
- PR #284 investigou bootstrap/readiness e performance, mas está **Draft e PAUSADO**, sem autorização de merge/deploy no estado atual;
- a frente histórica R4/Pendências foi reavaliada em 07/09 e **não representa defeito funcional**: a página completa de Pendências mede a antiguidade total desde a abertura original, enquanto Dashboard/Carteira medem o tempo da ação operacional atual. São métricas diferentes, deliberadas e úteis; não devem ser unificadas.

A decisão de pausa do #284 e a ordem vigente estão registradas em [`handoff/2026-09-07-pausa-pr284-prioridade-pendencias-nf.md`](handoff/2026-09-07-pausa-pr284-prioridade-pendencias-nf.md).

## 2. Prioridade funcional vigente

A prioridade do projeto é concluir a frente funcional real de Nota Fiscal antes da retomada de mudanças estruturais de carregamento:

1. **R5 — Nota Fiscal:** analisar e completar a convergência autoritativa/incremental da interface após `invoice:save` e `invoice:remove`, inclusive remoções retornadas por ID;
2. **retomar R2 / PR #284:** somente depois de R5 estabilizado, reconciliar o candidato com a nova `main`, corrigir por causa raiz as regressões desktop e provar equivalência funcional pelo frontend real;
3. executar gate de equivalência e somente então avaliar otimizações adicionais de carregamento baseadas em evidência.

### R4 / Pendências — reavaliação encerrada

Não existe correção funcional aprovada nessa frente.

A auditoria havia interpretado como divergência o fato de duas superfícies exibirem tempos diferentes. A revisão do fluxo completo confirmou que isso é intencional:

- **página de Pendências:** preserva e usa a antiguidade total da Pendência desde a abertura original para acompanhamento histórico, organização e filtros;
- **Dashboard/Carteira:** mostram o tempo da ação operacional corrente, isto é, há quanto tempo a providência atual está com a escola ou com o usuário responsável pela reanálise;
- novos envios, reanálises e mudanças de responsabilidade permanecem registrados no histórico e nas tentativas;
- uma reanálise incorreta devolve a ação à escola sem apagar ou reiniciar a idade histórica da Pendência na página completa.

Portanto, **não unificar os cálculos, não alterar `dataAbertura`, não criar migration e não modificar a regra de Pendências por causa dessa diferença de métricas**. Qualquer mudança futura nessa área exige um defeito funcional novo e comprovado pelo frontend real.

## 3. Classificação vigente de R1–R9

R1–R9 são identificadores históricos; não constituem fila automática.

| Fase | Estado atual | Próxima decisão |
|---|---|---|
| **R1** | **Concluída pelo PR #282** | Preservar performance como diagnóstico, sem autoridade funcional. |
| **R2A** | **Absorvida parcialmente** | Resiliência do loader já preservada por #270. |
| **R2B/R2C** | **Pausada / candidata no PR #284** | Não integrar agora. Retomar somente após R5 e com equivalência funcional comprovada. |
| **R3** | **Materialmente atendida** | Fechamento formal pode ser feito sem reabrir regra já coberta por #276 e posteriores. |
| **R4** | **Encerrada sem alteração funcional** | Reavaliação concluiu que as métricas de tempo distintas são comportamento deliberado, não bug. Preservar. |
| **R5** | **PRÓXIMA FRENTE ATIVA** | Convergência de `invoice:save`/`invoice:remove`. |
| **R6** | **Gate posterior** | Equivalência após R5 e antes de aceitar mudança estrutural de readiness. |
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
- a página completa de Pendências preserva a antiguidade total desde a abertura original;
- Dashboard/Carteira podem exibir o tempo da ação operacional atual sem substituir a antiguidade histórica da Pendência;
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
7. não reabrir R4/Pendências com base apenas na diferença entre antiguidade total e tempo da ação corrente;
8. enquanto R5 estiver aberta, não retomar o #284;
9. continuar somente a primeira frente ativa desta documentação.
