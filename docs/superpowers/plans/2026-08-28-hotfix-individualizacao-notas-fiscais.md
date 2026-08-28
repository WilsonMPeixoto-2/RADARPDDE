# Hotfix — individualização da análise técnica e das Pendências de Notas Fiscais

**Data:** 28 de agosto de 2026  
**Classe documental:** Plano executável específico do hotfix  
**Branch:** `hotfix/individualizar-analise-notas-fiscais`  
**PR:** #211 (Draft)  
**Baseline de origem:** `b4ad4e8540c55ccfae0406ea136bc4c8da59fd0b`  
**Checkpoint documentado:** `cebac4dcb3dfb1836f81d59ba58d04cc96974aca`

## 1. Relação com o plano mestre

Este documento **não substitui, renumera, absorve nem encerra** o plano mestre de correções pós-auditoria:

- `docs/superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md`;
- `docs/handoff/2026-08-26-retomada-plano-mestre-pos-pr200.md`.

O hotfix é um **parêntese operacional deliberado**, aberto porque o comportamento atual de `notaFiscal` tornou-se semanticamente incorreto depois que vários registros de despesa passaram a coexistir no mesmo grupo documental.

Ao concluir o PR #211 e sua publicação, a equipe deve **voltar ao plano mestre**. Antes de iniciar PR3.1, porém, é obrigatório executar uma **reconciliação pós-hotfix** para verificar se alguma entrega do PR #211:

1. já solucionou total ou parcialmente uma premissa futura do plano;
2. alterou arquivos, contratos, testes, migrations, RPCs ou integrações citados no plano;
3. tornou alguma etapa redundante;
4. criou nova dependência ou nova restrição;
5. mudou a ordem segura de implementação.

A retomada não deve presumir que o texto de 26/08 continua literalmente correto. O plano mestre continua sendo a direção aprovada, mas suas premissas técnicas precisam ser revalidadas contra a `main`, Supabase Production e Vercel Production após o hotfix.

## 2. Problema que originou o hotfix

Em um único contexto escola + competência + programa, `Notas Fiscais` pode conter vários registros independentes, por exemplo:

- NF de serviço;
- NF de consumo;
- NF de permanente;
- boleto de pagamento de Internet;
- despesa a identificar.

A bonificação continua sendo uma decisão agregada do requisito documental. A análise técnica, porém, não pode permanecer agregada quando cada registro pode ter conformidade e Pendência próprias.

Cenário que evidencia o defeito:

```text
NFS-E 1234      R$ 500,00  → Correto
Boleto 1234     R$ 100,00  → Incorreto → Pendência A
NF 2345       R$ 1.345,00  → Incorreto → Pendência B
```

O contrato antigo, baseado apenas em:

```text
escola + competência + programa + notaFiscal
```

não distingue Pendência A de Pendência B.

## 3. Decisões funcionais aprovadas

### 3.1 Bonificação

Permanece agregada em `notaFiscal`:

- Sim;
- Não;
- Não se aplica.

O hotfix não cria bonificação por Nota Fiscal individual.

### 3.2 Análise técnica individual

Cada `registered_invoice` passa a possuir estado técnico próprio:

- Não analisado;
- Correto;
- Correto (Atrasado);
- Incorreto.

O estado agregado de `verification.analise.notaFiscal` passa a ser **derivado e somente informativo**.

Precedência aprovada do resumo:

```text
Incorreto
→ Não analisado
→ Correto (Atrasado)
→ Correto
```

### 3.3 Identidade da Pendência

Para Pendência individual de Notas Fiscais:

```text
escola
+ competência
+ programa
+ notaFiscal
+ registered_invoice_id
```

Duas despesas diferentes podem ter Pendências ativas simultâneas.

A mesma despesa não pode ter duas Pendências ativas simultâneas do mesmo documento.

### 3.4 Boleto de Internet

`boleto_internet` continua exclusivamente como **tipo de gasto** dentro de Notas Fiscais.

É proibido reintroduzir:

- linha documental `boletoInternet`;
- bonificação `boletoInternet`;
- análise técnica `boletoInternet`;
- Pendência documental autônoma `boletoInternet`.

### 3.5 Despesa a identificar

A decisão anterior do plano mestre fica **expressamente superada neste ponto específico**.

A nova regra é:

```text
a_identificar
→ Incorreto
→ Pendência individual obrigatória
```

