# RADAR PDDE — Plano mestre vigente pós-auditoria adversarial

**Atualizado em:** 5 de setembro de 2026  
**Classe:** **ÚNICO PLANO EXECUTÁVEL VIGENTE**  
**Baseline funcional:** PR #260 / `8fc58926565a72465980143f253f0a2fee4b8fc2`

> Leia primeiro [`../START_HERE.md`](../START_HERE.md). Antes de qualquer frente, aplicar o método adversarial e seu playbook reproduzível.

## 1. Objetivo

Concluir somente trabalho real do produto atual, preservando hotfixes posteriores e substituindo o antigo padrão de “gates verdes = fechamento” por investigação adversarial de defeitos desconhecidos.

## 2. Método obrigatório em todas as frentes

Toda frente deve, proporcionalmente ao risco:

1. confirmar `main`/SHA/PRs;
2. inventariar e mapear autoridades relevantes;
3. localizar segunda implementação/fallback/callback/closure;
4. procurar estado avançado que a operação possa destruir;
5. criar contraexemplo/probe quando houver hipótese concreta;
6. reproduzir antes de corrigir;
7. fazer TDD focal;
8. testar ponto de entrada real;
9. persistir/recarregar quando material;
10. combinar fluxos verdes em sequência;
11. tentar quebrar a própria correção;
12. atualizar `CURRENT_STATE.md` e `PLAN_TRACEABILITY.md`.

Método: [`architecture/adversarial-analysis-and-implementation-method.md`](architecture/adversarial-analysis-and-implementation-method.md)  
Playbook: [`architecture/adversarial-analysis-replication-playbook.md`](architecture/adversarial-analysis-replication-playbook.md)

---

# Frente 0 — absorver auditoria adversarial antes das frentes arquiteturais

## 0A — documentação, método e evidências

Objetivo:

- tornar método adversarial obrigatório;
- registrar achados Astra;
- reconciliar documentos correntes que ainda ensinam contratos antigos;
- preservar estudo dos artefatos para reutilização por novas sessões;
- impedir que “CI verde” volte a ser usado como prova de ausência de bug.

Entregas:

- método adversarial;
- playbook reproduzível;
- ledger de achados;
- revisão do pacote Astra;
- `START_HERE`, `AGENTS`, `TEST_GOVERNANCE`, `CURRENT_STATE`, `PLAN_TRACEABILITY`, `STATUS_DOCUMENTOS` atualizados;
- arquitetura de competências/exportações reconciliada.

Gate:

- checker documental verde;
- nenhuma documentação corrente conhecida ensina política antiga de competência institucional/CSV como se fosse vigente;
- PR #263 permanece documental, sem runtime.

## 0B — hotfix patrimonial P1

Defeito comprovado:

```text
bem Inventariada
+ salvar novamente a NF permanente vinculada
→ planner pode reaplicar regra de nascimento
→ bem Encaminhada com metadados de inventariação preservados
```

Antes da correção:

- reproduzir em Supabase descartável;
- caracterizar no-op;
- edição de descrição/valor;
- mudanças de tipo autorizadas;
- processo cadastrado posteriormente;
- reload/round-trip.

Implementação esperada:

- separar estado inicial de bem novo de transição de bem já existente;
- não permitir que save administrativo da NF desfaça inventariação concluída sem operação patrimonial explícita.

Gate:

```text
criar NF
→ inventariar
→ salvar NF
→ reload
→ continua Inventariada
```

## 0C — hotfix auditoria Excel SME P1

Defeito comprovado em composição:

```text
entrypoint auditado + falha inicial → nenhum download
botão SME real/integrado + mesma falha → caminho privado pode baixar antes da confirmação
```

Entrega:

- convergir botão real para autoridade auditada;
- remover/neutralizar caminho concorrente apenas depois de caracterizado;
- teste de gesto real com falha inicial.

Gate:

```text
clicar Excel SME
→ falha audit inicial
→ zero download
→ zero conclusão
→ nova tentativa possível
```

## 0D — decisões e probes antes de unificar

### Pendências

Divergência reproduzida:

- idade total desde abertura;
- tempo desde evento que devolveu ao ator atual.

Decidir explicitamente se o produto exibirá uma, outra ou ambas as métricas. Não unificar por inferência.

### CSV × XLSX

Definir:

- escopo temporal do CSV;
- ordem da auditoria;
- condição de fallback;
- relação deliberada com XLSX institucional.

