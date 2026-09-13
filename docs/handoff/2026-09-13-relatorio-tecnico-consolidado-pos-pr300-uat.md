# Relatório técnico consolidado — pós-PR #300 e início da UAT operacional

**Data:** 13 de setembro de 2026  
**Classe documental:** Handoff corrente / evidência de retomada  
**Baseline de Production:** `1a149174ed4a14d2fc9f92aff57d1957e8538e89`  
**Frente ativa:** PR #301 — `test/operational-uat-supabase-2026-09-13`  
**HEAD observado da UAT:** `920c7230a3ffdfade3df25dc0fc59eb2a9271a7d`

> Este documento registra o checkpoint operacional de 13/09/2026. Ele não substitui o modelo canônico. Enquanto for apontado por `docs/CURRENT_STAGE.md`, deve ser lido logo após o estado corrente para reconstruir o contexto detalhado da frente ativa. Quando a frente mudar, deve permanecer histórico.

## 1. Mudança de perspectiva

O trabalho deixou de considerar o RADAR apenas como uma sequência de implementações e hotfixes. A frente atual trata o produto como um sistema que receberá dados reais continuamente: avaliações mensais, bonificação, análise técnica, notas/despesas, Pendências, novos envios, reanálises, contatos, encerramentos e bens patrimoniais.

O objetivo agora é provar simultaneamente:

- funcionamento real pela interface;
- persistência e relações corretas no Supabase;
- atualização imediata e coerente do layout;
- convergência após reload;
- uso seguro de memória/cache local;
- sustentabilidade do crescimento previsível dos dados;
- observabilidade capaz de detectar regressões antes que se transformem em incidente percebido pelo usuário.

Princípio vigente: **local não é sinônimo de erro**. Supabase é a fonte canônica no modo remoto; memória/cache do navegador pode funcionar como projeção operacional descartável quando melhora responsividade. O erro ocorre quando estado local se transforma em uma segunda fonte de verdade, mascara falha remota ou obriga o sistema a reconstruir coleções globais crescentes.

## 2. Correção arquitetural concluída no PR #300

A grande refatoração foi desenvolvida em `fix/supabase-query-architecture-2026-09-11` e integrada pelo PR #300, “Arquitetura Supabase contextual e persistência remota segura”.

Merge em `main`:

`1a149174ed4a14d2fc9f92aff57d1957e8538e89`

O problema de origem era a permanência de partes do modelo pré-Supabase no frontend: snapshots amplos, reconstruções de coleções e leituras globais de dados operacionais/históricos em situações nas quais a superfície ativa precisava apenas de um contexto pequeno.

A solução consolidada incluiu:

- bootstrap remoto limitado a dados estruturais;
- contexto operacional carregado por competência/contexto;
- incorporação seletiva de obrigações históricas ainda ativas;
- histórico administrativo/escolar sob demanda;
- paginação limitada e ordenação determinística;
- comandos remotos serializados;
- gravação remota autoritativa e incremental;
- releitura corretiva quando necessária;
- `localStorage` fora do papel de segundo banco operacional no modo Supabase;
- fail-closed para consultas sem limites/ordenação suficientes;
- fronteira explícita de acesso às tabelas operacionais Supabase;
- invalidação contextual no logout;
- troca de competência com proteção contra resposta stale.

Commits arquiteturais especialmente relevantes incluem:

- `7af6f8839adb30f6662ccc4ad65acf5b211b3dc8` — auditoria remota fail-closed;
- `5916c3cd160897a17b8d848c98f27a15b04dd394` — ordenação determinística no keyset;
- `caf4ad9c8a6bf1c0594b74ef3017529ea2d843c2` — proteção das fronteiras de acesso direto ao Supabase;
- `b27bd385eb5fcdeed863c296bbb5af0e33dc3eea` — paginação remota com ordenação/faixa explícitas;
- `f064c189ff26a4f22357f61dda6e16d218599900` — reconciliação formal com o rollback da `main`;
- `7fac373ec4481b5ca5140f923312b9fb7a5f5fee` — restauração apenas do contrato incremental necessário à retificação manual;
- `8462c5b6011eac52e7a2f99ce1c033333b1c96b4` e `196232358ead79522f684e5aec43ba1660991019` — alinhamento dos E2E ao estado estável pós-logout;
- `054aeb26f6f0ad12bf66b3965b9adcb59bca1a8a` — otimização conservadora do carregamento de fontes.

