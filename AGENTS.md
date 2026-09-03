# AGENTS.md — RADAR PDDE 2026

**Atualizado em:** 3 de setembro de 2026

## 1. Leitura obrigatória

Antes de analisar ou alterar o repositório, leia **nesta ordem**:

1. `docs/handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md` — porta de entrada corrente e matriz do que ainda falta;
2. `docs/CURRENT_STAGE.md` — estado corrente, baseline e sequência real;
3. `docs/decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md` — contrato funcional vigente de Notas Fiscais/Pendências individuais;
4. `docs/decisions/ADR-052-autoridade-unica-fluxos-criticos.md` — autoridade, bootstrap e composição dos fluxos críticos;
5. `docs/reference/STATUS_DOCUMENTOS.md` — validade e precedência dos documentos;
6. `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md` — visão gerada do contrato funcional vigente;
7. `docs/PROJECT_CONTEXT.md` e `docs/DECISION_LOG.md`;
8. `docs/handoff/2026-09-02-dependency-governance.md` quando a frente tocar dependências/tooling;
9. `docs/superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md` — detalhes das etapas ainda vigentes, começando pela reconciliação de 03/09 incluída no próprio arquivo;
10. somente depois, handoffs, evidências e planos históricos anteriores;
11. código, GitHub, Vercel e Supabase correspondentes à frente, revalidados ao vivo quando houver dado volátil.

**Regra de continuidade:** o handoff de 03/09, o código atual, ADR-050/ADR-052 e decisões posteriores prevalecem sobre checkpoints anteriores no ponto em que houver conflito. Não restaurar uma tarefa, regra ou layout antigo apenas porque aparece em plano histórico.

**Regra específica do plano mestre:** PR4 antigo, PR6B, PR7B e PR9B não voltam à fila de implementação como estavam escritos. A sequência restante e a classificação de cada etapa ficam no handoff de 03/09.

Auditorias externas são insumo de investigação, não ordem de implementação. Se uma auditoria propuser caminho diferente, comparar primeiro com o SHA atual e com a reconciliação vigente.

## 2. Identidade do produto

O RADAR PDDE é sistema institucional de gestão, controle, acompanhamento e apoio à decisão para o PDDE da 4ª CRE/SME-Rio. Não é CRUD genérico.

Toda entrega deve considerar, na medida do impacto:

- correção técnica e funcional;
- coerência entre perfis, telas e dados;
- integridade, rastreabilidade e auditabilidade;
- visualização e encontrabilidade da informação;
- usabilidade, feedback e clareza da próxima ação;
- acessibilidade e equivalência mobile;
- confiabilidade de persistência e releitura.

Uma função não está pronta apenas porque grava no banco. O usuário precisa encontrá-la, compreender o estado, executar a ação e reencontrar o resultado de forma coerente.

## 3. Fontes de verdade

Para determinar o estado implementado, usar nesta ordem:

1. código-fonte remoto do SHA analisado;
2. migrations, funções, políticas, Auth, RLS e dados do Supabase autorizado;
3. artefato implantado na Vercel e seu SHA;
4. contrato funcional e decisões vigentes;
5. testes que representam o contrato atual;
6. documentação canônica;
7. auditorias históricas, planos antigos, testes superados e memória de conversa.

Se um teste ou documento divergir do comportamento atual comprovado, investigar a divergência antes de alterar o produto. Nunca modificar código correto apenas para satisfazer uma expectativa histórica.

## 4. Estado operacional estável

O estado corrente completo está em `docs/CURRENT_STAGE.md`. Valores voláteis devem ser consultados diretamente no remoto.

Contratos estáveis:

- Supabase é a persistência canônica de Preview/Production;
- Production usa `SupabaseRepository`;
- Node.js permanece fixado em `24.x`;
- competência mensal é contexto global único;
- Excel SME público possui 27 colunas A:AA;
- Gestão de Equipe usa backend protegido, Auth Admin e RPCs transacionais;
- a suíte automatizada protege o produto, mas não define regra de negócio por conta própria.

## 5. Perfis e autorização

Perfis funcionais visíveis:

- Controlador (`controller`);
- Assistente de Verbas Federais (`federal_assistant`);
- Gestão SME (`sme_management`);
- Equipe de Inventário (`inventory`).

`technical_admin` é papel autenticado técnico separado e não é quinto perfil funcional visual.

### Controlador

A carteira representa responsabilidade principal e filtro inicial. Controladores podem colaborar nas escolas da própria `cre_scope`, preservando responsável principal e autoria. Não redistribuem `schools.controller_id` pela edição cadastral e não alteram identidade institucional reservada.