Só depois alterar código/testes.

---

# Frente 1 — retirar autoridade funcional dos wrappers de performance

Problema confirmado e reforçado pelo Astra:

`operational-write-performance.js` ainda participa de políticas funcionais e `prontuario-conditional-reconciler.js` depende da composição.

Entrega:

- mover autoridade funcional para serviços/DataService/StatePort adequados;
- deixar performance/diagnóstico fail-open e observacional;
- provar equivalência funcional com módulo presente/ausente.

Gate: mesmas escritas/projeções sem depender do módulo de performance para correção.

---

# Frente 2 — readiness determinístico por capability

Problema confirmado:

- Promise `RadarProductExtensionsReady` pode existir antes da capability efetivamente instalada;
- polling/composição tardia ainda participa de readiness;
- loader sequencial pode confundir script presente com operação pronta.

Entrega:

- contrato `pending/ready/failed/degraded` por capability;
- distinguir script carregado de capacidade instalada;
- preservar fail-closed em capacidade crítica;
- não remover timers/MutationObserver legítimos por ritual.

Gate: testes esperam resolução/capability real, não truthiness de Promise publicada.

---

# Frente 3 — identidade segura e idempotência durável da NF normal

Preservar guards imediatos do #260. Completar:

- IDs seguros;
- intent/operation key durável;
- idempotência server-side;
- optimistic concurrency;
- RPC v2 da NF normal com resultado composto.

Gate: retry ambíguo, conflito, isolamento por ator, duas NFs idênticas com chaves distintas.

---

# Frente 4 — projeção operacional de Pendências

Não reabrir transições já estabilizadas.

Dívida:

- cálculos concorrentes de data-base/idade/ação;
- múltiplas projeções de próximo ator;
- renderer legado antigo ainda potencialmente executável.

Pré-condição: decisão 0D sobre métricas.

Entrega:

- núcleo compartilhado apenas onde semântica for realmente comum;
- textos editoriais podem divergir;
- teste diferencial com o mesmo registro entre Dashboard/Carteira/Pendências/alertas.

---

# Frente 5 — save/remove NF autoritativo e incremental

Preservar integralmente NF ↔ bem ↔ verificação e o hotfix 0B.

Entrega:

- resposta v2 completa;
- upsert/remove autoritativos;
- aplicação incremental local;
- fallback seguro;
- sem repetir write quando commit remoto já ocorreu.

Gate inclui conversões, múltiplos bens, `encampInventario`, no-op, remoção e estados patrimoniais avançados.

---

# Frente 6 — gate de equivalência das superfícies

Executar regressões cross-view, quatro abas, filtros, drawer, novo envio/reanálise/substituição/reabertura, exportações, perfis, acessibilidade e Prontuário.

Não basta comparar screenshots/outputs felizes: incluir sequências e falhas intermediárias definidas pelo método adversarial.

---

# Frente 7 — instrumentação causal e otimização condicionada

## 7A Instrumentação

Medir auth, sessão, Supabase, leituras, normalização, StatePort, primeiro render, capabilities críticas e interação útil.

## 7B Otimização

Somente quando causa medida superar ruído/custo. Não relaxar threshold para fabricar verde.

---

# Frente 8 — fechamento integral e rebaseline

No SHA final:

1. reconciliar `main`, Vercel e Supabase;
2. migrations/tipos;
3. unitários/integração;
4. pgTAP/RLS/Auth;
5. banco limpo;
6. backup/restauração;
7. Playwright e jornadas reais;
8. perfis/viewports;
9. Excel/exportações;
10. CodeQL/dependências;
11. Lighthouse;
12. matriz funcional;
13. revisão adversarial final;
14. documentação.

Além dos gates, registrar obrigatoriamente:

> **O que foi tentado para provar que ainda estava errado?**

Sem essa seção, não existe fechamento integral.

## Ordem executável

```text
0A método/documentação
→ 0B hotfix patrimonial
→ 0C hotfix Excel SME
→ 0D decisões/probes
→ 1 performance sem autoridade funcional
→ 2 readiness determinístico
→ 3 identidade/idempotência NF
→ 4 projeção Pendências
→ 5 save/remove NF autoritativo
→ 6 equivalência
→ 7A instrumentação
→ 7B otimização se medida
→ 8 fechamento adversarial/rebaseline
```

**Esta é a única fila executável vigente.**
