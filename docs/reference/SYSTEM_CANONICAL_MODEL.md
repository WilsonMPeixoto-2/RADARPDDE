# Modelo canônico integrado do RADAR PDDE

**Classe documental:** Canônico — modelo funcional e arquitetural integrado  
**Atualizado em:** 7 de setembro de 2026  
**Finalidade:** leitura obrigatória antes de qualquer análise funcional, correção, implementação, refatoração ou auditoria do produto  
**Estado mutável do projeto:** `docs/CURRENT_STAGE.md`

## 0. Regra de uso

Este documento existe para responder uma pergunta simples que não deveria exigir arqueologia toda vez que um chat novo começa: **o que é o RADAR PDDE, quais regras o governam e onde cada regra realmente vive?**

Ele não substitui o código, o Supabase ou as ADRs. Ele integra essas autoridades em um mapa único para impedir que uma análise local de um arquivo, teste ou documento histórico produza uma falsa conclusão sobre o sistema inteiro.

Antes de propor qualquer mudança funcional, o executor deve:

1. identificar neste mapa a superfície, entidade, fluxo e invariantes afetados;
2. confirmar no código atual a autoridade indicada;
3. conferir Supabase/Auth/RLS/RPC/Edge Function quando a regra atravessar backend;
4. verificar se existe decisão superveniente;
5. somente então classificar o comportamento como defeito, dívida, diferença deliberada ou regra correta.

**Proibido:** criar nova regra funcional apenas porque ela parece ausente no primeiro módulo encontrado.

## 1. Baseline desta reconstrução

Esta versão foi reconstruída source-first, confrontando documentação, código e ambientes efetivos.

### Código e deployment

- `main` verificada em `cafef971b902fd206ce26208445e27aeacbc9a0f`;
- Vercel Production verificada como `READY` no mesmo SHA;
- deployment observado: `dpl_DWSLXhgTktiphBs7CMbk18wM2UCL`.

### Supabase Production

Projeto verificado: `scnryinorqeucbfkioxo`.

Foram conferidos diretamente:

- tabelas públicas;
- colunas das entidades operacionais centrais;
- RPCs/funções;
- políticas RLS;
- triggers de integridade e auditoria.

O schema remoto confirma, entre outras, as entidades `schools`, `school_programs`, `verifications`, `pendencies`, `pendency_attempts`, `pendency_contacts`, `registered_invoices`, `assets`, `controllers`, `inventory_team_members`, `user_profiles`, `user_school_scopes`, `programs`, `competences`, `app_config`, `administrative_logs` e `audit_events`.

**Importante:** SHA, deployment, contagens e estado remoto são voláteis. Revalidar ao vivo antes de depender deles. O que este documento torna estável é o **modelo de produto e suas autoridades**, não um snapshot eterno do ambiente.

## 2. O que é o RADAR PDDE

O RADAR PDDE é um sistema institucional de gestão, controle, acompanhamento e apoio à decisão do PDDE no âmbito da 4ª CRE/SME-Rio.

Ele organiza um mesmo universo de fatos em superfícies diferentes para que o usuário consiga saber:

- qual é o estado da escola, competência e programa;
- o que foi entregue;
- o que foi analisado;
- o que está incorreto ou pendente;
- quem deve agir;
- qual é a próxima ação;
- quais despesas e notas existem;
- quais efeitos patrimoniais foram gerados;
- como a regularização evoluiu;
- como a decisão foi auditada;
- como a informação chega a relatórios e exportações.

Nenhuma tela cria uma fonte de verdade própria. Dashboard, Carteira, Competências, Prontuário, Pendências, Inventário, Timeline, Registros Internos, alertas, busca e exportações são **projeções do mesmo domínio**.

## 3. Precedência de autoridade

Quando houver conflito, usar nesta ordem:

