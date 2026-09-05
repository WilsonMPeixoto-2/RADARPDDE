# RADAR PDDE — Achados adversariais posteriores ao fechamento documental

**Data:** 5 de setembro de 2026  
**Baseline funcional examinada:** PR #260 / merge `8fc58926565a72465980143f253f0a2fee4b8fc2`  
**Checkpoint documental integrado examinado:** PR #261 / `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`  
**PR documental em revisão:** #263 / branch `audit/continuity-source-traceability-2026-09-04`  
**Origem:** auditoria adversarial parcial executada com Codex/Astra Ultra.  
**Classe:** estado de achados; não altera runtime nem cria regra por inferência.

> A auditoria anterior de continuidade foi útil para reconciliar hotfixes e documentação, mas não foi suficiente para provar ausência de defeitos funcionais desconhecidos. Esta auditoria adversarial encontrou problemas adicionais ao procurar contraexemplos, caminhos paralelos, estados avançados destruídos por operações anteriores e divergências entre projeções.

## 1. O que esta auditoria provou sobre a metodologia

A suíte desktop executada durante a auditoria terminou com **141 testes aprovados, 37 ignorados e 0 falhas** entre 178 cenários. Mesmo assim, a análise encontrou defeitos e divergências fora do universo coberto pelos testes existentes.

Conclusão metodológica:

```text
gates verdes
≠ ausência de defeito
```

Os gates comprovam que contratos conhecidos continuam atendidos. A descoberta de defeitos desconhecidos exige investigação adversarial separada, documentada em [`../architecture/adversarial-analysis-and-implementation-method.md`](../architecture/adversarial-analysis-and-implementation-method.md).

## 2. Achados funcionais comprovados

### 2.1 Bem `Inventariada` pode ser rebaixado ao salvar novamente a NF vinculada

**Classificação:** B — bug funcional reproduzido  
**Risco:** Alto / P1

Cadeia observada:

1. `InventoryService.inventory` conclui o bem como `Inventariada` e grava metadados de inventariação;
2. `InvoiceService.save` carrega o bem vinculado;
3. `buildDesiredAsset` reaplica a regra de estado inicial do bem também no update;
4. com processo de inventário existente, o planner sobrescreve o status com `Encaminhada`;
5. o save passa a considerar que existe alteração mesmo quando a NF não mudou;
6. os metadados de inventariação permanecem, criando combinação incoerente `Encaminhada + dados de inventariação`.

Probe focal com `InvoiceService` real e persistência em memória reproduziu:

```text
NF permanente sem alteração
+ bem Inventariada
+ processo existente
→ save executado
→ bem Encaminhada
→ metadados de inventariação preservados
```

**Limite da prova:** causa no service/planner está reproduzida. Ainda é obrigatório reproduzir a jornada completa em Supabase descartável antes do hotfix e comprovar round-trip/reload.

**Correção futura esperada, sem implementação neste PR documental:** separar regra de nascimento do bem de transições de um bem já existente; edição de NF não pode desfazer inventariação concluída sem operação patrimonial explícita que autorize essa reabertura.

### 2.2 Botão real de Excel SME pode contornar a auditoria obrigatória pré-download

**Classificação:** C — inconsistência de composição com consequência funcional reproduzida  
**Risco:** Alto / P1

O módulo de auditoria possui caminho que bloqueia download quando a persistência inicial da auditoria falha. Porém o botão SME real é montado por integração que usa closure privada de exportação e executa download antes do log/persistência correspondente.

Probe de composição demonstrou diferença:

```text
rota auditada + falha inicial
→ nenhum download

botão SME real/integrado + mesma falha
→ caminho de download ocorre antes da confirmação da auditoria
```

Os E2E atuais comprovam que o arquivo é gerado/baixado corretamente, mas não exercitam `falha da auditoria inicial → nenhum download`.

**Correção futura esperada:** convergir o ponto de entrada real para a autoridade auditada e criar teste de gesto real com falha inicial. Não tratar como defeito remoto em Production sem reprodução correspondente.

