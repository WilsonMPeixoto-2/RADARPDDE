# Auditoria semântica completa de continuidade e rastreabilidade

**Data de fechamento:** 5 de setembro de 2026  
**Baseline funcional examinada:** PR #260 / merge `8fc58926565a72465980143f253f0a2fee4b8fc2`  
**Checkpoint documental de entrada:** PR #261 / `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`  
**Branch de reconciliação:** `audit/continuity-source-traceability-2026-09-04`  
**Classe:** auditoria canônica de fechamento da continuidade pós-hotfixes

> Esta auditoria **não cria regra de negócio**. Ela reconstrói qual regra já estava vigente a partir da sequência de decisões, PRs, código, migrations/RPCs e testes que realmente representam o contrato atual. Onde não havia suporte suficiente, nenhuma afirmação nova foi promovida a regra.

## 1. Problema investigado

O projeto entrou em risco de regressão porque três camadas podiam divergir:

1. o código atual;
2. a documentação acumulada;
3. a memória de chats/sessões anteriores.

O último plano corretamente reconciliado era o PR #253, de 03/09. Depois dele, novos hotfixes foram integrados antes da retomada da fila planejada:

```text
#254 → #256 → #257 → #258 → #260 → #261
```

Esses hotfixes continham decisões posteriores ao plano e, portanto, precisavam ser absorvidos pelo estado/documentação e pelo plano sucessor. Isso havia sido feito apenas parcialmente: `CURRENT_STAGE` já reconhecia a estabilização do PR #260, mas outros documentos ainda direcionavam sessões novas para a fila R1–R9 de 03/09 ou conservavam cláusulas anteriores aos hotfixes.

O PR #262 agravou a percepção do problema: um teste novo interpretou incorretamente a criação de NF permanente como se todo bem devesse nascer `Não encaminhada`. A regra corrente era outra. O PR foi abortado sem merge.

## 2. Método

A auditoria combinou duas camadas.

### 2.1 Inventário mecânico integral

O inventário versionado encontrou:

- 842 arquivos versionados;
- 212 documentos textuais;
- 186 arquivos de código do produto;
- 321 arquivos de validação;
- 0 arquivos textuais ilegíveis;
- 0 links internos ausentes na rodada mecânica inicial.

Essa etapa serviu para cobertura, não para decidir semântica.

### 2.2 Leitura semântica e confronto

Para cada domínio relevante foi aplicado o seguinte critério:

```text
pré-condição
→ ação
→ efeito automático
→ persistência
→ pós-condição
→ superfícies afetadas
```

A regra foi confrontada com:

1. último plano reconciliado de 03/09;
2. PR/hotfix posterior que tocou a superfície;
3. código-fonte da baseline funcional;
4. migrations/RPCs/Edge Functions quando materiais;
5. testes que representam esse contrato;
6. documentação corrente e histórica.

Teste verde não ganhou autoridade para inventar regra. Documento “canônico” antigo não ganhou autoridade para revogar decisão posterior. Código atual também não foi considerado automaticamente correto quando havia evidência de defeito: nesses casos a origem/PR e o comportamento esperado foram confrontados.

## 3. Sequência de decisão pós-PR #253

### PR #254

Decisões posteriores incorporadas:

- novo envio não resolve Pendência;
- primeiro envio corretivo pode partir de `Aberta`;
- substituição mais recente pode ser registrada quando a Pendência já está `Aguardando reanálise`;
- histórico do envio anterior não é reescrito;
- `Resolvida` e `Cancelada` podem ser reabertas quando autorizado;
- `canceled_at` representa cancelamento terminal atual;
- agregado de Consulta Assessoria respeita as análises individuais das NFs irmãs;
- não há backfill heurístico de universo legado vazio/legítimo.

### PR #256

Decisão posterior incorporada:

```text
Aberta → Escola
Aguardando reanálise → Controlador
Resolvida/Cancelada → nenhum próximo ator ativo
```

`responsavel` e `proximoAtor` são sincronizados nas transições e aliases legados stale não prevalecem.

### PR #257

Decisão posterior incorporada:

- `encampInventario` passa a ser derivado das aquisições permanentes do contexto;
- nenhuma permanente = `Não se aplica`;
- alguma permanente não encaminhada = `Não`;
- todas `Encaminhada`/`Inventariada` = `Sim`;
- a análise técnica derivada não é aprovada por herança quando o conjunto muda.

O PR explicitou os dois cenários de criação:

```text
permanente com processo → Encaminhada / Sim
permanente sem processo → Não encaminhada / Não
```

### PR #258

Decisão posterior incorporada:

- o Prontuário mantém o resultado agregado, mas mostra quais NFs/bens o sustentam;
- vínculo é resolvido por `bemId`/`linked_asset_id`, não por coincidência de número/descrição/valor;
- NF, descrição, valor e status patrimonial aparecem vinculados;
- nenhuma nova autoridade de escrita é criada.

### PR #260

Decisões posteriores incorporadas:

- bem que esteja `Não encaminhada` não pode pular para `Inventariada`;
- bem derivado de NF não permite edição isolada do número fiscal;
- encaminhamento posterior de bem vinculado sincroniza asset + verificação + log pela RPC `save_asset_with_verification_and_log`;
- aliases técnicos de versão são removidos/protegidos no payload de verificação;
- novo envio, reanálise, encaminhamento e inventariação recebem contenção de gesto repetido durante a chamada em andamento;
- guard existente de NF é preservado;
- jornadas reais com Supabase/Auth passam a comprovar persistência, leitura, reload e releitura.

A frase de fechamento `Não encaminhada → Encaminhada → Inventariada` foi reconciliada como regra **condicional ao bem estar Não encaminhada**, não como regra universal de criação. Isso elimina a interpretação que quase causou regressão no PR #262.

### PR #261

Somente documentação de fechamento do #260. Não mudou runtime, banco ou regra funcional.

### PR #262

Abortado e fechado sem merge. Excluído da baseline e da cadeia de decisão.

## 4. Competência e navegação

### Regra verificada

`RadarCompetenceContext` continua sendo a fonte do contexto mensal global.

- formato `YYYY-MM`;
- não criar seletor concorrente;
- seleção válida pode ser restaurada;
- competências futuras são consultáveis, mas protegidas contra mutação mensal;
- Pendências é exceção transversal e pode operar em todas as competências;
- abrir detalhe de Pendência não troca silenciosamente a competência global;
- ao navegar para Prontuário mensal a competência de origem é reaplicada quando necessário;
- retorno contextual preserva origem/filtros/rolagem/foco quando aplicável.

### Fontes confrontadas

- `docs/architecture/competencias.md`;
- `src/domain/competence-context.js`;
- navegação/contexto e regressões correspondentes;
- `PROJECT_CONTEXT.md` reconciliado.

### Classificação

**ALINHADO.** Nenhuma decisão posterior aos hotfixes contradiz esse contrato.

## 5. Perfis, autorização e escolas

### Controlador

- atua nas escolas autorizadas da própria CRE;
- carteira representa responsabilidade principal, não transferência automática;
- não redistribui `controller_id` por edição comum;
- não altera identidade institucional da escola por edição comum;
- autoria registra o executor real.

### Assistente de Verbas Federais

- atuação transversal na CRE;
- redistribuição de carteira;
- Gestão de Equipe;
- cadastro/alteração institucional autorizada da escola;
- operações documentais/retificação autorizadas.

### Gestão SME

- visão gerencial;
- configurações/exercícios/programas autorizados no contrato atual;
- não recebe mutações operacionais de Pendências apenas por visualizar os registros.

### Inventário

- opera o recorte patrimonial autorizado;
- conclui inventariação conforme estado e permissão;
- não recebe bonificação/análise/configuração global por simples acesso ao patrimônio.

### `technical_admin`

Papel técnico real. Simulação visual não altera JWT, identidade ou autoridade efetiva.

### Fontes confrontadas

- `src/domain/access-policy.js`;
- `src/application/school-service.js`;
- `src/application/directory-service.js`;
- `src/application/configuration-service.js`;
- `SUPABASE_PERMISSIONS_MATRIX.md`;
- `PRODUCT_SURFACE_CATALOG.md`;
- RLS/RPCs e testes de perfis/viewports.

### Classificação

**ALINHADO após atualização documental.** Matriz e catálogo foram reescritos para não manter resumo antigo como fonte concorrente.

## 6. Gestão de Equipe

### Regra verificada

```text
DirectoryService
→ TeamAccountGateway
→ team-account-management
→ Auth Admin + RPC transacional
```

- CORS fail-closed;
- JWT e papel autorizados;
- credencial administrativa somente no backend;
- lookup Auth exato por `resolve_team_auth_user_id_by_email`;
- sem `listUsers` global como caminho normal;
- conta existente só é reutilizada sem vínculo ativo incompatível;
- ambiguidade é erro;
- desativação preserva histórico;
- falha após alteração em Auth exige compensação.

### Fontes confrontadas

- `src/application/directory-service.js`;
- `supabase/functions/team-account-management/index.ts`;
- migrations/RPCs de Gestão de Equipe;
- permissões e testes correspondentes.

