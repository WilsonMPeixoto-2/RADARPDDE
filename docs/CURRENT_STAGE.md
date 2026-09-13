# RADAR PDDE — Estado atual do projeto

**Classe documental:** Canônico — estado mutável e retomada futura  
**Atualizado em:** 13 de setembro de 2026

## 1. Baseline vigente

A refatoração da arquitetura Supabase foi integrada pelo PR #300.

**`main` / Production:** `1a149174ed4a14d2fc9f92aff57d1957e8538e89`  
**PR #300:** merged  
**Vercel Production:** `READY` no mesmo SHA  
**Data mode:** `supabase-production`

O hotfix `2eff1321a8abaccd46d9627ee2eed060741ce3b7`, que reverteu a regressão global associada ao PR #299, foi preservado na reconciliação. A funcionalidade de retificação de avaliação removida pelo rollback do PR #299 não foi reintroduzida.

O PR #300 não alterou migrations do Supabase nem exigiu mudança manual de dados em Production.

## 2. Frente ativa

A frente corrente é **homologação operacional ponta a ponta e observabilidade pós-refatoração**, não nova refatoração arquitetural.

Branch:

`test/operational-uat-supabase-2026-09-13`

PR:

`#301 — UAT operacional Supabase e observabilidade pós-refatoração`

Estado do PR #301 no checkpoint:

- aberto;
- Draft;
- HEAD observado: `920c7230a3ffdfade3df25dc0fc59eb2a9271a7d`;
- alterações funcionais de produto no HEAD: nenhuma;
- contém plano de UAT, novo teste Playwright e inclusão desse teste no workflow de ciclos Supabase.

### Handoff corrente obrigatório depois deste arquivo

[`handoff/2026-09-13-relatorio-tecnico-consolidado-pos-pr300-uat.md`](handoff/2026-09-13-relatorio-tecnico-consolidado-pos-pr300-uat.md)

Ele concentra o panorama detalhado de GitHub, Vercel, Supabase, arquitetura, capacidade, observabilidade, dependências, primeiro UAT e próximos testes. Enquanto este `CURRENT_STAGE.md` o apontar como handoff corrente, deve ser lido antes de executar ou ampliar o PR #301.

## 3. O que foi encerrado pelo PR #300

A causa raiz arquitetural foi tratada estruturalmente:

- bootstrap remoto restrito a dados estruturais necessários;
- dados operacionais carregados por competência/contexto;
- dependências históricas ainda ativas incorporadas seletivamente;
- histórico administrativo e escolar carregado sob demanda;
- consultas genéricas fail-closed quando faltam ordenação determinística ou limites;
- gravações remotas autoritativas/incrementais;
- releitura corretiva apenas quando necessária;
- `localStorage` fora do papel de segundo banco operacional no modo Supabase;
- aplicação de estado remoto à projeção em memória com `persistStorage:false`;
- proteção contra resposta stale na troca de contexto;
- acesso direto às tabelas operacionais do Supabase restrito à camada de dados, com exceções de Auth previstas.

A arquitetura não proíbe memória/cache local. O contrato vigente é:

```text
Supabase = fonte canônica persistente
memória/cache local = projeção operacional descartável
```

Estado local é útil quando melhora responsividade e não mascara falha, não substitui o Supabase e converge para a autoridade remota após escrita/reload.

## 4. Certificação já concluída

O candidato funcional do PR #300 passou os gates de release, incluindo:

- Playwright E2E;
- homologação integral pré-production;
- Supabase readiness;
- confiabilidade funcional com Supabase real;
- ciclos funcionais reais;
- perfis/viewports;
- CodeQL;
- saúde de dependências;
- Excel SME;
- snapshot canônico;
- Lighthouse.

Suíte unitária: **1.018 aprovados, 0 falhas**.

O LCP desktop certificado ficou em **3,46 s** no candidato, com TBT 0 ms, acessibilidade 100% e boas práticas 100%. Oscilações pequenas posteriores, sem mudança funcional, não justificam sacrificar correções arquiteturais. Mobile permanece dívida conhecida e não bloqueante para o alvo operacional desktop.

## 5. Estado observado de Production

No checkpoint de 13/09:

- Vercel deployment: `dpl_AgBZAFksL5g7X3qmoY4xdF65h1ti`;
- target: Production;
- state: `READY`;
- manifesto oficial HTTP 200;
- SHA: `1a149174...`;
- `supabaseRepositoryEnabled: true`;
- `productionActivationApproved: true`;
- consulta de runtime logs nas últimas 24h filtrando error/warning/fatal: sem ocorrências.

Revalidar ao vivo antes de depender desses valores, porque deployment e logs são voláteis.

## 6. Primeira evidência da UAT operacional

Novo teste:

`tests/e2e/supabase-operational-uat.spec.js`

O primeiro cenário já passou e comprovou pela interface real + Auth/RLS + Supabase descartável que:

- o login chega ao dashboard;
- `administrative_logs` não participa do bootstrap;
- não foi detectado GET operacional sem filtro contextual nesse fluxo;
- Registros Internos solicita `administrative_logs` somente ao ser aberto;
- a consulta chega limitada e ordenada.

