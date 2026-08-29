# Handoff — PR #211 / hotfix de Notas Fiscais

**Data:** 29 de agosto de 2026  
**PR:** #211 — preparado para sair de Draft  
**Branch:** `hotfix/individualizar-analise-notas-fiscais`  
**SHA funcional validado:** `ff8453c8fd0c4e5707d656b4520051962a48df96`  
**Production:** sem alteração causada por este PR

## 1. Situação atual

O núcleo funcional do hotfix está implementado e os principais caminhos antigos foram fechados.

Em 29/08/2026, o responsável pelo produto registrou que não consegue fazer nova conferência visual neste momento e autorizou o avanço da preparação para merge, deixando eventual refinamento visual adicional para etapa posterior. A primeira inspeção autenticada já havia aprovado a estrutura principal e identificado os ajustes residuais; esses ajustes foram implementados e passaram por E2E. Assim, a conferência visual pós-ajuste deixa de ser bloqueante para a preparação do merge, sem ser apagada do histórico.

Nenhuma migration do PR #211 foi aplicada em Production.

## 2. Regra funcional consolidada

- `notaFiscal` continua agregada para bonificação;
- cada despesa possui análise técnica própria;
- o resumo técnico de Notas Fiscais é derivado e não aceita edição direta;
- toda nova Pendência fiscal pertence a uma despesa específica;
- invoices diferentes podem possuir Pendências simultâneas;
- a mesma invoice não pode duplicar Pendência ativa;
- `boleto_internet` permanece tipo de gasto dentro de Notas Fiscais e somente em Educação Conectada;
- nova `a_identificar` nasce obrigatoriamente `Incorreto + Pendência`;
- uma despesa identificada não pode virar `a_identificar` pelo editor comum;
- a identificação posterior de `a_identificar` ocorre em **Registrar novo envio**, na tela de Pendências;
- o mesmo ID é preservado;
- se o documento apresentado for serviço, Consulta Assessoria surge em sua área própria;
- se for bem permanente, o registro patrimonial é criado e vinculado na mesma operação;
- novo envio leva a Pendência para `Aguardando reanálise` e a despesa para `Não analisado`;
- reanálise só ocorre depois de tentativa válida da mesma Pendência;
- os 20 `a_identificar` históricos não recebem Pendências inventadas;
- somente o Boleto 1234 conhecido possui reparo cirúrgico previamente autorizado.

### Consulta Assessoria — fechamento da individualização

- somente NFs de serviço participam da Consulta Assessoria;
- envio, análise e Pendência são individualizados por `registered_invoice_id`;
- uma Pendência ativa da NF A não bloqueia a NF B;
- ao selecionar `Incorreto`, a análise não é gravada antes da Pendência: a confirmação ocorre atomicamente;
- se já existir Pendência da própria NF, o Prontuário abre **Visualizar pendência** em vez de exibir alerta genérico;
- o resumo mensal de bonificação da Assessoria é `Sim` quando pelo menos uma consulta exigível foi enviada, `Não` quando existem NFs de serviço e nenhuma foi enviada, e `Não se aplica` quando não existe NF de serviço;
- `Registrar novo envio` e `Reanalisar` permanecem na tela de Pendências;
- E2E comprova duas Pendências de Assessoria simultâneas para duas NFs distintas, sem bloqueio cruzado.

## 3. Layout aprovado e implementado

O Prontuário usa o bloco estruturado de Notas Fiscais com quatro áreas desktop:

`Documento | Tipo · Valor | Situação técnica | Ação`

Matriz visual:

| Estado | Apresentação | Próxima ação no Prontuário |
|---|---|---|
| Não analisado | seletor técnico | analisar |
| Correto | estado verde | Editar análise, somente por ação deliberada |
| Correto (Atrasado) | estado semântico concluído | Editar análise, somente por ação deliberada |
| Incorreto + Pendência | estado estático | Visualizar pendência |
| Aguardando reanálise | estado estático | Visualizar pendência |
| Despesa a identificar | Incorreto | Visualizar pendência |

Outras decisões visuais já incorporadas:

- contador de Pendências oculto quando zero;
- edição/exclusão documental comum escondida enquanto houver Pendência ativa;
- `Abrir pendência` não aparece como etapa normal para estado que deve nascer atomicamente;
- drawer limitado a **Visualizar → Editar → Salvar**;
- `Registrar novo envio` e `Reanalisar` pertencem à tela de Pendências;
- desktop é o alvo deste hotfix; não há redesenho geral do RADAR.

Referência: `docs/evidence/2026-08-28-pr211-referencias-visuais.md`.

## 4. Gates do SHA funcional validado

### Aprovados