1. código do SHA efetivamente analisado;
2. Supabase/Auth/RLS/RPCs/Edge Functions e dados efetivos;
3. artefato Vercel correspondente ao ambiente analisado;
4. decisões funcionais vigentes e ADRs supervenientes;
5. testes atuais que representam o contrato vigente;
6. este modelo e demais documentos canônicos;
7. auditorias, evidências, planos, handoffs e memória de conversa históricos.

Teste antigo, plano antigo ou documentação antiga não pode obrigar regressão de código correto.

## 4. Perfis e capacidades

### 4.1 Controlador

Responsável principal por uma carteira de escolas, sem que a carteira seja fronteira rígida de segurança entre Controladores da mesma CRE.

Pode, dentro do escopo autorizado:

- consultar Dashboard, Carteira, Competências, Prontuário, Pendências e Inventário;
- lançar bonificação e análise técnica;
- cadastrar/editar despesas e Notas Fiscais;
- abrir, acompanhar, registrar envio, reanalisar, cancelar e reabrir Pendências;
- registrar contatos/cobranças;
- cadastrar/editar bens nos limites permitidos;
- colaborar em escola de colega da mesma CRE sem transferir a responsabilidade principal.

Não pode:

- redistribuir `controller_id` pela edição comum da escola;
- alterar identidade institucional reservada;
- administrar contas/equipe como função cotidiana;
- agir fora da CRE sem escopo explícito.

### 4.2 Assistente de Verbas Federais

Perfil operacional transversal da CRE.

Além das capacidades operacionais, pode:

- cadastrar escola institucionalmente válida;
- redistribuir carteira individualmente e em lote;
- cadastrar, editar e desativar Controladores e integrantes de Inventário;
- administrar as contas Auth correspondentes pelo backend protegido;
- executar retificações autorizadas;
- atuar transversalmente nas escolas da CRE.

### 4.3 Gestão SME

Perfil gerencial.

Pode:

- consultar dados institucionais e gerenciais;
- consultar Pendências sem mutação operacional;
- acessar configurações globais autorizadas;
- criar exercícios/competências e manter calendário quando permitido;
- cadastrar/editar/desativar programas conforme contrato atual.

Não recebe, como regra, mutações operacionais de Pendências nem análise técnica editável nas superfícies restritas.

### 4.4 Equipe de Inventário

Perfil patrimonial da própria CRE.

Pode:

- consultar escolas, programas e bens necessários ao trabalho patrimonial;
- operar as mutações patrimoniais autorizadas;
- concluir inventariação e registrar responsável.

Não ganha por isso capacidade de alterar bonificação, análise documental, cadastro escolar, contatos ou configurações.

### 4.5 Administrador técnico

`technical_admin` é papel autenticado técnico, não um quinto perfil funcional cotidiano.

Pode atuar sobre infraestrutura, perfis, escopos, importação, auditoria e operações técnicas autorizadas. A simulação visual de Controlador, Assistente, SME ou Inventário **não troca o JWT nem reduz a autoridade real**.

### 4.6 Anônimo

Não acessa dados institucionais.

## 5. Superfícies e finalidade

| ID | Superfície | Finalidade principal |
|---|---|---|
| S-01 | Dashboard | sintetizar estado, prioridade, indicadores e próximos passos |
| S-02 | Carteira | localizar, comparar e abrir escolas |
| S-03 | Competências | acompanhar o ciclo mensal de bonificação, análise e regularização |
| S-04 | Pendências | operar e acompanhar o passivo documental transversal |
| S-05 | Prontuário | concentrar o contexto completo da unidade escolar |
| S-06 | Capital e Inventário | controlar bens permanentes, encaminhamento e inventariação |
| S-07 | Registros Internos | consultar trilha administrativa autorizada |
| S-08 | Configurações SME | manter exercício, competências, prazos, programas e configuração global |
| S-09 | Gestão de Equipe | administrar Controladores, Inventário, contas e carteiras |
| S-10 | Exercícios | criar/selecionar contexto anual coerente com as competências |
| S-11 | Programas | manter catálogo global e vigência dos programas |
| S-12 | Alertas | apontar itens que exigem atenção e levar ao contexto correto |
| S-13 | Busca global | localizar recursos autorizados e navegar para a superfície adequada |
| S-14 | Exportações | gerar relatórios institucionais, SME e Pendências com auditoria |
| S-15 | Autenticação | estabelecer sessão, perfil efetivo, escopos e bloqueio anônimo |
| S-16 | Modais/confirmações | editar ou confirmar ação contextual sem perder foco e contexto |
| S-17 | Formulários | editar estado de negócio com validação, persistência e releitura |
| S-18 | Loading/vazio/erro | explicar estado e permitir recuperação segura |
| S-19 | Monitoramento Production | detectar problemas do ambiente publicado sem substituir validação funcional |

