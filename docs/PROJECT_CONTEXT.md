# RADAR PDDE 2026 — Contexto funcional e arquitetural

**Atualizado em:** 3 de setembro de 2026
**Classe documental:** Canônico

## 1. Finalidade

O RADAR PDDE organiza o ciclo de entrega, análise, acompanhamento, regularização, consolidação, inventário, histórico e apoio à decisão dos programas do PDDE no âmbito da 4ª CRE/SME-Rio.

O sistema deve permitir que cada usuário compreenda:

1. o estado atual da unidade, competência e programa;
2. o que exige atenção;
3. quem deve agir;
4. qual é a próxima ação;
5. onde realizar essa ação;
6. como o histórico foi formado;
7. qual competência e programa sustentam a informação;
8. como a informação chega aos relatórios institucionais.

Dashboard, Carteira, Competências, Prontuário, Pendências, Inventário, Registros Internos, timeline e exportações representam o mesmo universo de dados. Nenhuma superfície cria fonte de verdade independente.

## 2. Baseline operacional

O baseline mutável corrente fica em [`CURRENT_STAGE.md`](CURRENT_STAGE.md).

A porta de entrada canônica é [`handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md`](handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md), que reconcilia o plano mestre de 26/08 com o código, Supabase Production e Vercel Production atuais.

O hotfix de Notas Fiscais permanece documentado em [`superpowers/plans/2026-08-28-hotfix-individualizacao-notas-fiscais.md`](superpowers/plans/2026-08-28-hotfix-individualizacao-notas-fiscais.md) e [`handoff/2026-08-30-pr211-publicacao-concluida.md`](handoff/2026-08-30-pr211-publicacao-concluida.md), agora como histórico técnico protegido pelas decisões posteriores.

O checkpoint pós-PR #200 em [`handoff/2026-08-26-retomada-plano-mestre-pos-pr200.md`](handoff/2026-08-26-retomada-plano-mestre-pos-pr200.md) permanece histórico/canônico para contexto, mas não controla mais a ordem corrente de execução.

O checkpoint pós-PR #193 permanece como histórico técnico da estabilização anterior em [`handoff/2026-08-23-post-pr-193.md`](handoff/2026-08-23-post-pr-193.md).

O snapshot de encerramento de 18/08/2026 permanece histórico em [`handoff/2026-08-18-encerramento-operacional.md`](handoff/2026-08-18-encerramento-operacional.md).

Este documento descreve contratos estáveis e não deve ser usado para presumir SHA, deployment, contagem de migrations ou versão de Edge Function sem nova consulta ao remoto.

## 3. Regra de precedência

1. código-fonte remoto vigente;
2. Supabase efetivo, incluindo schema, migrations, Auth, RLS, funções e dados;
3. artefato implantado na Vercel e seu SHA;
4. decisões funcionais vigentes;
5. testes/evidências reproduzíveis que representem o contrato atual;
6. documentação canônica;
7. documentos históricos e auditorias.

Memória de chat, planos e auditorias anteriores não substituem verificação operacional. Auditoria externa é evidência técnica, não autoridade de produto.

## 4. Perfis funcionais

### Controlador

Possui carteira de responsabilidade principal e pode colaborar nas escolas da própria CRE. A atuação fora da carteira não transfere `schools.controller_id`, preserva autoria e não concede acesso a outra CRE.

Pode editar dados cadastrais autorizados, mas não redistribuir carteira nem alterar a identidade institucional da escola fora das capacidades previstas.

### Assistente de Verbas Federais

Lidera operacionalmente a GAD/CRE, acompanha escolas, administra Controladores e Inventário, distribui carteiras, executa ações transversais autorizadas e consolida relatórios.

### Gestão SME

Realiza acompanhamento gerencial. Consulta identificação e bonificação, não recebe análise técnica editável nas superfícies restritas nem mutações operacionais de Pendências.

Capacidades administrativas específicas, inclusive de programas, devem ser confirmadas no código e nas permissões atuais antes de qualquer ampliação ou retirada futura.

