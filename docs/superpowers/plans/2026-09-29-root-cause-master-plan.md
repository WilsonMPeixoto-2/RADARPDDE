# Plano Mestre — Consolidação por Causas-Raiz

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Executar as correções do RADAR na ordem que ataca causas-raiz, reduz sobreposição histórica e evita novos ciclos de evolução/regressão.

**Architecture:** Quatro planos independentes compartilham uma única lente: consolidar autoridades existentes em vez de empilhar soluções locais. A performance contextual é a prioridade técnica; arquitetura frontend/readiness reduz reincidência; o drawer é correção visual localizada; documentação/matriz transformam o aprendizado em governança verificável.

**Tech Stack:** JavaScript, Supabase/PostgreSQL, CSS, Playwright, Node test runner, dependency-cruiser, Knip, GitHub Actions/Vercel existentes.

**Spec:** `docs/superpowers/specs/2026-09-29-root-cause-consolidation-design.md`

## Global Constraints

- Não iniciar implementação pela aparência do sintoma.
- Não criar `V2` paralela quando a intenção é substituir a autoridade anterior.
- Não fazer rewrite de `app.js`.
- Não fazer revisão global de CSS por causa de PROD-UX-08.
- Não executar hardening adicional de `registered_invoices`.
- Não abrir frente de Auth/RLS sem nova evidência.
- Não atribuir causa à piscada sem reprodução.
- Não atualizar Supabase CLI 2.114.0 sem nova homologação.
- Não usar teste verde como substituto de validação real da experiência.

## Review Focus

- A correção de performance deve preservar dependências históricas legítimas.
- A consolidação frontend deve remover camadas comprovadamente superseded, não apenas criar novos arquivos.
- O drawer deve continuar funcional em estados longos e transição de breakpoint.
- A documentação deve separar fato medido, inferência, decisão de produto e hipótese.
- Toda mudança publicada deve ser verificada no mesmo SHA.

---

## Frente 0 — Baseline e evidência congelada

**Documento:** `docs/evidence/2026-09-29-production-evaluation-performance/README.md`

- [ ] Tratar os números de 29/09 como baseline anterior à correção.
- [ ] Não levar o harness descartável da branch `diag/evaluation-production-measurement-2026-09-29` para a main.
- [ ] Preservar somente evidência e metodologia reproduzível.

### Baseline relevante

- 5,69–9,50 s por troca de competência;
- 172–292 requests REST por troca;
- ~89% do tempo em `loadOperationalContext()`;
- `switchView()` em ~12–19 ms;
- `save_verification_with_log` mediana ~73 ms, p95 ~300 ms;
- escrita isolada de 301 ms → 1 broadcast → 997 GETs no mesmo cliente em ~16 s;
- piscada não reproduzida nas trocas medidas.

---

## Frente A — Contexto operacional e performance

**Plano:** `docs/superpowers/plans/2026-09-29-operational-context-performance.md`

**Prioridade:** P0  
**Dependências:** nenhuma implementação anterior deste plano mestre.

- [ ] Criar leitura set-based `read_operational_context`.
- [ ] Substituir `queryContextDependencies()` no caminho de Production.
- [ ] Preservar interface de `queryOperationalContext()`.
- [ ] Provar abort/staleness/concorrência.
- [ ] Criar gate de contagem de requests.
- [ ] Medir novamente em Production.
- [ ] Só depois decidir se Realtime pós-write ainda demanda mudança própria.

### Gate para avançar

Não avançar para alterações de sincronização adicionais enquanto não houver nova medição.

Alvo:

- redução ≥80% da contagem de requests;
- até 30 requests totais por troca de competência, preferencialmente menos;
- redução ≥50% da latência;
- nenhuma perda de Pendência/NF/bem histórico;
- nenhuma nova fonte paralela de contexto.

---

## Frente B — Autoridades frontend, readiness e concentração

**Plano:** `docs/superpowers/plans/2026-09-29-frontend-authority-consolidation.md`

**Prioridade:** P1  
**Dependência:** pode iniciar o mapeamento em paralelo com A; mudanças funcionais de integração devem considerar o resultado de A.

- [ ] Gerar mapa atual de autoridades/wrappers/polling.
- [ ] Tornar readiness atômico explícito e remover seu polling de instalação.
- [ ] Classificar polling residual e converter somente os casos com sinal determinístico.
- [ ] Instituir regra de não crescimento desnecessário de `app.js`.
- [ ] Priorizar extrações de baixo acoplamento, uma área por vez.
- [ ] Registrar o que foi removido, não só o que foi criado.

### Gate para avançar

Uma extração só é aceita se:

- houver teste do comportamento anterior;
- a autoridade antiga for removida ou conscientemente reduzida a adaptador;
- não surgir estado paralelo;
- a superfície real continuar funcionando.

---

