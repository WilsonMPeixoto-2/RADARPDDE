# Hotfix — individualização da análise técnica e das Pendências de Notas Fiscais

**Data:** 28 de agosto de 2026  
**Classe documental:** Plano executável específico do hotfix  
**Branch:** `hotfix/individualizar-analise-notas-fiscais`  
**PR:** #211 (Draft)  
**Baseline de origem:** `b4ad4e8540c55ccfae0406ea136bc4c8da59fd0b`  
**SHA funcional validado:** `e4aaee1969785e7f0c116da6ffbac9fa11f972c8`

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

O hotfix altera o bloco de **Notas Fiscais do Prontuário**, o drawer lateral de conferência da Pendência e, somente na extensão necessária ao mesmo contrato individual, o bloco de **Consulta Assessoria** das NFs de serviço.

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
11. Consulta Assessoria usa sublinhas por NF de serviço, com envio/análise/Pendência individual e apenas `Visualizar pendência` no Prontuário;
12. nenhuma revisão geral do Prontuário, sidebar, tela de Pendências ou navegação entra neste escopo.

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

## 6.1 Decisão refinada de dados legados — 29/08/2026

A investigação de autoria substitui a classificação anterior que tratava os 20 `a_identificar` como um conjunto homogêneo.

Regra vigente:

- 16 foram criados por Controladores reais e são preservados;
- 4 foram criados pela conta técnica durante testes e integram a limpeza;
- mais 8 NFs/despesas dos mesmos cenários foram comprovadas como fixtures, totalizando 12 registros de despesa removíveis;
- três Pendências fiscais genéricas antigas desses cenários também são fixtures;
- o Boleto 1234 e sua Pendência pertencem ao conjunto de teste, portanto não são mais reparados;
- a migration preserva os logs e falha se qualquer prova de autoria/contexto divergir;
- os 16 legítimos aparecem como **Registro legado**, sem análise/Pendência retroativa e sem edição/exclusão comum.

Fonte canônica: `docs/evidence/2026-08-29-pr211-classificacao-dados-legados.md`.

## 7. Implementado até o checkpoint funcional consolidado

No checkpoint `e4aaee1969785e7f0c116da6ffbac9fa11f972c8`:

- análise técnica individual por `registered_invoice_id` implementada;
- bonificação de `notaFiscal` preservada como requisito agregado;
- resumo técnico de `notaFiscal` derivado e bloqueado contra edição direta;
- Pendências de Notas Fiscais obrigatoriamente vinculadas à despesa específica;
- coexistência de Pendências ativas de invoices diferentes comprovada;
- duplicidade ativa da mesma invoice bloqueada;
- `boleto_internet` mantido exclusivamente como tipo de gasto de `notaFiscal` e somente em `CONECTADA`;
- nova `a_identificar` criada somente como `Incorreto + Pendência` na mesma operação;
- editor comum impedido de transformar despesa identificada em `a_identificar`;
- identificação posterior transferida para **Pendências → Registrar novo envio**, preservando o mesmo ID;
- identificação como serviço preserva a dimensão separada de Consulta Assessoria;
- identificação como bem permanente cria e vincula o registro patrimonial na mesma operação;
- reanálise exige Pendência em `Aguardando reanálise` e tentativa válida da mesma despesa;
- Pendência ativa bloqueia edição documental comum no Prontuário;
- layout desktop ajustado para **Documento | Tipo · Valor | Situação técnica | Ação**;
- estados `Correto` e `Correto (Atrasado)` passam a ser apresentados como estado, com edição deliberada;
- contador de Pendências ocultado quando igual a zero;
- ação normal `Abrir pendência` removida do estado que deve nascer atomicamente;
- drawer limitado a **Visualizar → Editar → Salvar**, com fechamento por Escape e restauração de foco;
- testes unitários e E2E antigos que legitimavam o fluxo superado foram substituídos;
- migration Draft e RPCs ajustadas para validar identidade, contexto, transição e atomicidade sem duplicar no PostgreSQL toda a regra de negócio;
- os 16 registros históricos legítimos `a_identificar` permanecem sem backfill;
- antigo reparo do Boleto 1234 foi superado por limpeza fail-closed, após comprovação de que boleto e Pendência são fixtures de teste;
- Consulta Assessoria foi individualizada por NF de serviço também no ciclo de Pendência;
- a verificação de Pendência ativa da Assessoria usa a identidade da NF exata, evitando bloqueio cruzado;
- `Incorreto` da Assessoria é persistido apenas junto com a Pendência, na mesma operação;
- o resumo mensal da Assessoria passa a `Sim` com pelo menos uma consulta enviada e não exige que todas estejam enviadas;
- o Prontuário da Assessoria usa **Visualizar pendência**, enquanto novo envio e reanálise permanecem na tela de Pendências;
- Production permanece intocada.

## 8. Evidências do checkpoint atual

### 8.1 Gates funcionais aprovados

- **Validar RADAR PDDE:** PASS;
- **E2E Playwright:** PASS;
- **Gate remoto de perfis e viewports:** PASS;
- **Backup e restauração descartáveis:** PASS;
- **CodeQL:** PASS;
- **Saúde das dependências:** PASS;
- **Snapshot canônico:** PASS;
- **Excel SME / contratos-fonte:** PASS;
- **Vercel Preview:** PASS.