### Equipe de Inventário

Executa o fluxo patrimonial autorizado dentro do escopo da CRE.

### Administrador técnico

`technical_admin` atua em segurança, infraestrutura, perfis, escopos, importações e auditoria. A simulação visual não altera JWT nem substitui contas operacionais reais.

## 5. Superfícies

O produto contém, conforme o perfil:

- Dashboard;
- Carteira;
- Competências;
- Pendências;
- Prontuário e timeline;
- Gestão de Equipe;
- Capital e Inventário;
- Registros Internos;
- configurações SME;
- alertas, busca, modais e exportações.

Toda alteração deve considerar competência, exercício, Controlador, CRE, escola, programa, documento, situação, autoria e perfil efetivo.

## 6. Competência transversal e exceção de Pendências

A competência canônica usa `YYYY-MM` e é gerida por `RadarCompetenceContext`.

Ela é contexto global persistente para Dashboard, Carteira, Competências, Prontuário, alertas, timeline e exportações conforme a regra da superfície.

### Exceção deliberada: Pendências Operacionais

Pendências representam passivo histórico e não podem desaparecer apenas porque o usuário selecionou a competência corrente.

Por isso:

- a competência global continua visível na página;
- a página abre em **Todas as competências**;
- a competência global não é aplicada automaticamente como filtro da lista;
- o filtro local de competência é opcional;
- ao navegar de uma pendência para o Prontuário, a competência de origem da pendência volta a ser aplicada ao contexto mensal.

Ver [`decisions/ADR-044-pendencias-passivo-transversal.md`](decisions/ADR-044-pendencias-passivo-transversal.md).

Competência existente, disponível e formalmente fechada são conceitos distintos.

## 7. Avaliação mensal

Identidade:

```text
escola + competência + programa
```

A projeção canônica reúne consolidação, resultado, campos ausentes, bonificação, análise técnica, conclusão e pendências.

Regras vigentes:

- competências futuras podem ser vistas, mas não editadas;
- após consolidação do prazo/bonificação, documento entregue fora do período não recebe `Correto` como situação regular;
- quando tecnicamente correto e entregue após o prazo, usa-se `Correto (Atrasado)`;
- bonificação, análise técnica e pendência permanecem dimensões diferentes;
- `bonus_result` ausente significa preservar o valor existente; limpeza explicitamente solicitada é semanticamente diferente de campo ausente;
- N/A → Sim/Não reinicializa derivações incompatíveis, incluindo análise técnica de NF para `Não analisado` quando aplicável;
- operação semanticamente idêntica ao estado atual é idempotente e não deve produzir nova persistência, novo `row_version` ou novo log apenas por repetição do comando.

O diagnóstico de 24/08 identificou que esse último contrato ainda não está integralmente satisfeito em `invoice:save`: a edição alcança update/log sem um planejador semântico completo e a inclusão não possui chave idempotente de servidor. Tratar como lacuna conhecida do fluxo INV-01, não como autorização para alterar a regra.

### Decisões supervenientes de 01–03/09

- **Declaração BB Ágil:** aceita `Não se aplica` quando cabível. Nesse estado, a análise técnica fica neutra como `Correto`; sair de N/A reinicia para `Não analisado`; Pendência ativa precisa ser resolvida ou cancelada antes de marcar N/A.
- **Comunicação externa:** `RADAR PDDE` é o nome do sistema interno e não integra e-mail, WhatsApp, ofício ou texto oficial gerado para unidade escolar. A cobrança automática termina somente em `Atenciosamente`.
- **Exportação de Pendências:** a tela possui relatório XLSX próprio, com `RESUMO` e `PENDÊNCIAS`, respeitando busca/filtros e sem expor identificadores técnicos.
- **Ordem dos programas na avaliação:** `PDDE Básico` aparece primeiro somente na apresentação. A ordem persistida de `programasIds` não é alterada e os demais programas mantêm sua ordem relativa.
- **Dependências:** decisões de versão e rejeições homologadas ficam em `handoff/2026-09-02-dependency-governance.md`; atualização automática não prevalece sobre RLS, pgTAP, Node 24 ou testes funcionais.
### Notas Fiscais — granularidade individual

