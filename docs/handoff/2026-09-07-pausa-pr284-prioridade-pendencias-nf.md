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

Isso torna inadequado continuar a otimização enquanto ainda existem duas frentes funcionais conhecidas na baseline: semântica de Pendências e convergência visual/local após salvar ou remover Nota Fiscal.

## 3. Ordem vigente

A ordem operacional passa a ser:

1. **R4 — Pendências:** analisar profundamente e unificar a semântica entre as projeções/visões sem alterar a regra de negócio vigente;
2. **R5 — Nota Fiscal:** corrigir convergência autoritativa/incremental da interface após `invoice:save` e `invoice:remove`;
3. **retomar o PR #284/R2:** rebasear/reconciliar com a nova `main`, investigar por causa raiz as regressões desktop e provar equivalência;
4. somente após equivalência funcional, avaliar/retomar otimizações de carregamento baseadas em evidência.

## 4. Condição obrigatória de retomada do #284

A frente só pode voltar a ser candidata a merge depois de R4 e R5 estarem estabilizados e do candidato ser submetido ao gate canônico `docs/reference/FRONTEND_USER_VALIDATION_GATE.md`.

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

## 5. Preservação contra confusão futura

PR aberto, branch experimental ou documentação interna do próprio #284 não altera esta decisão. Enquanto este documento estiver vigente, o #284 deve permanecer Draft/pausado e não pode ser tratado como R2 concluído.

Novos chats/agentes devem ler esta decisão antes de retomar bootstrap/readiness ou performance.
