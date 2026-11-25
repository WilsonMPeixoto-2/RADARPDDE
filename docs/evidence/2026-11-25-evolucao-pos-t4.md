# Evolução do RADAR PDDE após T4 — evidências de 25/11/2026

**Base:** `6dd6a9f9f8147deb39c5813baad0b5521427b8bd` · **Branch de trabalho:** `feat/evolucao-integral-pos-t4-20261125`.

Evidência da evolução após a publicação de #562. Estas mudanças ainda precisam de revisão, gates e publicação próprios; este documento não substitui o plano T5.

## Engenharia, integração e preparação T5 — Eixos 1, 3 e 7

### Origem e limites da implementação

A análise seguiu `AGENTS.md`, [CURRENT_STAGE](../CURRENT_STAGE.md), o [contrato de correção](../reference/PRONTUARIO_CORRECAO_CONTRATO.md), o [plano T0–T6](../superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md), o [modelo canônico](../reference/SYSTEM_CANONICAL_MODEL.md) e a [linhagem](../continuity/prontuario-t0-t6/LINEAGE.md). Reutiliza [D020](../continuity/prontuario-t0-t6/DECISION_IMPACT_PROTOCOL.md) para propagar as decisões.

O caminho efetivo T2–T4 continua em `operational-correction-client.js`, `operational-correction-dialog.js` e nos contratos SQL publicados. Plano do servidor, idempotência e recarga após recibo confirmado foram preservados. Não houve alteração de RPC, migration, autorização, bonificação ou patrimônio nesta frente.

Foram escolhidos dois problemas demonstráveis, com alcance delimitado:

| Achado e origem | Antes | Correção implementada | Evidência |
|---|---|---|---|
| Projeção em `src/domain/school-timeline.js` | A reanálise substituía o envio; para SME, ambos desapareciam após o filtro técnico. A observação do envio era reutilizada na reanálise; os campos reais de autoria eram ignorados. | Dois eventos com IDs estáveis e suas próprias datas, autoria e observações. Envio permanece “Registrado”; resultado técnico permanece restrito. Sem evento com data inválida. | Três contraprovas unitárias; E2E existente ajustado para dez eventos, envio preservado e recorte SME. |
| Recomposição em `src/domain/pendency-correction.js` | Alvo escolhido por número/posição, IDs fabricados e sequência renumerada. Texto corrigido podia desfazer cancelamento/reabertura posterior. | Identidade persistida única; preservação de números/versões; sequência explícita sem reativar tentativa substituída. Eventos independentes preservados. Evidência insuficiente retorna ambiguidade sem alteração. | Contraprovas de identidade, versões, cancelamento/reabertura, ordem e substituição; regressão de correção dos erros atuais. |

**Alcance:** a timeline é usada pelo produto. O helper permanece preparatório, sem consumidor de produção, interface ou escrita nova. T5 não foi concluído.

### Verificação executada

**RED:** nove novas contraprovas falharam no código anterior; onze testes anteriores passaram. São casos sintéticos: as falhas do helper preparatório não representam falhas de produção.

**Revisão adversarial adicional:** um novo envio aguardando reanálise pode continuar exibindo erros de uma análise anterior. Corrigir/excluir essa análise sem saber se ela sustenta `errosAtuais` produzia uma proposta internamente divergente. A contraprova adicional falhou antes da correção; o helper agora retorna `AMBIGUOUS_PENDENCY_HISTORY` sem alteração para esse alcance não comprovado. Foram verificados `correct_review`, `delete_review` e `delete_submission`.

**GREEN:** **23/23 testes** focais e adjacentes, incluindo carregamento do histórico somente na ativação explícita da timeline:

```bash
node --test tests/unit/pendency-correction.test.js tests/unit/school-timeline.test.js tests/unit/school-timeline-lazy-logs.test.js
node --check src/domain/pendency-correction.js
node --check src/domain/school-timeline.js
node --check tests/e2e/school-timeline.spec.js
git diff --check
```

