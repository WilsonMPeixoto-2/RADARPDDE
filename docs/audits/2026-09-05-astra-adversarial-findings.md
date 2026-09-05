# RADAR PDDE — Achados adversariais posteriores ao fechamento documental

**Data:** 5 de setembro de 2026  
**Baseline funcional examinada:** PR #260 / `8fc58926565a72465980143f253f0a2fee4b8fc2`  
**Checkpoint documental integrado examinado:** PR #261 / `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`  
**PR documental em revisão:** #263  
**Classe:** ledger corrente de achados; não altera runtime nem cria regra por inferência.

> A auditoria anterior de continuidade reconstruiu corretamente a linha #253→#261, mas não provou ausência de defeitos desconhecidos. A auditoria Astra procurou contraexemplos, autoridades concorrentes e combinações de fluxos verdes e encontrou problemas adicionais.

## 1. Evidência metodológica central

Na coleta Astra daquele checkout:

- 840 arquivos inventariados;
- 3.797 funções mapeadas por AST;
- 151 chamadas relevantes de write/load;
- 88 definições SQL e 57 nomes distintos no índice;
- integração 7/7;
- E2E desktop 141 aprovados, 37 ignorados, 0 falhas entre 178;
- Production integrity saudável/zero issues no snapshot.

Mesmo assim, bugs/composições incorretas foram reproduzidos.

Conclusão:

```text
gates verdes + integridade saudável
≠ ausência de defeito desconhecido
```

## 2. B — bug funcional reproduzido: bem `Inventariada` rebaixado ao salvar NF

**Risco:** P1 / Alto

Cadeia:

1. `InventoryService.inventory` conclui `Inventariada` e grava metadados;
2. `InvoiceService.save` carrega o bem;
3. `buildDesiredAsset` reaplica regra de estado inicial também no update;
4. com processo existente, status é sobrescrito para `Encaminhada`;
5. metadados de inventariação permanecem.

Probe com `InvoiceService` real reproduziu:

```text
NF permanente sem alteração
+ bem Inventariada
+ processo existente
→ save
→ bem Encaminhada
→ metadados de inventariação preservados
```

**Limite:** reproduzido em service/planner com persistência em memória. Antes do hotfix, reproduzir round-trip em Supabase descartável.

Correção esperada: separar regra de nascimento do bem de transições de bem existente; edição de NF não deve desfazer inventariação sem operação patrimonial explícita.

## 3. C — inconsistência de composição: auditoria do Excel SME

**Risco:** P1 / Alto

O entrypoint auditado bloqueia download quando a auditoria inicial falha. O botão SME real é criado com closure privada que pode baixar antes da confirmação.

Probe de composição:

```text
entrypoint auditado + falha inicial
→ audit-failed
→ zero download

botão SME integrado + mesma falha
→ download
→ legacy-log
→ legacy-persist
```

O E2E atual comprova workbook feliz, mas não `falha inicial → nenhum download`.

Correção futura: convergir o ponto de entrada real para a autoridade auditada e testar pelo gesto real.

## 4. F — decisão: idade total da Pendência × espera do ator atual

**Risco:** Alto para filtros/priorização/cobrança

Contraexemplo:

```text
abertura: 01/08/2026
reanálise incorreta: 04/09/2026
agora: 05/09/2026
```

Resultados:

- `pendencias-view-model`: 35 dias desde abertura;
- `operational-projection`: 1 dia desde evento que devolveu à Escola.

Próximo ator é Escola em ambos.

Não unificar por inferência. Decidir se o produto exibe idade total, tempo do ator atual ou ambas as métricas explicitamente.

## 5. F/H — CSV × XLSX institucional

Decisão posterior de 09/08 limita o XLSX institucional à competência global ativa. CSV preserva caminho legado com política temporal/auditoria diferente.

Antes de alterar:

- decidir escopo temporal do CSV;
- ordem da auditoria;
- fallback;
- relação deliberada com XLSX.

Documentação corrente foi reconciliada para não chamar os dois produtos de equivalentes por padrão.

## 6. D — teste/helper de desativação de Controlador ainda ensina regra antiga

Contrato atual: desativação exige **carteira previamente zerada**.

Resíduo:

- teste/helper ativo ainda contém linguagem de “desativada + 13 escolas transferidas”.

O fluxo atual não realiza essa transferência junto da desativação. O resíduo é perigoso porque suíte verde pode preservar duas mensagens/expectativas concorrentes.