### Rotas principais

- Dashboard: `dashboard`;
- Carteira: `escolas`;
- Competências: `competencias`;
- Pendências: `pendencias`;
- Prontuário: `prontuario` + escola;
- Inventário: `inventario`;
- Registros Internos: `auditoria`;
- Configurações SME: `sme-config`;
- Gestão de Equipe: `equipe`.

## 6. Mapa de entidades

```text
app_config
├─ competences
└─ configuração global

programs
└─ school_programs ── schools ── controllers
                         │
                         ├─ verifications  [school + competence + program]
                         │    ├─ bonification
                         │    ├─ analysis
                         │    └─ bonus_result
                         │
                         ├─ registered_invoices
                         │    ├─ verification_id
                         │    ├─ program_id
                         │    ├─ registered_invoice_id = identidade da própria linha
                         │    └─ linked_asset_id ── assets
                         │
                         ├─ pendencies
                         │    ├─ competence_origin
                         │    ├─ program_id
                         │    ├─ document_key
                         │    └─ registered_invoice_id opcional quando a pendência é individual
                         │          ├─ pendency_attempts
                         │          └─ pendency_contacts
                         │
                         └─ administrative_logs

Auth user
└─ user_profiles
   ├─ controller_id
   ├─ inventory_member_id
   ├─ cre_scope
   └─ user_school_scopes
```

`audit_events` é trilha técnica; `administrative_logs` é histórico funcional/administrativo.

## 7. Contextos estruturantes

### 7.1 Avaliação mensal

Identidade lógica:

```text
school + competence + program
```

É representada em `verifications`.

### 7.2 Nota Fiscal / despesa

Cada linha em `registered_invoices` tem identidade própria. Para análise documental individual e Pendência fiscal, a identidade canônica é o `registered_invoice_id`.

### 7.3 Pendência documental genérica

Contexto canônico:

```text
school + competence_origin + program + document
```

Quando o documento é uma NF ou dimensão individual de NF, acrescenta-se:

```text
+ registered_invoice_id
```

### 7.4 Competência global

`RadarCompetenceContext` é a autoridade do mês ativo.

A competência é usada por Dashboard, Carteira, Competências, Prontuário, timeline, alertas e exportações conforme a superfície.

**Exceção deliberada:** Pendências é passivo transversal e abre em **Todas as competências**. A competência global continua visível, mas não filtra silenciosamente a fila.

## 8. Fato compartilhado não significa apresentação idêntica

Esta é uma regra central do produto.

Duas telas podem mostrar o mesmo fato sob projeções diferentes, desde que a diferença seja intencional e documentada.

### 8.1 Antiguidade de Pendência

- **Página completa de Pendências:** mede a antiguidade histórica total desde `dataAbertura` e usa esse critério para acompanhamento/filtros/ordenação da Pendência aberta.
- **Dashboard/Carteira:** podem medir o tempo da **ação operacional corrente**, isto é, desde quando a providência atual voltou para a escola ou ficou aguardando reanálise.

Essas métricas não devem ser unificadas.

### 8.2 Nota Fiscal