`notaFiscal` continua sendo a dimensão documental agregada para bonificação, mas cada registro em `registered_invoices` é uma unidade técnica individual.

Contrato integrado e publicado pelo PR #211:

- bonificação de `notaFiscal` permanece agregada em Sim/Não/N/A;
- análise técnica existe por `registered_invoice_id`;
- o resumo `verification.analysis.notaFiscal` é projeção derivada, não campo técnico editável do conjunto;
- precedência do resumo: Incorreto → Não analisado → Correto (Atrasado) → Correto;
- Pendência individual de Notas Fiscais usa `registered_invoice_id`;
- NFs distintas podem ter Pendências ativas simultâneas;
- a mesma NF não pode duplicar Pendência ativa equivalente;
- `boleto_internet` é somente tipo de gasto de Notas Fiscais;
- `boletoInternet` não pode reaparecer como documento;
- `a_identificar` nasce `Incorreto + Pendência` de forma atômica;
- uma despesa identificada não pode virar `a_identificar` pelo editor comum;
- identificação posterior de `a_identificar` ocorre em **Pendências → Registrar novo envio** e preserva o mesmo ID;
- o novo envio leva a Pendência para `Aguardando reanálise` e a despesa identificada para `Não analisado`;
- se a identificação revelar serviço, Consulta Assessoria surge na dimensão própria;
- se revelar bem permanente, o registro patrimonial é criado e vinculado na mesma operação;
- nova Pendência de `notaFiscal` sem `registered_invoice_id` é proibida;
- com Pendência fiscal ativa, a edição estrutural comum daquela despesa fica bloqueada;
- reanálise exige tentativa válida da mesma Pendência, no mesmo contexto.

Transição de dados aprovada em 29/08:

- 16 `a_identificar` legítimos anteriores ao contrato individual permanecem como **Registro legado**, sem análise/Pendência retroativa e sem edição/exclusão pelo fluxo comum;
- 4 `a_identificar` e outras 8 despesas/NFs de teste, mais três Pendências fiscais genéricas dos mesmos cenários, foram removidas pela limpeza fail-closed comprovada por autoria;
- Boleto 1234 e sua Pendência são fixtures e não recebem o reparo de vínculo proposto inicialmente;
- a Pendência fiscal agregada real preservada continua acessível como legado, sem associação heurística a uma NF.

Essa regra específica substitui a antiga interpretação segundo a qual `A identificar` não deveria receber estado técnico automaticamente. O que continua proibido é fabricar **bonificação** ou atribuir retrospectivamente um erro agregado antigo a uma NF específica sem evidência.

**Decisão integral:** `docs/decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md`.

**Sequência de segurança deliberada:** a auditoria pós-publicação encontrou uma lacuna residual de proteção contra escrita direta em `registered_invoices` para `id`, `verification_id` e `source_context_key`, sem evidência de corrupção atual. Por decisão explícita do responsável pelo produto, o hardening correspondente foi adiado até a conclusão e validação de todas as implementações dos planos de correção funcional. Ver ADR-051. Essa frente não é gate do PR #211 nem da sequência funcional atual.

### Fechamento visual do hotfix

A reconferência visual final do PR #211 detectou overflow horizontal em desktop de 1280 px nos painéis individualizados de Notas Fiscais/Consulta Assessoria. O PR #214 corrigiu a grade entre 901 e 1440 px e adicionou regressão E2E para garantir que painel e controles permaneçam dentro da largura disponível. A correção foi integrada no merge `cc842af7b7bc6341dab68aa55a533a2017923bcf` e publicada em Vercel Production.

