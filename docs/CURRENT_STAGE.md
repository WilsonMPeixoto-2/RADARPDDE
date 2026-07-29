# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 28 de julho de 2026  
**HEAD funcional publicado:** `e85d3260683b99e2d67e51e07cf4bac8690b0700`  
**Deployment funcional em Production:** `dpl_7dAaUfecP9NkTigAfpbaAk9DpHEN` — estado `READY`  
**Frente em execução:** certificação integral dos relatórios Excel  
**Natureza:** documento operacional e transitório

## 1. Regra de leitura

Antes de iniciar tarefa:

1. confirmar o HEAD remoto da `main`;
2. verificar PRs e workflows posteriores;
3. confirmar o deployment Vercel correspondente;
4. confirmar o estado do Supabase autorizado;
5. confrontar documentação e artefatos com código e ambientes;
6. atualizar este documento quando o estado mudar.

Código, banco e deployment prevalecem sobre planos e relatórios históricos.

## 2. Situação executiva

A integração entre frontend, Supabase Auth, PostgREST, RLS, PostgreSQL e Vercel Production está ativa. A governança da Gestão SME, o contexto mensal global, a avaliação mensal canônica e a timeline cronológica estão publicados.

### Ciclo 1 — competência mensal global

- seletor global de competência;
- janeiro a dezembro de 2026 disponíveis;
- preservação da seleção entre telas, perfis e recarga;
- sincronização entre exercício e competência;
- `closing_competence = 2026-12`;
- alteração auditada com `row_version = 5`;
- publicação Production concluída.

### Ciclo 2 — avaliação mensal certificada

- projeção canônica única de APTA/INAPTA;
- campos obrigatórios e `Não se aplica` indevido tratados;
- situação técnica separada do grau de conclusão;
- pendências filtradas por escola, competência e programa;
- consolidação usando a mesma projeção da consulta;
- persistência atômica, autoria, log e `row_version` preservados;
- jornada real em agosto validada após recarga;
- PR #98 mesclado como `d7e3fb4361680200c4c900a8b36b920ea3d7dc63`;
- publicado em Production no deployment `dpl_7dAaUfecP9NkTigAfpbaAk9DpHEN`.

### Ciclo 3 — timeline cronológica da unidade

- projeção somente leitura por unidade e competência;
- verificações, pendências, tentativas, contatos, notas fiscais, bens e logs consolidados;
- ordenação decrescente e desempate estável;
- abertura de pendência sem duplicidade;
- vínculos por programa, competência e pendência preservados;
- detalhe técnico restrito ocultado da Gestão SME;
- aba **Histórico cronológico** incorporada ao Prontuário;
- carregamento pós-`app.js` idempotente e degradável;
- montagem integral por DOM seguro, sem `innerHTML`;
- 129 testes Playwright aprovados no gate final;
- PR #100 mesclado como `fcf1ced6fca0cfda1d021915b17328aa299c1224`;
- publicado em Production no deployment `dpl_7dAaUfecP9NkTigAfpbaAk9DpHEN`.

A publicação conjunta dos ciclos 2 e 3 foi confirmada por smoke direto do runtime Production, da projeção mensal, do domínio da timeline e do bootstrap das extensões.

## 3. Estado por camada

| Camada | Estado |
|---|---|
| GitHub | `main` contém competência global, avaliação mensal e timeline cronológica. |
| Vercel Production | deployment `dpl_7dAaUfecP9NkTigAfpbaAk9DpHEN` em estado `READY`. |
| Runtime publicado | `production`, `supabase-production`, repositório remoto habilitado. |
| Supabase | projeto `scnryinorqeucbfkioxo` ativo e saudável. |
| Calendário | `closing_competence = 2026-12`, `row_version = 5`. |
| Auth/RLS | ativos; acesso anônimo bloqueado. |
| Governança SME | concluída e publicada. |
| Competência global | concluída, publicada e operacionalizada. |
| Avaliação mensal | concluída e publicada. |
| Timeline da unidade | concluída e publicada. |
| Excel institucional | implementado; certificação célula a célula pendente. |
| Excel SME mensal | implementado; certificação célula a célula pendente. |
| Deployment automático | bloqueio restaurado após a janela controlada. |
| Liberação oficial | não declarada. |

## 4. Dados observados em Production

Data de corte: 28/07/2026.