- bonificação de `notaFiscal`: agregada no contexto mensal;
- análise técnica: individual por NF;
- resumo técnico mensal: derivado das análises individuais.

### 8.3 Consulta Assessoria

Cada NF de serviço possui estado individual. O resumo mensal é derivado do conjunto das NFs de serviço do contexto.

### 8.4 Ordem dos programas

`PDDE Básico` pode aparecer primeiro na interface de avaliação, sem reordenar a persistência de `programasIds`.

### 8.5 Timeline

É projeção de leitura. Não cria tabela nem grava evento derivado.

### 8.6 Gestão SME

A SME observa o mesmo universo de fatos, mas a interface omite detalhe técnico não autorizado. Ocultar não significa possuir uma fonte paralela.

## 9. Fluxos ponta a ponta

## 9.1 Login e abertura do produto

```text
usuário entra
→ Supabase Auth valida sessão
→ user_profiles/profiles/escopos definem autoridade
→ RLS permanece como segunda barreira
→ dados autorizados são carregados
→ competência/contexto são aplicados
→ rota pendente é resolvida
→ interface é renderizada
```

Autoridades principais:

- `RadarSessionService` / bootstrap Auth;
- Supabase Auth;
- `user_profiles`, `profiles`, `user_school_scopes`;
- RLS;
- navegação canônica e contexto global.

## 9.2 Alterar bonificação ou análise mensal

```text
controle visível
→ VerificationService
→ regra de competência/perfil/estado consolidado
→ alteração da verification
→ saveVerificationWithLog
→ RPC save_verification_with_log
→ retorno autoritativo
→ estado local
→ tela
→ refresh/releitura
```

Bonificação, análise e Pendência são dimensões independentes. Uma não deve ser inferida automaticamente da outra fora das regras expressas.

## 9.3 Cadastrar/editar Nota Fiscal ou despesa identificada

```text
formulário NF
→ InvoiceService.save
→ valida contexto, tipo, valor, programa e estado mensal
→ invoice-effects planeja efeitos
→ DataService/Repository
→ saveInvoiceWithEffects
→ RPC canônica (v2 quando a intenção idempotente é usada)
→ registered_invoices
→ assets/verifications/log conforme efeitos
→ retorno autoritativo
→ incorporação/reconciliação local
→ tela
→ refresh/releitura
```

Efeitos por tipo:

- `consumo`: sem patrimônio;
- `permanente`: gera/mantém bem vinculado;
- `servico`: participa da dimensão Consulta Assessoria;
- `boleto_internet`: tipo de gasto de NF, somente Educação Conectada;
- `a_identificar`: não usa o fluxo comum de uma despesa identificada.

## 9.4 Criar `a_identificar`

```text
usuário registra despesa ainda não identificada
→ InvoiceService
→ operação atômica específica
→ registered_invoice + análise Incorreto + Pendência individual
→ save_unidentified_expense_with_pendency
→ retorno autoritativo
→ Prontuário mostra estado e ação de Pendência
```

Regra inegociável: **novo `a_identificar` nasce `Incorreto + Pendência` na mesma operação**.

O editor comum não transforma despesa identificada em `a_identificar`.

## 9.5 Identificar posteriormente um `a_identificar`

Ocorre em **Pendências → Registrar novo envio**.

```text
Pendência Aberta
→ Registrar novo envio
→ informar identificação/documento
→ preservar registered_invoice_id
→ atualizar a despesa
→ criar efeito de serviço ou patrimônio se necessário
→ criar tentativa
→ Pendência = Aguardando reanálise
→ análise da NF = Não analisado
→ persistir atomicamente
→ reler
```

Apresentar o documento não resolve a Pendência.

## 9.6 Análise individual de NF e abertura de Pendência

```text
NF sem análise
→ usuário escolhe situação
→ se Correto/Correto (Atrasado), grava análise individual
→ se Incorreto, fluxo atômico abre Pendência vinculada à mesma NF
→ resumo mensal de notaFiscal é recalculado
```