**Correção pós-PR #211:** o PR #215 corrigiu a fronteira de concorrência otimista que reintroduzia `rowVersion` dentro de payloads de negócio durante a conversão canônico → legado → canônico. A regra funcional da ADR-050 não mudou. `row_version` permanece top-level; payloads não carregam `rowVersion/row_version`; a migration `20260830223000_payload_row_version_boundary` limpou Production e ajustou apenas a tolerância técnica das RPCs de abertura fiscal/Assessoria. Production passou a 44 migrations, e os dois fluxos originalmente falhos foram comprovados por smokes transacionais reais com rollback.

**Governança de composição:** a ADR-052 define que fluxo crítico deve possuir autoridade funcional explícita, ordem de bootstrap tratada como contrato e prova executável de instalação/composição. Para Consulta Assessoria, `service-advisory-pendency.js` responde por abertura/reanálise e `service-advisory-corrective-submission.js` pelo novo envio corretivo. A separação é deliberada e a CI deve impedir duplicação ou desconexão silenciosa dessas autoridades.

### Consulta Assessoria — proteção individual completa

- somente NFs de serviço participam da dimensão;
- cada NF usa `registered_invoice_id` para envio, análise e Pendência;
- Pendência ativa da NF A não bloqueia a NF B;
- o `InvoiceService` recusa alterações comuns da própria NF enquanto houver Pendência ativa e também recusa `Incorreto` sem a operação atômica;
- novo envio exige Pendência `Aberta`, cria a próxima tentativa e leva o ciclo a `Aguardando reanálise`;
- reanálise exige a tentativa real mais recente ainda não analisada e não pode reescrever observação, link ou datas do envio;
- o resumo mensal é `Sim` se ao menos uma consulta exigível foi enviada, `Não` se existem NFs de serviço e nenhuma foi enviada, e `Não se aplica` sem NF de serviço.

### Persistência e atualização visual da avaliação

Desde os PRs #190–#193, o caminho normal de sucesso é:

```text
interação
→ feedback visual imediato
→ persistência/RPC
→ retorno autoritativo
→ aplicação incremental do estado
→ reconciliação localizada escola + competência + programa
→ estabilização visual
```

`renderProntuario()` integral não é rotina de sucesso. Fica reservado a bootstrap, navegação, erro, retorno incompleto ou inconsistência que não possa ser reconciliada com segurança.

## 8. Pendências

Estados:

- Aberta;
- Aguardando reanálise;
- Resolvida;
- Cancelada.

Novo envio não resolve automaticamente. Reanálise positiva resolve; negativa reabre; cancelamento preserva motivo e autoria; regularização não apaga percurso.

Conforme PEND-05, `Resolvida` e `Cancelada` podem voltar a `Aberta` quando a operação de reabertura for válida, sempre preservando histórico e auditoria.

A ordenação operacional prioriza as pendências ativas mais antigas e, para estados encerrados, os acontecimentos mais recentes.

A tabela `pendency_attempts` permanece sincronizada com o estado agregado das tentativas da pendência.

### Datas de tentativa

`available_at` registra quando o documento foi disponibilizado pela escola.

`submitted_at` registra quando a tentativa foi lançada no RADAR.

Esses campos são conceitualmente distintos e não devem ser colapsados em round-trips entre domínio, estado legado e Supabase.

### Pendência de Notas Fiscais vinculada à despesa

Pendência individual de `notaFiscal` referencia a despesa específica por `registered_invoice_id`.

Identidade ativa:

```text
escola + competência + programa + notaFiscal + registered_invoice_id
```

O vínculo individual não transforma cada NF em uma nova categoria documental: a categoria continua sendo `notaFiscal`. O ID apenas fornece granularidade ao ciclo de análise, Pendência, envio e reanálise.

No Prontuário, após a abertura da Pendência, a ação é **Visualizar pendência**. Novo envio e reanálise pertencem à tela de Pendências.

### Pendência de Assessoria vinculada à NF

Pendência individual de Assessoria referencia a Nota Fiscal de origem por `registered_invoice_id`.

NFs distintas podem possuir pendências ativas simultaneamente no mesmo programa/competência. A mesma NF não pode duplicar pendência ativa equivalente.

