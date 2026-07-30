# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 29 de julho de 2026  
**Baseline funcional auditada da `main`:** `598361dd784563f4d70d1e25df3818f4ee066da8`  
**Commit funcional publicado:** `dfc8aa3030b02edb73f764f5f56bd6759a7a1d77`  
**Deployment Production:** `dpl_7tLM3RZ7MEuRRTzvGmc9EiAARmDY` — `READY`  
**Estado da frente anterior:** concluída, mesclada e publicada  
**Próxima frente:** ainda não escolhida  
**Natureza:** documento operacional e transitório

## 1. Regra de leitura

Antes de iniciar tarefa:

1. confirmar a baseline funcional da `main` e os commits posteriores;
2. verificar PRs e workflows abertos;
3. confirmar o deployment Vercel Production correspondente;
4. confirmar o projeto Supabase autorizado e seu estado;
5. comparar o histórico local e remoto de migrations quando houver alteração de banco;
6. confrontar documentação e artefatos com código e ambientes;
7. atualizar este documento quando o estado material mudar.

Código, banco e deployment prevalecem sobre planos, relatórios e memórias de chat.

## 2. Situação executiva

A integração entre frontend, Supabase Auth, PostgREST, RLS, PostgreSQL e Vercel Production está ativa.

Estão concluídos e publicados:

- governança da Gestão SME;
- competência mensal global;
- avaliação mensal canônica;
- timeline cronológica da unidade;
- certificação automatizada dos relatórios Excel;
- navegação contextual e retorno seguro.

O código funcional dos ciclos 1 a 5 integra a baseline `598361dd...`. O deployment funcional vigente foi gerado pelo commit `dfc8aa3...`. O commit posterior apenas restaurou `git.deploymentEnabled: false` e não abriu nova publicação.

A divergência de identificador da migration SME foi reconciliada sem reaplicação do SQL. A liberação oficial ainda não foi declarada porque permanecem gates de segurança, homologação, restauração, UAT e decisão formal.

## 3. Estado por camada

| Camada | Estado comprovado |
|---|---|
| GitHub | `main` contém governança SME e ciclos 1 a 5. |
| Baseline funcional | `598361dd784563f4d70d1e25df3818f4ee066da8`. |
| Vercel Production | `dpl_7tLM3RZ7MEuRRTzvGmc9EiAARmDY`, `READY`. |
| Commit publicado | `dfc8aa3030b02edb73f764f5f56bd6759a7a1d77`. |
| Runtime | `production`, `supabase-production`, repositório remoto habilitado. |
| Supabase | projeto `scnryinorqeucbfkioxo`, `ACTIVE_HEALTHY`, PostgreSQL 17. |
| Calendário | `closing_competence = 2026-12`, `row_version = 5`. |
| Auth/RLS | ativos; acesso anônimo bloqueado. |
| Gestão SME | concluída e publicada. |
| Competência global | concluída e publicada. |
| Avaliação mensal | concluída e publicada. |
| Timeline da unidade | concluída e publicada. |
| Excel institucional | certificação automatizada concluída; botão institucional ainda usa CSV. |
| Excel SME mensal | certificação automatizada concluída. |
| Navegação contextual | concluída, publicada e validada em desktop e mobile. |
| Histórico de migrations | 25 versões correspondentes entre GitHub e Supabase Production; migration SME reconciliada. |
| Deployment automático | bloqueado após a janela controlada. |
| Liberação oficial | não declarada. |

## 4. Governança da Gestão SME

Concluída pelos PRs #87, #88 e #89.

Regras vigentes:

- visão mensal e Prontuário exibem identificação e bonificação, sem análise técnica nem ações;
- Pendências permanecem consultáveis, sem novo envio, substituição, reanálise, contato, cancelamento, reabertura ou criação;
- guardas existem na política de capacidades, handlers e serviços;
- Registros Internos usam `actor_user_id = auth.uid()`;
- a RLS de `administrative_logs` aplica o mesmo recorte;
- o Administrador técnico preserva leitura integral em sua visão técnica;
- programas por exercício continuam fora desse escopo.

## 5. Ciclo 1 — competência mensal global

Concluído pelo PR #92 e publicado pelos PRs #95 e #96.