| Entidade | Quantidade |
|---|---:|
| Configuração global | 1 |
| Programas | 8 |
| Controladores | 6 |
| Integrantes no diretório de Inventário | 4 |
| Competências | 12 |
| Escolas | 164 |
| Vínculos escola–programa | 431 |
| Perfis ativos | 13 |
| Verificações | 6 |
| Pendências | 3 |
| Tentativas | 3 |
| Contatos | 5 |
| Registros administrativos | 82 ou mais, incluindo a ativação do calendário |
| Bens | 2 |

As quantidades são retrato operacional e podem mudar com o uso real.

## 5. Perfis

| Perfil | Quantidade |
|---|---:|
| Controlador | 6 |
| Assistente de Verbas Federais | 1 |
| Equipe de Inventário | 4 |
| Gestão SME | 1 |
| Administrador técnico | 1 |

A carteira organiza responsabilidade, mas não impede colaboração entre Controladores da mesma CRE. A Gestão SME permanece somente leitura nas superfícies definidas pela ADR-022. O Inventário permanece restrito ao fluxo patrimonial autorizado.

## 6. Competências e avaliação mensal

A identidade operacional é:

```text
escola + competência + programa
```

A projeção canônica reúne:

- possibilidade de consolidação;
- resultado `apta`, `inapta` ou nulo;
- campos ausentes;
- estágio da bonificação;
- situação da análise técnica;
- conclusão técnica `not_started`, `in_progress` ou `complete`;
- pendências abertas;
- itens aguardando reanálise;
- total de pendências ativas.

A situação técnica e a conclusão são independentes. Uma análise pode apresentar documento incorreto e permanecer incompleta quando outros documentos ainda não foram analisados.

## 7. Timeline cronológica

A timeline combina, por unidade e competência:

- consolidações de bonificação;
- abertura, resolução e cancelamento de pendências;
- novos envios e reanálises;
- contatos e cobranças;
- notas fiscais;
- bens permanentes e inventariação;
- registros administrativos autorizados.

Contrato de cada evento:

```text
id, occurredAt, type, title, description, actor, status,
competenceKey, programId, pendencyId, visibility, sourceEntity, sourceId
```

A timeline não cria tabela, migration, RPC ou nova fonte de verdade.

## 8. Certificação Excel — frente atual

Existem dois produtos distintos e ambos devem preservar seus contratos próprios:

### Relatório institucional

- histórico e multicompetência;
- uma linha por escola, competência e programa consolidado;
- quatro abas: `BONIFICACOES`, `SINTESE`, `QUALIDADE_DADOS` e `METADADOS`;
- equivalência com o relatório lógico original obrigatória.

### Excel SME mensal

- uma única competência por arquivo;
- todas as unidades escolares no escopo;
- 26 colunas;
- agrupamentos PDDE Básico, Qualidade e Equidade;
- uma única planilha com o nome do mês;
- ausência das validações que provocavam reparo pelo Microsoft Excel.

A certificação deverá comprovar, separadamente:

```text
estado de origem
→ evaluateMonthlyEvaluation
→ modelo lógico do relatório
→ pacote OOXML
→ endereço e valor da célula XLSX
```

Gates previstos:

- resultado armazenado compatível com a projeção canônica;
- isolamento absoluto da competência no Excel SME;
- preservação deliberada do escopo histórico no relatório institucional;
- correspondência célula a célula;
- contagens, resumos e agregações reconciliados;
- pacote OOXML íntegro;
- arquivo sem reparo;
- manifesto determinístico com hashes e divergências;
- evidência sem dados pessoais desnecessários.

## 9. Segurança operacional

Comprovado:

- acesso anônimo bloqueado;
- somente chave publicável no frontend;
- RLS por papel e escopo;
- Edge Function protegida por JWT;
- alterações auditáveis;
- backup lógico pré-ativação disponível;
- deployments automáticos bloqueados após as janelas controladas.

Bloqueadores antes do release oficial:

- habilitar proteção contra senhas vazadas no Supabase Auth;
- fixar deliberadamente a major do Node;
- validar backup e restauração em ambiente descartável;
- executar gate remoto por perfil;
- concluir a certificação dos relatórios Excel;
- concluir UAT.

## 10. Ordem das próximas entregas

1. reconciliar e certificar os dois relatórios Excel;
2. implementar navegação contextual e botões de voltar;
3. executar polimento editorial e visual;
4. fortalecer segurança, realizar UAT e decidir a liberação oficial.

Plano detalhado: [`superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md`](superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md).
