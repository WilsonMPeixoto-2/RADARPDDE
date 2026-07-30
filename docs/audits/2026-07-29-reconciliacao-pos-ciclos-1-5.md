# RADAR PDDE — Reconciliação pós-ciclos 1 a 5

**Data de corte:** 29 de julho de 2026  
**Natureza:** auditoria documental baseada em código, GitHub, Vercel e Supabase  
**Escopo:** reconstrução do estado real após a governança da Gestão SME e os cinco ciclos de oficialização operacional

## 1. Regra de precedência aplicada

A reconstrução seguiu a ordem:

1. código-fonte remoto da `main`;
2. migrations, políticas, funções e dados efetivos do Supabase autorizado;
3. deployment efetivo da Vercel Production;
4. testes e evidências reproduzíveis;
5. PRs e decisões vigentes;
6. documentação existente.

Documentos anteriores foram tratados como históricos quando divergiam das fontes operacionais.

## 2. Identificação das fontes verificadas

### GitHub

- repositório: `WilsonMPeixoto-2/RADARPDDE`;
- branch padrão: `main`;
- baseline funcional e operacional auditada: `598361dd784563f4d70d1e25df3818f4ee066da8`;
- esse commit apenas restaura `vercel.json > git.deploymentEnabled` para `false` após a publicação do Ciclo 5;
- o código funcional dos ciclos 1 a 5 já está contido nessa baseline.

### Vercel Production

- projeto: `radarpdde-fix`;
- deployment vigente: `dpl_7tLM3RZ7MEuRRTzvGmc9EiAARmDY`;
- estado: `READY`;
- alvo: `production`;
- commit publicado: `dfc8aa3030b02edb73f764f5f56bd6759a7a1d77`;
- mensagem: publicação da navegação contextual em Production;
- após o smoke, o commit `598361dd...` restaurou o bloqueio automático e não abriu nova publicação.

### Supabase Production

- projeto: `RADAR PDDE 2026`;
- ref: `scnryinorqeucbfkioxo`;
- região: `sa-east-1`;
- estado: `ACTIVE_HEALTHY`;
- PostgreSQL: 17;
- migration mais recente observada: `20260728190344_sme_access_governance`;
- `closing_competence = 2026-12`;
- `app_config.row_version = 5`.

## 3. Dados operacionais observados

| Entidade | Quantidade |
|---|---:|
| Competências | 12 |
| Unidades escolares | 164 |
| Programas | 8 |
| Vínculos escola–programa | 431 |
| Perfis ativos | 13 |
| Verificações | 6 |
| Pendências | 3 |
| Tentativas | 3 |
| Contatos | 5 |
| Registros administrativos | 82 |
| Bens | 2 |

Os quantitativos são retrato operacional da data de corte e não constantes de negócio.

## 4. Entregas concluídas antes dos cinco ciclos

### Governança da Gestão SME

Concluída, mesclada e publicada pelos PRs #87, #88 e #89.

O código e a migration comprovam:

- tela mensal e Prontuário em modo gerencial restrito;
- ausência de análise técnica e de mutações operacionais para SME nas superfícies definidas;
- Pendências consultáveis em modo somente leitura;
- guardas de interface, handlers e serviços contra mutações programáticas;
- Registros Internos limitados a `actor_user_id = auth.uid()`;
- RLS específica em `administrative_logs`;
- preservação da leitura integral do Administrador técnico em sua visão técnica;
- programas por exercício mantidos fora desse escopo.

## 5. Ciclos de oficialização reconstruídos

### Ciclo 1 — competência mensal global

**PR funcional:** #92  
**Publicação controlada:** PRs #95 e #96

Entregue:

- domínio `RadarCompetenceContext`;
- competência ativa única por sessão;
- janeiro a dezembro de 2026 disponíveis;
- prioridade de inicialização por seleção persistida, seleção explícita, fechamento e fallback cronológico;
- sincronização entre exercício e competência;
- seletor global transversal;
- preservação entre telas e recarga;
- `closing_competence` atualizado para `2026-12` por fluxo auditado.

### Ciclo 2 — avaliação mensal certificada

**PR funcional:** #98  
**Publicação controlada:** PRs #101 e #102

Entregue:

- projeção canônica `evaluateMonthlyEvaluation`;
- resultado APTA/INAPTA;
- campos obrigatórios ausentes;
- estágio da bonificação;
- situação e grau de conclusão da análise técnica como dimensões independentes;
- pendências recortadas por escola, competência e programa;
- serviço de consulta e consolidação baseado na mesma projeção;
- persistência atômica, autoria, auditoria e `row_version` preservados.

### Ciclo 3 — timeline cronológica da unidade

**PR funcional:** #100  
**Publicação controlada:** PRs #101 e #102

Entregue:

- domínio `RadarSchoolTimeline`;
- projeção somente leitura, sem nova tabela;
- consolidação de verificações, pendências, tentativas, contatos, notas fiscais, bens e registros administrativos;
- ordenação decrescente e desempate estável;
- deduplicação da abertura da pendência;
- preservação de escola, competência, programa, pendência e autoria;
- recorte de visibilidade da Gestão SME;
- aba **Histórico cronológico** no Prontuário;
- DOM seguro e montagem idempotente.

### Ciclo 4 — certificação integral dos relatórios Excel

**PR funcional:** #103  
**Publicação acumulada:** deployment do PR #105

Entregue:

- auditoria de `resultadoBonif` contra a projeção mensal canônica;
- certificação separada do relatório institucional histórico/multicompetência e do Excel SME mensal;
- execução dos modelos, planos e renderizadores reais;
- comparação endereço a endereço e valor a valor no OOXML;
- confirmação das entradas obrigatórias do pacote;
- quatro abas institucionais e uma aba SME;
- ausência de `dataValidations` no Excel SME;
- manifesto determinístico com hashes estrutural, de conteúdo e de manifesto;
- massa sintética sem dados pessoais;
- regeneração obrigatória da evidência pelo `test:readiness`.

Limites preservados:

- o botão institucional ainda permanece vinculado ao CSV;
- a certificação automatizada não substitui a abertura manual no Microsoft Excel desktop;
- a evidência sintética não consulta nem grava Production.

### Ciclo 5 — navegação contextual

**PR funcional:** #104  
**Publicação controlada:** PRs #105 e #106

Entregue:

- módulo `RadarNavigationContext`;
- captura da origem antes de entrar em Prontuário ou Pendências;
- pilha limitada a 12 transições em `sessionStorage`;
- preservação de competência, rota, filtros, rolagem e foco;
- retorno ao controle acionável da unidade;
- fallback **Voltar para Carteira** em acesso direto;
- restauração compatível com scroll próprio no desktop e scroll da página no mobile;
- foco restrito a elementos acionáveis visíveis;
- montagem segura e idempotente;
- nenhuma tabela, migration, RPC ou persistência remota nova.

O SHA final do PR #104 teve sucesso nos workflows:

- Supabase readiness;
- Lighthouse CI;
- Saúde das dependências;
- Playwright desktop, Android e iPhone.

## 6. Verificação do toolchain

O `package.json` vigente comprova:

- `test:readiness` executa sintaxe, lint de segurança, lint E2E, testes unitários, certificação Excel, integração, readiness Supabase, alinhamento final, configuração de runtime, artefatos gerados, tipagem de banco e auditoria funcional;
- módulos dos cinco ciclos estão incluídos no gate de sintaxe;
- Node permanece aceito na faixa `>=24 <27`, portanto a decisão de fixar deliberadamente a major operacional continua pendente;
- dependências de desenvolvimento permanecem fixadas no arquivo, com lockfile versionado pelo projeto.

## 7. Divergências documentais encontradas

Antes desta reconciliação:

- `README.md` ainda apresentava maio de 2026 como limite operacional e os ciclos como pendentes;
- `docs/README.md` ainda descrevia avaliação e certificação Excel como não concluídas;
- `docs/CURRENT_STAGE.md` mantinha o PR #104 em validação, embora já estivesse mesclado e publicado;
- `docs/PROJECT_CONTEXT.md` ainda tratava competência global, timeline, certificação e navegação como direção futura;
- `docs/reference/STATUS_DOCUMENTOS.md` ainda descrevia a operação mensal limitada a maio;
- o PR #94 permanecia aberto apesar de substituído pelo PR #100;
- os PRs #70 e #5 permaneciam abertos como artefatos históricos não canônicos.

## 8. Bloqueadores reais restantes

A liberação oficial continua não declarada. Permanecem:

1. homologação manual dos relatórios no Microsoft Excel desktop;
2. habilitação da proteção contra senhas vazadas no Supabase Auth;
3. fixação deliberada da major operacional do Node;
4. teste de backup e restauração em ambiente descartável;
5. gate remoto por perfil e viewport com identidades controladas;
6. UAT funcional;
7. polimento editorial e visual sem alteração das regras de produto;
8. decisão formal de liberação, liberação com restrições ou não liberação.

O advisor de segurança do Supabase confirma que a proteção contra senhas vazadas permanece desabilitada.

## 9. Próxima decisão

Nenhuma nova frente funcional foi escolhida nesta auditoria. A documentação passa a reconhecer que os ciclos 1 a 5 estão concluídos e publicados. A próxima etapa deve ser decidida entre os bloqueadores reais restantes, sem reabrir entregas já concluídas nem retomar o cadastro de programas por exercício sem decisão específica.