## Frente C — PROD-UX-08

**Plano:** `docs/superpowers/plans/2026-09-29-prod-ux-08-drawer-consolidation.md`

**Prioridade:** P1 corretiva  
**Dependência:** independente de A no código, desde que branch/worktree seja isolada.

- [ ] Demonstrar computed styles vencedores.
- [ ] Consolidar geometria do drawer em uma única autoridade.
- [ ] Remover overrides concorrentes do componente.
- [ ] Validar 1366×768, 1440×900 e transição de 1181 px.
- [ ] Validar conteúdo longo, ações, footer e scroll outside-in.
- [ ] Confirmar em Production após publicação autorizada.

### Gate para avançar

Não ampliar para CSS global. Se aparecer problema fora do drawer, registrar como achado separado e demonstrar causalidade antes de tocar.

---

## Frente D — Evidência funcional e governança

**Plano:** `docs/superpowers/plans/2026-09-29-functional-evidence-governance.md`

**Prioridade:** P1/P2  
**Dependência:** rebaseline da matriz pode começar já; `CURRENT_STAGE.md` só muda quando o estado real mudar.

- [ ] Reavaliar itens Parcial da matriz funcional contra evidências posteriores a 09/09.
- [ ] Incorporar a lente de consolidação ao `ENGINEERING_METHOD.md` e `AGENTS.md`.
- [ ] Registrar decisões de não ação.
- [ ] Manter um único handoff corrente.
- [ ] Após fila corretiva, reavaliar `DESIGN_TOOLING.md`.

---

## Decisões congeladas — não abrir frente agora

| Tema | Decisão |
|---|---|
| Auth/RLS | Área auditada e saudável; sem ação corretiva |
| `registered_invoices` hardening | Não prioritário no modelo atual de equipe confiável |
| ADR-051 | Não tratar como dívida ativa |
| Piscada de tela | Sintoma relatado, causa ainda não reproduzida |
| Rewrite de `app.js` | Proibido como estratégia |
| Migração ampla para TypeScript | Fora de escopo |
| Revisão CSS global | Fora de escopo por PROD-UX-08 |
| Nova ferramenta de dependência/unused | Usar dependency-cruiser e Knip já presentes |
| Supabase CLI | Manter 2.114.0 até nova homologação |

---

## Ordem recomendada de execução

```
A1 banco set-based
→ A2 repository
→ A3 concorrência
→ A4 gate de performance
→ medir Production
→ decisão Realtime
          ↘
            B1 mapa de autoridades
            → B2 readiness atômico
            → B3 polling residual
            → B4/B5 decomposição oportunística

C1 causa CSS → C2 consolidação → C3 validação
(pode ocorrer em branch isolada paralelamente)

D1 matriz funcional pode rodar em paralelo
D2 método/governança incorpora resultados confirmados
D3/D4 estado/handoff acompanham o que realmente for integrado
```

## Estratégia de branches/PRs

Não agrupar todas as frentes em um PR.

Sugestão:

1. PR-A1 — RPC set-based + pgTAP.
2. PR-A2 — repository + DataService/tests + gate de performance.
3. PR-A3 — somente se a nova medição comprovar necessidade de ajuste Realtime.
4. PR-B1 — mapa/readiness atômico.
5. PR-B2+ — um grupo de polling ou uma extração de baixo acoplamento por PR.
6. PR-C — PROD-UX-08 isolado.
7. PR-D — rebaseline documental/governança.

Cada PR deve ser rejeitável sem invalidar os demais.

## Critério de parada após falhas

Depois de **duas tentativas que não convergem materialmente**:

- parar de remendar;
- voltar ao diagnóstico;
- verificar autoridade/camada errada;
- revisar hipótese;
- não empilhar uma terceira correção sobre as duas anteriores.

Se três abordagens falharem, tratar como sinal de arquitetura incorreta antes de nova implementação.

## Critério final de sucesso

A sequência estará concluída quando:

1. troca de competência não gerar fan-out de centenas de requests;
2. gravação rápida não se transformar em cascata de releituras de mesma ordem de grandeza;
3. readiness crítico for determinístico no caso conhecido e polling residual estiver classificado;
4. autoridades frontend estiverem documentadas e novas mudanças não aumentarem concentração sem justificativa;
5. PROD-UX-08 estiver resolvido e validado visualmente;
6. matriz funcional/documentação refletirem o estado real;
7. nenhuma frente “resolvida” tiver deixado uma segunda implementação funcional concorrente;
8. Production estiver verificada no SHA publicado.

## Próxima frente somente após estes gates

A evolução visual ampla registrada em:

`docs/evidence/2026-09-27-pr378-tooling/DESIGN_TOOLING.md`

deve ser reavaliada somente depois da fila corretiva/arquitetural imediata, com benefício observável, custo, risco e compatibilidade novamente verificados.