## 3. Divergências reais que exigem decisão antes de código

### 3.1 Idade total da Pendência × tempo aguardando o ator atual

**Classificação:** F — ambiguidade que exige decisão de produto  
**Risco:** Alto para filtros/priorização/cobrança

Para o mesmo registro:

```text
abertura: 01/08/2026
reanálise incorreta: 04/09/2026
agora: 05/09/2026
```

foram reproduzidos dois cálculos:

- `pendencias-view-model`: 35 dias desde abertura;
- `operational-projection`: 1 dia desde o evento que devolveu o trabalho para a Escola.

O próximo ator permanece Escola em ambos. A divergência é real; o relatório não escolheu unilateralmente qual cálculo deve desaparecer.

Antes de unificar, o produto precisa distinguir se as superfícies pretendem exibir:

- idade total da Pendência;
- tempo de espera do ator atual;
- ou ambos com nomes explícitos.

### 3.2 Política do CSV versus XLSX institucional

**Classificação:** F/H — decisão de produto + investigação complementar

O XLSX institucional atual foi deliberadamente alterado em commit posterior para escopo da competência global ativa. Documentos antigos ainda descrevem histórico multicompetência. O CSV de contingência mantém caminho legado com política temporal/auditoria diferente.

Não igualar CSV e XLSX por inferência. Primeiro fixar contrato atual desejado e provar os pontos de entrada reais.

## 4. Dívidas arquiteturais de risco alto

### 4.1 Renderer legado de Pendências ainda executável por composição

**Classificação:** E — duplicação arquitetural com risco alto

A UI moderna possui quatro situações canônicas e ações por estado. `app.js` ainda conserva implementação anterior com duas abas/fallbacks relacionados. Hoje a composição moderna prevalece, mas mudança no loader/readiness ou falha de extensão pode reviver comportamento antigo.

Ação futura: teste de composição/falha controlada do instalador antes de remover fallback. Não redesenhar a tela no mesmo passo.

### 4.2 Duas derivações ativas de `encampInventario`

**Classificação:** E — duplicação arquitetural

`invoice-effects` e `InventoryService` derivam a projeção patrimonial em caminhos distintos. Hoje a regra básica concorda, mas há diferenças de pré-condição/reset de análise.

Ação futura: corpus compartilhado de cenários e eventual extração de função pura, sem transformar diferença de contexto em bug por simplificação.

### 4.3 Múltiplas projeções de próximo ator/data/ação

**Classificação:** E/F

Próximo ator atualmente concorda entre consumidores, mas data-base/idade já divergiu. A frente de projeção única deve começar por testes diferenciais, não por mover código e escolher uma semântica arbitrária.

### 4.4 Wrappers/readiness com autoridade funcional

**Classificação:** E

A auditoria confirmou o problema já previsto no plano: módulo chamado de performance ainda participa de correção/políticas de persistência, e readiness pode confundir Promise publicada com capacidade efetivamente instalada.

Esses itens continuam no plano, agora sob o método adversarial obrigatório.

## 5. Documentação/testes obsoletos perigosos encontrados

### 5.1 Matriz apontando para migration/RPC superada

`PEND-02` e outras evidências podem apontar para migration anterior à redefinição vigente. A documentação deve resolver a última definição da assinatura e apontar teste sucessor.

### 5.2 Contrato de competências anterior à exceção transversal de Pendências

Documento antigo proíbe seletor independente sem registrar a decisão posterior que permite filtro local `Todas` em Pendências, mantendo a competência global intacta.

### 5.3 Documentos de exportação ainda descrevendo histórico multicompetência

O código/commit posterior limitou o Excel institucional à competência global ativa. Documentos correntes que ainda afirmem o contrário precisam ser reconciliados.

### 5.4 Títulos de testes que ensinam regra revogada

