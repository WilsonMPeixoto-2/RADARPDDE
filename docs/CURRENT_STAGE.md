# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 29 de julho de 2026  
**Linha de base funcional auditada da `main`:** `598361dd784563f4d70d1e25df3818f4ee066da8`  
**Artefato funcional publicado:** `dfc8aa3030b02edb73f764f5f56bd6759a7a1d77`  
**Deployment Production:** `dpl_7tLM3RZ7MEuRRTzvGmc9EiAARmDY` — `READY`  
**Próxima frente:** polimento editorial e visual  
**Natureza:** documento operacional e transitório

> A linha de base acima é o commit funcional confrontado nesta auditoria. O merge de alterações documentais produzirá novo HEAD sem modificar o runtime descrito.

## 1. Regra de leitura

Antes de iniciar qualquer tarefa:

1. confirmar o HEAD remoto da `main`;
2. verificar PRs, commits e workflows posteriores;
3. confirmar o deployment Production correspondente;
4. confirmar o estado do projeto Supabase autorizado;
5. confrontar documentação e artefatos com código e ambientes;
6. classificar planos e relatórios antigos como históricos quando já executados ou substituídos;
7. atualizar este documento quando o estado material mudar.

Código, banco, deployment e evidências reproduzíveis prevalecem sobre planos, chats e relatórios históricos.

## 2. Situação executiva

A integração entre frontend, Supabase Auth, PostgREST, RLS, PostgreSQL e Vercel Production está ativa. Os cinco primeiros ciclos do plano de oficialização foram concluídos e publicados:

1. competência mensal global;
2. avaliação mensal canônica e resultado APTA/INAPTA;
3. timeline cronológica da unidade;
4. certificação integral dos relatórios Excel;
5. navegação contextual e retorno seguro.

A governança restritiva da Gestão SME permanece aplicada em interface, serviços e RLS. Deployments automáticos estão bloqueados por padrão e são abertos somente em janelas controladas.

A aplicação ainda **não foi declarada oficialmente liberada**. Permanecem acabamento editorial/visual, homologação manual dos Excels, fortalecimento de segurança, comprovação de restauração, matriz remota de jornadas, UAT e decisão formal de release.

## 3. Ciclos concluídos

### Ciclo 1 — competência mensal global

Concluído no PR #92 e publicado pelos PRs #95 e #96.

- domínio puro `RadarCompetenceContext`;
- seletor global de competência;
- janeiro a dezembro de 2026 disponíveis;
- seleção preservada entre telas, perfis e recarga;
- sincronização entre exercício e competência;
- rejeição de seleção inválida ou fora do exercício;
- remoção da seleção mensal concorrente da tela local;
- `closing_competence = 2026-12`;
- alteração auditada com `row_version = 5`;
- cobertura desktop, Android, iPhone, Supabase e RLS.

### Ciclo 2 — avaliação mensal certificada

Concluído no PR #98 e publicado no deployment conjunto `dpl_7dAaUfecP9NkTigAfpbaAk9DpHEN`.

- projeção canônica única em `evaluateMonthlyEvaluation`;
- resultado APTA/INAPTA e campos ausentes;
- estágio da bonificação;
- situação da análise técnica separada do grau de conclusão;
- pendências filtradas por escola, competência e programa;
- consulta e consolidação usando a mesma projeção;
- persistência atômica, autoria, log e `row_version` preservados;
- jornada real validada após recarga.

### Ciclo 3 — timeline cronológica da unidade

Concluído no PR #100 e publicado no mesmo deployment da avaliação mensal.

- projeção somente leitura por unidade e competência;
- verificações, pendências, tentativas, contatos, notas fiscais, bens e registros administrativos consolidados;
- ordenação decrescente com desempate estável;
- abertura de pendência sem duplicidade;
- vínculos por escola, competência, programa e pendência;
- recorte de visibilidade para Gestão SME;
- aba **Histórico cronológico** no Prontuário;
- carregamento pós-`app.js` idempotente e degradável;
- montagem por DOM seguro, sem `innerHTML`;
- nenhuma tabela, migration, RPC ou persistência derivada.