### Assistente de Verbas Federais

Possui atuação transversal autorizada na CRE. Lidera Gestão de Equipe, redistribuição de carteira, reanálise de pendências, retificações e demais operações expressamente concedidas pelo contrato atual.

### Gestão SME

Realiza acompanhamento gerencial e utiliza configurações autorizadas. Pendências são consultáveis, sem mutações operacionais. Qualquer mudança futura de programas/configurações deve partir do código e da decisão funcional vigente, não de documentação histórica.

### Inventário

Opera o fluxo patrimonial autorizado segundo o escopo e as políticas específicas de bens.

### Administrador técnico

`technical_admin` preserva a identidade, o JWT e a autoridade autenticada independentemente do perfil visual simulado.

A simulação de Controlador, Assistente, SME ou Inventário altera a apresentação da interface e o contexto visual, mas **não rebaixa a autoridade real do administrador técnico**. Auditoria deve registrar o usuário real, `authenticatedRole = technical_admin` e, quando houver, o perfil visual simulado.

## 6. Competência global

`RadarCompetenceContext` é a fonte canônica de competência mensal.

Dashboard, Carteira, Competências, Prontuário, Pendências, alertas, timeline e exportações devem consumir o mesmo mês ativo.

Não criar seletor concorrente nem alterar `activeCompetenciaKey` diretamente em implementação ou teste quando a intenção for mudar o contexto mensal. Usar o contexto canônico.

## 7. Regra de impacto entre camadas

Toda alteração deve verificar somente as camadas materialmente afetadas:

```text
layout/frontend e encontrabilidade
→ visibilidade/capacidade por perfil
→ handler e serviço de aplicação
→ contrato de persistência
→ tabela, RPC ou Edge Function
→ Auth/RLS
→ autoria e auditoria
→ atualização da interface
→ releitura quando houver escrita
→ erro, conflito e compensação quando aplicáveis
→ testes proporcionais
→ documentação afetada
→ build/deployment quando houver publicação
```

Não transformar essa lista em checklist obrigatório de todos os gates para toda alteração pequena.

## 7.1 Autoridade única e prevenção de correção duplicada

Para qualquer fluxo P0/P1, **antes de criar handler, wrapper, extensão, RPC ou nova rota de persistência**:

1. pesquisar a operação na matriz funcional e no `DECISION_LOG`;
2. localizar todos os consumidores e produtores atuais, inclusive módulos carregados dinamicamente;
3. inspecionar `product-extensions-bootstrap.js` e a cadeia que o instala quando houver extensão;
4. identificar qual módulo é a autoridade vigente de cada etapa;
5. confirmar se a suposta ausência é real ou apenas está em outro módulo;
6. somente então alterar código.

Não duplicar uma regra porque ela não aparece no primeiro arquivo inspecionado.

Para Consulta Assessoria, a autoridade corrente é:

```text
edição ordinária
→ InvoiceService.updateServiceAdvisory

Incorreto + abertura / reanálise
→ service-advisory-pendency.js

novo envio corretivo
→ service-advisory-corrective-submission.js

persistência
→ RPC específica correspondente
```

A ordem de bootstrap é parte do contrato. Um PR que tocar fluxo crítico deve manter ou atualizar regressões que provem:

- bootstrap instalado;
- autoridade correta por operação;
- delegação de rotas não aplicáveis;
- composição real no navegador;
- snapshot/adapter e RPC quando houver escrita remota.

Se a investigação descobrir implementação equivalente já existente, **não criar uma segunda implementação**. Corrigir carregamento, roteamento ou autoridade, conforme a causa real.

## 8. Gestão de Equipe

Fluxo vigente:

```text
DirectoryService
→ TeamAccountGateway
→ team-account-management
→ Auth Admin + RPC transacional
```

Preservar:

- CORS fail-closed e allowlist canônica;
- JWT e papel autorizados;
- lookup Auth exato por e-mail;
- recuperação segura de vínculos históricos;
- rejeição de ambiguidade e vínculo ativo conflitante;
- transição autorizada entre perfis reutilizando a conta existente;
- desativação lógica, redistribuição e histórico;
- compensação quando Auth ou banco falhar.

## 9. Escolas, pendências e patrimônio