## 3. Reconciliação com o rollback do PR #299

A `main` possuía o hotfix `2eff1321a8abaccd46d9627ee2eed060741ce3b7`, que reverteu a regressão global de acesso associada ao PR #299. A branch arquitetural havia divergido antes dele.

A reconciliação foi feita por merge formal em `f064c189...`. O commit `7fac373e...` restaurou somente `incrementalStateEntities` e `remoteResultIsAuthoritative` onde eram necessários, sem restaurar a funcionalidade de retificação de avaliação removida pelo rollback.

Os módulos, UI, migration e testes centrais removidos pelo hotfix do PR #299 permaneceram ausentes. O PR #300 não alterou migrations e não exigiu mudança manual de dados em Production.

## 4. Certificação do PR #300

O candidato funcional `054aeb26...` passou os principais gates: E2E Playwright, homologação integral pré-production, validação geral, Supabase readiness, confiabilidade funcional com Supabase real, ciclos funcionais reais, gate de perfis/viewports, retificação auditável, CodeQL, saúde de dependências, Excel SME, snapshot canônico e Lighthouse.

A suíte unitária atingiu **1.018 testes aprovados, 0 falhas**, além das baterias de domínio, integração e jornadas autenticadas contra Supabase descartável.

### Lighthouse

O LCP desktop havia oscilado pouco acima do piso interno de 3,5 s. A análise apontou descoberta tardia das fontes e render-blocking, não lentidão das operações Supabase. A otimização `054aeb26...` antecipou a descoberta das fontes sem alterar regras ou identidade visual.

Resultado certificado no candidato:

- Performance 78%;
- Acessibilidade 100%;
- Boas práticas 100%;
- FCP 737 ms;
- LCP 3,46 s;
- Speed Index 1,29 s;
- TBT 0 ms;
- CLS 0,082;
- TTI 3,46 s.

Em execução documental posterior o mesmo código marcou ~3,63 s, enquanto o Lighthouse dentro da homologação passou no mesmo SHA. A diferença foi classificada como variabilidade de medição, não regressão. A decisão é não sacrificar arquitetura correta para fabricar um verde por dezenas/centenas de milissegundos. Mobile continua dívida conhecida e não bloqueante para o alvo operacional desktop.

## 5. Estado de Production no checkpoint

`main`: `1a149174ed4a14d2fc9f92aff57d1957e8538e89`.

Vercel Production:

- deployment `dpl_AgBZAFksL5g7X3qmoY4xdF65h1ti`;
- estado `READY`;
- commit exatamente `1a149174...`;
- manifesto oficial HTTP 200;
- `vercelEnvironment: production`;
- `runtimeEnvironment: production`;
- `dataMode: supabase-production`;
- `supabaseRepositoryEnabled: true`;
- `productionActivationApproved: true`.

Consulta de runtime logs de Production nas últimas 24 horas, filtrando `error`, `warning` e `fatal`, não encontrou ocorrência no checkpoint. Isso é sinal operacional, não substituto do UAT.

## 6. Estado local, memória e Supabase

A análise do código confirmou que o desenho atual distingue persistência canônica de projeção local.

No modo Supabase:

- bootstrap remoto aplica estado com `persistStorage:false`;
- `applyRemoteState()` aplica entidades/canônico com `persistStorage:false`;
- `persistSnapshot()` legado é proibido para repositório remoto;
- comandos remotos são serializados;
- resultados autoritativos podem atualizar imediatamente a projeção em memória;
- quando o resultado não basta, ocorre releitura corretiva das entidades necessárias;
- falha de aplicação local depois de commit remoto produz estado de sincronização (`refreshRequired`) em vez de fingir rollback remoto;
- reload deve convergir novamente para o Supabase.

Portanto, memória no navegador é permitida e útil. A regra é: **não persistir coleções operacionais como segunda base no modo remoto e nunca anunciar sucesso quando a autoridade remota não confirmou a gravação.**