Precedência do resumo técnico:

```text
Incorreto
> Não analisado
> Correto (Atrasado)
> Correto
```

Uma NF com Pendência ativa não pode ser estruturalmente editada pelo fluxo comum.

## 9.7 Consulta Assessoria

Somente NF de `servico` participa.

Autoridades distintas e deliberadas:

- edição ordinária: `InvoiceService.updateServiceAdvisory`;
- abertura `Incorreto + Pendência` e reanálise: `service-advisory-pendency.js`;
- novo envio corretivo: `service-advisory-corrective-submission.js`;
- persistência: RPC específica da operação.

Fluxo:

```text
NF de serviço
→ registrar se consulta foi enviada
→ analisar consulta individualmente
→ Incorreto exige Pendência atômica da mesma NF
→ novo envio ocorre em Pendências
→ reanálise decide se resolve ou volta à escola
→ resumo mensal é derivado das NFs de serviço
```

Resumo mensal:

- `Sim`: ao menos uma consulta exigível foi enviada;
- `Não`: existem NFs de serviço e nenhuma foi enviada;
- `Não se aplica`: não existe NF de serviço.

Pendência da NF A nunca bloqueia a NF B.

## 9.8 Ciclo genérico de Pendência

Estados canônicos:

```text
Aberta
Aguardando reanálise
Resolvida
Cancelada
```

Transições:

```text
abertura
→ Aberta / próximo ator = Escola

novo envio corretivo
→ Aguardando reanálise / próximo ator = Controlador

reanálise correta
→ Resolvida

reanálise incorreta
→ Aberta / próximo ator = Escola

arquivo indisponível
→ Aberta / próximo ator = Escola

cancelamento autorizado
→ Cancelada

reabertura de Resolvida/Cancelada
→ Aberta / próximo ator = Escola
```

Regras:

- Aberta e Aguardando são estados ativos;
- novo envio nunca resolve;
- reanálise exige a tentativa real mais recente ainda não analisada;
- reanálise valida escola, competência, programa, documento e, quando aplicável, `registered_invoice_id`;
- histórico e tentativas são preservados;
- `dataAbertura` não é reescrita quando a ação volta à escola.

## 9.9 Capital e Inventário

Estados operacionais centrais:

```text
Não encaminhada
→ Encaminhada
→ Inventariada
```

`Inventariada` é terminal no fluxo ordinário.

Proteções atuais:

- `InventoryService.forward()` rejeita reencaminhamento indevido;
- trigger `assets_protect_inventoried_terminal_state` impede rebaixamento de status;
- edição posterior da NF vinculada deve preservar status, processo e metadados da inventariação.

Nota permanente e bem derivado devem permanecer coerentes no mesmo contexto.

`encampInventario` é derivado do conjunto de bens permanentes vinculados:

- nenhum permanente: `Não se aplica`;
- algum ainda não encaminhado: `Não`;
- todos Encaminhada/Inventariada: `Sim`.

## 9.10 Excluir Nota Fiscal

A exclusão comum só é permitida quando não existe histórico individual de Pendência que precise ser preservado.

```text
usuário exclui NF elegível
→ InvoiceService.remove
→ proteção histórica
→ deleteInvoiceWithEffects
→ remoção/ajuste do bem vinculado quando aplicável
→ recálculo das projeções da verification
→ log
→ retorno autoritativo
→ tela/releitura
```

NF com histórico protegido não pode desaparecer apagando a trilha documental.

## 9.11 Retificação

```text
contexto consolidado
→ Assistente informa justificativa
→ compara antes/depois
→ altera somente campos autorizados
→ registra autoria e diferença
→ preserva histórico
```

Retificação de bonificação não resolve, cancela ou reabre Pendência automaticamente e não altera análise técnica por associação implícita.

## 9.12 Gestão de Equipe

