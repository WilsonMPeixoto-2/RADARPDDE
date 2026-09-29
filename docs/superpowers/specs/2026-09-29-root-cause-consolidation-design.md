# RADAR PDDE — desenho de consolidação por causas-raiz

**Data:** 29 de setembro de 2026  
**Baseline de referência:** `main@eb6f33f2ec123c5f2f6bdf08f63ab0e18cbc4fa2`  
**Status:** desenho consolidado para execução posterior; nenhuma mudança funcional neste documento.

## 1. Objetivo

Reduzir as causas estruturais de lentidão, regressão e dificuldade de diagnóstico do RADAR sem reconstrução ampla e sem substituir problemas antigos por novas camadas de compatibilidade.

O objetivo não é “modernizar tudo”. É restaurar **autoridades claras**, tornar a sincronização operacional proporcional à ação executada e reduzir progressivamente a concentração/coupling quando houver evidência de benefício.

## 2. Visão analítica transversal

O problema histórico do RADAR não deve ser tratado como uma coleção de defeitos independentes.

Ao longo da evolução do produto, soluções locais corretas foram frequentemente adicionadas sobre implementações existentes — wrappers sobre handlers, observadores sobre renderizadores, polling de readiness, integrações dinâmicas, regras CSS posteriores substituindo regras anteriores e novas responsabilidades acumuladas em `app.js` — sem consolidação proporcional das camadas anteriores.

O padrão é:

```
comportamento existente
+ adaptação
+ wrapper
+ exceção
+ observer/polling
+ regra adicional
+ override
+ teste local
```

O resultado agregado é maior acoplamento, ordem de carregamento material, blast radius imprevisível, dificuldade de causa-raiz e regressões em áreas aparentemente não relacionadas.

Esta visão **não é um achado isolado**. É o critério de projeto para todas as frentes abaixo.

### Regra permanente

Antes de qualquer correção:

1. identificar quem deveria ser a autoridade única do comportamento;
2. mapear quantas implementações participam hoje;
3. distinguir autoridade atual de camada histórica/compatibilidade;
4. preferir substituir/consolidar a acrescentar;
5. remover a implementação superseded somente após prova funcional e de regressão.

## 3. Evidência de performance que altera a prioridade

A medição autenticada em Production de 29/09/2026 demonstrou:

- troca de competência: 5,69–9,50 s;
- 172–292 requests REST por troca;
- aproximadamente 89% do tempo em `DataService.loadOperationalContext()`;
- `switchView()`: apenas 12–19 ms;
- contagem de requests reproduzida exatamente em duas execuções independentes;
- gravação `save_verification_with_log`: mediana ~73 ms, p95 ~300 ms;
- uma escrita isolada de 301 ms seguida por um broadcast e 997 GETs operacionais no mesmo cliente em ~16 s;
- interações locais na Avaliação sem nova hidratação: zero requests;
- mutações relevantes de DOM, mas nenhuma piscada reproduzida frame a frame.

A evidência integral está em:

`docs/evidence/2026-09-29-production-evaluation-performance/README.md`.

## 4. Decisões consolidadas

### 4.1 Performance e contexto operacional — ação prioritária

A causa mais bem suportada é o fan-out de `queryOperationalContext()`, especialmente `queryContextDependencies()`, que converte dependências históricas legítimas em muitas consultas HTTP por combinação escola/competência/programa.

Decisão:

- preservar a semântica contextual;
- substituir a implementação fragmentada por **uma leitura set-based canônica no banco**, mantendo a interface `queryOperationalContext()`;
- não criar `V2` paralela;
- não restaurar bootstrap global;
- não usar cache como primeira correção;
- não alterar Realtime antes de medir o comportamento depois da consolidação da leitura.

### 4.2 Sincronização pós-gravação — segunda etapa da mesma frente

As RPCs de gravação são rápidas. A demora percebida é posterior.

Decisão:

- primeiro tornar a releitura contextual barata e limitada;
- depois repetir a prova de uma escrita isolada;
- somente se ainda houver refresh redundante material, desenhar deduplicação específica de invalidação;
- não introduzir heurística temporal para “ignorar broadcasts” sem correlação segura.

### 4.3 Concentração em `app.js` — redução progressiva

`app.js` concentra aproximadamente 13 mil linhas e centenas de funções/responsabilidades.

Decisão:

- não fazer rewrite;
- mapear clusters, dependências e autoridades;
- impedir novo crescimento desnecessário;
- extrair helpers/áreas de baixo acoplamento quando uma frente real já tocar aquele código;
- tratar regressões e performance como sinais para escolher alvos de desacoplamento.

### 4.4 Wrappers, bootstrap e readiness — consolidar, não remover mecanicamente

Wrappers e polling não são intrinsecamente defeitos. O problema é quando instalação e comportamento dependem de ordem implícita e múltiplas camadas.

Decisão:

