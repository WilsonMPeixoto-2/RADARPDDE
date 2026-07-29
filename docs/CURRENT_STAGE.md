# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 28 de julho de 2026  
**HEAD da `main`:** `d7e3fb4361680200c4c900a8b36b920ea3d7dc63`  
**Deployment funcional em Production:** `dpl_6tjSL6iFXAR2CkhPoRBm8kvtyvtJ` — commit `4964049e426181fef1d01cb7d2309b898a7bf9d7`  
**Frente em validação:** timeline cronológica da unidade — PR #100  
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

A integração entre frontend, Supabase Auth, PostgREST, RLS, PostgreSQL e Vercel Production está ativa. A governança da Gestão SME e o contexto mensal global estão publicados.

Dois ciclos da oficialização já foram concluídos no código:

### Ciclo 1 — competência mensal global

- seletor global de competência;
- janeiro a dezembro de 2026 disponíveis;
- preservação da seleção entre telas, perfis e recarga;
- sincronização entre exercício e competência;
- `closing_competence = 2026-12`;
- alteração auditada com `row_version = 5`;
- publicação Production concluída;
- deployment automático novamente bloqueado.

### Ciclo 2 — avaliação mensal certificada

- projeção canônica única de APTA/INAPTA;
- campos obrigatórios e `Não se aplica` indevido tratados;
- situação técnica separada do grau de conclusão;
- pendências filtradas por escola, competência e programa;
- consolidação usando a mesma projeção da consulta;
- persistência atômica, autoria, log e `row_version` preservados;
- jornada real em agosto validada após recarga;
- readiness, migrations, Supabase local, Auth/RLS, Playwright e Lighthouse aprovados;
- PR #98 mesclado na `main` como `d7e3fb4361680200c4c900a8b36b920ea3d7dc63`.

A avaliação mensal ainda não foi publicada em novo deployment. A publicação será agrupada com a timeline após o gate do PR #100.

## 3. Estado por camada

| Camada | Estado |
|---|---|
| GitHub | `main` contém competência global e avaliação mensal certificada; timeline em PR #100. |
| Vercel Production | deployment `dpl_6tjSL6iFXAR2CkhPoRBm8kvtyvtJ` em estado `READY`. |
| Runtime publicado | `production`, `supabase-production`, repositório remoto habilitado. |
| Supabase | projeto `scnryinorqeucbfkioxo` ativo e saudável. |
| Calendário | `closing_competence = 2026-12`, `row_version = 5`. |
| Auth/RLS | ativos; acesso anônimo bloqueado. |
| Governança SME | concluída e publicada. |
| Competência global | concluída, publicada e operacionalizada. |
| Avaliação mensal | concluída na `main`; publicação agrupada pendente. |
| Timeline da unidade | domínio, integração e testes em validação no PR #100. |
| Excel SME | implementado; certificação integral pendente. |
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

## 7. Timeline cronológica — frente atual

O PR #100 cria uma projeção sem nova tabela e sem persistência paralela. A timeline combina, por unidade e competência:

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

Regras obrigatórias:

1. ordenação decrescente por data e desempate estável por identificador;
2. ausência de abertura duplicada entre pendência e histórico incorporado;
3. isolamento por escola e competência;
4. preservação dos vínculos com programa e pendência;
5. visibilidade gerencial da Gestão SME sem detalhes técnicos restritos;
6. aba acessível no Prontuário;
7. ausência de nova fonte de verdade.

A extensão é carregada depois de `app.js` por bootstrap próprio e compõe o renderizador do Prontuário com os wrappers de navegação existentes.

## 8. Excel

O Excel SME mensal está implementado e não possui o defeito conhecido de reparo. Permanecem pendentes:

- massa representativa;
- reconciliação Supabase → frontend → projeção canônica → modelo → célula XLSX;
- isolamento entre competências;
- correção do escopo mensal do Excel editorial;
- certificação dos dois modelos;
- abertura no Microsoft Excel desktop;
- manifesto e hashes de evidência.

## 9. Segurança operacional

Comprovado:

- acesso anônimo bloqueado;
- somente chave publicável no frontend;
- RLS por papel e escopo;
- Edge Function protegida por JWT;
- alterações auditáveis;
- backup lógico pré-ativação disponível;
- deployments automáticos bloqueados após a janela controlada.

Bloqueadores antes do release oficial:

- habilitar proteção contra senhas vazadas no Supabase Auth;
- fixar deliberadamente a major do Node;
- validar backup e restauração em ambiente descartável;
- executar gate remoto por perfil;
- certificar os relatórios Excel;
- concluir UAT.

## 10. Ordem das próximas entregas

1. concluir, mesclar e publicar a timeline juntamente com a avaliação mensal;
2. reconciliar e certificar os dois relatórios Excel;
3. implementar navegação contextual e botões de voltar;
4. executar polimento editorial e visual;
5. fortalecer segurança, realizar UAT e decidir a liberação oficial.

Plano detalhado: [`superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md`](superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md).