## 7. Dados e capacidade do Supabase Production

Baseline observado em 13/09/2026:

- banco PostgreSQL total: aproximadamente **39 MB**;
- 163 escolas;
- 430 vínculos escola-programa;
- `administrative_logs`: 3.563 linhas / ~1,7 MB;
- `verifications`: 339 linhas / ~352 kB;
- `registered_invoices`: 84 linhas / ~216 kB;
- `pendencies`: 94 linhas / ~424 kB;
- `pendency_attempts`: 23 linhas / ~160 kB;
- `pendency_contacts`: 10 linhas / ~152 kB;
- `assets`: 14 linhas / ~128 kB.

A conclusão importante é que o incidente arquitetural **não era falta de capacidade do banco**. O volume é pequeno. O problema era o padrão de acesso: consultas globais repetidas e reconstrução desnecessária de dados crescentes.

O crescimento é previsível porque escolas e boa parte dos documentos mensais são quase fixos. Notas/despesas, Pendências, tentativas, contatos e logs são os acumuladores mais variáveis. O monitor futuro deve medir tendência real e distinguir crescimento esperado de crescimento anômalo.

## 8. `pg_stat_statements` como memória do problema antigo

`pg_stat_statements` está habilitado e preserva histórico desde julho. Ele registrou fingerprints da arquitetura anterior, inclusive milhares de chamadas globais.

Exemplos observados:

- consulta global paginada de `administrative_logs`: cerca de 6.729 execuções, média histórica ~1,58 s e máximo ~8 s;
- padrão global de `verifications`: cerca de 3.449 execuções, média ~229 ms e máximo ~4,36 s;
- assinaturas equivalentes aparecem para `registered_invoices`, `pendencies`, `pendency_attempts`, `assets` e outras coleções.

Esses contadores são cumulativos e não provam que a arquitetura nova ainda execute essas consultas.

Decisão: **não resetar as estatísticas**. Registrar o contador atual como linha de corte pós-refatoração e monitorar apenas o delta. Se fingerprints globais antigos voltarem a crescer durante uso normal, tratar como regressão arquitetural.

## 9. Observabilidade que já existe

O repositório já possui instrumentos úteis e eles devem ser integrados, não duplicados:

- smoke de Production em GitHub Actions, inclusive cron horário e incidente automático;
- integridade de dados de Production a cada 6 horas;
- saúde semanal de dependências;
- Dependabot para npm e GitHub Actions;
- CodeQL;
- Vercel deployments/build/runtime logs;
- Supabase Reports/Logs/Advisors;
- `pg_stat_statements`;
- rotinas de readiness, RLS, Auth e pgTAP existentes.

Evolução desejada: um resumo agregado de saúde que acrescente capacidade e regressão de consultas sem criar workflows redundantes.

## 10. Supabase Advisors no checkpoint

### Segurança

Um warning: **Leaked Password Protection Disabled**. É melhoria de segurança a avaliar, não causa do incidente arquitetural.

### Performance

Dez índices aparecem como `Unused Index`, nível INFO. Entre eles: `assets_inventoried_at_idx`, `registered_invoices_program_idx`, `data_import_runs_status_idx`, `competences_bonus_deadline_idx`, `app_config_closing_competence_idx`, `assets_competence_id_idx`, `pendencies_program_id_idx`, `schools_initial_competence_idx`, `user_profiles_inventory_member_id_idx` e `data_import_staging_batch_idx`.

Nenhum índice deve ser removido automaticamente. “Nunca usado até agora” pode significar fluxo raro/sazonal, e a análise precisa considerar custo de escrita, plano de execução e finalidade.

## 11. Dependências

O projeto já possui `npm outdated`, `npm audit`, Knip, SBOM, assinatura de pacotes, Dependabot e política específica para advisories conhecidos.

Versões observadas:

- `@supabase/supabase-js` 2.112.4, com versão mais nova disponível;
- Playwright 1.62.1, com versão mais nova disponível;
- Supabase CLI 2.114.0;
- TypeScript e ESLint atuais no checkpoint.