### 8.2 Banco e Supabase

As provas funcionais do banco passaram integralmente no SHA validado:

- migration-smoke: PASS;
- readiness completo: PASS;
- preflight pós-apply: PASS;
- pgTAP: **25 arquivos / 357 testes / PASS**;
- lint do schema: PASS;
- migrations em PostgreSQL limpo: PASS;
- regeneração e conferência dos tipos: PASS;
- login das identidades descartáveis: PASS;
- Edge Function: PASS;
- frontend, Auth e RLS contra Supabase local: PASS.

A falha externa anterior de registry (`Rate exceeded`) deixou de existir na reexecução e não permanece como pendência.

### 8.3 Homologação pré-Production

Passaram:

- Playwright completo;
- prontidão completa;
- migrations em PostgreSQL limpo;
- dependências e segurança;
- Excel SME e rota pública local;
- Supabase local, Auth, RLS e pgTAP;
- backup/restauração.

O único job vermelho é o Lighthouse móvel.

Desktop:

- performance: **78%**;
- FCP: **1,07 s**;
- LCP: **3,45 s** para limite de **3,50 s**.

Mobile:

- performance: **68%**;
- FCP: **2,82 s**;
- LCP: **16,40 s** para limite de **15,00 s**.

A dívida móvel já existia antes do PR #211 e permanece **não bloqueante para este hotfix desktop**. O threshold não foi relaxado.

### 8.4 Revisão adversarial de caminhos antigos

Concluída no SHA validado.

Foram encontradas e corrigidas duas portas residuais:

- `a_identificar` escondido dentro do cadastro comum de Nota Fiscal;
- tentativa da integração atômica genérica de iniciar o fluxo agregado antigo de `notaFiscal → Incorreto`.

Os dois caminhos agora estão bloqueados e cobertos por regressão E2E.

## 9. Sequência restante

### Etapa H6 — Preview desktop autenticado

Ainda é obrigatório:

- abrir o Preview do SHA candidato;
- autenticar com perfil de teste autorizado;
- conferir visualmente o bloco de Notas Fiscais;
- comparar com as referências versionadas;
- conferir o drawer;
- provar ausência de duplicidade `boletoInternet`;
- provar que `Registrar novo envio` e `Reanalisar` permanecem exclusivamente na tela de Pendências.

### Etapa H7 — revisão adversarial final

**Concluída para código e contratos.**

Resultados adicionais:

- opção `a_identificar` removida do cadastro comum e reservada ao fluxo dedicado;
- rota agregada antiga de `notaFiscal → Incorreto` bloqueada;
- Consulta Assessoria confirmada individual por NF, sem bloqueio cruzado e com abertura atômica de Pendência;
- Boleto Internet permanece apenas como `boleto_internet` dentro de Notas Fiscais;
- Assessoria continua exclusiva de serviço;
- criação patrimonial no novo envio permanece coberta;
- 20 registros históricos continuam intocados;
- preflight do Boleto 1234 segue fail-closed;
- estratégia de reversão está documentada.

A única parte ainda pendente é a inspeção visual autenticada do Preview desktop.

### Etapa H8 — documentação e decisão de merge

Antes de retirar Draft:

- manter `CURRENT_STAGE.md`, handoff, ADR, evidências e matriz funcional coerentes com o SHA candidato;
- registrar a classificação formal do Lighthouse móvel como dívida herdada não bloqueante;
- registrar resultados finais dos gates.

### Etapa H9 — merge e Production

Somente após as etapas anteriores e autorização explícita:

- retirar Draft;
- merge;
- aplicar migration no Supabase Production;
- publicar Vercel Production;
- smoke autenticado;
- confirmar o reparo cirúrgico conhecido;
- confirmar que os 20 registros históricos não foram alterados indevidamente;
- registrar SHA, deployment e estado efetivo.

### Etapa H10 — retorno obrigatório ao plano mestre

Antes de PR3.1:

1. revalidar `main`, Supabase Production e Vercel Production;
2. comparar o diff completo do PR #211 com o plano mestre;
3. marcar tarefas futuras já atendidas, parcialmente atendidas ou afetadas;
4. atualizar o plano mestre e o handoff de retomada;
5. só então iniciar PR3.1.

## 10. Critério de pronto

O hotfix só está pronto quando:

- cada documento de `notaFiscal` possui análise independente;
- Pendências simultâneas de invoices distintas funcionam;
- mesma invoice não duplica Pendência ativa;
- bonificação permanece agregada;
- resumo técnico é derivado e não editável diretamente;
- `boleto_internet` continua apenas como tipo de gasto;
- `a_identificar` nasce `Incorreto + Pendência` atomicamente;
- identificação posterior ocorre no novo envio e preserva o mesmo ID;
- serviço e bem permanente produzem seus efeitos separados corretamente;
- reanálise não pode pular novo envio nem trocar de contexto;
- histórico não é perdido ou inventado;
- migration aplica de forma segura;
- testes funcionais relevantes estão aprovados;
- falhas externas de CI estão classificadas por evidência e reexecutadas quando necessário;
- Preview desktop coincide funcional e visualmente com o layout aprovado;
- Production só é publicada após decisão final;
- documentação registra o retorno obrigatório ao plano mestre.