- domínio `RadarCompetenceContext`;
- seletor global de competência;
- janeiro a dezembro de 2026 disponíveis;
- prioridade de inicialização por seleção persistida, explícita, fechamento e fallback cronológico;
- sincronização entre exercício e competência;
- preservação entre telas e recarga;
- `closing_competence = 2026-12` por fluxo auditado;
- `app_config.row_version = 5`.

## 6. Ciclo 2 — avaliação mensal certificada

Concluído pelo PR #98 e publicado pelos PRs #101 e #102.

- projeção canônica `evaluateMonthlyEvaluation`;
- resultado `apta`, `inapta` ou nulo;
- campos obrigatórios ausentes;
- estágio da bonificação;
- situação técnica e conclusão técnica separadas;
- pendências recortadas por escola, competência e programa;
- consulta e consolidação usam a mesma projeção;
- persistência atômica, autoria, log e `row_version` preservados;
- jornada de agosto validada após recarga.

## 7. Ciclo 3 — timeline cronológica da unidade

Concluído pelo PR #100 e publicado pelos PRs #101 e #102.

- domínio `RadarSchoolTimeline`;
- projeção somente leitura por unidade e competência;
- verificações, pendências, tentativas, contatos, notas, bens e logs consolidados;
- ordenação decrescente e desempate estável;
- abertura de pendência sem duplicidade;
- vínculos por programa, competência e pendência preservados;
- detalhe técnico restrito ocultado da Gestão SME;
- aba **Histórico cronológico** no Prontuário;
- carregamento pós-`app.js` idempotente;
- DOM seguro, sem nova fonte de verdade.

## 8. Ciclo 4 — certificação integral dos relatórios Excel

Concluído pelo PR #103 e incorporado ao deployment do PR #105.

### Relatório institucional

- histórico e multicompetência;
- quatro abas: `BONIFICACOES`, `SINTESE`, `QUALIDADE_DADOS` e `METADADOS`;
- equivalência com o CSV legado;
- comparação de células e pacote OOXML;
- manifesto e hashes determinísticos.

### Excel SME mensal

- uma competência por arquivo;
- uma aba mensal;
- 26 colunas;
- agrupamentos PDDE Básico, Qualidade e Equidade;
- ausência de `dataValidations`;
- isolamento temporal entre competências;
- comparação endereço a endereço e valor a valor.

### Evidência sintética

| Verificação | Resultado |
|---|---:|
| Resultados canônicos auditados | 4 |
| Divergências canônicas | 0 |
| Células institucionais certificadas | 48 |
| Divergências institucionais | 0 |
| Células SME certificadas | 78 |
| Divergências SME | 0 |
| Abas institucionais | 4 |
| Abas SME | 1 |
| `dataValidations` | ausente |

```text
manifestHash = ee589e0d6f7361c9dd8176baccbcd9ceb931f4b34eb698c2f5dd97a49877f58b
```

Evidência: `docs/evidence/excel-certification/synthetic-manifest.json`.

Limites:

- o botão institucional ainda permanece vinculado ao CSV;
- a certificação automatizada não substitui a abertura manual no Microsoft Excel desktop;
- a massa sintética não consulta nem grava Production.

## 9. Ciclo 5 — navegação contextual

Concluído pelo PR #104 e publicado pelos PRs #105 e #106.

- módulo `RadarNavigationContext`;
- captura antes da entrada em Prontuário ou Pendências;
- pilha de até 12 transições em `sessionStorage`;
- preservação de competência, rota, filtros, rolagem e foco;
- retorno ao controle acionável da unidade;
- fallback **Voltar para Carteira** em acesso direto;
- scroll próprio no desktop e scroll da página no mobile;
- foco somente em elemento acionável e visível;
- montagem segura e idempotente;
- nenhuma tabela, migration, RPC ou persistência remota.

O SHA final do PR #104 passou em:

- Supabase readiness;
- Lighthouse CI;
- Saúde das dependências;
- Playwright desktop, Android e iPhone.

## 10. Dados observados em Production

Data de corte: 29/07/2026.

