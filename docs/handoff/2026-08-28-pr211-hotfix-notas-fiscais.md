# Handoff — PR #211 / hotfix de Notas Fiscais

**Data:** 29 de agosto de 2026  
**PR:** #211 — Draft  
**Branch:** `hotfix/individualizar-analise-notas-fiscais`  
**Último SHA funcional antes da reconciliação documental:** `3d63e0cee204c633ef8b796c7921fda05274c63e`  
**Production:** sem alteração causada por este PR

## 1. Situação atual

O núcleo funcional do hotfix está implementado e os principais caminhos antigos foram fechados.

Após a rodada anterior de homologação, novas correções foram autorizadas: refinamento da classificação de dados legados, limpeza fail-closed de fixtures de teste e adaptação visual dos `a_identificar` legítimos. Por isso, resultados verdes de SHAs anteriores continuam como evidência histórica, mas não autorizam retirar o Draft. Os gates precisam ser executados novamente sobre o HEAD que contém estas correções.

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
- 16 `a_identificar` históricos legítimos de Controladores são preservados como **Registro legado**, sem Pendência ou análise retroativa;
- 4 `a_identificar` e outras 8 despesas/NFs comprovadamente criadas pela conta técnica nos cenários do hotfix são fixtures removíveis por preflight fail-closed;
- três Pendências fiscais genéricas antigas desses testes também integram a limpeza;
- a antiga proposta de reparar o Boleto 1234 foi superada: boleto e Pendência são fixtures de teste e serão removidos, com logs preservados.

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

## 4. Gates

Os resultados verdes do SHA `ff8453c8fd0c4e5707d656b4520051962a48df96` continuam válidos como evidência de que o núcleo anterior estava estável.

Entretanto, após esse SHA foram modificados:

- migration de Production, para substituir o antigo reparo do Boleto 1234 pela limpeza fail-closed de fixtures;
- renderização dos `a_identificar` legítimos, agora identificados como **Registro legado**;
- regra de transição que determina quando a individualização já começou;
- regressão E2E correspondente.

Portanto, **nenhum resultado anterior é usado como autorização de merge para o HEAD atual**. O ciclo completo deve ser reexecutado.

O Lighthouse móvel continua classificado como dívida herdada não bloqueante deste hotfix desktop; essa exceção não se estende a falhas funcionais, de banco, segurança ou E2E.

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

1. executar unitários, integração, E2E, Supabase readiness, pgTAP, migrations limpas, Auth/RLS, backup/restauração, segurança e Preview no HEAD atual;
2. revisar os resultados e corrigir qualquer regressão real;
3. imediatamente antes de eventual merge/migration, repetir em Production somente leitura o preflight de autoria/fixtures e preservação dos 16 registros legítimos;
4. confirmar `main`, mergeabilidade e Preview;
5. somente depois avaliar retirada do Draft;
6. merge e Production continuam dependentes de autorização explícita no estágio final.

## 7. Relação com o plano mestre

Este hotfix não substitui o plano mestre.

Depois da eventual publicação em Production:

`PR #211 publicado → revalidar main/Supabase/Vercel → reconciliar com plano mestre → atualizar premissas → só então iniciar PR3.1`


## 8. Evidência canônica de legados

A classificação que deve orientar futuras sessões é:

`docs/evidence/2026-08-29-pr211-classificacao-dados-legados.md`

Documentos anteriores que falem em “preservar os 20” ou em “reparar o Boleto 1234” são históricos superados e não devem ser usados como regra corrente.
