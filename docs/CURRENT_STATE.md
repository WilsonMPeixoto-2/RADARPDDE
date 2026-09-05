# RADAR PDDE — Estado corrente para continuidade

**Atualizado em:** 5 de setembro de 2026  
**Classe:** estado operacional corrente, curto e canônico  
**Baseline funcional reconciliada:** PR #260 / merge `8fc58926565a72465980143f253f0a2fee4b8fc2`  
**Checkpoint documental de entrada:** PR #261 / `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`

> Antes de usar este arquivo, leia [`../START_HERE.md`](../START_HERE.md). O SHA corrente da `main` deve ser consultado no remoto.

> Desde 05/09/2026, análises e implementações críticas seguem obrigatoriamente o método adversarial e o playbook reproduzível. Gates verdes não equivalem a ausência de defeitos.

## 1. Ambiente publicado da última baseline funcional

No fechamento do PR #260:

- Supabase Production: 46 migrations;
- migration mais recente: `20260904040000_functional_reliability_inventory_sync`;
- RPC `save_asset_with_verification_and_log` presente;
- `production_integrity_check()` havia registrado `totalIssues = 0`.

A coleta remota preservada pelo Astra em 05/09 também encontrou 46 migrations e `production_integrity_check()` saudável/zero issues naquele snapshot.

**Importante:** integridade atual saudável descreve os dados existentes naquele instante. Não prova que um write futuro não possa criar estado inválido. Portanto, ela não invalida o bug patrimonial reproduzido em código.

PR #261 e PR #263 são documentais/governança; não alteram runtime por si só.

## 2. Linha recente

```text
#253
→ #254 → #256 → #257 → #258 → #260 → #261
→ #263 documental em revisão
```

PR #262 foi fechado sem merge e não integra a baseline.

## 3. Regras sensíveis a regressão

### Pendências

- estados: `Aberta`, `Aguardando reanálise`, `Resolvida`, `Cancelada`;
- `Aberta`/`Aguardando reanálise` são ativas;
- novo envio não resolve;
- substituição do último envio enquanto aguarda reanálise é permitida;
- reanálise correta resolve; incorreta/arquivo indisponível volta à Escola;
- `Resolvida` e `Cancelada` podem ser reabertas quando autorizado;
- próximo ator: `Aberta → Escola`, `Aguardando reanálise → Controlador`, terminal → nenhum;
- `canceled_at` terminal atual não apaga histórico de cancelamento;
- bonificação, análise técnica e Pendência são dimensões independentes.

### NF / `a_identificar` / Assessoria

- análise/Pendência fiscal individual usa `registered_invoice_id`;
- `a_identificar` novo nasce `Incorreto + Pendência` atomicamente;
- identificação posterior preserva ID;
- legados legítimos não recebem backfill heurístico;
- Assessoria é individual por NF de serviço e agregado mensal é derivado;
- `boleto_internet` é tipo de gasto dentro de NF em Educação Conectada, não documento autônomo.

### Capital e Inventário

- NF permanente cria/vincula bem;
- com número + processo já existente: bem novo `Encaminhada` / **Aguardando Inventariação**;
- sem processo: bem novo `Não encaminhada`;
- somente o ramo `Não encaminhada` exige `Não encaminhada → Encaminhada → Inventariada`;
- `encampInventario`: nenhum permanente = N/A; algum não encaminhado = Não; todos encaminhados/inventariados = Sim;
- Prontuário usa vínculo técnico NF ↔ bem;
- encaminhamento posterior sincroniza bem + verificação + log atomicamente;
- número da NF de bem derivado não é editado isoladamente;
- guards de gesto repetido existentes devem ser preservados.

### Avaliação e competência

- `RadarCompetenceContext` é autoridade global;
- Pendências é passivo transversal e pode ter filtro local `Todas` sem trocar a competência global;
- competências futuras podem ser consultadas, mas operações protegidas ficam somente leitura;
- BB Ágil aceita N/A quando cabível; Extrato CC/INV não;
- PDDE Básico primeiro é apenas apresentação;
- consolidação e retificação são operações distintas.

### Perfis/equipe

- Controlador não redistribui `controller_id` em edição cadastral comum;
- desativação de Controlador exige carteira previamente zerada;
- Assistente possui atuação transversal autorizada e Gestão de Equipe;
- SME não ganha mutações operacionais de Pendências por simples visualização;
- Inventário opera o recorte patrimonial;
- `technical_admin` preserva autoridade real durante simulação visual;
- equipe usa `DirectoryService → TeamAccountGateway → team-account-management → Auth Admin + RPC`.

