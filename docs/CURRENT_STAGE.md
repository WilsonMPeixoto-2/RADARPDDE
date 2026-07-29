# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 28 de julho de 2026  
**HEAD da `main`:** `6310270e20be024bb296da9b89f9029b4ccee7c3`  
**HEAD funcional publicado:** `e85d3260683b99e2d67e51e07cf4bac8690b0700`  
**Deployment funcional em Production:** `dpl_7dAaUfecP9NkTigAfpbaAk9DpHEN` — estado `READY`  
**Frente em validação:** certificação integral dos relatórios Excel — PR #103  
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

### Ciclo 4 — certificação integral dos relatórios Excel

Implementado no PR #103 e em validação:

- auditoria de `resultadoBonif` contra `evaluateMonthlyEvaluation`;
- relatório institucional preservado como histórico e multicompetência;
- Excel SME preservado como mensal e restrito à competência ativa;
- equivalência institucional com o CSV legado;
- extração das worksheets produzidas pelos renderers reais;
- comparação endereço a endereço e valor a valor;
- validação das entradas OOXML obrigatórias;
- confirmação de quatro abas institucionais e uma aba SME;
- confirmação de ausência de `dataValidations`;
- hash estrutural, hash de conteúdo e hash do manifesto;
- contexto de divergência anonimizado por SHA-256;
- massa sintética sem dados pessoais;
- manifesto versionado e regenerado obrigatoriamente pelo readiness.

## 3. Estado por camada

| Camada | Estado |
|---|---|
| GitHub | `main` contém competências, avaliação e timeline; certificação Excel em PR #103. |
| Vercel Production | deployment `dpl_7dAaUfecP9NkTigAfpbaAk9DpHEN` em estado `READY`. |
| Runtime publicado | `production`, `supabase-production`, repositório remoto habilitado. |
| Supabase | projeto `scnryinorqeucbfkioxo` ativo e saudável. |
| Calendário | `closing_competence = 2026-12`, `row_version = 5`. |
| Auth/RLS | ativos; acesso anônimo bloqueado. |
| Governança SME | concluída e publicada. |
| Competência global | concluída, publicada e operacionalizada. |
| Avaliação mensal | concluída e publicada. |
| Timeline da unidade | concluída e publicada. |
| Excel institucional | modelo e renderer implementados; certificação automatizada em gate final. |
| Excel SME mensal | modelo e renderer implementados; certificação automatizada em gate final. |
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

A timeline não cria tabela, migration, RPC ou nova fonte de verdade.

## 8. Certificação Excel — frente atual

### 8.1 Produtos distintos

#### Relatório institucional

- histórico e multicompetência;
- uma linha por escola, competência e programa consolidado;
- quatro abas: `BONIFICACOES`, `SINTESE`, `QUALIDADE_DADOS` e `METADADOS`;
- equivalência com o relatório lógico original obrigatória.

#### Excel SME mensal

- uma única competência por arquivo;
- todas as unidades escolares no escopo;
- 26 colunas;
- agrupamentos PDDE Básico, Qualidade e Equidade;
- uma única planilha com o nome do mês;
- ausência das validações que provocavam reparo pelo Microsoft Excel.

### 8.2 Cadeia certificada

```text
estado de origem
→ evaluateMonthlyEvaluation
→ modelo lógico
→ plano do workbook, quando aplicável
→ pacote OOXML
→ endereço e valor da célula
→ manifesto SHA-256
```

### 8.3 Resultado da massa sintética

| Verificação | Resultado |
|---|---:|
| Resultados canônicos auditados | 4 |
| Divergências canônicas | 0 |
| Linhas institucionais | 4 |
| Células institucionais certificadas | 48 |
| Divergências de célula institucional | 0 |
| Abas institucionais | 4 |
| Escolas no Excel SME | 2 |
| Colunas SME | 26 |
| Células SME certificadas | 78 |
| Divergências de célula SME | 0 |
| Abas SME | 1 |
| `dataValidations` | ausente |

Hashes da evidência versionada:

```text
manifestHash = ee589e0d6f7361c9dd8176baccbcd9ceb931f4b34eb698c2f5dd97a49877f58b
institutional.contentHash = a268bf40e6a9d3fc4d498af7568fc58d83d7960f64b9c99bf0d2fc074308acc3
smeMonthly.contentHash = 7e6ce22739f5323193ceb284e43678648fe8772e21775467bf625340a766bcba
```

Evidência:

```text
docs/evidence/excel-certification/synthetic-manifest.json
```

O readiness executa o gerador em modo `--check`. Qualquer divergência entre o manifesto regenerado e a evidência versionada bloqueia o PR.

### 8.4 Limites

Esta entrega não:

- substitui o botão institucional ainda vinculado ao CSV;
- altera a regra de inclusão dos relatórios;
- consulta ou grava dados em Production;
- comprova abertura manual no Microsoft Excel desktop.

## 9. Segurança operacional

Comprovado:

- acesso anônimo bloqueado;
- somente chave publicável no frontend;
- RLS por papel e escopo;
- Edge Function protegida por JWT;
- alterações auditáveis;
- backup lógico pré-ativação disponível;
- deployments automáticos bloqueados após as janelas controladas;
- evidência Excel sintética sem dados pessoais.

Bloqueadores antes do release oficial:

- habilitar proteção contra senhas vazadas no Supabase Auth;
- fixar deliberadamente a major do Node;
- validar backup e restauração em ambiente descartável;
- executar gate remoto por perfil;
- concluir o gate do PR #103;
- realizar homologação manual dos arquivos no Microsoft Excel desktop;
- concluir UAT.

## 10. Ordem das próximas entregas

1. concluir e mesclar a certificação automatizada dos relatórios Excel;
2. implementar navegação contextual e botões de voltar;
3. executar polimento editorial e visual;
4. fortalecer segurança, realizar UAT e decidir a liberação oficial.

Plano detalhado: [`superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md`](superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md).
