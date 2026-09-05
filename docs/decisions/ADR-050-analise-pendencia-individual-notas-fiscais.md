# ADR-050 — análise e Pendência individual por registro de Notas Fiscais

**Status:** aceita e vigente **com emendas posteriores incorporadas**  
**Origem:** PR #211, 28–30 de agosto de 2026  
**Emendas posteriores relevantes:** PRs #214, #215, #254, #256, #257, #258 e #260

> Antes de usar esta ADR para alterar código, leia [`../../START_HERE.md`](../../START_HERE.md), [`../CURRENT_STATE.md`](../CURRENT_STATE.md) e, quando precisar da sucessão das decisões, [`../PLAN_TRACEABILITY.md`](../PLAN_TRACEABILITY.md). A fila atual está somente em [`../MASTER_PLAN_CURRENT.md`](../MASTER_PLAN_CURRENT.md).

## 1. Problema que a ADR resolveu

`notaFiscal` é uma exigência documental agregada para bonificação, mas pode conter várias despesas independentes. Uma única análise técnica e uma única Pendência agregada não conseguem representar corretamente situações em que uma NF está correta, outra incorreta e outra ainda não foi analisada.

O mesmo problema existia para débitos cuja documentação ainda não havia sido apresentada (`a_identificar`) e para Consulta Assessoria de NFs de serviço.

## 2. Decisão nuclear, ainda vigente

1. A bonificação de `notaFiscal` permanece agregada.
2. A análise técnica fiscal é individual por `registered_invoice_id`.
3. O resumo técnico agregado é derivado e não aceita edição direta.
4. Precedência do resumo: `Incorreto → Não analisado → Correto (Atrasado) → Correto`.
5. Toda nova Pendência fiscal precisa estar vinculada à invoice específica.
6. Invoices diferentes podem possuir Pendências ativas simultâneas.
7. A mesma invoice não pode possuir duas Pendências ativas equivalentes.
8. `boleto_internet` é tipo de gasto de `notaFiscal`, somente em Educação Conectada; não é documento autônomo.
9. `a_identificar` novo nasce obrigatoriamente `Incorreto + Pendência` na mesma operação protegida.
10. O editor comum não cria nem transforma uma despesa identificada em `a_identificar`.
11. A identificação posterior de `a_identificar` ocorre em **Pendências → Registrar novo envio**.
12. A identificação preserva o mesmo `registered_invoice_id`.
13. Apresentar o documento não resolve automaticamente a Pendência.
14. Reanálise exige tentativa real da mesma Pendência e do mesmo contexto.
15. Se a identificação resultar em serviço, Consulta Assessoria passa a existir na dimensão própria.
16. Se resultar em permanente, o bem patrimonial é criado e vinculado pela mesma cadeia canônica de efeitos.
17. Pendência ativa da invoice bloqueia edição estrutural comum daquela despesa.
18. Histórico legado sem identidade individual não recebe associação automática por número, valor, descrição ou outra heurística.

## 3. Emenda do PR #254: novo envio e reabertura

A formulação original dizia que o novo envio exigia exclusivamente Pendência `Aberta`. **Essa cláusula foi substituída pelo PR #254.**

Contrato atual:

- Pendência documental/fiscal real pode estar `Aberta` ou `Aguardando reanálise` para registrar o novo envio aplicável;
- quando já existe uma tentativa aguardando e o usuário registra uma substituição mais recente, a tentativa anterior é preservada no histórico e marcada como substituída antes da análise;
- a nova tentativa fica `aguardando`;
- a Pendência resultante fica `Aguardando reanálise`;
- o conteúdo do envio anterior não é reescrito;
- `Resolvida` ou `Cancelada` pode ser reaberta quando a operação é autorizada;
- depois da reabertura, histórico de cancelamento permanece histórico, mas `canceled_at` atual não pode indicar falsamente que o registro continua cancelado.

Portanto, **“novo envio exige apenas Pendência Aberta” é regra histórica e não deve ser reintroduzida.**

## 4. Emenda do PR #256: próximo ator

Toda transição documental mantém as projeções de responsável/próximo ator sincronizadas:

```text
Aberta → Escola
Aguardando reanálise → Controlador
Resolvida → nenhum próximo ator ativo
Cancelada → nenhum próximo ator ativo
```