A reanálise altera a NF vinculada e depois recalcula o agregado mensal, sem contaminar outras notas.

## 9. Timeline

`RadarSchoolTimeline` projeta avaliações, pendências, tentativas, contatos, despesas, bens e registros administrativos. Preserva ordem, autoria, competência, programa, origem e visibilidade por perfil.

## 10. Navegação contextual

`RadarNavigationContext` preserva competência, rota, filtros, rolagem e foco entre origem operacional e Prontuário/Pendências.

Na exceção transversal de Pendências, abrir detalhes não força a competência global; navegar para o Prontuário assume a competência da pendência.

## 11. Persistência

```text
Frontend
→ serviços de aplicação e UnitOfWork
→ RepositoryContract
   ├── SupabaseRepository — Production
   └── LocalStorageRepository — desenvolvimento/testes explicitamente configurados
→ PostgREST / RPC / Edge Function
→ Auth / RLS / PostgreSQL
```

O adaptador remoto usa paginação, lotes, erros padronizados, `row_version`, snapshots, RPCs, reconciliação e rollback.

Políticas de retorno/commit autoritativo são aplicadas apenas aos comandos em que o contrato permite evitar refresh remoto redundante. `administrativeLogs` é a única entidade autorizada para a isenção ampla de refresh prevista nessa política; entidades mutáveis de negócio permanecem conservadoras quando necessário.

### Production fail-closed

Production somente opera com a configuração remota autorizada.

Falha, ausência ou inconsistência de configuração Supabase em Production **não ativa fallback silencioso para LocalStorage ou seed**. O produto deve permanecer bloqueado/indisponível até o ambiente oficial ser restabelecido.

O build de Production sanitiza os dados iniciais de escolas/controladores usados no desenvolvimento para que eles não façam parte do bundle público institucional.

Ver [`decisions/ADR-045-production-fail-closed.md`](decisions/ADR-045-production-fail-closed.md).

## 12. Auth e sessão

O cliente Supabase usa sessão persistente e renovação automática. O bootstrap:

1. restaura ou cria a sessão;
2. valida perfil, papel efetivo e escopos;
3. cria cliente autenticado;
4. carrega entidades autorizadas;
5. aplica o perfil à interface;
6. mantém a aplicação inerte enquanto a autorização não termina.

Em Production, erro de configuração/autorização não é convertido em sessão local funcional.

## 13. Gestão de contas

```text
DirectoryService
→ TeamAccountGateway
→ team-account-management
   ├── Supabase Auth Admin
   └── RPC PostgreSQL transacional
```

Contratos vigentes:

- CORS fail-closed;
- JWT e papel autorizados;
- credencial administrativa somente server-side;
- lookup exato de conta por e-mail pela RPC autorizada;
- recuperação de vínculo histórico quando inequívoca;
- reutilização segura de conta em transição autorizada de perfil;
- um único perfil institucional ativo por usuário;
- desativação lógica e preservação de histórico;
- compensação quando Auth e banco participam de etapas distintas.

### Desativação de Controlador

A sequência obrigatória é:

1. transferir todas as escolas pela alocação de carteira;
2. confirmar carteira zerada;
3. desativar.

A desativação não redistribui escolas e não pede substituto quando a carteira já está vazia. Controladores inativos permanecem no histórico, mas não integram diretórios, filtros ou seletores operacionais.

## 14. Escolas e carteira

A carteira organiza responsabilidade, não fronteira entre Controladores da mesma CRE.

Novas escolas exigem identidade institucional informada:

- código institucional;
- designação;
- denominação;
- INEP;
- CNPJ;
- SICI.

Valores artificiais não podem ser gerados para preencher identidade definitiva.

A redistribuição de `controller_id` é exclusiva de perfis/rotinas administrativas autorizadas e protegida também no backend.

## 15. Financeiro e patrimônio

Notas fiscais e bens permanentes participam de operações compostas.