- manter wrappers que tenham responsabilidade funcional comprovada;
- remover somente redundâncias demonstradas;
- migrar readiness crítico para instalação explícita/eventos determinísticos;
- começar pelo caso conhecido de `atomic-analysis-pendency.js`, hoje fail-closed mas ainda dependente de polling e não explicitamente incluído no gate final de `installCriticalExtensions()`;
- preservar o fail-closed de “Incorreto + Pendência”.

### 4.5 PROD-UX-08 — correção localizada

O conflito do drawer global foi analisado como composição específica do componente.

Decisão:

- não abrir revisão global de CSS;
- escolher uma única autoridade de geometria do drawer;
- remover/neutralizar regras superseded desse componente em `task-9-pendencias.css`, `task-9-cross-view.css`, `layout-responsive-2026.css` e `desktop-basic-monitors.css`;
- validar conteúdo real, scroll e transições desktop.

### 4.6 Segurança/autorização — sem frente corretiva

A auditoria de Auth/RLS/autorização não revelou defeito ativo que exija ação.

Decisão: nenhuma frente nova.

### 4.7 `registered_invoices` — hardening não prioritário por decisão de produto

O produto atual é ferramenta interna de equipe pequena, cooperativa e confiável. Restrições adicionais de edição/exclusão foram deliberadamente flexibilizadas para favorecer o trabalho real.

Decisão:

- não executar hardening adicional agora;
- não tratar ADR-051 como dívida ativa;
- reavaliar apenas se o RADAR ganhar adoção institucional ampla ou outro modelo de ameaça.

### 4.8 Piscada de tela — sintoma ainda não localizado

A troca de competência não reproduziu frames vazios/ocultos/degradados.

Decisão:

- não corrigir “flicker” por hipótese;
- registrar nova reprodução real quando ocorrer;
- instrumentar a interação específica antes de qualquer alteração visual ou de renderização.

### 4.9 Matriz funcional e documentação — rebaseline

A matriz funcional de 09/09 está atrás das evidências posteriores.

Decisão:

- reavaliar cada item Parcial contra evidência posterior;
- não promover cobertura por inferência;
- atualizar documentos canônicos somente com prova localizada.

### 4.10 Ferramentas de análise estática

`dependency-cruiser` e `knip` já estão instalados no projeto.

Decisão:

- usar os recursos existentes antes de instalar novas ferramentas;
- `knip` inicialmente apenas diagnóstico, sem `--fix`;
- ampliar regras arquiteturais do dependency-cruiser quando uma dependência proibida concreta for identificada;
- não executar migração em massa para TypeScript.

## 5. Arquitetura proposta para a leitura operacional

A interface pública permanece:

`OperationalSupabaseRepository.queryOperationalContext(options)`

A implementação passa a usar uma única autoridade set-based no Supabase:

`public.read_operational_context(p_competence_id text, p_history_statuses text[]) -> jsonb`

Características:

- `SECURITY INVOKER`;
- RLS continua sendo aplicada;
- leitura somente;
- CTEs/conjuntos calculam competência corrente, Pendências ativas/históricas solicitadas, bens ativos e dependências necessárias;
- tentativas/contatos são unidos pelos IDs de Pendência;
- verificações e NFs históricas são fechadas por dependência funcional, não por loop cliente;
- assets vinculados continuam preservados;
- retorno JSON mantém o contrato atual de `competenceId + entities`;
- o frontend não ganha uma segunda representação.

Após homologação:

- `queryContextDependencies()` deixa de participar do caminho de Production e é removido se não houver consumidor remanescente;
- `DataService.loadOperationalContext()` permanece a autoridade de aplicação/cancelamento/staleness;
- `StatePort` continua recebendo apenas as entidades contextuais.

## 6. Ordem de execução

1. **Plano A — contexto operacional e performance.**
2. Repetir baseline em Production e decidir, por evidência, se Realtime pós-write exige ajuste adicional.
3. **Plano B — autoridades frontend, readiness, wrappers e concentração.**
4. **Plano C — PROD-UX-08**, podendo ser executado em paralelo somente se a branch permanecer isolada e sem tocar sincronização.
5. **Plano D — matriz funcional/documentação e gates.**
6. Somente depois reavaliar a frente ampla de evolução visual registrada em `DESIGN_TOOLING.md`.

## 7. Critérios globais

Nenhuma frente é concluída por “testes verdes” isoladamente.

Cada mudança relevante precisa provar:

- comportamento funcional real;
- redução ou não-regressão das métricas pertinentes;
- ausência de nova camada paralela;
- remoção explícita de implementação superseded quando aplicável;
- CI direcionada e regressão relacionada;
- validação autenticada em Production quando a superfície for operacional;
- evidência no mesmo SHA.

## 8. Restrições

Não fazer nesta sequência:

- rewrite de `app.js`;
- migração de framework;
- hardening de `registered_invoices`;
- alteração de Auth/RLS sem nova evidência;
- remoção indiscriminada de wrappers/observers/timers;
- CSS global por causa do drawer;
- aumento de timeout para mascarar performance;
- cache como substituto da correção do fan-out;
- atualização cega da Supabase CLI 2.114.0;
- atualização automática de goldens visuais para obter verde;
- correção da “piscada” sem reprodução.