Aliases legados de próximo ator não podem prevalecer sobre essa projeção atual.

## 5. Consulta Assessoria

A Consulta Assessoria continua separada da análise documental fiscal, mas também é individual por NF de serviço.

- somente `servico` participa;
- cada NF possui seu próprio estado de envio e sua própria análise;
- Pendência é identificada por escola + competência + programa + `consAssessoria` + `registered_invoice_id`;
- Pendência da NF A não bloqueia a NF B;
- `Incorreto` é confirmado pela operação atômica junto com a Pendência;
- edição ordinária não substitui a abertura atômica;
- novo envio corretivo segue a regra atual do PR #254, inclusive substituição enquanto já está `Aguardando reanálise`;
- reanálise exige a tentativa real mais recente ainda aguardando;
- observação, link e datas do envio são históricos e não podem ser reescritos pela reanálise;
- o resumo mensal da Assessoria é `Sim` se pelo menos uma consulta exigível foi enviada, `Não` se existem NFs de serviço e nenhuma foi enviada e `Não se aplica` se não existe NF de serviço.

Autoridades atuais:

```text
edição ordinária
→ InvoiceService.updateServiceAdvisory

Incorreto + abertura/reanálise
→ service-advisory-pendency.js

novo envio/substituição
→ service-advisory-corrective-submission.js

persistência
→ RPC específica correspondente
```

## 6. `a_identificar` e legados

A classificação de Production foi refinada por autoria durante o ciclo do PR #211:

- 16 `a_identificar` legítimos de Controladores foram preservados como **Registro legado**;
- eles não receberam análise ou Pendência retroativa inventada;
- 4 `a_identificar` de teste, outras 8 despesas/NFs de teste e três Pendências fiscais genéricas dos mesmos cenários foram removidos pela limpeza fail-closed então documentada;
- logs administrativos foram preservados;
- a antiga proposta de reparar o “Boleto 1234” foi superada porque o registro e a Pendência foram comprovados como fixtures de teste.

Essa classificação não autoriza novos backfills heurísticos.

## 7. Decisão visual vigente

A individualização permanece visível no Prontuário.

- cada NF mostra seu próprio estado técnico;
- o cabeçalho não repete uma situação técnica agregada;
- contador de Pendências aparece quando aplicável;
- com Pendência ativa, a ação operacional é **Visualizar pendência**;
- `Registrar novo envio` e `Reanalisar` pertencem à tela de Pendências;
- o PR #214 corrigiu o overflow da grade individual em desktop sem mudar a regra funcional;
- refinamentos posteriores até o baseline atual prevalecem sobre mockups/anotações antigas.

## 8. Efeitos patrimoniais posteriores

Os PRs #257, #258 e #260 especializaram o efeito de uma invoice permanente sem alterar a identidade individual desta ADR:

- NF permanente cria/vincula bem;
- com número fiscal e processo de inventário já cadastrado, o bem novo entra `Encaminhada` / **Aguardando Inventariação**;
- sem processo, entra `Não encaminhada`;
- o Prontuário explicita NF ↔ bem por vínculo técnico;
- um bem `Não encaminhada` não pode pular diretamente para `Inventariada`;
- encaminhamento posterior sincroniza bem + verificação + log atomicamente;
- número fiscal do bem derivado não é editado isoladamente no cadastro patrimonial.

## 9. Limite entre aplicação e banco

A aplicação/dominio define a regra funcional. O banco protege identidade, contexto, versão, vínculo, estado necessário, tentativa e atomicidade.

A ADR-051 registra uma blindagem adicional contra escrita direta em campos estruturais de `registered_invoices`. Esse hardening continua **deliberadamente adiado** até o fechamento das frentes funcionais correntes; não deve ser inserido oportunisticamente em outro hotfix.

## 10. Continuidade atual

O antigo plano source-first de 03/09 é histórico. Depois dele, PRs posteriores alteraram o produto e foram reconciliados.

**Plano executável atual:** [`../MASTER_PLAN_CURRENT.md`](../MASTER_PLAN_CURRENT.md).  
**Rastreabilidade:** [`../PLAN_TRACEABILITY.md`](../PLAN_TRACEABILITY.md).  
**Estado curto:** [`../CURRENT_STATE.md`](../CURRENT_STATE.md).