### Ciclo 4 — certificação integral dos relatórios Excel

Concluído no PR #103.

- auditoria de `resultadoBonif` contra `evaluateMonthlyEvaluation`;
- relatório institucional preservado como histórico e multicompetência;
- Excel SME preservado como mensal e restrito à competência ativa;
- equivalência institucional com o CSV legado;
- execução dos modelos, planos e renderers reais;
- extração de células numéricas e `inlineStr` do OOXML;
- comparação endereço a endereço e valor a valor;
- validação das entradas obrigatórias do pacote;
- confirmação de quatro abas institucionais e uma aba SME;
- ausência de `dataValidations` no Excel SME;
- hash estrutural, hash de conteúdo e hash do manifesto;
- massa sintética sem dados pessoais;
- regeneração obrigatória da evidência pelo readiness;
- isolamento temporal entre competências.

Resultado da evidência sintética:

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

### Ciclo 5 — navegação contextual

Concluído no PR #104 e publicado pelos PRs #105 e #106.

- extensão do histórico canônico existente, sem segundo roteador;
- contexto de origem em `sessionStorage`;
- pilha limitada a 12 transições;
- captura antes da entrada em Prontuário ou Pendências;
- preservação de competência, rota, filtros, rolagem e foco;
- botão **Voltar para …** conforme a origem real;
- retorno ao controle acionável da unidade;
- fallback **Voltar para Carteira** em acesso direto, favorito ou nova aba;
- detecção do scrollport responsivo real;
- restauração de foco somente em controles acionáveis;
- montagem segura por DOM e bootstrap idempotente;
- nenhuma tabela, migration, RPC ou persistência remota;
- homologação em desktop, Android e iPhone.

## 4. Estado por camada

| Camada | Estado em 29/07/2026 |
|---|---|
| GitHub | `main` auditada em `598361dd`; ciclos 1 a 5 integrados. |
| Vercel Production | `dpl_7tLM3RZ7MEuRRTzvGmc9EiAARmDY`, `READY`, commit `dfc8aa3030`. |
| Runtime publicado | `production`, `supabase-production`, repositório remoto habilitado. |
| Supabase | projeto `scnryinorqeucbfkioxo`, `ACTIVE_HEALTHY`, PostgreSQL 17, região `sa-east-1`. |
| Calendário | 12 competências de 2026; `closing_competence = 2026-12`. |
| Auth/RLS | ativos; acesso anônimo bloqueado. |
| Governança SME | concluída e publicada. |
| Competência global | concluída e publicada. |
| Avaliação mensal | concluída e publicada. |
| Timeline da unidade | concluída e publicada. |
| Excel institucional | modelo XLSX certificado; comando institucional visível ainda preserva o CSV legado. |
| Excel SME mensal | implementado e certificado automaticamente. |
| Navegação contextual | concluída e publicada. |
| Deployment automático | bloqueado em `vercel.json`. |
| Liberação oficial | não declarada. |

## 5. Arquitetura efetiva

O projeto permanece uma aplicação JavaScript sem framework de UI, com `app.js` como núcleo legado e módulos especializados carregados ao redor dele.

Padrão vigente:

```text
Domínio puro
   ↓
Serviços de aplicação
   ↓
Integrações e bootstraps idempotentes
   ↓
app.js e superfícies existentes
   ↓
Contrato único de repositório
   ├── SupabaseRepository
   └── LocalStorageRepository — contingência
```

Características observadas:

- módulos UMD compatíveis com navegador e Node Test Runner;
- extensões pós-`app.js` coordenadas por `product-extensions-bootstrap.js`;
- rotas canônicas baseadas em History API e `switchView()`;
- domínio sem dependência de DOM para competência, timeline e certificação;
- serviços com guardas de capacidade e unidade de trabalho;
- persistência remota com RLS, RPCs e concorrência otimista;
- testes unitários, integração, Playwright, pgTAP e Lighthouse;
- renderer OOXML próprio, sem ExcelJS.

