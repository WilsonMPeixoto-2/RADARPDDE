# Rebaseline Funcional, Evidência e Governança — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconciliar a documentação canônica com o estado real pós-setembro e transformar as conclusões desta auditoria em gates permanentes, sem converter documentos históricos em fila de implementação.

**Architecture:** A matriz funcional continua sendo o índice de operações, mas cada classificação deve apontar para evidência atual. O método de engenharia passa a registrar explicitamente a regra de consolidação por autoridade. `CURRENT_STAGE.md` só muda quando uma frente for efetivamente iniciada/concluída.

**Tech Stack:** Markdown, scripts Node existentes, GitHub Actions/CI existente.

**Spec:** `docs/superpowers/specs/2026-09-29-root-cause-consolidation-design.md`

## Global Constraints

- Não promover `Parcial` para `Comprovada` sem evidência localizada.
- Não reabrir achados já encerrados só porque aparecem em documento histórico.
- Segurança/Auth permanecem “sem ação” salvo nova evidência.
- Hardening de `registered_invoices` permanece fora da fila atual.
- A “piscada” permanece sintoma não localizado; não registrar causa não comprovada.
- Performance de Production deve apontar para evidência de 29/09/2026.
- Documentos canônicos devem distinguir estado corrente, decisão e histórico.

## Review Focus

- Evidência posterior a 09/09 pode provar operação hoje marcada Parcial.
- Evidência local não deve ser confundida com Production quando o contrato exige Production.
- Skips condicionais não contam como prova da operação omitida.
- CI verde não substitui validação visual de layout.
- Documento `CURRENT_STAGE.md` não pode apontar para handoff já encerrado.

---

### Task 1: Rebaseline da matriz funcional

**Files:**
- Modify: `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`
- Modify if generator requires: `scripts/check-functional-contract-matrix.mjs`
- Read: `docs/evidence/`, `docs/handoff/`, PRs/CI correspondentes

**Interfaces:**
- Produces: matriz corrente com cobertura baseada em evidência posterior a 09/09.

- [ ] **Step 1: Enumerar todas as operações da matriz**

Preservar IDs existentes e não renumerar por conveniência.

- [ ] **Step 2: Para cada item Parcial, localizar a melhor evidência posterior**

Classificar como:

- Comprovada;
- Parcial;
- Lacuna;

e registrar próxima prova somente quando necessária.

- [ ] **Step 3: Não alterar classificação sem evidência citável**

Se a prova estiver incompleta, manter Parcial.

- [ ] **Step 4: Rodar o checker**

Run: `npm run check:functional-matrix`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md scripts/check-functional-contract-matrix.mjs
git commit -m "docs: rebaseline functional contract evidence"
```

### Task 2: Incorporar a lente de consolidação ao método de engenharia

**Files:**
- Modify: `docs/reference/ENGINEERING_METHOD.md`
- Modify: `AGENTS.md`
- Modify: `docs/decisions/ADR-052-autoridade-unica-fluxos-criticos.md` somente para esclarecer aplicação geral, sem reescrever a decisão histórica.

**Interfaces:**
- Produces: regra metodológica aplicável a novas mudanças.

- [ ] **Step 1: Registrar o princípio transversal**

Antes de nova camada funcional, o executor deve responder:

1. qual é a autoridade pretendida;
2. quais implementações já participam;
3. qual camada anterior pode ser substituída;
4. o que será removido se a solução for validada;
5. qual prova confirma que a consolidação não regrediu o fluxo.

- [ ] **Step 2: Adicionar regra de conclusão**

Uma mudança que apenas acrescenta wrapper/override/observer sem avaliar consolidação exige justificativa explícita no PR.

- [ ] **Step 3: Preservar proporcionalidade**

Não transformar mudança pequena em auditoria total; aplicar investigação conforme risco.

- [ ] **Step 4: Commit**

### Task 3: Registrar decisões de “não ação”

**Files:**
- Modify: `docs/CURRENT_STAGE.md` somente quando a nova frente for formalmente iniciada.
- Modify: `docs/reference/STATUS_DOCUMENTOS.md`
- Create/modify evidence summary as necessário.

**Interfaces:**
- Produces: fila sem falsos positivos.

- [ ] **Step 1: Registrar explicitamente**

- Auth/RLS: auditado, saudável, sem ação.
- `registered_invoices`: hardening adicional não é prioridade atual por decisão de produto.
- piscada: relato real, causa não reproduzida nas jornadas medidas.
- Supabase CLI 2.114.0: manter até nova homologação.
- migração em massa para TypeScript: não planejada.

- [ ] **Step 2: Garantir que nenhum desses itens apareça como dívida ativa sem nova evidência**

### Task 4: Atualizar estado/handoff após cada frente real

**Files:**
- Modify: `docs/CURRENT_STAGE.md`
- Modify: `docs/reference/STATUS_DOCUMENTOS.md`
- Create: `docs/handoff/<date>-<frente>.md` quando necessário.

- [ ] **Step 1: Ao iniciar Plano A, apontar um único handoff corrente**

- [ ] **Step 2: Ao concluir cada frente, registrar SHA, PR, deployment quando houver e evidência**

- [ ] **Step 3: Não deixar dois handoffs “correntes” simultaneamente**

### Task 5: Reconciliar a sucessão para evolução visual

**Files:**
- Read: `docs/evidence/2026-09-27-pr378-tooling/DESIGN_TOOLING.md`
- Modify after fila corretiva: `docs/CURRENT_STAGE.md`

- [ ] **Step 1: Só após as frentes corretivas/arquiteturais imediatas, revalidar tooling visual ao vivo**

- [ ] **Step 2: Decidir conscientemente entre evolução visual ampla e próxima etapa da Fase D**

Não saltar para redesign enquanto performance/autoridade ainda estiverem instáveis.

### Task 6: Gate documental final

**Files:**
- No new files unless inconsistencies are found.

- [ ] **Step 1: Rodar**

```bash
npm run check:functional-matrix
npm run check:workflow-references
npm run check:generated
npm run format:check
```

- [ ] **Step 2: Revisar links internos e classe documental**

- [ ] **Step 3: Confirmar que documentos históricos não são apresentados como execução corrente**
