# Handoff — PR #211 / hotfix de Notas Fiscais

**Data:** 28 de agosto de 2026  
**PR:** #211 — Draft  
**Branch:** `hotfix/individualizar-analise-notas-fiscais`  
**Checkpoint funcional consolidado:** `3b10c2a97fd2142dbfd1e120dad0bf2bbd712d57`  
**Production:** sem alteração causada por este PR

## 1. Situação atual

O núcleo funcional do hotfix está implementado e os principais caminhos antigos foram fechados.

O PR permanece **Draft** porque ainda faltam a inspeção visual autenticada do Preview desktop, a revisão adversarial final e a reexecução de um gate Supabase que falhou por limitação externa de download de imagem Docker.

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

## 4. Gates do checkpoint

### Aprovados

- Validar RADAR PDDE;
- E2E Playwright;
- Gate remoto de perfis e viewports;
- Backup e restauração descartáveis;
- CodeQL;
- Saúde das dependências;
- Snapshot canônico;
- Excel SME e contratos-fonte;
- migration-smoke;
- readiness estático;
- preflight pós-apply;
- migrations em PostgreSQL limpo;
- pgTAP: **25 arquivos / 357 testes / PASS**;
- lint do schema;
- Vercel Preview.

### Vermelhos com causa identificada

**Supabase readiness agregado:** falhou somente ao baixar a imagem `postgres-meta` para regeneração de tipos, com `toomanyrequests: Rate exceeded`, depois de migration, preflight, pgTAP e lint passarem.

**Homologação integral pré-Production:** o job Supabase falhou durante download/recriação de containers pelo mesmo tipo de rate limit externo. Os demais jobs funcionais da homologação passaram.

**Lighthouse:** mobile permanece fora do orçamento; desktop passou.

Desktop:
- performance: 79%;
- FCP: 1,02 s;
- LCP: 3,49 s / limite 3,50 s.

Mobile:
- performance: 63%;
- FCP: 4,00 s;
- LCP: 15,98 s / limite 15,00 s.

A dívida móvel é anterior ao PR #211 e foi definida como **não bloqueante neste hotfix desktop**. O threshold não foi relaxado.

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

1. reexecutar o gate Supabase quando o registry permitir;
2. abrir e inspecionar o Preview autenticado no desktop;
3. comparar o Preview com as referências visuais aprovadas;
4. revisar o diff de forma adversarial;
5. revalidar Boleto Internet, Assessoria, Inventário e os 20 registros históricos;
6. revalidar o preflight do reparo Boleto 1234;
7. somente então decidir retirada do Draft e merge.

## 7. Relação com o plano mestre

Este hotfix não substitui o plano mestre.

Depois da eventual publicação em Production:

`PR #211 publicado → revalidar main/Supabase/Vercel → reconciliar com plano mestre → atualizar premissas → só então iniciar PR3.1`