```text
interface
→ DirectoryService
→ TeamAccountGateway
→ Edge Function team-account-management
→ Auth Admin + RPC transacional
→ banco/Auth
→ compensação ou reconciliação em falha parcial
→ retorno
→ releitura
```

Desativar Controlador exige carteira vazia ou redistribuição conforme fluxo autorizado. Não se bloqueia/desfaz Auth a partir de uma suposição quando a resposta do banco é ambígua.

## 9.13 Navegação contextual

`RadarNavigationHistory` mantém a rota canônica. `RadarNavigationContext` preserva retorno, competência, scroll e foco para superfícies de aprofundamento.

Prontuário e Pendências podem restaurar a origem operacional; uma rota direta sem origem usa fallback seguro.

## 9.14 Exportações

Exportação não é fonte de verdade.

Ela usa dados autorizados em memória, filtros/contexto vigentes e exige auditoria administrativa do download conforme o fluxo correspondente.

Principais produtos:

- relatório institucional;
- Excel SME mensal de 27 colunas A:AA;
- XLSX de Pendências com `RESUMO` e `PENDÊNCIAS`.

## 10. Autoridades atuais por domínio

| Domínio/operação | Autoridade funcional principal | Persistência/backend |
|---|---|---|
| sessão/autorização | Session/Auth bootstrap + Access Policy | Supabase Auth + RLS |
| competência global | `RadarCompetenceContext` | `competences` / `app_config` |
| bonificação/análise/consolidação | `VerificationService` + domínio operacional | `save_verification_with_log` |
| escola/carteira | `SchoolService` | `save_school_with_programs`, `assign_controller_with_log` |
| Pendência genérica | `pendencias.js` + `PendencyService` | `save_pendency_command`, `reanalyze_pendency_with_verification` |
| NF/despesa | `InvoiceService` + `invoice-effects.js` + análise individual | `save_invoice_with_effects_v2`, `delete_invoice_with_effects` |
| NF incorreta/Pendência individual | `InvoiceService` + integração atômica | `save_invoice_document_with_pendency` |
| novo envio NF | `PendencyService`/integração individual | `register_invoice_document_attempt` |
| reanálise NF | `PendencyService`/integração individual | `reanalyze_invoice_document_pendency` |
| Assessoria ordinária | `InvoiceService.updateServiceAdvisory` | `save_invoice_with_effects`/RPC aplicável |
| Assessoria Incorreto/reanálise | `service-advisory-pendency.js` | RPCs de Pendência da Assessoria |
| novo envio Assessoria | `service-advisory-corrective-submission.js` | `register_service_advisory_attempt` |
| patrimônio | `InventoryService` | `save_asset_with_log`, `save_asset_with_verification_and_log` |
| equipe/Auth | `DirectoryService` + TeamAccountGateway | Edge Function + RPCs de equipe |
| configurações | `ConfigurationService` | RPCs de calendário/exercício/programa |
| timeline | `RadarSchoolTimeline` | somente leitura |
| navegação | `RadarNavigationHistory` + `RadarNavigationContext` | sessionStorage para retorno contextual |
| performance | diagnóstico/medição apenas | **não é autoridade de negócio** |

## 11. Bootstrap e composição

A aplicação ainda possui módulos carregados em fases diferentes. A ordem é parte do contrato quando uma extensão depende de outra.

No baseline desta reconstrução:

- `app.js` é o núcleo;
- integrações de navegação/Auth carregam depois;
- `product-extensions-bootstrap.js` instala extensões de produto;
- `atomic-analysis-pendency.js` continua na frente da cadeia crítica;
- `service-advisory-pendency.js` e `service-advisory-corrective-submission.js` mantêm autoridades diferentes;
- `critical-action-guard.js` integra a cadeia crítica;
- `operational-write-performance.js` atualmente envolve somente medição/tracing da persistência e **não decide consistência funcional**.