- novas escolas exigem identidade institucional real; não sintetizar INEP, CNPJ, SICI, designação ou denominação;
- Controlador não redistribui responsável de carteira pela edição cadastral;
- novo envio de pendência não resolve automaticamente;
- reanálise pode ser executada por Controlador, Assistente e `technical_admin`; SME e Inventário permanecem bloqueados para essa mutação;
- tentativas permanecem sincronizadas com `pendency_attempts` e com a verificação relacionada;
- nota permanente e bem derivado permanecem coerentes na mesma operação protegida;
- edição patrimonial usa serviço autorizado, versão esperada e log.

No contrato vigente após PR #209 e no PR #211, **não existe documento autônomo `boletoInternet`**. `boleto_internet` existe somente como **Tipo de Gasto dentro de Notas Fiscais**, exclusivo de Educação Conectada. Não possui linha documental, bonificação, análise técnica ou Pendência independente e não participa de Consulta Assessoria.

## 9.0 Guardrails supervenientes até PR #249

- Declaração BB Ágil pode usar N/A sob o contrato vigente; Pendência ativa impede a transição até ser resolvida/cancelada.
- `RADAR PDDE` é nome interno e não aparece em comunicação oficial externa gerada.
- a exportação XLSX de Pendências é superfície vigente e deve preservar auditoria, filtros e ausência de IDs técnicos;
- `PDDE Básico` aparece primeiro somente no layout da avaliação; não reordenar `programasIds` nem transformar isso em regra persistente;
- a interface atual de Pendências e o polimento visual pós-PR #237/#249 estão aprovados; plano histórico não autoriza redesenho regressivo;
- Supabase CLI 2.116.0 permanece rejeitado por regressão pgTAP/RLS; não atualizar por automatismo;
- Lighthouse usa três rodadas e mediana; não relaxar thresholds para obter verde.
## 9.1 Guardrails integrados pelo PR #211

No baseline posterior ao PR #211, preservar estas decisões já fechadas:

- novas `a_identificar` nascem `Incorreto + Pendência` atomicamente;
- os **16 `a_identificar` legítimos de Controladores** são `Registro legado`: sem backfill, sem Pendência inventada e sem edição/exclusão comum;
- **12 despesas/NFs + 3 Pendências fiscais genéricas** comprovadas como fixtures da conta técnica foram removidas pela limpeza fail-closed;
- o antigo reparo do **Boleto 1234** está superado: boleto e Pendência foram classificados como fixtures e removidos pela limpeza condicionada, não vinculados;
- Consulta Assessoria é individual por NF de serviço e a Pendência ativa deve ser buscada com `registered_invoice_id`; lookup genérico por escola + competência + programa + documento não pode bloquear outra NF;
- selecionar `Incorreto` em Assessoria abre primeiro o fluxo atômico de Pendência; não gravar `Incorreto` solto;
- o `InvoiceService` também bloqueia alterações comuns da Assessoria enquanto a mesma NF possui Pendência ativa; somente novo envio e reanálise podem avançar esse ciclo;
- reanálise fiscal ou de Assessoria exige a tentativa real mais recente, em `Aguardando reanálise`, e não pode reescrever o conteúdo que a escola enviou;
- o resumo mensal da Assessoria é `Sim` se **ao menos uma** consulta exigível foi enviada, `Não` se existem NFs de serviço e nenhuma foi enviada, e `Não se aplica` sem NF de serviço;
- no Prontuário, item com Pendência ativa mostra **Visualizar pendência**; `Registrar novo envio` e `Reanalisar` permanecem na tela de Pendências;
- Pendência fiscal agregada real anterior à individualização continua acessível como legado, sem associação inventada a uma NF;
- o fluxo normal e as RPCs protegem identidade, contexto, concorrência e atomicidade; existe uma lacuna residual conhecida contra escrita **direta** em `registered_invoices` envolvendo `id`, `verification_id` e `source_context_key`, registrada na ADR-051;
- por decisão explícita do responsável pelo produto, esse hardening adicional do Supabase está **adiado até a conclusão e validação de todas as frentes de correção funcional**; não antecipá-lo, não usá-lo como gate dos PRs funcionais e não marcá-lo como resolvido;
- desktop foi o alvo do hotfix; a reconferência visual final foi concluída e o overflow em 1280 px foi corrigido pelo PR #214, com regressão E2E de largura/alinhamento; mobile permanece dívida separada não bloqueante;
- o PR #215 corrigiu a fronteira `row_version`/payload e Production opera com 44 migrations; não reintroduzir `rowVersion`/`row_version` em payloads de negócio;
- a ADR-052 exige autoridade única e prova executável do bootstrap/composição de fluxos críticos.

Se um teste, comentário antigo ou auditoria contrariar esses pontos, classificar primeiro como possível contrato superado antes de alterar o produto.

