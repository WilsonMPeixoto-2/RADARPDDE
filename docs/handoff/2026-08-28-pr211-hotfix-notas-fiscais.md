# Handoff — PR #211 / hotfix de Notas Fiscais

**Data:** 29–30 de agosto de 2026
**PR:** #211 — Draft  
**Branch:** `hotfix/individualizar-analise-notas-fiscais`  
**Último SHA funcional validado:** `530ca6cb62c385ca7ca35f30e82a723e1afed3f6`
**Production:** sem alteração causada por este PR

## 1. Situação atual

O núcleo funcional, a decisão de dados de 29/08 e o hardening server-side posterior estão implementados e validados remotamente no SHA `530ca6c`. Passaram os gates funcionais, banco, segurança, E2E, backup/restauração, perfis/viewports e Preview. O único vermelho efetivo é o Lighthouse móvel, não bloqueante por decisão expressa; o desktop passou na medição de confirmação. O gate agregado pré-Production falha somente por exigir também o mobile.

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
- reanálise usa a tentativa real mais recente ainda não analisada e não reescreve o conteúdo enviado;
- 16 `a_identificar` históricos legítimos de Controladores são preservados como **Registro legado**, sem Pendência ou análise retroativa;
- 4 `a_identificar` e outras 8 despesas/NFs comprovadamente criadas pela conta técnica nos cenários do hotfix são fixtures removíveis por preflight fail-closed;
- três Pendências fiscais genéricas antigas desses testes também integram a limpeza;
- a antiga proposta de reparar o Boleto 1234 foi superada: boleto e Pendência são fixtures de teste e serão removidos, com logs preservados.
- a Pendência fiscal agregada real que não pertence às fixtures continua acessível como legado, sem associação inventada.

### Consulta Assessoria — fechamento da individualização

- somente NFs de serviço participam da Consulta Assessoria;
- envio, análise e Pendência são individualizados por `registered_invoice_id`;
- uma Pendência ativa da NF A não bloqueia a NF B;
- ao selecionar `Incorreto`, a análise não é gravada antes da Pendência: a confirmação ocorre atomicamente;
- enquanto a própria NF possui Pendência ativa, o serviço canônico bloqueia qualquer alteração comum de envio/análise;
- novo envio exige Pendência `Aberta`; reanálise exige `Aguardando reanálise` e a tentativa real mais recente;
- reanálise não pode alterar observação, link ou datas do envio;
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
| Nova despesa a identificar | Incorreto | Visualizar pendência |
| `a_identificar` histórico legítimo | Registro legado | somente leitura |

Outras decisões visuais já incorporadas:

- contador de Pendências oculto quando zero;
- cabeçalho sem repetição da situação técnica agregada; os estados permanecem nas linhas;
- Pendência fiscal agregada preservada acessível por **Visualizar pendência legada**;
- edição/exclusão documental comum escondida enquanto houver Pendência ativa;
- `Abrir pendência` não aparece como etapa normal para estado que deve nascer atomicamente;
- drawer limitado a **Visualizar → Editar → Salvar**;
- `Registrar novo envio` e `Reanalisar` pertencem à tela de Pendências;
- desktop é o alvo deste hotfix; não há redesenho geral do RADAR.

Referência: `docs/evidence/2026-08-28-pr211-referencias-visuais.md`.

## 4. Gates

No SHA remoto `530ca6cb62c385ca7ca35f30e82a723e1afed3f6` passaram: Validar RADAR, Playwright completo, Supabase local/Auth/RLS/pgTAP, migration-smoke, migrations em PostgreSQL limpo, readiness, backup/restauração, perfis/viewports, CodeQL, dependências, snapshot, Ajv, Excel e Vercel Preview. O Preview ficou READY em `https://radarpdde-hhubte7ci-wilson-m-peixotos-projects.vercel.app`.

Um job duplicado de Supabase na homologação agregada falhou inicialmente antes dos testes por colisão da porta local `54322`; a reexecução passou integralmente, incluindo migrations, pgTAP, lint, artefatos, Auth, Edge Function e RLS. O Lighthouse móvel falhou e fez o gate agregado pré-Production falhar; todos os demais jobs internos passaram. Na reexecução de confirmação, desktop obteve performance 79%, acessibilidade 100%, Best Practices 100% e LCP 3,35 s para limite de 3,50 s. Mobile permanece dívida herdada expressamente não bloqueante. A reconferência visual manual posterior aos ajustes também foi expressamente adiada e não bloqueia o merge.

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

1. imediatamente antes de eventual merge/migration, repetir em Production somente leitura o preflight de autoria/fixtures e preservação dos 16 registros legítimos;
2. confirmar `main`, mergeabilidade e Preview do SHA final;
3. a nova inspeção visual manual permanece recomendada, mas não bloqueante por decisão expressa;
4. realizar a revisão adversarial final do diff;
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