## 6. Perfis e capacidades

### Controlador

- carteira como responsabilidade principal e filtro inicial;
- colaboração permitida nas escolas da própria CRE;
- autoria real preservada em mutações;
- análise técnica e fluxo de pendências autorizados.

### Assistente de Verbas Federais

- visão transversal da CRE;
- Gestão de Equipe e carteiras;
- ações administrativas e operacionais autorizadas;
- retificações e consolidação.

### Gestão SME

- visão mensal e Prontuário restritos a identificação e bonificação;
- análise técnica não exibida;
- Pendências consultáveis em modo somente leitura;
- mutações bloqueadas na interface, handlers e serviços;
- Registros Internos filtrados por `actor_user_id = auth.uid()`;
- RLS de defesa em profundidade.

### Equipe de Inventário

- fluxo patrimonial autorizado;
- bens, encaminhamentos e inventariação;
- ausência de capacidades operacionais não relacionadas ao inventário.

### Administrador técnico

- infraestrutura, perfis, escopos, importações e auditoria;
- simulação visual de perfil sem substituição do JWT;
- leitura técnica integral quando não estiver simulando outro perfil.

## 7. Competência, avaliação e timeline

Identidade operacional:

```text
escola + competência + programa
```

A projeção mensal reúne:

- possibilidade de consolidação;
- resultado `apta`, `inapta` ou nulo;
- campos ausentes;
- estágio da bonificação;
- situação da análise técnica;
- conclusão `not_started`, `in_progress` ou `complete`;
- pendências abertas;
- itens aguardando reanálise;
- total de pendências ativas.

Situação técnica e grau de conclusão são independentes.

A timeline projeta eventos das entidades canônicas, preservando ordem, autoria, competência, programa, pendência e visibilidade. Não constitui fonte paralela de persistência.

## 8. Navegação

Rotas canônicas principais:

```text
/dashboard
/carteira
/competencias
/pendencias
/inventario
/auditoria
/equipe
/gestao-sme
/escolas/:schoolId
/escolas/:schoolId/pendencias
/pendencias?escola=:schoolId
```

A navegação contextual complementa essas rotas e restaura origem, competência, posição e foco sem reconstituir manualmente a jornada.

## 9. Segurança operacional

Comprovado:

- acesso anônimo bloqueado;
- somente chave publicável no frontend;
- RLS por papel e escopo;
- Edge Function de Gestão de Equipe protegida por JWT;
- operações auditáveis;
- deployment automático bloqueado após janelas controladas;
- evidência Excel sintética sem dados pessoais;
- Vercel configurada para Node `24.x`.

Aviso de segurança vigente no Supabase:

- `auth_leaked_password_protection` — proteção contra senhas vazadas desabilitada.

## 10. Bloqueadores antes do release oficial

- executar polimento editorial e visual sem alterar paleta, marca, capacidades ou nomenclatura canônica;
- homologar manualmente os dois produtos no Microsoft Excel desktop e versionar evidência;
- habilitar proteção contra senhas vazadas no Supabase Auth;
- restringir deliberadamente a faixa de Node do repositório à major operacional aprovada;
- validar backup e restauração em ambiente descartável;
- executar gate remoto por perfil, competência e viewport;
- concluir UAT com usuários reais;
- decidir e registrar formalmente o release.

## 11. Ordem das próximas entregas

1. polimento editorial e visual;
2. fortalecimento de segurança e infraestrutura de release;
3. homologação manual dos Excels e restauração;
4. matriz remota de jornadas por perfil;
5. UAT;
6. decisão de liberação oficial.

Plano histórico de referência: [`superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md`](superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md). Os subprojetos 1 a 5 desse plano estão executados; suas caixas de seleção não devem ser usadas como indicador do estado atual.

## 12. Higiene do repositório

O PR #94 permanece aberto como rascunho histórico da primeira branch empilhada da timeline. Foi substituído pelo PR #100 e **não deve ser mesclado**. O fechamento pode ser realizado em tarefa de manutenção separada para preservar o escopo desta reconsolidação documental.