- nota permanente e bem derivado preservam contexto coerente;
- quando uma nota perde/troca vínculo com bem derivado, o vínculo anterior é tratado na mesma operação protegida;
- cada NF de serviço registra individualmente consulta à Assessoria e análise técnica;
- `Assessoria = Incorreto` e a pendência obrigatória correspondente são persistidos de forma atômica;
- pendências de Assessoria preservam `registered_invoice_id` canônico e compatibilidade com o vínculo legado quando necessário;
- resumos mensais de Assessoria são derivados das NFs e não substituem a avaliação individual;
- reanálise da Assessoria altera apenas a NF vinculada antes de recalcular o resumo;
- depois que há histórico de pendência vinculada, a identidade estrutural necessária à rastreabilidade da NF fica protegida pelas regras correspondentes;
- edição rápida de bem é restrita aos campos permitidos, com versão esperada e log;
- encaminhamento e inventariação usam fluxo patrimonial próprio.

### Despesa `A identificar`

Saída bancária sem documentação suficiente pode ser registrada provisoriamente como `A identificar`.

Esse estado não deve forçar NF, natureza de despesa, bem patrimonial ou consulta à Assessoria. A classificação é atualizada quando houver evidência documental.

## 16. Auditoria e exportações

`administrative_logs` registra eventos funcionais e `audit_events` serve à trilha técnica correspondente ao schema.

Exportações institucional e SME passam por auditoria de início/conclusão e devem permanecer coerentes com o estado canônico.

## 17. Ambientes

### Desenvolvimento/local

Supabase local, LocalStorage e fixtures descartáveis conforme o ensaio. Não representa Production.

### Preview

Ambiente candidato/isolado para validação. Preview não é publicação oficial.

### Production

Supabase Production canônico e frontend publicado na Vercel. Production é fail-closed e não usa seed/local como contingência silenciosa.

Validações destrutivas não escrevem em Production; usam ambiente descartável/Preview quando necessárias.

Consultar `CURRENT_STAGE.md` e o manifesto remoto para o baseline efetivo.

## 18. Excel SME

Contrato estável:

- uma competência por arquivo;
- uma aba;
- 27 colunas A:AA;
- template-fonte com 30 colunas usado somente como base visual;
- remoção de K, R e Y na projeção pública;
- designação como texto;
- bordas, alinhamentos, filtro, impressão e congelamento preservados;
- ausência deliberada de validações incompatíveis;
- certificação OOXML e homologação desktop.

## 19. Garantia operacional e ferramentas

O sistema possui camadas permanentes de:

- smoke geral de Production;
- incidentes/monitoramento conforme workflows vigentes;
- auditorias e contratos executáveis;
- backup/restauração descartáveis;
- gate por perfil e viewport;
- CodeQL;
- health checks de dependências;
- testes de banco, Auth e RLS.

Ferramentas incorporadas no ciclo de estabilização de 23/08:

- `fast-check` para testes de propriedades/invariantes;
- MSW para falhas, timeout, latência, conflito e retorno remoto incompleto;
- `dependency-cruiser` para gate arquitetural;
- Performance API/PerformanceObserver nativos para diagnóstico local das escritas operacionais.

A integração de métricas concluída e incorporada à `main` pelo PR #194 usa probe limitada em memória e interface somente leitura `RadarOperationalWriteMetrics`. Não envia telemetria, não persiste métricas e não coleta identificadores/conteúdo de negócio. Falha da instrumentação é fail-open.

O checkpoint pós-PR #200 registrou uma limitação adicional: o hotfix protegeu um fluxo crítico específico, mas performance e outros módulos funcionais ainda podem depender de instalação por polling com prazo fixo. A prontidão real por capacidade está planejada em PR3.1–PR3.3, mas não implementada no baseline `0965ba8`.

A existência de um gate não o torna automaticamente obrigatório para toda alteração. A governança de testes define proporcionalidade ao risco.

### Vulnerabilidades conhecidas

As vulnerabilidades moderadas conhecidas na cadeia ExcelJS/UUID são risco conscientemente aceito no estado de 23/08. Não executar atualização forçada, `npm audit fix --force` ou troca rompente de biblioteca apenas para zerar o relatório. Acompanhar versões compatíveis e reavaliar se o risco ou a exposição mudar.