Foram encontrados títulos ativos como “reabre somente resolvida”, embora o contrato atual aceite `Resolvida` ou `Cancelada`. A assertion pode continuar útil, mas o nome não pode continuar ensinando a regra antiga.

### 5.5 Desativação de Controlador com expectativa histórica de transferência

Fluxo vigente exige carteira zerada antes de desativar. Helper/teste antigo ainda preserva texto de “desativada + 13 escolas transferidas”. Não restaurar transferência implícita por causa desse artefato.

### 5.6 Teste E2E manipulando `activeCompetenciaKey` diretamente

A arquitetura atual exige `RadarCompetenceContext`. Fixture que altera variável direta pode mascarar sincronização e ensinar bypass de contexto.

### 5.7 Planos históricos de `a_identificar`

Planos antigos ainda descrevem conversões hoje proibidas. Devem permanecer como história explicitamente superada e apontar para o contrato sucessor.

### 5.8 Ramo agregado fiscal inalcançável dentro de API ativa

`VerificationService.setTechnicalAnalysis` ainda conserva ramo interno de `notaFiscal` apesar de a API atual rejeitar análise fiscal agregada antes dele. Não é bug funcional atual comprovado, mas é código morto que pode reensinar contrato antigo.

## 6. Regras confirmadas como coerentes e que não devem ser reabertas sem evidência

A auditoria também confirmou coerência atual em vários contratos:

- novo envio não resolve; vai a `Aguardando reanálise`;
- substituição do último envio enquanto aguarda reanálise é suportada;
- reanálise correta resolve; incorreta/arquivo indisponível reabre;
- `Resolvida` ou `Cancelada` podem ser reabertas;
- cancelamento histórico é preservado sem recriar `canceled_at` terminal após reabertura;
- próximo ator por status está coerente;
- bonificação, análise e Pendência são independentes;
- BB Ágil N/A e bloqueios correlatos estão coerentes;
- Boleto de Internet é tipo de gasto fiscal, não documento autônomo;
- Consulta Assessoria permanece individual por invoice;
- `a_identificar` novo é atômico e legado legítimo não recebe backfill heurístico;
- Production fail-closed permanece coerente;
- perfis/autorização principais permanecem coerentes;
- Excel SME público continua 27 colunas A:AA.

Essas confirmações são importantes justamente para evitar que a nova auditoria vire justificativa para refazer áreas que não apresentaram defeito.

## 7. Consequência para o PR #263

O fechamento técnico anteriormente registrado para #263 deve ser considerado **revogado como fechamento semântico final** até que estes achados sejam incorporados à documentação corrente e ao plano.

O PR continua documental/governança. Ele não deve implementar os bugs funcionais acima. Deve:

1. institucionalizar o método adversarial;
2. registrar os achados conhecidos;
3. corrigir documentos/testes-documentação que ainda ensinem regras superadas, quando estiverem no escopo documental;
4. atualizar o plano para colocar os bugs comprovados e decisões pendentes antes das frentes arquiteturais anteriores;
5. deixar claro que gates verdes não encerram a investigação adversarial.

## 8. Próxima ordem segura

```text
0A — reconciliar documentação/método/achados no PR #263
→ 0B — reproduzir e corrigir Inventariada → Encaminhada em PR funcional próprio
→ 0C — reproduzir em composição real e corrigir auditoria pré-download do Excel SME em PR próprio
→ 0D — decidir/characterizar idade total × espera do ator e política CSV × XLSX
→ retomar Frentes 1–8 do MASTER_PLAN_CURRENT já sob o método adversarial
```

## 9. Limites

A sessão Astra foi interrompida por cota antes de concluir toda a auditoria de persistência/arquitetura. Portanto:

- não afirmar que estes são todos os defeitos existentes;
- não afirmar corrupção em Production sem reprodução correspondente;
- não promover hipótese a bug;
- não usar a incompletude para descartar achados já reproduzidos;
- preservar os artefatos/probes da auditoria para continuidade e evitar repetir varreduras caras.