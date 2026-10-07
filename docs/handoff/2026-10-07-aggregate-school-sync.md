# Dashboard/Carteira — sincronização escolar residual

Classe: handoff da frente, sem criar regra funcional nova.

## Baseline e objetivo

- Main verificada em 07/10: `2cb4fb359ff9614ebd7fdf824e297f22ebcb025f`.
- Branch: `fix/aggregate-school-sync-2026-10-07`, criada dessa main.
- #410 está mergeado; #407/#409 e checkpoints Draft antigos são históricos.
- Completar a aplicação escolar já existente para Dashboard, Carteira e
  Competências. Nenhuma mudança em Auth/RLS, schema, dependências, observabilidade
  ou smoke de Production pertence a esta frente.
- Não fazer merge antes de apresentar resultados ao usuário.

## Fronteira causal identificada no código

`decideInvalidationAction`, em `operational-realtime-invalidation.js`, transforma
todo evento fora do Prontuário em global, mesmo com entidade coberta e schoolId.
O shared refresh já oferece `refreshSchool`, aplica a fatia pelo DataService e
invoca `refreshCurrentView`. Dashboard/Carteira calculam seus indicadores a partir
da memória canônica; não precisam de um novo renderer ou bootstrap.

Há duas fronteiras adjacentes a confrontar: navegação para agregado com escolas
dirty e coalescimento de escolas diferentes no debounce. Ambas ainda promovem
para global. Não alterar sem contraprova e preservar o fallback necessário.

Contatos gerais (`pendency_contacts`) não têm a mesma cobertura das seis coleções
operacionais: a presença de schoolId por si só não permite trocar seu fallback.
Evento desconhecido, reconexão e competência/bootstrap continuam conservadores.

## Checkpoint inicial — apenas teste, nenhuma correção de produto

`supabase-aggregate-school-sync.spec.js` autentica três sessões reais:
Dashboard/controlador, Carteira/assistente e escritor/controlador. O escritor usa
controles reais para criar, editar e excluir Despesa a identificar e alterar outra
escola. Observadores conferem agregados crescentes/decrescentes, estado da outra
escola, filtros e competência. O contrato final exige cinco leituras escolares e
zero globais por observador. O benchmark registra respostas/bytes, aplicações,
renders, DOM, long tasks, erros e capturas em artifact. Ainda executar para provar
RED; leitura de código não substitui resultado de navegador.

Supabase local canônico 2.114.0 não pôde subir: a imagem Postgres excedeu o disco
de 32 GB. A prova usará o Supabase descartável do workflow de hardening existente.
Não adaptar CLI nem enfraquecer RLS para contornar capacidade do workspace.

## Continuidade

1. Executar workflow `sync-hardening-targeted.yml` nesta branch e abrir artifact.
2. Diferenciar eventual erro de fixture/seletor do RED de produto.
3. Salvar números e run/SHA do RED antes de modificar implementação.
4. Reutilizar `refreshSchool` e o dirty/generation do #410, sem segundo scheduler.
5. Provar GREEN, recuperação/inflight/navegação/perfis e inspeção visual.
6. Atualizar docs canônicas estritamente afetadas, abrir PR e certificar CI final.

Dados brutos ficam nos artifacts; resumo, hashes, decisões e orientação ficam no
Git. Nenhuma escrita nem teste destrutivo em Production foi realizado.