## 10. Testes: regra principal

Aplicar `docs/reference/TEST_GOVERNANCE.md`.

Antes de corrigir qualquer falha de teste, classifique-a como:

1. defeito real de produto;
2. contrato de teste superado;
3. defeito do próprio teste/fixture;
4. falha de infraestrutura;
5. flaky não reproduzível.

Só o primeiro caso autoriza alterar o produto por causa da falha.

### Validação proporcional

Para uma mudança comum:

- reutilizar teste existente diretamente relacionado;
- comprovar um fluxo positivo;
- comprovar bloqueio negativo apenas quando a autorização for risco material;
- para escrita, comprovar persistência/releitura quando isso acrescentar evidência real;
- avaliar visualização, encontrabilidade, feedback e coerência do estado;
- executar um gate base compatível com o escopo;
- não repetir suites já aprovadas se o código coberto não mudou.

Não criar infraestrutura de teste nova sem risco concreto. Não iniciar ciclos sucessivos de E2E, Lighthouse, backup, mobile e outros gates apenas para transformar todos os indicadores em verdes.

Suite integral e gates especializados são apropriados para mudanças transversais, releases relevantes ou auditorias expressamente autorizadas.

## 11. Testes superados

Quando uma regra funcional mudar, registrar:

```text
regra anterior → regra vigente → código afetado → teste afetado
```

Atualizar ou remover a expectativa antiga. Se um cenário histórico estiver embutido em uma suíte extensa e já houver proteção sucessora suficiente, ele pode ser excluído da execução por título exato, com razão documentada e referência ao teste atual.

Nunca reverter regra vigente para recuperar um teste antigo.

## 12. Auditoria de testes

Não assumir ordem cronológica de coleções sem `ORDER BY` temporal explícito. UUID não é relógio.

Testes de auditoria devem localizar eventos pelo ator autenticado, contexto, identificador da operação ou timestamp adequado. `reverse()` sobre uma coleção ordenada por ID não prova “último evento”.

## 13. Migrations e Supabase

Regras permanentes:

- migrations versionadas e aplicadas em ordem;
- nenhum seed institucional implícito;
- nenhuma chave administrativa no frontend;
- operações compostas atômicas quando necessário;
- conflitos com `row_version` não são sobrescritos silenciosamente;
- histórico de migrations não é editado diretamente;
- nova migration somente quando houver mudança real de schema/regra que não possa ser representada pelo contrato existente.

## 14. Excel SME

Contrato vigente:

```text
template-fonte: 30 colunas
produto público: 27 colunas A:AA
motor: ExcelJS 4.4.0
competência: mensal e estrita
```

As posições-fonte K, R e Y são removidas na projeção pública. Alteração material do gerador exige certificação correspondente; não reexecutar certificação Excel por mudanças sem relação com exportação.

## 15. Documentação

- código e ambientes efetivos são superiores à documentação;
- `CURRENT_STAGE.md` descreve o presente;
- matriz JSON é a fonte da visão gerada `FUNCTIONAL_CONTRACT_MATRIX.md`;
- `TEST_GOVERNANCE.md` controla a estratégia de validação;
- auditorias e planos datados registram o passado e não são reescritos para parecer atuais;
- branch/PR não integrado não altera o baseline.

Ao concluir mudança material, atualizar somente os documentos vigentes realmente afetados.

## 16. Git e integração

Não trabalhar diretamente na `main`.

Fluxo padrão:

1. confirmar HEAD remoto;
2. criar branch específica;
3. inspecionar código antes de testes;
4. implementar a menor mudança coerente;
5. executar validação proporcional uma vez;
6. classificar falhas encontradas;
7. corrigir apenas defeitos reais ou testes comprovadamente superados;
8. abrir PR com escopo, riscos e evidências;
9. integrar quando objetivamente pronto;
10. confirmar o SHA efetivamente publicado quando houver mudança de Production.

Não aguardar indefinidamente todos os jobs nem reiniciar a mesma bateria sem nova evidência.

## 17. Critério de conclusão

Uma frente pode ser encerrada quando:

- o comportamento afetado atende ao contrato atual;
- o usuário consegue encontrar, compreender e executar as ações esperadas;
- dados e informações permanecem coerentes após a operação;
- não há defeito relevante conhecido no escopo;
- falhas de teste remanescentes foram classificadas e não representam regressão real.

Cobertura parcial, teste histórico, Lighthouse não relacionado ou ausência de uma prova opcional não mantêm automaticamente o RADAR em estado de projeto inacabado.
