# Evolução do RADAR PDDE após T4 — evidências de 25/11/2026

**Base:** `6dd6a9f9f8147deb39c5813baad0b5521427b8bd` · **Branch de trabalho:** `feat/evolucao-integral-pos-t4-20261125`.

**Candidata de revisão:** [PR #564](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/564), sem merge. O código funcional e as capturas desta primeira rodada correspondem a `16b9a5baf6c25b0da872c060a691898cabed4c63`; resultados posteriores devem identificar seu próprio SHA.

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

O E2E `tests/e2e/school-timeline.spec.js` foi atualizado e executado na CI. A projeção integral, o recorte SME e a recuperação de falha passaram. Duas jornadas adicionais falharam por usar `getByLabel` exato num rótulo que contém o `select` e suas opções, embora a árvore de acessibilidade mostrasse `combobox "Tipo de movimentação"`. O seletor foi corrigido para esse papel e nome acessível exatos, preservando as verificações de comportamento. A comprovação final depende da execução dessa correção; a instalação local de Chromium havia retornado HTTP 403.

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

### Provas visuais efetivamente obtidas

O [workflow de regressão visual 45550728981](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45550728981) aprovou **5/5 cenários** no SHA `16b9a5ba`. O artefato `14993179915` foi baixado e seu ZIP conferido pelo SHA-256 `ee8984e3ab2326ccd7c73a15a66e56e543bbbe30ffa2db1875e802ebc71ca699`. As imagens do contato em 1440 e 390 pixels e do histórico vazio em 1440 pixels foram examinadas: escola e código permanecem legíveis, campos e ações cabem no modal móvel, e o histórico explicita competência, filtros e a ação para consultar outro mês.

A comparação anterior usa `6dd6a9f9`, [run 45547911799](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45547911799), artefato `14991858881`, ZIP SHA-256 `01ef49bc345b6df2f78f747a07a4a8fc51eb875739a23ba7c619c3145e2e465a`. Os dois pares antes/depois preservam o mesmo viewport de 1440 × 900 e os PNGs originais. São cenários com fixtures de teste; a comparação não registra operações sobre escolas reais.

O projeto Vercel ignorou o deploy desta branch, conforme sua configuração vigente que constrói somente `main`. Um status de integração Vercel bem-sucedido não representa uma URL de preview publicada. Guia, demonstração documental e comparação visual são entregues também como HTMLs autossuficientes privados.

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

### Validação automatizada obtida

- `npm run test:readiness`: aprovado, incluindo **1.524 testes unitários**, **8 de integração**, contratos, sintaxe, arquitetura, CSS, assets e verificações estáticas do Supabase. O lint apresentou avisos, sem erros; esse resultado não significa ausência de dívida técnica.
- Motor documental sintético: **12/12** testes de comportamento aprovados. Contratos focais do guia: **3/3** aprovados depois da seleção final das três imagens públicas.
- [Supabase readiness 45550728839](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45550728839), no SHA `16b9a5ba`: **3/3 jobs aprovados**, **906 asserções pgTAP em 46 arquivos** e **42 testes navegados autenticados** (17 + 4 + 21), sem instabilidade relatada. As massas são descartáveis; esses testes não gravam no banco institucional.
- [Nomenclatura Painel 45550728920](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45550728920): o job de navegador aprovou os **7 testes do guia**. O contrato estático falhou por exigir a representação antiga `routeLabel: 'Abrir Painel'`. A correção verifica o botão efetivamente renderizado e o destino `dashboard`, preservando a exigência funcional; o E2E também passa a percorrer a navegação de ida e volta. O run original continua registrado como falha, não como aprovado.
- [Desktop completo 45550728881](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45550728881), em `16b9a5ba`: **293 aprovados, 2 falhas, 1 instável que passou na repetição e 90 ignorados**, entre 386 casos. As duas falhas foram os seletores do histórico descritos acima. Os sete testes do guia e o teste da POC passaram diretamente. O teste preexistente de posição na edição apresentou deslocamento de 47 px na primeira tentativa, acima do limite de 4 px; a repetição passou. No [preprod 45550729074](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45550729074), foram 294 aprovados, as mesmas duas falhas, 90 ignorados e nenhuma repetição necessária; seus outros sete jobs passaram.
- Artefato desktop `14993887231`, ZIP SHA-256 `18c3484df0961d09f92bfe6caea9bf065737a353f71efbed9c7f2bd6c6431f92`, baixado e conferido. A inspeção visual revelou sobreposição da busca fixa do guia sobre o cabeçalho global durante a rolagem, apesar de seus testes anteriores passarem. O ajuste de layout recebe nova captura; esse primeiro conjunto não certifica o layout final do guia.

A suíte visual existente foi ampliada para os cinco testes do histórico, sete do guia e um da demonstração, mantendo os cinco cenários anteriores. A coleta confirmou **18 casos em cinco arquivos**; coleta não significa execução aprovada. Nenhum workflow paralelo novo foi criado.

As contagens acima pertencem a suítes diferentes e podem conter cobertura repetida. Não foram somadas para fabricar um total de casos distintos. A homologação da nova ponta deve ser consultada no PR; capturas de uma ponta anterior só se aplicam à nova se os arquivos da interface permanecerem idênticos.

O [checkpoint](../continuity/prontuario-t0-t6/CHECKPOINT.md) foi reconciliado com a publicação de #562, o backup recuperável, a migration 68 e o smoke de produção. Modelo canônico e catálogo de superfícies agora distinguem correção composta de rotas ordinárias legadas, limpeza de análise de exclusão de histórico e terminalidade ordinária de patrimônio de exclusão causal autorizada.

`npm run check:continuity` confirmou a integridade do registro: 21 decisões, 56 obrigações; as oito obrigações de UI da T5 continuam planejadas. Essa verificação documental não prova funcionamento de interface. Resultados da CI e capturas do novo SHA devem ser acrescentados quando efetivamente obtidos; nenhum merge/deploy desta candidata foi autorizado pelo prompt.
