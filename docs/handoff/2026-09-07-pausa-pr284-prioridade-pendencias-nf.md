# Pausa formal do PR #284 e prioridade funcional

**Data:** 7 de setembro de 2026  
**Classe documental:** Canônico — decisão operacional corrente

## 1. Decisão

O PR #284 (`audit/desktop-bootstrap-observability-2026-09-07`) fica **pausado, preservado e não integrável no estado atual**.

A pausa não invalida o trabalho técnico já realizado. Permanecem preservados como candidatos/evidências: diagnóstico do bootstrap, instrumentação, análise dos pollings, conceito de readiness determinístico, artefatos de teste e medição local de performance.

Não devem prosseguir agora:

- merge ou deploy do PR #284;
- novas otimizações de carregamento;
- retirada adicional de entidades do bootstrap bloqueante;
- conclusão de R2 com base no estado atual do PR;
- uso da mediana de performance como substituto de equivalência funcional.

## 2. Motivo

O HEAD analisado do PR #284 (`e0813ac2c198db8060a63c9f2b2621a2b00621a9`) apresentou falhas relevantes de E2E desktop e de homologação pré-Production. A investigação indicou que a mudança estrutural de readiness pode afetar a ordem de instalação/disponibilidade de módulos, produzindo páginas parcialmente renderizadas com funcionalidades ainda indisponíveis.

A pausa permanece necessária enquanto a frente funcional real de convergência de Nota Fiscal não for encerrada e antes de qualquer retomada estrutural de readiness.

## 3. Reavaliação de R4 / Pendências

A classificação inicial desta decisão tratava a diferença de contagem temporal entre `operational-projection.js` e `pendencias-view-model.js` como uma frente funcional a corrigir. Essa interpretação foi reavaliada no mesmo dia após reconstrução do fluxo completo do produto.

**Conclusão vigente: não há defeito funcional demonstrado nessa diferença.**

As superfícies medem coisas distintas por desenho:

- a **página completa de Pendências** preserva a antiguidade total da Pendência desde sua abertura original, usada para histórico, organização e filtros;
- o **Dashboard/Carteira** mostram o tempo da ação operacional corrente, isto é, há quanto tempo a providência atual está com a escola ou com o usuário responsável pela reanálise;
- cada novo envio, reanálise e mudança de responsabilidade permanece registrado no histórico/tentativas;
- uma reanálise incorreta pode iniciar novo período de ação da escola sem apagar a idade histórica total da Pendência.

Portanto, não existe autorização para:

- unificar os dois cálculos;
- reiniciar ou substituir `dataAbertura`;
- criar migration para essa diferença;
- alterar regras de reanálise;
- modificar a UI apenas para tornar as duas métricas iguais.

A divergência aparente foi um **falso positivo de auditoria por interpretação incompleta do papel de cada superfície**. Este registro existe para impedir que o mesmo falso positivo gere uma regressão futura.

## 4. Ordem vigente

A ordem operacional passa a ser:

1. **R5 — Nota Fiscal:** analisar e corrigir a convergência autoritativa/incremental da interface após `invoice:save` e `invoice:remove`;
2. **retomar o PR #284/R2:** rebasear/reconciliar com a nova `main`, investigar por causa raiz as regressões desktop e provar equivalência;
3. somente após equivalência funcional, avaliar/retomar otimizações de carregamento baseadas em evidência.

R4/Pendências está **encerrada sem alteração funcional** nesta rodada.

## 5. Condição obrigatória de retomada do #284

A frente só pode voltar a ser candidata a merge depois de R5 estar estabilizada e do candidato ser submetido ao gate canônico `docs/reference/FRONTEND_USER_VALIDATION_GATE.md`.

A aprovação deve provar pelo frontend real, em desktop:

- login e primeira navegação;
- controles e ações disponíveis;
- jornadas críticas executadas por cliques reais;
- gravação correta quando houver escrita;
- persistência após refresh/reabertura;
- contexto, competência e perfil preservados;
- resultado visual coerente;
- ausência de regressão funcional em relação à baseline estável.

Performance é critério posterior: a única diferença desejável entre baseline e candidato é executar a mesma funcionalidade com menor custo/tempo.

## 6. Preservação contra confusão futura

PR aberto, branch experimental ou documentação interna do próprio #284 não altera esta decisão. Enquanto este documento estiver vigente, o #284 deve permanecer Draft/pausado e não pode ser tratado como R2 concluído.

Novos chats/agentes devem ler esta decisão antes de retomar bootstrap/readiness, performance ou qualquer suposta “unificação” de tempos de Pendências.