### Exportações

- Excel SME: uma competência, uma aba, 27 colunas A:AA;
- XLSX institucional corrente: competência global ativa por decisão posterior de 09/08;
- CSV: política temporal/auditoria ainda precisa de decisão explícita antes de convergência;
- XLSX de Pendências: segue filtros da fila, inclusive transversalidade local.

## 4. Achados adversariais ainda abertos

### P1 — `Inventariada → Encaminhada` ao salvar a NF

Defeito reproduzido no service/planner: save de NF permanente já vinculada pode reaplicar regra de nascimento e rebaixar bem `Inventariada` para `Encaminhada`, preservando metadados de inventariação.

Antes do hotfix: reproduzir em Supabase descartável, caracterizar no-op e edições permitidas, criar RED da sequência `criar NF → inventariar → salvar NF → reload`.

### P1 — auditoria pré-download do Excel SME

O entrypoint auditado bloqueia falha inicial, mas o botão real pode seguir closure privada que baixa antes da confirmação.

Antes do hotfix: teste pelo botão real `falha da auditoria inicial → nenhum download`.

### Decisão necessária — idade total × espera do ator

Mesmo registro após reanálise incorreta: uma projeção retornou 35 dias desde abertura, outra 1 dia desde retorno à Escola. Não unificar por inferência.

### Investigação/decisão — CSV × XLSX

XLSX usa competência ativa; CSV mantém política anterior. Definir escopo temporal, ordem da auditoria e fallback antes de alterar.

## 5. Dívidas/riscos adicionais revelados pelo pacote Astra

- renderer antigo de Pendências com duas abas ainda potencialmente executável por composição;
- duas derivações ativas de `encampInventario`;
- múltiplas projeções de data/idade/próximo ator;
- ramo fiscal agregado inalcançável ainda presente em API ativa;
- `operational-write-performance.js` ainda participa de correção funcional;
- `RadarProductExtensionsReady` pode existir antes de a capability estar efetivamente pronta;
- teste/helper antigo de desativação de Controlador ainda fala em transferência automática de 13 escolas;
- E2E de timeline manipula `activeCompetenciaKey` diretamente;
- anchors da matriz ainda podem apontar para migrations/RPCs superadas.

Esses itens exigem classificação/prova própria. Não são todos bugs de runtime.

## 6. O que a auditoria Astra realmente executou

O pacote de evidências preservado registra:

- 840 arquivos inventariados naquele checkout;
- 242 documentos, 187 unitários, 56 E2E, 46 migrations, 51 integrações, 47 scripts, entre outras categorias;
- mapa estático com 3.797 funções, 151 chamadas relevantes, 88 definições SQL e 57 nomes SQL distintos, 0 erros de parse;
- integração: 7/7;
- desktop E2E: 141 aprovados, 37 ignorados, 0 falhas entre 178 cenários;
- suíte unitária ampla: 871/873, com 2 falhas de artefato/reprodutibilidade do checkout que não foram usadas como prova de defeito funcional;
- ambiente normalizado por `npm ci` após detectar dependências reaproveitadas divergentes.

A principal lição é que **ampla cobertura verde coexistiu com bugs encontrados por probes de composição/estado**.

## 7. Método e evidências correntes

- método: [`architecture/adversarial-analysis-and-implementation-method.md`](architecture/adversarial-analysis-and-implementation-method.md)
- playbook reproduzível: [`architecture/adversarial-analysis-replication-playbook.md`](architecture/adversarial-analysis-replication-playbook.md)
- ledger de achados: [`audits/2026-09-05-astra-adversarial-findings.md`](audits/2026-09-05-astra-adversarial-findings.md)
- estudo do pacote: [`audits/2026-09-05-astra-artifact-package-review.md`](audits/2026-09-05-astra-artifact-package-review.md)
- auditoria anterior de continuidade: [`audits/2026-09-05-continuity-semantic-traceability-complete.md`](audits/2026-09-05-continuity-semantic-traceability-complete.md), válida para reconstrução documental, não como prova de ausência de bug.

## 8. Ordem de trabalho

O único plano executável é [`MASTER_PLAN_CURRENT.md`](MASTER_PLAN_CURRENT.md), agora iniciado pela Frente 0:

1. concluir método/documentação/achados;
2. hotfix patrimonial P1;
3. hotfix exportação P1;
4. decisões/probes Pendências e CSV;
5. retomar frentes arquiteturais anteriores sob o método adversarial;
6. fechamento final somente depois de registrar o que foi tentado para provar que ainda estava errado.