### Classificação

**ALINHADO.** Nenhuma regra nova foi inferida além do que serviço/backend implementam e os ciclos anteriores documentaram.

## 7. Avaliação mensal e retificações

### Regra verificada

A identidade é escola + competência + programa.

- bonificação, análise técnica e Pendência são independentes;
- bonificação usa `Sim`, `Não` e N/A somente onde permitido;
- Extrato CC/Investimento não usam N/A para concluir;
- BB Ágil pode usar N/A quando cabível;
- BB Ágil em N/A possui análise neutra `Correto`;
- sair de N/A reinicia a análise aplicável;
- Pendência ativa do BB Ágil bloqueia N/A;
- Nota Fiscal não pode ser N/A quando já existem despesas/NFs registradas;
- Consulta Assessoria é derivada das NFs de serviço;
- operação idêntica ao estado atual não deve produzir gravação/log desnecessários;
- consolidação exige conjunto aplicável completo;
- retificação exige Assistente, justificativa, mudança real e registra antes/depois;
- PDDE Básico é priorizado apenas na apresentação.

### Fontes confrontadas

- `docs/architecture/avaliacao-mensal.md`;
- `src/application/verification-service.js`;
- `src/domain/retificacoes.js`;
- jornadas `supabase-verification-reliability.spec.js`;
- decisões BB Ágil e regressões atuais.

### Classificação

**ALINHADO.** O material corrente foi consolidado em `PROJECT_CONTEXT.md`, `CURRENT_STATE.md` e `DECISION_LOG.md`.

## 8. Nota Fiscal, análise fiscal e `a_identificar`

### Regra verificada

- bonificação de `notaFiscal` permanece agregada;
- análise fiscal e Pendência são individuais por `registered_invoice_id`;
- resumo é derivado por precedência;
- invoices diferentes podem possuir Pendências independentes;
- a mesma invoice não duplica Pendência ativa equivalente;
- Pendência ativa bloqueia alteração estrutural incompatível da própria invoice;
- `a_identificar` novo nasce `Incorreto + Pendência` atomicamente;
- identificação posterior acontece pelo fluxo de Pendências e preserva ID;
- apresentação do documento leva para `Não analisado`/`Aguardando reanálise`, não resolve por si só;
- 16 legados legítimos preservados não recebem história retroativa inventada;
- `boleto_internet` é tipo de gasto de NF somente em Educação Conectada e não cria documento/Pendência/inventário/Assessoria autônomos.

### Fontes confrontadas

- ADR-050 e suas emendas;
- `src/application/invoice-service.js`;
- `src/domain/invoice-effects.js`;
- análise documental individual;
- migrations/RPCs do PR #211/#254;
- testes unitários/E2E/pgTAP correspondentes.

### Correção documental

ADR-050 ainda continha a frase original “novo envio exige Pendência Aberta”. Ela foi **substituída dentro da própria ADR** pela regra posterior do PR #254, em vez de apenas receber um aviso no topo.

### Classificação

**ALINHADO após correção documental.**

## 9. Consulta Assessoria

### Regra verificada

- somente NFs de serviço participam;
- envio/análise são individuais por invoice;
- Pendência usa `registered_invoice_id`;
- NF A não bloqueia NF B;
- `Incorreto + Pendência` usa a operação atômica própria;
- edição ordinária, abertura/reanálise e novo envio possuem autoridades separadas;
- novo envio/substituição segue a ampliação do PR #254;
- reanálise usa tentativa real mais recente aguardando;
- conteúdo histórico não é reescrito;
- resumo mensal é derivado do conjunto de NFs de serviço.

### Classificação

**ALINHADO.** O conflito de wording antigo da ADR-050 foi removido.

## 10. Pendências, tentativas e contatos

### Regra verificada

Estados:

```text
Aberta
Aguardando reanálise
Resolvida
Cancelada
```

- as duas primeiras são ativas;
- abertura preserva contexto;
- novo envio cria/substitui tentativa, não resolve;
- reanálise correta resolve;
- incorreta/arquivo indisponível volta a `Aberta`;
- cancelamento somente em estado ativo;
- reabertura de `Resolvida` ou `Cancelada` quando autorizada;
- contato/cobrança é registro associado e não transição automática da Pendência;
- próximo ator segue PR #256;
- histórico de cancelamento não se confunde com estado terminal atual.

### Fontes confrontadas

- `src/domain/pendencias.js`;
- `src/application/pendency-service.js`;
- RPCs de tentativa/reanálise/contato;
- PRs #254/#256;
- `modelo-operacional.md`;
- testes E2E/pgTAP atuais.