| Entidade | Quantidade |
|---|---:|
| Configuração global | 1 |
| Programas | 8 |
| Competências | 12 |
| Escolas | 164 |
| Vínculos escola–programa | 431 |
| Perfis ativos | 13 |
| Verificações | 6 |
| Pendências | 3 |
| Tentativas | 3 |
| Contatos | 5 |
| Registros administrativos | 82 |
| Bens | 2 |

As quantidades são retrato operacional e podem mudar com o uso real.

## 11. Rastreabilidade da migration SME — resolvida

O arquivo canônico criado e testado no GitHub é:

```text
20260728182226_sme_access_governance.sql
```

O histórico do Supabase Production agora registra o mesmo identificador:

```text
version = 20260728182226
name = sme_access_governance
```

O registro derivado `20260728190344` foi removido exclusivamente pelo mecanismo oficial de `migration repair`. Nenhuma instrução funcional foi reaplicada.

Verificações posteriores:

```text
migrations remotas = 25
registro canônico = 1
registro derivado = 0
comprimento reconstruído = 1.411 caracteres
SHA-256 reconstruído = cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e
```

O CLI armazenou o conteúdo em quatro instruções separadas. A reconstrução das quatro instruções reproduz exatamente o SQL canônico. O teste `tests/unit/sme-migration-history-alignment.test.js` protege versão, ausência do identificador derivado e hash.

Evidências:

- [`audits/2026-07-29-rastreabilidade-migration-sme.md`](audits/2026-07-29-rastreabilidade-migration-sme.md) — registro do achado original;
- [`audits/2026-07-29-reconciliacao-migration-sme-plano.md`](audits/2026-07-29-reconciliacao-migration-sme-plano.md) — estratégia executada;
- [`audits/2026-07-29-reconciliacao-migration-sme-evidencias.md`](audits/2026-07-29-reconciliacao-migration-sme-evidencias.md) — comprovação posterior.

## 12. Toolchain e gates

O `test:readiness` vigente executa:

- verificação de sintaxe;
- lint de segurança;
- lint dos testes E2E;
- testes unitários;
- certificação Excel sintética;
- testes de integração;
- readiness e alinhamento final do Supabase;
- configuração de runtime;
- verificação de artefatos gerados;
- tipagem do banco;
- auditoria funcional.

Também existem gates para Supabase local/pgTAP, Playwright, Lighthouse, saúde das dependências e build Vercel.

A faixa de Node permanece `>=24 <27`; a fixação deliberada da major operacional ainda é pendência de release.

## 13. Segurança operacional e bloqueadores

Comprovado:

- acesso anônimo bloqueado;
- somente chave publicável no frontend;
- RLS por papel e escopo;
- Edge Function protegida por JWT;
- alterações auditáveis;
- deployments automáticos bloqueados após janelas controladas;
- evidência Excel sem dados pessoais;
- histórico de migrations reconciliado entre GitHub e Supabase Production.

Bloqueadores reais restantes:

1. homologar manualmente os relatórios no Microsoft Excel desktop;
2. habilitar proteção contra senhas vazadas no Supabase Auth;
3. fixar deliberadamente a major do Node;
4. testar backup e restauração em ambiente descartável;
5. executar gate remoto por perfil e viewport;
6. concluir UAT;
7. realizar polimento editorial e visual;
8. registrar decisão formal de liberação.

O advisor de segurança do Supabase confirma que a proteção contra senhas vazadas permanece desabilitada.

## 14. PRs residuais

- PR #94: fechado sem merge; substituído pelo PR #100;
- PR #70: fechado sem merge; execução temporária expressamente não integrável;
- PR #5: permanece aberto para decisão própria sobre uma fundação segura de CSV e não integra a sequência corrente.

## 15. Próxima decisão

Os ciclos 1 a 5 estão encerrados e a rastreabilidade da migration SME está reconciliada. Não existe nova implementação funcional autorizada neste documento.

A próxima frente deve ser escolhida entre os bloqueadores remanescentes da seção 13. O cadastro e a disponibilização de programas por exercício permanecem fora do escopo até decisão específica.

Auditoria geral: [`audits/2026-07-29-reconciliacao-pos-ciclos-1-5.md`](audits/2026-07-29-reconciliacao-pos-ciclos-1-5.md).