O E2E `tests/e2e/school-timeline.spec.js` foi atualizado e teve a sintaxe verificada. **Execução navegada/captura visual pendentes:** Chromium ausente; instalação tentada pelo coordenador retornou HTTP 403. O teste permanece nos workflows existentes.

### Obrigações T5 preservadas

Consulta executada no checkout desta entrega:

```bash
npm run decisions:impact -- --query --phase=T5 --surface=ui
```

As oito obrigações abaixo permanecem `planned` no registro existente. O trabalho preparatório não altera seu status nem substitui sua prova de UI.

| Decisão / obrigação | Consequência que permanece para T5 |
|---|---|
| D001 / I001-03 | Formulários mantêm contexto e decisão visíveis, sem etapas artificiais. |
| D002 / I002-03 | Correção autorizada de Inventariada é distinta de baixa externa no SIGMA; efeitos relacionados ficam explícitos. |
| D008 / I008-02 | Avaliação fiscal e Assessoria permanecem independentes por nota fiscal. |
| D010 / I010-02 | O editor identifica a tentativa pelo alvo explícito; o helper reforçado prepara essa exigência, mas não entrega o editor. |
| D011 / I011-03 | Corrigir Inventariada preserva bonificação e estado de entrega. |
| D012 / I012-02 | Novos formulários usam capacidade efetiva e colaboração entre controladores. |
| D020 / I020-02 | O futuro layout consulta D002/D011 e não reintroduz proibições históricas superadas. |
| D021 / I021-03 | Interfaces explicam objeto, efeito, preservação e próximo passo na linguagem do operador. |

Os identificadores completos usam o prefixo `T0T6-`, conforme o [catálogo existente de impactos](../continuity/prontuario-t0-t6/decision-impact.json).

### Reutilização e condições da próxima etapa

1. **Reutilizar entidades e fluxo:** IDs/versões de `pendency_attempts`, histórico existente e preview/apply com autoridade do servidor. Não criar outra fonte de eventos; recibo de auditoria não é entidade operacional vigente.
2. **Completar a granularidade aprovada:** envio, reanálise, contato e patrimônio exigem transação, autorização, concorrência, idempotência e confirmação de efeitos. Contato geral permanece independente; exclusão local não desfaz atos externos.
3. **Concluir recomposição e integração:** `affectedAnalysis: null` significa preservar a análise, não marcá-la “Não analisado”. Datas, links, patrimônio e transições restantes ainda exigem casos integrados. Ambiguidade exige alcance explícito; correção não fabrica envio ou reanálise.
4. **Comprovar SQL/UI:** usar suítes existentes para recarga, outra sessão, permissões, falhas e preservação de nota vizinha/bonificação/patrimônio. O aceite de frontend continua no gate vigente.
5. **Reutilizar evidências certificadas:** merge #562 acima e [smoke de produção 45547911796](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45547911796). Backup, migration 68 e integridade institucional não foram repetidos ou alterados. As três inconsistências patrimoniais preexistentes permanecem linha de base, sem correção automática.

Nenhum item acima redefine o plano aprovado. São as condições de continuidade que impedem confundir preparação técnica com entrega funcional ou publicação de T5.

## Leitura e experiência de uso — Eixos 1 e 2

A revisão preserva a composição aprovada do Prontuário e aprimora tarefas concretas:

- Histórico cronológico com busca por texto sem distinção de acento, filtro de tipo, quantidade encontrada e agrupamento por dia. Envio e reanálise permanecem fatos separados, com responsável e observação próprios.
- Filtros preservados durante a leitura do mesmo contexto e reiniciados ao mudar escola, competência ou perfil. Os filtros não ampliam o conjunto autorizado de eventos.
- Estados vazios distinguem ausência de movimentos de busca sem resultado. Falha de carregamento oferece nova tentativa explícita.
- Modal **Registrar Contato** mostra nome e código da escola. O estado vazio de Registros Internos usa a linguagem da superfície, sem o rótulo técnico “log”.