A CLI 2.116.0 já havia sido rejeitada por regressão em garantias pgTAP/RLS. Portanto, **não misturar atualização de dependências com a homologação da arquitetura**. Cada upgrade relevante deve ocorrer em branch própria e repetir o UAT operacional.

`npm ci` do novo workflow mostrou duas vulnerabilidades moderadas e warnings transitivos (`inflight`, `rimraf@2`, `lodash.isequal`, `glob@7`, `fstream`, `uuid@8`), enquanto o gate específico de saúde das dependências permaneceu verde. Investigar origem transitiva antes de qualquer atualização em massa.

## 12. Nova frente: UAT operacional pós-release

Foi criada a branch:

`test/operational-uat-supabase-2026-09-13`

Baseline: `1a149174...`.

PR #301: **UAT operacional Supabase e observabilidade pós-refatoração**.

No checkpoint:

- estado: aberto;
- Draft;
- HEAD: `920c7230a3ffdfade3df25dc0fc59eb2a9271a7d`;
- alterações funcionais de produto: nenhuma;
- alterações: plano de UAT, novo teste Playwright e inclusão do teste no workflow do ciclo Supabase.

Preview Vercel do HEAD `920c7230...`: `READY`, target Preview. Production permanece separada no merge do PR #300.

## 13. Plano versionado da UAT

Plano:

`docs/superpowers/plans/2026-09-13-homologacao-operacional-observabilidade.md`

Frentes:

1. UAT real com Supabase descartável;
2. contrato de cache/projeção local;
3. crescimento e capacidade;
4. regressão de consultas globais;
5. observabilidade;
6. dependências em trilha separada.

Critério central de escrita:

```text
UI após ação
= projeção em memória
= registro Supabase
= UI após reload
```

com conferência dos efeitos transversais.

## 14. Primeiro teste novo de UAT

Arquivo:

`tests/e2e/supabase-operational-uat.spec.js`

Ele usa Supabase local descartável, Auth real, RLS real, perfil Controlador e interface real.

### Cenário 1 — login → dashboard → Registros Internos

Passos/provas:

- login pelo formulário real;
- espera `RadarDataContext.ready` + role Controlador + repositório Supabase;
- dashboard/layout visíveis;
- mede submit → dashboard;
- reprova `administrative_logs` no bootstrap;
- reprova GET de coleção operacional sem filtro contextual;
- abre Registros Internos;
- só então espera request de `administrative_logs`;
- exige `limit=101` e ordenação por `event_at.desc`;
- exige ausência de page errors/console errors.

**Resultado da primeira execução: PASSOU.**

Essa é evidência direta de que o problema de origem está, pelo menos nessa jornada, corrigido: login/dashboard não depende de histórico administrativo global, e logs são buscados sob demanda.

### Cenário 2 — avaliação → Supabase → ausência de base local → reload

O cenário pretende:

- abrir `ESC-LOCAL` em 2026-05;
- marcar “Extrato Conta Corrente” como `Sim` e `Correto` pela interface;
- conferir UI imediata;
- consultar `verifications` pelo cliente autenticado;
- conferir `bonification.extCC`, `analysis.extCC` e `row_version`;
- exigir que coleções operacionais não tenham sido gravadas no `localStorage`;
- recarregar;
- reencontrar o mesmo estado pela UI.

## 15. Primeira falha da UAT e classificação

Workflow `Ciclos funcionais reais com Supabase`, run `34771878379`:

- 5 testes executados;
- 4 aprovados;
- 1 reprovado.

Passaram os cenários antigos de reanálise autenticada, ciclo de NF e persistência de verification, além do novo cenário login/contexto.

A única falha foi no novo cenário de avaliação e ocorreu **antes** da consulta de persistência remota.

O teste esperava classe visual `/is-selected/`, mas a interface real usa:

`btn-toggle active-sim`

O mesmo resultado ocorreu no retry.

Classificação no checkpoint: **forte evidência de expectativa incorreta do teste, não de defeito do produto**. A primeira ação é corrigir a asserção do teste para o contrato visual vigente (preferencialmente sem depender de classe frágil se houver estado semântico melhor) e rerodar. Não alterar produto correto para satisfazer a expectativa criada no teste.

Artefato de falha foi publicado pelo workflow, incluindo screenshot, vídeo e trace.