O registro deve ser criado de forma atômica com a irregularidade e a Pendência.

Quando a documentação posterior permitir identificar a despesa, o mesmo `registered_invoice_id` deve ser preservado. A Pendência segue seu ciclo normal de novo envio e reanálise.

### 3.6 Histórico

Documento que possua histórico de Pendência individual:

- não pode ser excluído;
- não pode ser transferido para outra escola, competência ou programa;
- mantém sua identidade documental;
- pode ter os campos corrigíveis editados conforme as regras específicas;
- se houver histórico de Assessoria, a natureza necessária àquele histórico permanece protegida.

## 4. Layout aprovado

O hotfix altera somente o bloco de **Notas Fiscais do Prontuário** e o drawer lateral de conferência da Pendência.

O desenho aprovado está registrado em:

- `docs/evidence/2026-08-28-pr211-referencias-visuais.md`.

Princípios:

1. `Notas Fiscais` vira um grupo estruturado;
2. cada despesa aparece em sublinha própria;
3. o cabeçalho mostra apenas dados agregados;
4. o seletor técnico agregado desaparece;
5. análise individual fica em cada sublinha;
6. documento incorreto mostra estado + **Visualizar pendência**;
7. `Registrar novo envio` e `Reanalisar` saem do Prontuário;
8. o drawer serve apenas a **visualizar → Editar → Salvar**;
9. a gestão posterior da Pendência continua na tela de Pendências;
10. desktop é o alvo deste hotfix;
11. nenhuma revisão geral do Prontuário, sidebar ou navegação entra neste escopo.

## 5. Fluxos obrigatórios

### Fluxo A — Nota Fiscal comum

```text
Adicionar Nota
→ nasce Não analisado
→ controlador analisa
→ Correto / Correto (Atrasado)
ou
→ Incorreto
→ modal de Pendência do registered_invoice_id
→ grava Incorreto + Pendência atomicamente
→ abre drawer lateral
```

### Fluxo B — múltiplos documentos incorretos

```text
NF A → Incorreto → Pendência A
NF B → Incorreto → Pendência B
NF C → Não analisado
```

Todos coexistem no mesmo `notaFiscal`, sem bloqueio cruzado.

### Fluxo C — despesa a identificar

```text
Registrar despesa a identificar
→ cria registered_invoice
→ Incorreto
→ Pendência obrigatória
→ drawer lateral
→ posterior identificação preserva ID
→ novo envio
→ Aguardando reanálise
→ Correto / Correto (Atrasado) / Incorreto
```

## 6. Compatibilidade e transição

Para contextos históricos sem estado individual explícito:

- enquanto nenhum documento tiver análise individual, o resumo agregado legado pode continuar sendo exibido;
- a primeira análise individual encerra a inferência agregada para os demais registros;
- registros ainda não analisados passam a `Não analisado`;
- não é permitido fabricar retrospectivamente qual NF foi a causa de um estado agregado antigo.

Pendências históricas sem `registered_invoice_id` não recebem associação automática por heurística.

Exceção expressamente identificada e comprovada:

- Pendência `pend-384d9cc0-634f-4e74-9eac-f22da3b6e2c5`;
- boleto `nota-a2da969c-2e29-41f9-a9fc-f34a306e00ed`;
- escola `04.31.001`;
- competência `2026-08`;
- programa `CONECTADA`.

O reparo deve ser fail-closed, com preflight integral antes da associação.

## 7. Implementado até o checkpoint

No checkpoint `cebac4dcb3dfb1836f81d59ba58d04cc96974aca`:

- branch remota real criada;
- PR #211 aberto como Draft;
- domínio `invoice-document-analysis.js` criado;
- resumo derivado implementado;
- identidade de Pendência generalizada para `registered_invoice_id`;
- `InvoiceService.updateDocumentAnalysis()` criado;
- ciclo individual de abertura, novo envio e reanálise criado no `PendencyService`;
- RPCs específicas do ciclo individual adicionadas em migration Draft;
- regra de `a_identificar = Incorreto + Pendência` implementada;
- criação atômica de `a_identificar` iniciada;
- proteção de histórico reforçada;
- layout estruturado de Notas Fiscais implementado no Prontuário;
- drawer lateral implementado;
- referência visual aprovada incorporada ao contrato documental;
- testes unitários e SQL específicos acrescentados;
- reparo cirúrgico conhecido incluído com preflight;
- Production permanece intocada.