Ação futura: aposentar/renomear o ramo impossível sem alterar a regra vigente.

## 7. D — E2E escreve `activeCompetenciaKey` diretamente

`school-timeline.spec.js` manipula variável legada diretamente e injeta estado sintético.

Isso não prova bug da timeline, mas pode mascarar sincronização e ensinar bypass do `RadarCompetenceContext`.

Ação: usar helper/contexto canônico quando a finalidade do teste depender de competência real; marcar fixture isolada quando não depender.

## 8. E — renderer legado de Pendências ainda potencialmente executável

UI moderna: quatro situações/abas canônicas.

`app.js` conserva renderer/fallback anterior de duas abas.

Não há prova de regressão visível na composição atual. O risco é loader/readiness futuro reviver o caminho antigo.

Ação: caracterizar composição/falha controlada antes de retirar fallback.

## 9. E/F — readiness: Promise publicada não equivale capability pronta

`RadarProductExtensionsReady` pode existir como Promise desde o início. Verificar apenas truthiness não comprova resolução nem capacidade instalada.

Ação: testes/loader devem esperar resolução e capability específica. Não remover polling antes de substituto determinístico.

## 10. E — módulo de performance ainda participa da correção

`operational-write-performance.js` altera políticas/handlers e o reconciliador depende da composição.

Não tratá-lo como telemetria fail-open até a Frente 1 remover sua autoridade funcional.

## 11. E — derivações concorrentes de `encampInventario`

`invoice-effects` e `InventoryService` derivam o agregado em caminhos distintos. Hoje a regra básica coincide, mas há diferenças de reset/análise por pré-condição.

Não chamar de bug sem divergência reproduzida. Criar corpus compartilhado de cenários antes de extrair função pura comum.

## 12. D/E — análise fiscal agregada antiga ainda deixa ramo inalcançável

A API atual rejeita escrita agregada de Nota Fiscal, mas permanece ramo interno antigo depois da guarda de rejeição.

Risco: manutenção futura interpretar o ramo morto como suporte atual.

Ação: remover oportunisticamente após confirmar callsites e preservar teste negativo da API agregada.

## 13. D — anchors de matriz para migrations/RPCs superadas

Algumas linhas da matriz apontam para migration inicial de uma RPC que foi redefinida depois.

Regra: resolver última definição efetiva da assinatura e registrar evidência sucessora. Migrations antigas permanecem imutáveis.

## 14. G — históricos legítimos que NÃO devem ser “corrigidos”

- `a_identificar` legado sem análise/Pendência retroativa;
- labels/fixtures de Boleto Internet histórico;
- migrations antigas preservadas;
- fixture adversarial com próximo ator stale para testar normalização;
- conta/local repository explícito em ambiente local/Preview quando permitido.

Existência desses artefatos não autoriza backfill, remoção indiscriminada ou regressão de compatibilidade.

## 15. Regras correntes confirmadas pela auditoria

A auditoria **não** encontrou evidência para revogar:

- novo envio → `Aguardando reanálise`, não resolve;
- substituição enquanto aguarda;
- reabertura Resolvida/Cancelada;
- Controlador/Assistente/technical_admin podem reanalisar conforme autorização;
- bonificação/análise/Pendência independentes;
- BB Ágil N/A sob as regras atuais;
- Boleto Internet como tipo de gasto de NF;
- Assessoria individual por NF;
- `a_identificar` novo atômico + legado sem backfill;
- permanente com processo pode nascer `Encaminhada`; sem processo `Não encaminhada`;
- Excel SME com 27 colunas A:AA;
- Production fail-closed.

## 16. Artefatos e método

- método: [`../architecture/adversarial-analysis-and-implementation-method.md`](../architecture/adversarial-analysis-and-implementation-method.md)
- playbook: [`../architecture/adversarial-analysis-replication-playbook.md`](../architecture/adversarial-analysis-replication-playbook.md)
- estudo do pacote: [`2026-09-05-astra-artifact-package-review.md`](2026-09-05-astra-artifact-package-review.md)

## 17. Critério de fechamento desses achados

Cada item só sai do ledger aberto quando houver uma destas condições:

- bug corrigido e reproduzido antes/depois;
- decisão de produto explicitamente tomada e implementada/testada;
- risco arquitetural caracterizado e tratado em frente apropriada;
- artefato obsoleto corrigido/isolado sem destruir histórico legítimo;
- hipótese H refutada com evidência.

Gate verde sozinho não fecha nenhum item acima.