### Dívida separada

`pendencias-view-model.js` e `operational-projection.js` ainda possuem cálculos duplicados de data-base/idade/ação. Isso é dívida da Frente 4 do plano atual e **não significa que as transições #254/#256 estejam erradas**.

### Classificação

**REGRA ALINHADA; DÍVIDA DE PROJEÇÃO RASTREADA NO PLANO.**

## 11. Capital e Inventário

### Regra verificada, com pré-condições explícitas

```text
NF permanente + número + processo de inventário já existente
→ cria/vincula bem
→ status Encaminhada
→ UI Aguardando Inventariação
→ ação seguinte: concluir inventariação
```

```text
NF permanente sem processo
→ cria/vincula bem
→ status Não encaminhada
→ quando o processo existir: Encaminhar
→ depois: Inventariar
```

Outras regras:

- `Não encaminhada` não pula para `Inventariada`;
- conclusão exige estado `Encaminhada` e responsável;
- `encampInventario` é derivado do conjunto de permanentes;
- análise técnica derivada não é aprovada por mudança patrimonial;
- Prontuário mostra NF ↔ bem por identidade técnica;
- encaminhamento posterior persiste asset + verification + log atomicamente;
- NF do bem vinculado não é editada isoladamente;
- guards atuais protegem repetição imediata.

### Fontes confrontadas

- PRs #257/#258/#260;
- `src/domain/invoice-effects.js`;
- `src/application/inventory-service.js`;
- `prontuario-operational-ux.js`;
- migration #46/RPC patrimonial;
- unitários e jornada real do PR #260.

### Classificação

**ALINHADO E CONDICIONALMENTE ESPECIFICADO.** Esta é a correção semântica mais importante da auditoria.

## 12. Exportações e comunicação externa

### Regra verificada

- Excel SME: uma competência, uma aba, 27 colunas A:AA;
- template de 30 colunas é fonte de projeção, não formato público;
- XLSX de Pendências respeita busca/filtros e não expõe IDs técnicos;
- exportações com contrato auditável registram início antes do download;
- comunicação oficial externa gerada não expõe `RADAR PDDE`;
- nome interno pode existir na interface/documentação interna.

### Fontes confrontadas

- contratos de exportação e homologação;
- integração de auditoria;
- matriz funcional/catalogo de superfícies;
- decisão de comunicação externa.

### Classificação

**ALINHADO.**

## 13. Bootstrap, extensões e readiness

### Estado atual verificado

`product-extensions-bootstrap.js` carrega 18 scripts na baseline. A documentação anterior parava antes do `critical-action-guard.js` introduzido no PR #260.

A ordem corrente foi reconciliada, incluindo:

```text
13 service-advisory-corrective-submission
14 critical-action-guard
15 operational-write-diagnostics
16 operational-write-performance
17 prontuario-conditional-reconciler
18 operational-write-feedback
```

### Dívidas atuais, não regressões

- `operational-write-performance.js` ainda participa de política funcional de consistência;
- `prontuario-conditional-reconciler.js` ainda depende dessa composição;
- readiness/instalação ainda possui cadeia/polling a tornar determinística.

Essas dívidas correspondem às Frentes 1 e 2 do plano sucessor. O fato de serem dívida **não autoriza retirar guards/extensões atuais antes da migração segura**.

### Classificação

**DOCUMENTAÇÃO ALINHADA; DÍVIDA ARQUITETURAL CONFIRMADA NO PLANO.**

## 14. Supabase, migrations e CI

### Baseline verificada

- 46 migrations no fechamento funcional #260;
- migration #46: `20260904040000_functional_reliability_inventory_sync`;
- RPC patrimonial presente;
- tipos/migrations/RPCs são fontes executáveis para o schema;
- Production fail-closed;
- Auth/RLS/optimistic concurrency/atomicidade preservados.

### Falha de readiness observada no PR #263

Primeira execução do SHA `617355e1...`:

- reset: PASS;
- preflight: PASS;
- pgTAP: PASS;
- lint: PASS;
- regeneração de tipos/cliente: FAIL.

O mesmo job foi reexecutado **no mesmo SHA e sem mudança de código**. Na segunda tentativa passaram:

- regeneração dos tipos/cliente;
- reprodutibilidade dos artefatos;
- sete identidades Auth;
- Edge Function de Gestão de Equipe;
- frontend + Auth + RLS;
- cleanup.

### Classificação

**FALHA TRANSITÓRIA DE RUNNER/AMBIENTE, NÃO DEFEITO REPRODUZÍVEL.** Nenhuma alteração de runtime/schema foi feita para mascarar o evento.