Qualquer auditoria que descreva o wrapper de performance como autoridade atual de consistência está usando documentação anterior ao PR #282.

O PR #284 permanece assunto de `CURRENT_STAGE.md`; não é baseline funcional até integração aprovada.

## 12. Decisões substituídas ou refinadas

### Production em LocalStorage

Superada. Supabase é a persistência canônica de Production.

### `boletoInternet` como documento autônomo

Superada. `boleto_internet` é tipo de gasto dentro de Notas Fiscais, exclusivo de Educação Conectada.

### NF com análise/Pendência agregada única

Superada pelo contrato individual do PR #211 / ADR-050. Bonificação permanece agregada, análise e Pendência são individuais.

### `a_identificar` sem estado técnico automático

Superada para novos registros. Novo `a_identificar` nasce `Incorreto + Pendência`. Registros históricos legítimos continuam preservados sem backfill inventado.

### Somente Controlador reanalisar

Superada. Controlador, Assistente e `technical_admin` podem reanalisar; SME e Inventário não.

### Competência global filtrando Pendências automaticamente

Superada/refinada pela ADR-044. Pendências é transversal.

### Performance como autoridade de consistência

Superada pelo PR #282. Performance é observação/diagnóstico.

### `Inventariada` passível de rebaixamento por resalvamento

Superada pelo PR #265. `Inventariada` é terminal.

### Repetir escrita remota após resposta perdida para recuperar UI

Superada pelos guardrails posteriores. Commit remoto confirmado e reconciliação local são fronteiras diferentes.

## 13. Invariantes que não podem regredir

1. Supabase é a fonte canônica de persistência em Production.
2. Production e operações críticas são fail-closed quando a segurança/integridade exigir.
3. `RadarCompetenceContext` é a autoridade do mês global.
4. Pendências é transversal entre competências por padrão.
5. Bonificação, análise técnica e Pendência são dimensões independentes.
6. Página de Pendências usa antiguidade histórica; Dashboard/Carteira podem usar tempo da ação corrente.
7. NF possui análise e Pendência individuais por `registered_invoice_id`.
8. Bonificação de NF permanece agregada.
9. Resumo técnico de NF é derivado, não uma segunda análise compartilhada.
10. `a_identificar` novo nasce `Incorreto + Pendência` atomicamente.
11. Legados legítimos não recebem associação, análise ou Pendência fabricadas.
12. `boleto_internet` não volta a ser documento autônomo.
13. Consulta Assessoria é individual por NF de serviço.
14. Pendência da NF A nunca bloqueia a NF B.
15. Novo envio não resolve Pendência.
16. Reanálise exige tentativa/contexto/versionamento válidos.
17. Histórico documental não é apagado para simplificar estado atual.
18. `Inventariada` é terminal.
19. NF permanente e bem vinculado mantêm coerência transacional.
20. Controlador não redistribui `controller_id` por edição comum.
21. Identidade institucional da escola não é sintetizada.
22. `technical_admin` não perde autoridade real ao simular perfil visual.
23. Timeline é projeção e não fonte de verdade.
24. Exportação não altera dados de negócio e preserva auditoria exigida.
25. Commit remoto confirmado não deve ser repetido apenas para recuperar estado local.
26. Wrapper de performance não pode decidir regra funcional.
27. Layout aprovado de Prontuário/Pendências não deve ser redesenhado por plano histórico.
28. Comunicação externa gerada não expõe o nome interno `RADAR PDDE`.
29. Nenhuma mudança que afete o usuário é concluída sem o gate de frontend real.

## 14. Jornadas concretas de referência

### J1 — NF de consumo correta

```text
Controlador abre Carteira
→ escola
→ Prontuário
→ competência/programa
→ Notas Fiscais
→ cadastra NF de consumo
→ salva
→ NF persiste
→ análise individual começa em estado aplicável do fluxo
→ nenhum bem é criado
→ refresh mantém a NF
```

### J2 — NF permanente