## 8. Falhas já identificadas no checkpoint

O PR **não está apto para merge**.

Falhas conhecidas que devem ser corrigidas antes da revisão final:

1. a RPC `save_unidentified_expense_with_pendency` está com delimitador PL/pgSQL inválido na migration Draft;
2. a suíte unitária ampliada ainda retorna falha e precisa ser inspecionada teste a teste;
3. o novo drawer acrescentou uma advertência de `innerHTML`, fazendo o lint ultrapassar o teto vigente;
4. `Supabase readiness` falha enquanto a migration não compila;
5. gates posteriores ficam cancelados ou bloqueados pelos jobs anteriores;
6. a inspeção autenticada do Preview ainda não foi concluída.

## 9. Sequência restante

### Etapa H1 — corrigir gates imediatos

- corrigir delimitador SQL;
- rodar migration-smoke;
- abrir relatório JUnit e corrigir as falhas reais;
- eliminar a nova advertência de lint em vez de aumentar o teto.

### Etapa H2 — validar domínio e persistência

- unit;
- integration;
- property tests pertinentes;
- SQL pgTAP;
- rollback atômico;
- conflito otimista;
- duplicidade por mesma invoice;
- coexistência de duas invoices;
- round-trip Supabase ↔ estado legado.

### Etapa H3 — E2E funcional

Provar:

```text
NFS-E 1234 → Correto
Boleto 1234 → Incorreto → Pendência A
NF 2345 → Incorreto → Pendência B
```

e provar que:

- A não bloqueia B;
- B não bloqueia C;
- resumo permanece Incorreto;
- bonificação não é alterada pela Pendência;
- Visualizar pendência abre o drawer correto.

### Etapa H4 — `a_identificar`

Provar ponta a ponta:

- nasce Incorreto;
- Pendência nasce junto;
- não existe janela intermediária inconsistente;
- não permite novo envio antes de identificação;
- identificação preserva ID;
- depois da identificação entra em Aguardando reanálise;
- reanálise afeta só aquele documento.

### Etapa H5 — dados existentes

- revalidar o caso conhecido imediatamente antes da migration;
- inventariar os registros históricos `a_identificar`;
- não classificar automaticamente registros não comprovados;
- registrar evidência de qualquer reparo efetivamente necessário.

### Etapa H6 — Preview desktop

- deployment Preview do SHA final;
- login autenticado;
- conferência visual do bloco de Notas Fiscais;
- conferência do drawer;
- comparar com as referências visuais;
- provar ausência de duplicidade `boletoInternet`;
- provar ausência de ações de gestão de Pendência no Prontuário.

### Etapa H7 — revisão final

- revisão adversarial do diff;
- busca por rotas equivalentes fora do diff;
- confirmar migrations, rollback e permissões;
- confirmar que o hotfix não absorveu PR3.1 ou etapas posteriores;
- gates verdes proporcionais ao risco.

### Etapa H8 — merge e Production

Somente após os gates:

- retirar Draft;
- merge autorizado;
- aplicar migration no Supabase Production;
- publicar Vercel Production;
- smoke autenticado;
- confirmar dado reparado;
- registrar SHA, deployment e estado efetivo.

### Etapa H9 — fechamento e retorno ao plano mestre

Antes de PR3.1:

1. revalidar `main`, Vercel e Supabase;
2. comparar o diff completo do PR #211 com o plano mestre;
3. marcar tarefas futuras já atendidas, parcialmente atendidas ou afetadas;
4. atualizar `CURRENT_STAGE.md`, plano mestre e handoff;
5. só então começar PR3.1.

## 10. Critério de pronto

O hotfix só está pronto quando:

- cada documento de `notaFiscal` possui análise independente;
- Pendências simultâneas de invoices distintas funcionam;
- mesma invoice não duplica Pendência ativa;
- bonificação permanece agregada;
- resumo técnico é derivado;
- `boleto_internet` continua apenas como tipo de gasto;
- `a_identificar` nasce Incorreto + Pendência atomicamente;
- histórico não é perdido;
- migration aplica e reverte de forma segura;
- testes relevantes estão verdes;
- Preview desktop coincide funcionalmente com o layout aprovado;
- Production é publicada e validada;
- documentação registra o retorno obrigatório ao plano mestre.