## 15. Documentos que estavam perigosamente concorrentes e foram corrigidos

Durante a auditoria foram identificados e corrigidos, entre outros:

- `PROJECT_CONTEXT.md` ainda apontando o plano de 03/09 como entrada corrente;
- `DECISION_LOG.md` acumulando decisões sem registrar adequadamente a sucessão pós-#260;
- `STATUS_DOCUMENTOS.md` ainda descrevendo R1–R9 como fila corrente em trechos internos;
- ADR-050 ainda contendo a pré-condição antiga de novo envio somente em `Aberta`;
- `product-extensions-load-order.md` sem `critical-action-guard.js`;
- `ROADMAP_ATUALIZACOES_2026.md` ainda intitulado roadmap canônico de uma fase de agosto;
- `CURRENT_STAGE.md` misturando vários “estados correntes” históricos no mesmo arquivo;
- dicionário/cobertura/permissões/auditoria/runbook do Supabase apontando para baseline antiga ou omitindo #260;
- `PRODUCT_SURFACE_CATALOG.md` sem explicitar os dois ramos de Inventário;
- `PRODUCT_DECISIONS.md` redirecionado definitivamente como índice histórico.

## 16. Nova arquitetura documental

### Porta única

`START_HERE.md`

### Estado atual

`CURRENT_STATE.md`

### Único plano executável

`MASTER_PLAN_CURRENT.md`

### Origem/absorção do plano

`PLAN_TRACEABILITY.md`

### Decisões correntes

`DECISION_LOG.md`

### Contratos funcionais amplos

`PROJECT_CONTEXT.md`

### História

`CURRENT_STAGE.md`, handoffs, ADRs históricos, audits, evidence e planos datados.

Não há autorização para escolher outro documento como “próxima fila” fora dessa cadeia.

## 17. Proteções automáticas

`check-continuity-docs.mjs` e `continuity-docs.test.js` verificam, entre outros:

- `START_HERE.md` nos pontos de entrada;
- existência de um único plano marcado como executável;
- banners históricos nos planos antigos;
- destino de R1–R9 na rastreabilidade;
- inclusão de #254/#256/#257/#258/#260/#261 e exclusão do #262;
- ausência das cláusulas stale mais perigosas;
- ordem documentada do `critical-action-guard`;
- PR funcional não pode alterar runtime sem atualizar `CURRENT_STATE.md` + `PLAN_TRACEABILITY.md`.

O checker usa a **baseline funcional #260**, não um SHA documental eterno, para evitar que o próprio merge documental gere um loop de “baseline desatualizada”.

## 18. Trabalho remanescente legítimo

A auditoria não transformou tudo em “concluído”. Permanecem dívidas reais já previstas no plano sucessor:

1. retirar autoridade funcional do wrapper de performance;
2. readiness determinístico;
3. IDs/intenção/idempotência durável da NF normal;
4. projeção operacional única de Pendências;
5. convergência autoritativa/incremental do save/remove normal de NF;
6. gate de equivalência;
7. instrumentação causal e otimização somente se medida;
8. fechamento/rebaseline.

Essas dívidas foram confirmadas no código. Elas não reabrem os hotfixes já homologados.

## 19. Inferências deliberadamente rejeitadas

A auditoria **não** promoveu como regra:

- “todo bem permanente nasce Não encaminhada”;
- “novo envio só pode ocorrer quando a Pendência está Aberta”;
- “qualquer teste verde define o comportamento correto”;
- “qualquer documento marcado canônico continua corrente para sempre”;
- “qualquer código atual é automaticamente a intenção de produto”;
- “todo timer é bug de readiness”;
- “duas NFs iguais são duplicatas”;
- “legados `a_identificar` devem ganhar Pendência retroativa por heurística”;
- “PR #262 define contrato atual”.

Essas afirmações são incompatíveis com a linhagem atual ou não possuem suporte suficiente.

## 20. Conclusão

Após a reconciliação, **não permaneceu conflito semântico conhecido entre a documentação corrente de continuidade, as decisões posteriores dos hotfixes #254/#256/#257/#258/#260, o código funcional examinado e o plano sucessor**.

Isso não significa que o software não possa conter bugs futuros. Significa algo mais específico e verificável: a documentação corrente não instrui mais um novo chat a desfazer deliberadamente as decisões posteriores já incorporadas, e os conflitos encontrados nesta auditoria foram corrigidos/documentados.

Qualquer PR funcional futuro deve atualizar continuidade no próprio ciclo, evitando que código e plano voltem a se separar.