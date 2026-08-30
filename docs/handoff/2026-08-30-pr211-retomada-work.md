# PR #211 — retomada obrigatória para nova sessão Work/Chat

**Data:** 30 de agosto de 2026  
**Branch:** `hotfix/individualizar-analise-notas-fiscais`  
**Natureza:** documento de roteamento entre sessões; não substitui ADR, plano, handoff ou evidências canônicas

## 1. Finalidade

Este arquivo existe para impedir que uma nova sessão do modo Work/Chat leia apenas checkpoints antigos, interprete decisões posteriores como regressões e tente "corrigir" o projeto de volta para regras já superadas.

Antes de alterar código, migration, testes ou documentação do PR #211, a nova sessão deve ler os documentos abaixo na ordem indicada e comparar qualquer auditoria externa com o **HEAD remoto corrente**.

## 2. Leitura obrigatória antes de agir

1. `docs/CURRENT_STAGE.md`;
2. `docs/handoff/2026-08-28-pr211-hotfix-notas-fiscais.md`;
3. `docs/superpowers/plans/2026-08-28-hotfix-individualizacao-notas-fiscais.md`;
4. `docs/decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md`;
5. `docs/evidence/2026-08-29-pr211-classificacao-dados-legados.md`;
6. `docs/evidence/2026-08-28-pr211-referencias-visuais.md`;
7. `docs/DECISION_LOG.md`;
8. `docs/reference/TEST_GOVERNANCE.md`;
9. `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`;
10. código do HEAD remoto, Supabase/Vercel e gates efetivos.

Os handoffs de 27/08 e o plano mestre de 26/08 continuam relevantes como **histórico** e para a retomada posterior ao hotfix, mas não prevalecem sobre decisões específicas do PR #211 atualizadas em 29/08.

## 3. Decisões de 29/08 que não podem ser revertidas por engano

### 3.1 Dados legados e fixtures

A investigação de autoria refinou a antiga leitura dos 20 `a_identificar`.

Contrato vigente:

- 16 registros legítimos de Controladores são preservados;
- esses 16 aparecem como **Registro legado**;
- não recebem análise/Pendência retroativa;
- não oferecem edição/exclusão comum enquanto continuarem nessa condição histórica;
- 4 `a_identificar` de teste + 8 outras despesas/NFs dos mesmos cenários = 12 fixtures removíveis;
- três Pendências fiscais genéricas antigas dos testes também são fixtures;
- a limpeza é fail-closed e preserva logs.

**Não voltar à regra antiga "preservar os 20 indistintamente".**

### 3.2 Boleto 1234

A antiga decisão de reparar o vínculo do Boleto 1234 foi superada.

A auditoria de autoria comprovou que boleto e Pendência eram fixtures da conta técnica. Portanto:

- não criar vínculo;
- não preservar como história operacional real;
- remover junto da limpeza fail-closed se todos os preflights forem satisfeitos.

### 3.3 Consulta Assessoria

A Assessoria é individual por NF de serviço.

Obrigatório:

- identidade por `registered_invoice_id`;
- Pendência da NF A não bloqueia NF B;
- lookup genérico escola + competência + programa + documento não deve ser usado para bloquear uma NF individual;
- `Incorreto` abre o fluxo de Pendência antes de persistir o estado isolado;
- `Incorreto + Pendência` é confirmado atomicamente pela integração canônica;
- resumo mensal = `Sim` se pelo menos uma consulta exigível foi enviada; `Não` se há NFs de serviço e nenhuma foi enviada; `Não se aplica` sem NF de serviço;
- Prontuário mostra **Visualizar pendência**;
- novo envio e reanálise permanecem na tela de Pendências.

A implementação vigente pode estar mais robusta que uma auditoria externa que proponha funções auxiliares diretamente em `app.js`. Avaliar a causa apontada pela auditoria, mas não substituir automaticamente a integração atual se o HEAD já satisfizer o contrato.

### 3.4 Notas Fiscais e a_identificar

- bonificação de `notaFiscal` continua agregada;
- análise técnica e Pendência são individuais por invoice;
- resumo técnico é derivado;
- nova `a_identificar` nasce `Incorreto + Pendência` atomicamente;
- identificação posterior ocorre em **Pendências → Registrar novo envio**, preservando o mesmo ID;
- serviço e bem permanente geram seus efeitos próprios na mesma operação quando aplicável;
- `boleto_internet` existe somente como tipo de gasto de Notas Fiscais e somente em `CONECTADA`.

### 3.5 UX aprovada

No Prontuário:

- documento com Pendência ativa mostra estado + **Visualizar pendência**;
- não mostrar `Registrar novo envio` ou `Reanalisar`;
- drawer é apenas Visualizar → Editar → Salvar;
- gestão do ciclo continua em Pendências.

Desktop é o alvo deste hotfix. Mobile é dívida separada e não bloqueante.

## 4. Como tratar auditorias externas

Auditoria externa é hipótese técnica útil, não fonte de verdade automática.

Processo obrigatório:

1. identificar a causa alegada;
2. localizar o código do HEAD atual;
3. comparar com ADR-050, plano, handoff e evidência de 29/08;
4. verificar se o problema já foi corrigido por caminho equivalente ou mais robusto;
5. reaproveitar somente o que acrescenta correção real;
6. rejeitar qualquer recomendação que reintroduza lookup agregado, backfill inventado, reparo do Boleto 1234, `boletoInternet` autônomo ou fluxo antigo do Prontuário.

## 5. Regra de precedência desta retomada

Para o estado implementado:

`HEAD remoto → Supabase/Vercel efetivos → decisões vigentes → testes atuais → documentação canônica → históricos/auditorias`.

Para saber **qual regra o produto deve obedecer**, usar ADR-050 + plano/handoff/evidência de 29/08, salvo decisão posterior expressa do responsável pelo produto.

## 6. Antes de qualquer merge

- manter PR #211 em Draft enquanto houver falha funcional relevante;
- não aplicar migration em Production antes do preflight final;
- repetir a prova de autoria/contexto da limpeza;
- preservar os 16 legados legítimos;
- remover somente fixtures explicitamente comprovadas;
- confirmar que nenhuma auditoria/teste antigo fez o código voltar a uma regra superada;
- atualizar este roteamento apenas se surgir decisão posterior real.