Isso é evidência direta de que o problema de origem foi corrigido nessa jornada.

## 7. Falha corrente do novo UAT

Workflow:

`Ciclos funcionais reais com Supabase` — run `34771878379`.

Resultado inicial:

- 4 testes aprovados;
- 1 teste reprovado.

A falha ocorreu no segundo novo cenário antes da verificação remota. O teste esperava classe `/is-selected/`, mas o controle real usa:

`btn-toggle active-sim`

O retry repetiu o mesmo resultado.

**Classificação corrente:** expectativa incorreta do teste até prova em contrário. Não alterar o produto para satisfazer essa asserção. O próximo passo imediato é corrigir o teste para o contrato visual vigente, preferindo estado semântico mais robusto se disponível, e rerodar até alcançar as verificações de Supabase, ausência de base operacional no `localStorage` e reload.

## 8. Prioridades da homologação

Depois de corrigir o teste inicial, executar pela interface real com Supabase descartável:

1. avaliação mensal completa: Sim/Não/N/A, análise técnica, atrasado, consolidação e derivados;
2. NF/despesa de consumo;
3. serviço + Consulta Assessoria individualizada;
4. permanente + bem + Capital/Inventário + encaminhamento;
5. Boleto de Internet em Educação Conectada;
6. `a_identificar` com `Incorreto + Pendência` atômicos e identificação no novo envio;
7. ciclo integral de Pendência, tentativa, contato, novo envio, reanálise, resolução/manutenção, cancelamento/reabertura autorizados;
8. novas retificações/edições e bloqueios por histórico;
9. mensagens de sucesso, erro, bloqueio e sincronização;
10. primeira navegação, rota direta, reload e mudança rápida de competência;
11. falha de persistência remota e falha de aplicação local pós-commit;
12. reflexos cruzados entre Prontuário, Pendências, Inventário, Dashboard/Carteira e Registros Internos.

Critério de escrita:

```text
estado persistido remoto
=
projeção local da aplicação
=
estado mostrado ao usuário
=
estado reencontrado após reload
```

com efeitos relacionados igualmente coerentes.

## 9. Capacidade e observabilidade

Baseline de Supabase Production observado:

- banco total ~39 MB;
- 163 escolas;
- 430 vínculos escola-programa;
- `administrative_logs` ~3.563 linhas / ~1,7 MB;
- `verifications` 339;
- `registered_invoices` 84;
- `pendencies` 94;
- `assets` 14.

O problema anterior era padrão de acesso, não volume absoluto.

`pg_stat_statements` preserva fingerprints históricos das consultas globais antigas. Não resetar. Registrar linha de corte pós-refatoração e monitorar somente o delta futuro para detectar reintrodução de consultas globais.

Observabilidade existente a preservar/integrar:

- smoke de Production horário com incidente automático;
- integridade de Production a cada 6h;
- CodeQL;
- Dependabot;
- saúde semanal de dependências;
- Vercel deployments/logs;
- Supabase Advisors/Reports/Logs;
- pgTAP/RLS/Auth/readiness.

Evolução futura: resumo agregado de saúde + capacidade + regressão de consultas, sem duplicar workflows.

## 10. Dependências

Não misturar upgrades de dependência com a homologação funcional atual.

Candidatos observados para avaliação posterior em branches próprias incluem `@supabase/supabase-js` e Playwright. A Supabase CLI 2.116.0 já havia sido rejeitada por regressão de garantias pgTAP/RLS; não atualizar automaticamente.

## 11. Documentos temporais antigos

- `audits/SUPABASE_ARCHITECTURE_FINAL_2026-09-13.md` é evidência do candidato pré-merge do PR #300. Não usar suas frases “aguarda integração” como estado corrente.
- `audits/ASTRA_AUDITORIA_RADAR_2026.md` é diário investigativo e contém checkpoints intermediários já superados.
- `PROJECT_CONTEXT.md` contém contexto funcional útil, mas também trechos temporais de 06/09; toda afirmação de PR/SHA/fila nele cede a este arquivo.
- planos, auditorias e handoffs anteriores não formam fila automática de execução.

## 12. Rota obrigatória para retomada

Ler nesta ordem:

1. `../AGENTS.md`;
2. `reference/SYSTEM_CANONICAL_MODEL.md`;
3. `reference/PRODUCT_SURFACE_CATALOG.md`;
4. este `CURRENT_STAGE.md`;
5. o **handoff corrente** explicitamente apontado na seção 2;
6. `reference/ENGINEERING_METHOD.md`;
7. `reference/FRONTEND_USER_VALIDATION_GATE.md`;
8. `reference/STATUS_DOCUMENTOS.md`;
9. `reference/FUNCTIONAL_CONTRACT_MATRIX.md` + JSON quando a frente tocar operação mapeada;
10. ADRs e referências especializadas da área afetada;
11. históricos apenas depois.

Não começar por memória de chat, plano antigo ou auditoria isolada.
