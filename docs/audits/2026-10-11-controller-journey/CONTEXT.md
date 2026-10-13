# Contexto confrontado — baseline pós-#437

Este documento é evidência datada, não nova especificação funcional.
Main examinada: `113841bda52ce3bbda228524daf9a7464f12b462`.
Foram obtidos metadados, diffs, discussões e reviews dos PRs abaixo pelo GitHub;
corpos, pontos funcionais e revisões materiais foram confrontados com os canônicos.
Comentários de execução pré-merge não representam pendências atuais.

| PR | Invariante / risco a observar nas jornadas |
|---|---|
| [#397](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/397) | Despesa independente de bonificação; primeira NF materializa contexto atomicamente, sem modificar decisão manual; identidade, CAS, idempotência e autoria preservados. |
| [#403](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/403) | Editar lançamento precisa ser encontrável; corrigir texto/valor/referência preserva Pendência/histórico e não autoriza classificação proibida. |
| [#404](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/404) | Retificação estrutural apenas quando histórico individual permite. Assessoria já enviada/analisada bloqueia mesmo sem Pendência; Inventariada terminal; a_identificar usa identificação própria. |
| [#406](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/406) / [#408](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/408) | Erro/stale/inflight/write/cooldown/foco/retomada não podem gerar tempestade nem deixar recovery perdido. Escopo patrimonial e rollback calculados com concorrência protegida. |
| [#410](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/410) | Fatia escolar com cobertura e exclusões, RLS, aplicação atômica, stale seguro, dirty na navegação, foco lógico e ausência de fade de refresh. Não ignorar outras escolas: projeções agregadas precisam convergir. |
| [#427](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/427) | Dashboard/Carteira/Competências usam leitura escolar conhecida; contatos/contexto incerto/reconnect/cobertura perdida continuam globais. DOM/CPU não receberam promessa de ganho. |
| [#429](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/429) | Recovery precisa trazer estado novo, não aproveitar leitura velha retida. Falha anterior ao spec não é defeito do produto. |
| [#415](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/415) | Analytics/Speed Insights só Production; não fabricar amostras de campo com automação. |
| [#426](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/426) | Conta real legitimamente autorizada; smoke agendado somente leitura; manual habilita CRUD reversível. Não publicar credenciais/traces autenticados de Production. |
| [#431](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/431) | Arquivos históricos reclassificados. Drawer PROD-UX-08 e #394 ainda precisam reprodução atual, não reforma por relato antigo. |
| [#433](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/433)–[#437](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/437) | Modernização isolada concluída; manter Node 24/CLI 2.114.0 e lockfile. Testes históricos não equivalem a jornadas realizadas nesta etapa. |

## Decisões para a auditoria

- Interface examinada primeiro; código/DOM entram para executar controles percebidos
  ou explicar anomalia, sem esconder encontrabilidade ruim.
- Ambiente descartável usa Auth/RLS/RPC/Broadcast reais para efeitos irreversíveis.
  O Dashboard em modo local antes do setup serviu apenas para orientação visual.
- Produção: main/deployment/migration e smoke público revalidados; login institucional
  visto, mas **nenhum fluxo autenticado de Production executado**.
- Métricas antigas #410 e #427 têm baselines distintas; não atribuir deltas históricos
  à presente etapa ou chamar volume local de performance de Internet.
- Não reabrir por checklist os PRs #407/#409, encerrados e substituídos.
- Achado precisa ligar tarefa, regra, autoridade, persistência e projeções; duas
  correções sem convergência exigem revisão da abordagem.