- Validar RADAR PDDE;
- E2E Playwright completo;
- Gate remoto de perfis e viewports;
- Backup e restauração descartáveis;
- CodeQL;
- Saúde das dependências;
- Snapshot canônico;
- Excel SME e contratos-fonte;
- migration-smoke;
- readiness completo;
- preflight pós-apply;
- migrations em PostgreSQL limpo;
- pgTAP: **25 arquivos / 357 testes / PASS**;
- lint do schema;
- regeneração e conferência de tipos;
- login de identidades descartáveis;
- Edge Function;
- frontend, Auth e RLS contra Supabase local;
- Vercel Preview: **READY**.

### Lighthouse

Desktop passou no SHA funcional `ff8453c8fd0c4e5707d656b4520051962a48df96`:

- performance: **79%**;
- FCP: **1,01 s**;
- LCP: **3,44 s** / limite **3,50 s**.

Mobile continua fora do orçamento:

- performance: **64%**;
- FCP: **4,06 s**;
- LCP: **15,66 s** / limite **15,00 s**.

O vermelho agregado da homologação pré-Production decorre exclusivamente do Lighthouse móvel. Todos os demais jobs da homologação passaram.

A dívida móvel é anterior ao PR #211 e permanece **não bloqueante para este hotfix desktop**. O threshold não foi relaxado.

### Revisão adversarial concluída

A revisão final de caminhos antigos encontrou e fechou duas portas residuais:

1. `a_identificar` ainda podia ser exposto como opção dentro do cadastro comum de Nota Fiscal por uma integração legada; agora só é habilitado pelo comando dedicado **Registrar despesa a identificar**;
2. a integração atômica genérica ainda podia tentar iniciar o antigo fluxo agregado `notaFiscal → Incorreto`; agora `notaFiscal` é devolvido ao serviço canônico, que recusa edição agregada e não abre Pendência genérica.

Ambos os comportamentos possuem regressão E2E e passaram no SHA validado.

## 5. Estratégia segura de reversão

O PR #211 não adota rollback destrutivo automático.

A razão é operacional: depois que usuários reais começarem a criar Pendências fiscais individualizadas, identificar `a_identificar` ou vincular novos bens permanentes, voltar cegamente ao modelo anterior poderia apagar ou tornar invisível história válida.

A reversão deve seguir três cenários:

### Cenário A — falha antes da migration em Production

- não aplicar a migration;
- manter Production atual;
- reverter apenas o deployment candidato, se necessário;
- nenhuma transformação de dados é executada.

### Cenário B — migration aplicada, mas nenhuma escrita do novo modelo ocorreu

Só é admissível considerar uma migration compensatória se um preflight comprovar, após o horário de publicação:

- nenhuma nova Pendência `notaFiscal` individual;
- nenhuma nova `a_identificar`;
- nenhuma identificação posterior de `a_identificar`;
- nenhum novo vínculo patrimonial produzido pelo hotfix.

Com essa prova, pode-se restaurar definições anteriores de constraint/RPC de forma controlada.

### Cenário C — houve qualquer escrita real no novo modelo

**Não fazer downgrade destrutivo do banco.**

A estratégia passa a ser **fail-forward**:

1. preservar os registros e o histórico já produzidos;
2. corrigir o frontend/serviço em nova revisão;
3. manter as estruturas de banco compatíveis;
4. executar smoke e reconciliação antes de reabrir a operação.

Reimplantar simplesmente o frontend anterior depois de novas escritas individuais não é considerado rollback seguro, porque o frontend antigo não conhece integralmente o novo vínculo por despesa.

Em todos os cenários:

- backup/restauração descartável deve estar verde antes de Production;
- registrar horário exato da migration e do deployment;
- executar preflight imediatamente antes da migration;
- registrar qualquer escrita ocorrida entre migration e eventual decisão de reversão.

## 6. Próximas ações obrigatórias

1. retirar o PR de Draft após registrar esta dispensa de conferência visual pós-ajuste;
2. imediatamente antes do merge/migration, reexecutar o preflight fail-closed do Boleto 1234 e dos 20 registros históricos;
3. confirmar novamente que a `main` não avançou e que o PR permanece mergeável;
4. obter/usar autorização de merge;
5. somente então integrar, aplicar migration e executar smoke de Production.

A conferência visual pós-ajuste permanece recomendada, mas foi explicitamente adiada para etapa posterior e não bloqueia mais a preparação do merge.

## 7. Relação com o plano mestre

Este hotfix não substitui o plano mestre.

Depois da eventual publicação em Production:

`PR #211 publicado → revalidar main/Supabase/Vercel → reconciliar com plano mestre → atualizar premissas → só então iniciar PR3.1`