Durante o download de imagens da stack Supabase ocorreram `toomanyrequests: Rate exceeded` temporários; os retries concluíram e a stack/migrations subiram. Isso não causou a falha final.

## 16. Estado dos gates do PR #301 no checkpoint

No SHA `920c7230...`:

Concluídos com sucesso:

- Saúde das dependências;
- Validar RADAR PDDE;
- CodeQL;
- Confiabilidade funcional com Supabase real.

`Ciclos funcionais reais com Supabase`: failure pelo motivo de teste descrito acima.

`Testes E2E Playwright` e `Homologação integral pré-production` ainda estavam em execução no momento deste registro.

O PR #301 deve permanecer Draft.

## 17. UAT ainda necessário

Prioridades de continuação:

1. corrigir a asserção visual do segundo UAT e executar até as verificações de Supabase/localStorage/reload;
2. avaliação mensal completa: Sim/Não/N/A, Correto/Incorreto/Não analisado/Correto (Atrasado), consolidação e derivados;
3. NF/despesa de consumo;
4. serviço + Consulta Assessoria individualizada;
5. permanente + Capital/Inventário + encaminhamento;
6. Boleto de Internet apenas em Educação Conectada;
7. `a_identificar`: `Incorreto + Pendência` atômicos, identificação no novo envio e preservação de identidade;
8. ciclo completo de Pendência: manual/automática, novo envio, Aguardando reanálise, reanálise resolutiva e não resolutiva, tentativas, contatos, cancelamento/reabertura autorizados;
9. permissões e retificações recentes: edição cadastral com histórico, bloqueios estruturais e preservação de identidade/Pendência/tentativas;
10. feedbacks de sucesso, erro, bloqueio, sincronização pendente e recovery;
11. primeira navegação, rota direta, troca de competência rápida e respostas stale;
12. falha remota antes de commit: UI não pode anunciar sucesso;
13. commit remoto confirmado + falha de projeção local: `refreshRequired` e convergência posterior;
14. efeitos transversais entre Prontuário, Pendências, Inventário, Dashboard/Carteira e Registros Internos.

## 18. Monitoramento a acrescentar

Após a UAT funcional básica ficar estável:

- registrar baseline pós-release de tamanho/linhas das tabelas acumulativas;
- registrar contadores/fingerprints globais antigos de `pg_stat_statements`;
- monitorar apenas delta futuro;
- alertar para reaparecimento sustentado de consultas globais proibidas;
- monitorar crescimento mensal/diário, dead tuples e latência de consultas contextuais;
- agregar sinais existentes de GitHub, Supabase e Vercel em resumo de saúde simples;
- evitar alarmes por crescimento esperado.

## 19. Governança documental

Este handoff deve permanecer subordinado a:

1. código/Supabase/Vercel efetivos;
2. `AGENTS.md`;
3. `docs/reference/SYSTEM_CANONICAL_MODEL.md`;
4. `docs/reference/PRODUCT_SURFACE_CATALOG.md`;
5. `docs/CURRENT_STAGE.md`.

Enquanto `CURRENT_STAGE.md` o indicar como handoff corrente, ele é a fonte detalhada para retomar o PR #301. Depois que a frente for encerrada, deve ser reclassificado como histórico sem ser reescrito para simular atualidade.

## 20. Ponto exato de retomada

Production:

`main @ 1a149174ed4a14d2fc9f92aff57d1957e8538e89`

UAT:

`test/operational-uat-supabase-2026-09-13 @ 920c7230a3ffdfade3df25dc0fc59eb2a9271a7d`

PR #301: Draft.

Primeiro passo técnico: corrigir o teste em `tests/e2e/supabase-operational-uat.spec.js` que espera `is-selected` quando o controle real retorna `active-sim`, rerodar a suíte e só depois classificar qualquer falha subsequente.

Preservar sempre:

- rollback do PR #299;
- Supabase como fonte canônica;
- cache/memória local como projeção, não banco concorrente;
- consultas contextuais e limitadas;
- UAT pela interface real;
- distinção entre bug do produto, bug do teste e falha de infraestrutura;
- atualizações de dependência fora da trilha de homologação funcional.
