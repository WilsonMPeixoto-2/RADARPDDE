# RADAR PDDE — Reconciliação de planos, demandas e documentação

**Data da análise:** 8 de outubro de 2026  
**Natureza:** relatório datado de reconciliação. Não cria regra de negócio nem substitui os documentos canônicos.  
**Base examinada:** main a5a67d34b6dcab04903b6657fb9fa01f0aba9d11.

## 1. Conclusão principal

Havia vários planos sobrepostos, com fases de mesmo nome e documentos que conservaram linguagem de execução depois de serem superados. Não existe uma única lista antiga que possa ser retomada literalmente.

A maior parte da frente recente de confiabilidade, sincronização, autonomia de despesas e atualização de ferramentas foi entregue. A próxima etapa útil é reconciliar o estado documental e verificar um conjunto pequeno de demandas remanescentes. Uma nova análise do produto é recomendável após essa limpeza, com foco nas tarefas reais dos usuários e critérios de término.

Esta revisão identificou:

- **Divergências documentais confirmadas:** fechamento do #429; situação dos #271/#272; entrega do antigo #375 pelo #376; contagens da matriz funcional; um pedido de prova da Fase 2 que ficou para trás.
- **Demandas antigas ainda a verificar no produto atual:** drawer desktop PROD-UX-08 e indicadores mensais históricos do Prontuário.
- **Residuais técnicos identificáveis:** geração de alguns IDs por horário e parte do readiness ainda por polling. Existência no código não equivale a incidente atual nem determina prioridade de implementação.
- **Frentes condicionais ou adiadas:** uso de credenciais reais no smoke; modernização visual; proteções patrimoniais adicionais e novas operações estruturais.
- **Entregas que devem permanecer encerradas:** #410, #427 e #429, além das Fases 1/2 de autonomia das despesas.

Nenhuma regra funcional, arquivo do repositório, dado de Production, PR ou deployment foi alterado nesta análise.

## 2. Base e alcance da verificação

| Verificação | Resultado |
|---|---|
| Main remota e checkout | a5a67d34b6dcab04903b6657fb9fa01f0aba9d11 |
| Árvore Git | 2b3160f32e73a0b825a7f067763b86115b241b8b |
| Production Vercel | dpl_BW2hefHBNgc7Aq1R4j7wEBsfYE9K, READY, target production, mesmo SHA |
| Alias examinado | https://radarpdde-fix.vercel.app |
| PRs abertos | 12; classificados na seção 7 |
| Issues abertas separadas de PR | Nenhuma retornada pela consulta de issues abertas |
| Documentação | Inventário de 414 arquivos sob docs; leitura dirigida dos documentos de autoridade, planos, handoffs e evidências relevantes |
| Histórico de entregas | Consulta das duas primeiras páginas de 100 PRs ordenados por atualização e confronto com fontes atuais |
| Supabase | Leitura de metadados das migrations recentes; inclui leitura contextual e invalidação escolar, independência despesas/bonificação e propriedade dos campos |
| Check executado | node scripts/check-functional-contract-matrix.mjs: sucesso, 44 operações |

**Limites:** não houve nova homologação visual autenticada, execução de jornadas CRUD, auditoria integral de SQL/RLS, repetição dos gates sustentados ou leitura exaustiva de todos os documentos. O check da matriz valida sua consistência estrutural, não a atualidade semântica de cada justificativa de cobertura. A consulta de migrations corrobora presença de entregas; não prova, sozinha, equivalência completa do banco com todo o código.

## 3. Como decidir qual documento prevalece

A ordem de autoridade deve seguir [AGENTS.md](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a5a67d34b6dcab04903b6657fb9fa01f0aba9d11/AGENTS.md), [modelo canônico](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a5a67d34b6dcab04903b6657fb9fa01f0aba9d11/docs/reference/SYSTEM_CANONICAL_MODEL.md) e [método de engenharia](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a5a67d34b6dcab04903b6657fb9fa01f0aba9d11/docs/reference/ENGINEERING_METHOD.md): conferir implementação no SHA alvo, ambiente efetivo, decisões vigentes e evidências correspondentes. Planos históricos explicam a evolução, mas não comandam automaticamente novas alterações.

Regras usadas nesta reconciliação:

1. PR fechado sem merge pode ter sido integralmente absorvido por outro PR.
2. PR integrado não garante que todas as ideias de um plano amplo tenham sido implementadas.
3. Um documento antigo pode conter contratos atuais e somente um parágrafo vencido.
4. Um teste verde não prova automaticamente todos os perfis, a experiência humana ou o uso de credenciais reais.
5. Ausência de evidência nesta análise não é prova de ausência de implementação.
6. Mudança de nome de arquivo, serviço ou RPC não significa descumprimento se o contrato foi atendido por outra implementação.
7. Não se corrige o produto para coincidir com uma regra histórica superada.

## 4. Reconstrução dos planos anteriores

| Família de plano | O que aconteceu | Tratamento atual |
|---|---|---|
| Plano diretor pós-PR22, julho | Mistura preparação para Supabase, dados, navegação, visual e evolução futura. Production já usa Supabase; diversas premissas foram substituídas. | Histórico. Recuperar oportunidades individualmente, sem importar prioridades P0/P1 de julho. |
| Plano de agosto / PR1–PR9 | Sofreu hotfixes, entregas parciais e substituição formal pelo plano source-first de setembro. | Não executar checkboxes remanescentes como fila atual. |
| Source-first de 03/09 / R1–R9 | R1 entregue no #282; idempotência no #276; convergência remota avançou no #300 e sucessores; medições e sincronização evoluíram depois. IDs e readiness têm residuais. | Substituir status global de “plano executável corrente” por histórico com mapa de entregas e residuais. |
| Tooling A/B/C | #378, #384, #385 e #386, com decisões de rejeição de versões; atualizações posteriores até #422. | Encerrado para o escopo homologado. Manutenção contínua é outra atividade. |
| “Fase D — hardening e performance” | Continua descrita como não iniciada, mas parte importante da intenção foi atendida por #396, #410 e #427. | Requalificar item a item. Não declarar tudo concluído nem iniciar pacote amplo por inércia. |
| Plano mestre Draft #395 — A | Contexto operacional e performance. #396 entregou leitura agregada, #410 contexto escolar e #427 superfícies agregadas. | Objetivo principal materialmente atendido; métricas e limites devem apontar às entregas posteriores. |
| #395 — B | Autoridades frontend, readiness, wrappers e redução progressiva de concentração. Parte evoluiu, mas há polling remanescente. | Residual técnico a priorizar por risco/benefício comprovado; não autoriza rewrite de app.js. |
| #395 — C | Drawer PROD-UX-08. | Verificação visual atual pendente. |
| #395 — D | Rebaseline funcional, evidência e governança. | A presente reconciliação cobre inventário e classificação; homologação humana geral continua distinta. |
| Fases 1/2 de autonomia/retificação | #403/#404 implementaram correções auditáveis e mudança de tipo elegível; #405 documentou fechamento. | Encerradas. Não restaurar bloqueios históricos. |
| Sincronização e prova de reconexão | #410 + #427; #428 fechamento; #429 corrigiu o teste causal. | Encerradas. Só reabrir com evidência nova. |
| Modernização visual | Existe direção registrada: avaliar ferramentas, usar piloto em superfície completa e aceitação humana. | Recuperar essa intenção após qualificar demandas corretivas. Não pressupõe adoção de framework ou bibliotecas. |

Os “Planos A–D” do #395, as “Fases A–D” de tooling e as fases de retificação são conjuntos diferentes. Um status de uma família não deve ser transferido para outra.