## 20. Confiabilidade funcional ponta a ponta

Uma função crítica deve ser rastreada por:

```text
superfície
→ controle
→ handler
→ serviço
→ repositório
→ tabela/RPC/Edge Function
→ Auth/RLS
→ resposta
→ estado em memória
→ reconciliação/renderização
→ releitura após refresh
→ erro, conflito e compensação
```

Não declarar função concluída apenas porque o controle aparece na interface.

## 21. Experiência do usuário

Critérios de homologação incluem:

- clareza de contexto;
- legibilidade;
- encontrabilidade de ações;
- feedback de sucesso/erro;
- coerência do dado salvo e exibido;
- permanência após releitura;
- navegação e retorno contextual;
- fluidez das escritas inline sem reconstrução integral desnecessária da tela.

No ciclo urgente de 22–23/08, otimização mobile não foi critério bloqueante. Mobile preserva capacidade essencial e pode voltar à prioridade por defeito real ou nova decisão explícita.

## 22. Restrições permanentes

Não é permitido:

- alterar código para coincidir com documento histórico;
- criar fonte paralela de competência, avaliação, timeline ou exportação;
- voltar a filtrar automaticamente Pendências Operacionais pela competência global;
- reintroduzir `renderProntuario()` integral como caminho normal depois de toda escrita bem-sucedida;
- enfraquecer Auth, RLS ou autoria;
- reintroduzir fallback silencioso local/seed em Production;
- publicar seed institucional legado no bundle de Production;
- transformar carteira em fronteira de segurança entre Controladores da mesma CRE;
- ocultar capacidade essencial no mobile;
- introduzir segredo no frontend;
- aplicar migration sem histórico, testes e reversão proporcional ao risco;
- editar diretamente a tabela de migrations;
- inventar identidade institucional de escola;
- liberar exportação sem os controles de auditoria previstos;
- tratar PR aberto ou Preview como funcionalidade publicada;
- declarar função pronta apenas pela presença visual;
- forçar atualização de dependência conscientemente aceita sem avaliação de compatibilidade e risco.

## 23. Referências

- [`CURRENT_STAGE.md`](CURRENT_STAGE.md);
- [`handoff/2026-08-26-retomada-plano-mestre-pos-pr200.md`](handoff/2026-08-26-retomada-plano-mestre-pos-pr200.md);
- [`superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md`](superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md);
- [`reports/2026-08-26-plano-mestre-correcoes-pos-auditoria.docx`](reports/2026-08-26-plano-mestre-correcoes-pos-auditoria.docx);
- [`handoff/2026-08-23-post-pr-193.md`](handoff/2026-08-23-post-pr-193.md);
- [`handoff/2026-08-18-encerramento-operacional.md`](handoff/2026-08-18-encerramento-operacional.md);
- [`DECISION_LOG.md`](DECISION_LOG.md);
- [`decisions/ADR-044-pendencias-passivo-transversal.md`](decisions/ADR-044-pendencias-passivo-transversal.md);
- [`decisions/ADR-045-production-fail-closed.md`](decisions/ADR-045-production-fail-closed.md);
- [`superpowers/specs/2026-08-22-estabilizacao-avaliacoes-reais-design.md`](superpowers/specs/2026-08-22-estabilizacao-avaliacoes-reais-design.md);
- [`superpowers/specs/2026-08-23-continuity-instrumentation-post-pr193-design.md`](superpowers/specs/2026-08-23-continuity-instrumentation-post-pr193-design.md);
- [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md);
- [`reference/TEST_GOVERNANCE.md`](reference/TEST_GOVERNANCE.md);
- [`architecture/product-extensions-load-order.md`](architecture/product-extensions-load-order.md);
- [`architecture/testing.md`](architecture/testing.md);
- [`architecture/supabase-readiness.md`](architecture/supabase-readiness.md);
- [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md).