```text
cadastrar NF permanente
→ salvar
→ registered_invoice persiste
→ asset vinculado é criado/mantido
→ bloco Capital/Inventário reflete o bem
→ encaminhar para inventariação
→ Inventário conclui
→ status = Inventariada
→ editar a NF depois
→ bem continua Inventariada
→ refresh preserva tudo
```

### J3 — NF incorreta

```text
analisar NF específica como Incorreto
→ modal/fluxo de Pendência
→ salvar atomicamente
→ NF = Incorreto
→ Pendência daquela NF = Aberta
→ Prontuário mostra Visualizar pendência
→ novo envio e reanálise não aparecem como ações do Prontuário
```

### J4 — Regularização da NF

```text
Pendências
→ abrir a Pendência da NF
→ Registrar novo envio
→ tentativa criada
→ Pendência = Aguardando reanálise
→ refresh
→ Reanalisar
→ Correto
→ Pendência = Resolvida
→ NF e resumo mensal convergem
```

### J5 — `a_identificar`

```text
registrar despesa não identificada
→ criação atômica Incorreto + Pendência
→ depois, em Pendências, Registrar novo envio
→ identificar como serviço ou permanente
→ preservar ID
→ gerar efeitos correspondentes
→ Aguardando reanálise
→ reanalisar
```

### J6 — Consulta Assessoria

```text
NF de serviço
→ marcar consulta enviada
→ analisar
→ se Incorreto, criar Pendência da mesma NF
→ Pendências registra novo envio
→ reanálise
→ resultado individual converge
→ resumo mensal é recalculado
```

### J7 — Pendência reaberta

```text
Pendência antiga Resolvida
→ reabrir com justificativa
→ volta a Aberta
→ página de Pendências continua mostrando antiguidade desde a abertura original
→ Dashboard/Carteira podem mostrar tempo desde a reabertura como ação corrente
```

### J8 — Redistribuição de carteira

```text
Assistente abre Gestão de Equipe/Carteira
→ escolhe escola e novo Controlador
→ operação autorizada
→ assign_controller_with_log
→ autoria registrada
→ refresh
→ nova carteira aparece
→ Controlador não consegue produzir a mesma mudança pelo editor comum da escola
```

## 15. Regra obrigatória para qualquer análise funcional futura

Toda análise funcional deve começar por uma tabela mental, nota de trabalho ou comentário equivalente com:

```text
superfície afetada
→ fato de negócio
→ entidade canônica
→ autoridade de domínio/aplicação
→ persistência/backend
→ projeções relacionadas
→ diferenças deliberadas entre superfícies
→ invariantes
→ decisão vigente
→ jornada real do usuário
```

Se não for possível preencher essa cadeia, ainda não há contexto suficiente para alterar o produto.

## 16. Governança documental para não repetir a fragmentação

1. `AGENTS.md` é o roteador obrigatório, não depósito de histórico volátil.
2. Este arquivo é o modelo integrado do produto.
3. `CURRENT_STAGE.md` contém somente estado mutável, prioridade e trabalho em andamento.
4. `STATUS_DOCUMENTOS.md` classifica validade documental.
5. `ENGINEERING_METHOD.md` define método.
6. `FRONTEND_USER_VALIDATION_GATE.md` define o gate de aceitação pela interface real.
7. ADR registra decisão durável/especializada.
8. Handoff, plano, auditoria e evidência não redefinem automaticamente o presente.
9. Todo novo documento classificado como canônico deve atualizar, na mesma entrega, a rota de leitura em `AGENTS.md`, `docs/README.md` e `STATUS_DOCUMENTOS.md`.
10. Documento que muda uma regra deste modelo deve atualizar este modelo na mesma entrega.
11. Documento histórico não deve ser reescrito para parecer atual; deve ser reclassificado ou apontado por uma fonte canônica posterior.

O objetivo é simples: **não criar mais documentação que precise ser descoberta por acaso**.