Não foram alteradas RPCs, capacidades ou regras de negócio por essas melhorias. E2E nos workflows existentes deve provar busca, filtro, contexto, ausência de transbordamento e capturas dos viewports relevantes antes de declarar a nova interface homologada. As capturas da baseline já publicada são evidência de antes; não devem ser apresentadas como capturas da candidata atual.

## Inteligência operacional e documentos — Eixos 4 e 5

A consulta institucional foi somente leitura, com contagens agregadas, denominadores e ressalvas temporais. O relatório de resultados permanece fora do repositório público. As [consultas reproduzíveis](../../ops/document-intelligence-poc/operational-indicators.sql) e o [estudo de arquitetura](../research/2026-11-25-inteligencia-operacional-documental.md) preservam método, perguntas operacionais e critérios de qualidade sem publicar registros institucionais.

O [protótipo documental](../../ops/document-intelligence-poc/README.md) usa exclusivamente documentos e movimentos sintéticos. Demonstra conciliação com contexto, integridade de conteúdo, revisão humana, baixa confiança, colisões e versão documental; não conecta SharePoint, OneDrive, Microsoft Graph, OCR, IA ou Supabase. Sua aprovação não equivale à implantação de extração documental real.

## Priorização funcional — Eixo 6

| Prioridade | Entrega ou condição |
|---|---|
| Imediata, nesta candidata | Corrigir a projeção de histórico, permitir localizar eventos e tornar a escolha da correção clara no guia; contexto escolar explícito ao registrar contato. |
| Próxima implementação da T5 | Alvo e versão persistidos, alcance causal comprovado e recomposição transacional de envios, reanálises, contatos e patrimônio, respeitando as oito obrigações já aprovadas. |
| Evolução de indicadores | Antes de comparar produtividade ou tempos de regularização, definir cobertura e excluir intervalos incompatíveis. Contagens e totais de universos diferentes não devem ser somados sem conciliação. |
| Integração documental futura | Selecionar biblioteca/escopo do Microsoft 365, resolver permissões e versionamento, validar extração em amostra autorizada e manter decisão humana antes de qualquer lançamento. |

Essa priorização não cria cronograma ou autorização de integração externa. As capacidades futuras permanecem propostas com condições de prova explícitas.

## Guia do Controlador — Eixo 8

O guia foi reorganizado em oito tarefas: localizar escola/mês; escolher a correção; avaliar/consolidar; registrar despesas; tratar Pendências/reanálise; corrigir mês/programa; acompanhar patrimônio; comunicar/consultar. Uma tabela distingue sete operações pelo que muda e pelo que permanece. Corrige as instruções antigas sobre o filtro transversal de Pendências e a independência do cadastro de despesas em relação à bonificação.

Três capturas reais da homologação autenticada local do PR #562 substituem a sequência extensa de imagens antigas. A origem e os hashes constam em `assets/controller-guide/README.md`. Essas imagens documentam operações T0–T4 já publicadas; a revisão do layout do próprio guia exige suas capturas novas. A ajuda contextual pode abrir diretamente um tópico por `RadarControllerGuide.openTopic`, com busca limpa e foco no destino, sem fabricar uma rota paralela.

## Continuidade e limite desta entrega

O [checkpoint](../continuity/prontuario-t0-t6/CHECKPOINT.md) foi reconciliado com a publicação de #562, o backup recuperável, a migration 68 e o smoke de produção. Modelo canônico e catálogo de superfícies agora distinguem correção composta de rotas ordinárias legadas, limpeza de análise de exclusão de histórico e terminalidade ordinária de patrimônio de exclusão causal autorizada.

`npm run check:continuity` confirmou a integridade do registro: 21 decisões, 56 obrigações; as oito obrigações de UI da T5 continuam planejadas. Essa verificação documental não prova funcionamento de interface. Resultados da CI e capturas do novo SHA devem ser acrescentados quando efetivamente obtidos; nenhum merge/deploy desta candidata foi autorizado pelo prompt.
