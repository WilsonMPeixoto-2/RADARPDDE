# Retificação auditável de avaliações — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** permitir desfazer bonificação e corrigir avaliação técnica por erro do operador, com auditoria, cancelamento seguro de Pendência vinculada quando necessário e UX explícita, homologando tudo somente em Preview.

**Architecture:** preservar `setBonification()` e `setTechnicalAnalysis()` como comandos ordinários e introduzir um comando explícito de correção técnica no serviço canônico. Operações que alterem simultaneamente verificação e Pendência usam persistência atômica; a UI apenas expressa intenção e confirmação, sem concentrar regra de negócio.

**Tech Stack:** JavaScript, Node test runner, Playwright, Supabase/PostgreSQL, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-09-10-retificacao-avaliacoes-preview-design.md`

## Global Constraints

- Branch de trabalho: `feat/retificacao-avaliacoes-preview-20260910`.
- `main` e Production não podem ser alterados.
- Corrigir documento oficial continua exclusivamente por **Registrar novo envio → Reanalisar**.
- Retificação não apaga histórico, tentativa ou identidade.
- Não ampliar perfis/capacidades de acesso nesta entrega.
- Teste deve falhar antes de código de produção correspondente ser escrito.
- Preview deliberado não pode deixar na `main` qualquer relaxamento da política Vercel `main-only`.

---

### Task 1: Contrato de bonificação reversível

**Files:**
- Modify: `tests/unit/verification-service.test.js`
- Modify: `src/application/verification-service.js`

**Interfaces:**
- Consumes: `VerificationService.setBonification(input)`.
- Produces: suporte explícito a `value: ''` para desfazer bonificação não derivada, com retorno `undone: true` e log `Avaliação desfeita`.

- [ ] Escrever teste RED comprovando `Sim → neutro`, reset técnico coerente e log `Avaliação desfeita`.
- [ ] Executar o teste e confirmar falha pelo contrato ausente.
- [ ] Implementar a menor alteração em `setBonification()` que preserve validações e derivados existentes.
- [ ] Executar testes unitários da verificação e confirmar GREEN.
- [ ] Commitar.

### Task 2: Comando explícito para corrigir análise técnica

**Files:**
- Modify: `tests/unit/verification-service.test.js`
- Modify: `src/application/verification-service.js`

**Interfaces:**
- Produces: `VerificationService.correctTechnicalAnalysis(input)`.

- [ ] Escrever testes RED para correção sem Pendência, recusa de documentos derivados e preservação do fluxo ordinário `setTechnicalAnalysis()`.
- [ ] Confirmar RED.
- [ ] Implementar `correctTechnicalAnalysis()` reutilizando as validações canônicas, sem permitir que o comando seja usado como novo envio/reanálise.
- [ ] Confirmar GREEN e regressões existentes.
- [ ] Commitar.

### Task 3: Retificação de `Incorreto` com Pendência ativa

**Files:**
- Modify: `tests/unit/verification-service.test.js`
- Modify: `tests/unit/verification-remote-persistence.test.js`
- Modify: `src/application/verification-service.js`
- Modify: `src/application/pendency-service.js` somente se necessário para fornecer operação atômica reutilizável.
- Modify/Create migration e testes pgTAP apenas se o repositório remoto atual não possuir uma RPC capaz de persistir verificação + cancelamento da Pendência no mesmo comando.

**Interfaces:**
- `correctTechnicalAnalysis({ ..., confirmPendencyCancellation: true })` cancela a Pendência com justificativa `cancelada por retificação da avaliação` e altera a análise sem criar tentativa.

- [ ] Escrever teste RED exigindo confirmação quando há Pendência ativa.
- [ ] Escrever teste RED verificando análise corrigida + Pendência cancelada + histórico preservado + zero nova tentativa.
- [ ] Confirmar RED.
- [ ] Implementar transação lógica e persistência atômica.
- [ ] Acrescentar testes negativos de contexto/versão se houver RPC nova.
- [ ] Confirmar GREEN em unitários e, se aplicável, pgTAP/Supabase descartável.
- [ ] Commitar.

### Task 4: Auditoria detalhada de Pendências manuais

**Files:**
- Modify: `tests/unit/auditable-retification.test.js`
- Modify: `src/integration/auditable-retification.js` ou mover a regra ao serviço canônico se a mudança puder ser feita sem ampliar o escopo arquitetural.

**Interfaces:**
- Consumes: `retifyManualDetails()` já existente.
- Produces: log com diferenças reais de `item`, `motivo`, `responsavel`, `observacao`, preservando status/contexto.

- [ ] Escrever teste RED para diff de campos e no-op.
- [ ] Confirmar RED.
- [ ] Implementar auditoria campo a campo sem reescrever eventos históricos.
- [ ] Confirmar GREEN.
- [ ] Commitar.

### Task 5: UX explícita de Editar avaliação / Salvar edição

**Files:**
- Modify: `app.js` e/ou integração responsável pela renderização atual do Prontuário.
- Modify: `src/integration/auditable-retification.js` se for o ponto de extensão já instalado para a edição.
- Modify: estilos apenas no escopo dos controles afetados.
- Create/Modify: testes Playwright focados de retificação de avaliação.

**Interfaces:**
- UI chama `setBonification()` para desfazer bonificação e `correctTechnicalAnalysis()` para corrigir análise.

- [ ] Escrever Playwright RED para botão **Editar avaliação**, formulário, **Salvar edição**, busy state e confirmação ao corrigir `Incorreto` com Pendência.
- [ ] Confirmar RED no workflow.
- [ ] Implementar controles visíveis sem alterar o layout funcional não relacionado.
- [ ] Confirmar GREEN em desktop e teclado.
- [ ] Commitar.

### Task 6: Validação integrada e Preview deliberado

**Files:**
- Modify: `.github/workflows/retification-targeted.yml` para incluir os novos testes focados.
- Não alterar permanentemente `vercel.json` para liberar branches genéricas.

- [ ] Rodar suíte unitária direcionada, Playwright focado, suíte de verificação, gates Supabase aplicáveis e `git diff --check` por GitHub Actions.
- [ ] Fazer revisão adversarial do diff contra o spec.
- [ ] Abrir/manter PR Draft.
- [ ] Gerar Preview deliberado sem merge em `main`.
- [ ] Verificar Preview e capturar URL exata.
- [ ] Registrar no PR resultados, limitações e confirmação de Production intacta.