Fontes: [#395](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/395), [plano source-first](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a5a67d34b6dcab04903b6657fb9fa01f0aba9d11/docs/superpowers/plans/2026-09-03-plano-remanescente-source-first.md), [backlog pós-PR22](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a5a67d34b6dcab04903b6657fb9fa01f0aba9d11/docs/reference/POST_PR22_PRIORITIZED_BACKLOG.md), [avaliação de ferramentas visuais](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a5a67d34b6dcab04903b6657fb9fa01f0aba9d11/docs/evidence/2026-09-27-pr378-tooling/DESIGN_TOOLING.md).

## 5. Regras de negócio: o que mudou e o que deve ser preservado

| Tema | Contrato vigente e cuidado na leitura de históricos |
|---|---|
| Despesa versus bonificação | #397/ADR-055 tornou explícita a independência. Bonificação manual e resultado consolidado não autorizam nem bloqueiam o ciclo da despesa. A primeira despesa materializa verificação vazia quando necessário, sem inventar “Sim” ou resultado. |
| Correção de dados da despesa | Descrição, referência/número e valor possuem correção auditável. Existência de pendência ativa não deve ser usada como bloqueio genérico de toda edição. |
| Mudança de tipo | #404 permite os casos elegíveis com histórico exclusivamente fiscal encerrado/cancelado. Assessoria, pendência ativa, patrimônio terminal e ausência de contexto/versão podem bloquear. Não é permissão universal de reclassificação. |
| Exclusão e transferência | A flexibilização da correção de tipo não libera exclusão com histórico individual nem mudança estrutural de escola/competência/programa. Anulação/transferência auditável seria demanda própria. |
| Despesa a identificar | Criação atômica com análise incorreta e pendência; identificação ocorre pelo fluxo específico de envio/identificação. Preserva identidade e rastreabilidade. Não é edição comum do tipo provisório. |
| Envio e reanálise | Novo envio leva à espera de reanálise; não resolve por si só. Reanálise decide o resultado. Não reescreve o conteúdo histórico enviado. |
| Análise fiscal e Assessoria | Ciclos individualizados por nota/serviço; resumo mensal derivado. Uma nota não altera automaticamente a análise das demais. |
| Inventário | A proteção de Inventariada do #265 está entregue. Propostas de proteção adicional de toda mutação direta são outra questão, não repetição dessa correção. |
| Escopo do Controlador | Carteira define responsabilidade e prioridade; colaboração na mesma CRE não deve ser bloqueada por confundir carteira com autorização. Exceções entre CREs dependem do escopo explícito. |
| Competência inicial | Seletor usa o mês anterior como referência de calendário, sujeito à disponibilidade e ao contexto. Não restaurar mês corrente ou um mês fixo de antigos checkpoints. |
| Pendências e indicadores | Passivo transversal e recortes operacionais têm finalidades distintas. Idade histórica e tempo sob responsabilidade atual não são sinônimos; não uniformizar apenas para cumprir o antigo R4. |
| Boleto de internet | Tipo de gasto dentro de notaFiscal, exclusivo de CONECTADA. Não recriar categoria documental autônoma boletoInternet. |
| Datas | Datas técnicas de registro/abertura não equivalem automaticamente a uma “data da despesa”. Não inventar campo ou interpretação de negócio. |
| Retificação de consolidação | O documento retificacoes.md trata bonificação/consolidação e não toda edição de despesa. Seu escopo precisa ficar claro; não usar a permissão de Assistente desse documento para retirar a autonomia das notas. |

Fontes atuais: [modelo canônico](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a5a67d34b6dcab04903b6657fb9fa01f0aba9d11/docs/reference/SYSTEM_CANONICAL_MODEL.md), [catálogo de superfícies](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a5a67d34b6dcab04903b6657fb9fa01f0aba9d11/docs/reference/PRODUCT_SURFACE_CATALOG.md), [contexto](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a5a67d34b6dcab04903b6657fb9fa01f0aba9d11/docs/PROJECT_CONTEXT.md), [InvoiceService](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a5a67d34b6dcab04903b6657fb9fa01f0aba9d11/src/application/invoice-service.js), [seletor de competência](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a5a67d34b6dcab04903b6657fb9fa01f0aba9d11/src/integration/global-competence-selector.js), [#397](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/397), [#404](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/404).

**Dados e planos antigos:** a política [Classificação de dados e ambientes](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a5a67d34b6dcab04903b6657fb9fa01f0aba9d11/docs/reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md) já substitui premissas de julho, distingue contato funcional de segredo e condiciona saneamento do histórico Git a necessidade concreta, impacto e autorização. Não recuperar a antiga marcação P0 como incidente atual sem examinar conteúdo e exposição atuais. O índice [PRODUCT_DECISIONS.md](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a5a67d34b6dcab04903b6657fb9fa01f0aba9d11/docs/reference/PRODUCT_DECISIONS.md) já está explicitamente classificado como histórico; não precisa ser promovido novamente a fonte vigente.

## 6. Demandas reconciliadas

| Demanda | Classificação em 08/10 | Próxima ação proporcional |
|---|---|---|
| Sincronização escolar e agregados #410/#427 | Concluída | Preservar. Nova otimização depende de telemetria ou reprodução. |
| Prova de reconexão #429 | Concluída; status documental atrasado | Registrar fechamento e preservar evidências RED/GREEN. |
| Autonomia das despesas #397/#403/#404 | Concluída | Ajustar referências de evidência que ainda aguardam o candidato. |
| NAV-01/contexto escolar e UX-04 do antigo #375 | Escopo original entregue via #376 | Reconciliar documentos. Uma rodada visual nova deve ser descrita como revalidação, com motivo atual. |
| PROD-UX-08: drawer desktop cortado/sobreposto | Achado histórico ainda sem fechamento identificado | Reproduzir na main atual em estado populado, desktop e largura restrita. Só então decidir correção. |
| #394: bolinhas históricas dos meses | Candidato aberto; implementação proposta ausente da main | Verificar mês fora do contexto atual com dados históricos conhecidos. Não integrar branch antiga diretamente. |
| Readiness sistêmico / #284 / plano B | Residual técnico real, impacto atual não demonstrado | Mapear autoridades e risco dos pontos remanescentes. Refatoração apenas com hipótese verificável. |
| IDs persistentes, parte antiga de R3/PR5 | Parcial: idempotência de NF entregue, geradores por horário ainda presentes | Avaliar alcance e concorrência de programas/equipe; não chamar a idempotência de NF de pendente. |
| Smoke autenticado real #426 | Infraestrutura integrada; ativação manual específica adiada | Manter decisão do usuário. Se retomado, verificar log e identidade efetivamente usada; sucesso do workflow isolado é insuficiente. |
| Web Analytics / Speed Insights | Instrumentação entregue | Usar amostra real quando suficiente. Não converter ganho de payload em ganho humano comprovado. |
| Tooling / PRs automáticos | Manutenção contínua | Avaliar individualmente compatibilidade, CI e benefício atual. |
| Leaked Password Protection | Fora da fila no plano atual | Rever somente se mudar plano/decisão pertinente. |
| Proteção patrimonial adicional | Fora da fila atual; decisão de produto separada | Não implementar como “correção faltante” do #265. |
| Anulação/transferência estrutural auditável | Possibilidade de evolução, não requisito já aprovado nesta retomada | Definir necessidade, regras e impacto antes de implementação. |
| Modernização visual | Intenção anterior preservada, escopo a decidir | Avaliação humana e piloto de superfície completa; ferramentas são meios, não backlog obrigatório. |
| Ajuda, vazios, formulários, Carteira, Inventário, Registros e administração | Oportunidades do backlog antigo, algumas já melhoradas por entregas posteriores | Reavaliar por jornada e impacto atual. Não abrir PR por título de julho. |
| Offline/PWA e inteligência operacional | Hipóteses antigas condicionais | Permanecem estudo se houver necessidade de uso; sem prioridade automática. |

### Dois residuais técnicos que merecem descrição precisa

**IDs:** o construtor de [DirectoryService](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a5a67d34b6dcab04903b6657fb9fa01f0aba9d11/src/application/directory-service.js) ainda usa prefixo + Date.now() quando não recebe gerador. O bootstrap de [app.js](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a5a67d34b6dcab04903b6657fb9fa01f0aba9d11/app.js) instancia esse serviço sem injetar createId. O serviço usa o gerador para programas, controladores e membros de inventário. Isso confirma que a meta ampla de substituir geradores por horário não foi integralmente cumprida. Não foi demonstrada colisão atual, perda de dados ou necessidade de migration nesta análise.

**Readiness:** [atomic-analysis-pendency.js](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a5a67d34b6dcab04903b6657fb9fa01f0aba9d11/src/integration/atomic-analysis-pendency.js) conserva polling de instalação. Logo, a meta de eliminar readiness essencial escondido em polling não pode ser declarada integralmente entregue apenas porque o loader e os fluxos principais evoluíram. Também não se demonstrou falha funcional atual atribuível a esse trecho.

### Dois itens de interface que precisam de observação atual

**Drawer:** a evidência de setembro e o handoff PROD-UX-08 são ponto de reprodução, não prova de que a mesma falha persiste em outubro. O registro de teste citado pode ter sido limpo; não recriar dados reais automaticamente.

**Meses históricos:** getCompMonthStatus em app.js calcula o status a partir do estado disponível. A leitura histórica adicional proposta no #394 e sua regressão específica não estão na main examinada. Isso sustenta a necessidade de verificar o comportamento em contexto remoto limitado; não basta para declarar toda a interface mensal incorreta.

## 7. Os 12 PRs abertos não são 12 pendências de produto

| PR | Situação | Encaminhamento recomendado |
|---|---|---|
| [#264](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/264) | Manutenção antiga ampla | Reconciliar mudanças absorvidas por PRs posteriores; extrair somente necessidade atual comprovada. Não integrar pacote antigo inteiro. |
| [#284](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/284) | Draft explicitamente pausado | Preservar diagnóstico; separar o residual atual de readiness das melhorias já substituídas. |
| [#292](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/292) | Draft de diagnóstico visual | Fonte histórica de evidência, não candidato obrigatório de merge. |
| [#324](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/324) | Draft de roteamento de qualidade para agentes | Proposta de processo/ferramental, não falha do produto. Comparar com AGENTS e governança atuais. |
| [#379](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/379) | Supabase CLI 2.119.0 | Avaliar essa versão por evidência própria; não confundir com 2.120.0 rejeitada. Manter 2.114.0 homologada até decisão. |
| [#394](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/394) | Draft de indicadores mensais históricos | Reproduzir na main e reaproveitar somente solução validada no contexto atual. |
| [#395](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/395) | Draft documental de planos A–D | Referência para reconciliação; não representa aprovação de execução integral. |
| [#407](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/407) | Draft de laboratório de uso operacional | Evidência histórica; partes úteis seguiram por #408/#410. |
| [#409](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/409) | Draft de candidato anterior à solução #410 | Superado como candidato de integração. Preservar comparações, sem merge amplo. |
| [#414](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/414) | Atualização patch de tipos Node 24 | Manutenção pontual; sem migração automática de major. |
| [#423](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/423) | MSW 2.15.0 → 3.0.2 | Mudança major exige homologação própria. Não pendência funcional do usuário. |
| [#424](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/424) | actions/download-artifact 4.3.0 → 8.0.1 | Manutenção de CI, avaliar contratos de artifacts e runtime da action. |

Nenhum PR foi fechado, alterado ou integrado. “Superado” nesta tabela é classificação para saneamento posterior, preservando a evidência útil.

A política atual bloqueia especificamente Supabase CLI 2.116.0, 2.117.0, 2.118.0 e 2.120.0. Ela não bloqueia toda versão futura nem comprova rejeição da 2.119.0. Fonte: [Dependabot](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a5a67d34b6dcab04903b6657fb9fa01f0aba9d11/.github/dependabot.yml).

## 8. Documentos a atualizar — mapa de edição

| Documento | Achado | Edição indicada |
|---|---|---|
| docs/CURRENT_STAGE.md | Topo ainda descreve follow-up #429/candidato antigo; NAV-01/UX-04 ambíguos; Fase D genérica | Registrar fechamento efetivo; mapear #375 → #376; separar demandas a verificar, decisões adiadas e residuais técnicos. |
| docs/reference/STATUS_DOCUMENTOS.md | #429 ainda classificado como handoff de follow-up; mistura prioridades históricas | Marcar histórico concluído; sincronizar classificação das frentes e apontar uma única retomada vigente quando definida. |
| docs/README.md | Apresentação ainda orienta para o follow-up e lista frentes sem reconciliação | Atualizar índice e caminho de leitura conforme CURRENT_STAGE. |
| docs/handoff/2026-10-07-pr429-reconnect-proof.md | Conserva checkpoint Draft e fechamento anterior ao merge | Acrescentar aviso superior de encerramento com PR/merge/evidência final; preservar cronologia original abaixo. |
| docs/DECISION_LOG.md | Diz que #271/#272 “continuam candidatos”, embora ambos integrados em 06/09 | Corrigir status temporal e indicar entregas posteriores. Não reescrever decisões históricas como se fossem originalmente atuais. |
| docs/architecture/README.md | Informa 19 covered/25 partial; fonte gerada atual informa 18/26. Frase de “última desativada” é ambígua e menciona identidades técnicas | Corrigir contagem por fonte e explicar separadamente infraestrutura de smoke, execução autorizada e evidência efetiva. |
| docs/reference/functional-contract-matrix.json | Metadados antigos coexistem com atualizações posteriores | Atualizar metadados somente após reconciliação das operações/evidências; não chamar tudo de inválido pela data. |
| Fontes de operações da matriz funcional | INV-01 ainda pede confirmar no CI descartável o candidato da Fase 2 | Vincular as evidências finais do #404. Rever o gap por camada; manter parcial quando ainda faltar prova específica. |
| docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md | Espelha fontes com esse gap temporal | Regenerar a partir das fontes, não editar manualmente para fabricar cobertura. |
| docs/superpowers/plans/2026-09-03-plano-remanescente-source-first.md | Autodescrição de plano executável corrente conflita com classificação superior histórica | Acrescentar banner de substituição e mapa de entregas/residuais; manter plano original datado. |
| docs/handoff/2026-09-28-prod-ux-08-drawer-clipping.md | Autodenomina-se “corrente” | Classificar como demanda histórica aguardando reprodução atual; produzir novo checkpoint somente quando retomada. |
| docs/handoff/2026-09-30-pos-publicacao-pr397-retomada.md | Retomada posterior conserva navegação como trabalho futuro apesar de #376 | Adicionar nota de reconciliação/sucessão, sem apagar o registro histórico. |
| docs/reference/POST_PR22_PRIORITIZED_BACKLOG.md | Backlog antigo pode ser lido como atual; premissas pré-Supabase | Explicitar classificação histórica e necessidade de requalificação individual. |
| docs/architecture/retificacoes.md | Linguagem de protótipo e título amplo podem confundir consolidação com despesas | Clarificar escopo e remeter aos contratos atuais de edição fiscal/bonificação; não ampliar/restringir perfis por inferência. |

**Preservar como base:** SYSTEM_CANONICAL_MODEL.md, PRODUCT_SURFACE_CATALOG.md e PROJECT_CONTEXT.md já incorporam regras relevantes de #397/#404. Alterações futuras nesses arquivos devem ser pontuais e justificadas por divergência concreta, não pela idade do documento.

**Já reconciliados no #429:** SUPABASE_FUNCTIONAL_COVERAGE.md e SUPABASE_INTEGRATION_AUDIT.md deixaram de exigir cinco identidades técnicas exclusivas. Não repetir esse achado como pendência.

**Preservar como histórico datado:** artifacts, runs, hashes, REDs, contraprovas, screenshots e DESIGN_TOOLING.md. A avaliação de ferramentas exige nova consulta apenas quando houver intenção de adoção.

## 9. Plano global proposto a partir daqui

### Etapa 1 — Encerrar a reconciliação documental

Aplicar o mapa da seção 8 em uma alteração exclusivamente documental. Conferir consistência entre CURRENT_STAGE, STATUS, README e handoffs; regenerar matriz quando suas fontes mudarem. Não promover indiscriminadamente operações de parcial para comprovada.

**Critério de término:** um leitor novo consegue identificar entregas fechadas, demandas a verificar e decisões adiadas sem depender de memória de chat.

### Etapa 2 — Validar as duas demandas concretas de interface

1. Drawer PROD-UX-08 em desktop e largura restrita, com conteúdo suficiente.
2. Indicadores históricos dos meses em escola com dados conhecidos fora do contexto operacional ativo.

**Critério de término:** cada demanda classificada como reproduzida, já resolvida ou não reproduzida nas condições descritas, com captura/evidência atual. Correções nascem apenas dos casos reproduzidos.

### Etapa 3 — Avaliar os residuais técnicos

Delimitar risco e alcance dos IDs por horário e do readiness remanescente. Separar idempotência já entregue de unicidade de IDs, e polling existente de defeito demonstrado. Prioridade dependerá da probabilidade, impacto e custo da mudança.

**Critério de término:** decisão explícita de corrigir, adiar ou manter, com justificativa. Não exige executar um plano arquitetural inteiro.

### Etapa 4 — Avaliação geral do produto por jornada

Usar o produto para avaliar compreensão e utilidade, cobrindo:

- início de trabalho: perfil, competência, Carteira/Painel e próxima ação;
- escola: despesas, bonificação, análise, identificação e reanálise;
- pendências: localizar, entender responsabilidade, enviar, acompanhar e consultar histórico;
- inventário: vínculo, encaminhamento, processo e estado terminal;
- gestão e consulta: equipe, registros, filtros e exportações;
- estados difíceis: vazio, filtro sem resultado, carregamento, erro, acesso negado, conteúdo longo e interrupção de trabalho.

Desktop é o foco inicial. Ampliar para mobile por demanda/risco atual, sem reabrir automaticamente a rodada antiga.

**Critério de término:** lista priorizada pequena, com usuário afetado, tarefa prejudicada, evidência, benefício esperado e preservações de negócio. Também registrar “manter como está” quando adequado.

### Etapa 5 — Escolher a próxima entrega

Escolher uma frente pelo impacto para o usuário. Se for visual, recuperar DESIGN_TOOLING.md e começar por uma superfície completa, com aceitação humana. Se for desempenho, exigir telemetria ou reprodução mensurável.

Smoke real permanece uma decisão operacional separada e adiada conforme orientação anterior do usuário. Dependências seguem manutenção controlada. Não há razão encontrada nesta reconciliação para repetir os gates de #410/#427/#429.

## 10. Texto-base sugerido para a próxima atualização de CURRENT_STAGE

> A frente de sincronização operacional e sua prova de reconexão estão encerradas pelos PRs #410, #427, #428 e #429. O #429 foi integrado em 07/10/2026; seu handoff passa a histórico concluído. As Fases 1 e 2 de autonomia/retificação das despesas também estão encerradas.
>
> A retomada atual é a reconciliação de documentação e demandas. O escopo original de navegação contextual/UX do #375 entrou pelo #376; uma nova validação não deve ser descrita como implementação pendente daquele PR. PROD-UX-08 e os indicadores históricos do #394 aguardam verificação na versão atual antes de correção. Readiness sistêmico e IDs persistentes possuem residuais a qualificar por risco.
>
> Planos de agosto, source-first de setembro, Fase D e Draft #395 preservam contexto, mas não constituem fila automática. A próxima frente de produto será escolhida após essa triagem. Evolução visual deve recuperar a avaliação de ferramentas e usar validação humana; otimização adicional exige nova evidência.
>
> Smoke autenticado com conta real permanece adiado; a infraestrutura está integrada. Proteção adicional de patrimônio, anulação/transferência e recursos dependentes de plano pago continuam decisões separadas.

Este texto é uma proposta de atualização, não foi aplicado ao repositório.

## 11. Referências principais para continuidade

- [Estado atual](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a5a67d34b6dcab04903b6657fb9fa01f0aba9d11/docs/CURRENT_STAGE.md) e [classificação documental](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a5a67d34b6dcab04903b6657fb9fa01f0aba9d11/docs/reference/STATUS_DOCUMENTOS.md).
- [Matriz funcional](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a5a67d34b6dcab04903b6657fb9fa01f0aba9d11/docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md) e [fontes/metadados](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a5a67d34b6dcab04903b6657fb9fa01f0aba9d11/docs/reference/functional-contract-matrix.json).
- [#271](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/271), [#272](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/272), [#276](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/276), [#282](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/282), [#300](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/300), [#375](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/375), [#376](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/376): entregas que substituíram partes da fila antiga.
- [#394](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/394), [#395](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/395): propostas abertas que exigem reconciliação.
- [#397](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/397), [#403](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/403), [#404](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/404): autonomia e regras atuais de despesas.
- [#410](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/410), [#415](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/415), [#422](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/422), [#426](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/426), [#427](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/427), [#428](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/428), [#429](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/429): fechamento da rodada recente.
- [Handoff de reconexão](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a5a67d34b6dcab04903b6657fb9fa01f0aba9d11/docs/handoff/2026-10-07-pr429-reconnect-proof.md) e [evidências finais](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/a5a67d34b6dcab04903b6657fb9fa01f0aba9d11/docs/evidence/2026-10-07-reconnect-proof/README.md).

**Nota sobre métricas:** a redução de payload de aproximadamente 60% isola o #427 no cenário pareado. Reduções próximas de 78% com baseline #408 acumulam outras entregas. Não foi demonstrado ganho equivalente de CPU/renderização ou tempo humano. As 400 rodadas são carga total, não 400 provas de reconexão.

**Ponto de retomada:** aplicar a reconciliação documental e verificar as duas demandas de interface. Não restaurar regras antigas nem iniciar refatoração preventiva para cumprir documentos superados.
