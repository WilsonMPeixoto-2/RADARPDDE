# Handoff corrente — investigação PROD-FUNC-09: data de negócio exibida um dia antes

**Estado:** corrente  
**Data:** 28 de setembro de 2026  
**Escopo:** causa-raiz primeiro; correção somente após prova  
**Próximo executor previsto:** Codex  
**Fase D:** adiada; não iniciar nesta frente

## 1. Onde o projeto está

As Fases A, B e C estão encerradas. A Fase D permanece deliberadamente adiada.

A jornada principal de **Despesa a identificar** foi reavaliada depois de A+B+C e está funcionalmente homologada por evidências complementares:

- Playwright local com controles reais;
- workflow com Supabase descartável, Auth/RLS/RPCs e reload;
- navegação autenticada em Production;
- ciclo sintético autorizado em Production.

No ciclo de Production foram comprovados:

```text
Prontuário
→ criação de Despesa a identificar
→ Pendência Aberta
→ retificação dos dados provisórios
→ preservação da mesma invoice e da mesma Pendência
→ primeiro envio
→ identificação como Material de Consumo
→ Aguardando reanálise
→ reanálise negativa coerente com ausência de arquivo real
→ retorno para Aberta / Escola
→ Registrar novo envio
→ reload
→ mesmos IDs, valor, tipo, status e contexto
→ conferência por Prontuário, Pendências Ativas da unidade e fila global
```

Não reabrir essa baseline sem nova evidência concreta.

## 2. Evidência de origem

Checkpoint da auditoria:

`docs/evidence/2026-09-27-post-abc-expense-ux-audit/README.md`

Ele está preservado na branch histórica de auditoria:

`audit/post-abc-expense-baseline-2026-09-27`

O registro sintético autorizado de Production usou, no checkpoint:

- invoice DOM: `nota-82b17b35-971e-49d9-85a5-d4e0e2c55065`;
- Pendência DOM: `pend-699702ea-480f-4703-bd98-9de990237f35`;
- escola: Escola Municipal Cardeal Câmara, `04.31.017`;
- competência: `08/2026`;
- programa: PDDE Básico;
- referência final: `DOC-TESTE-UX-2709-2308`;
- data informada no primeiro envio: `27/09/2026`.

Esses IDs servem para localizar evidência. **Não executar novas mutações em Production por inferência.** Escrita em Production exige autorização explícita nova para a ação proposta.

## 3. Achado corrente

**PROD-FUNC-09 — data de disponibilização retrocede um dia na fila global.**

Observado em Production:

1. o formulário recebeu `27/09/2026`;
2. a prévia do diálogo de reanálise exibiu `2026-09-27`;
3. depois do reload, em `Tentativas de envio` no drawer global, a disponibilização apareceu como `26/09/2026`;
4. a linha do tempo continuou registrando os eventos em `27/09/2026`.

Classificação atual:

- defeito funcional de apresentação;
- confiança alta na reprodução visual de Production;
- causa ainda **não formalmente comprovada**.

## 4. Hipótese técnica já identificada — não promover a causa sem prova

Existe uma hipótese forte no código corrente:

`src/integration/task-9-pendencias-page.js`

possui formatação equivalente a:

```js
function formatDate(value) {
    if (!value) return 'Data não informada';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Data não informada';
    return parsed.toLocaleDateString('pt-BR');
}
```

Uma string date-only `YYYY-MM-DD` é interpretada por JavaScript como instante UTC. Em fuso negativo, `2026-09-27T00:00:00Z` pode cair no dia civil anterior local e ser exibida como `26/09/2026`.

Há também contrato histórico explícito de que:

- `dataDisponibilizacao` é **data de negócio**;
- `dataRegistro/submitted_at` é **instante técnico**.

Arquivos relevantes já localizados:

- `src/integration/task-9-pendencias-page.js`;
- `src/data/state-bridge.js`;
- `src/data/legacy-state-adapter.js`;
- `src/domain/pendencias.js`;
- `src/domain/pendencias-view-model.js`;
- `tests/unit/pendency-availability-roundtrip.test.js`;
- `supabase/tests/database/pendency-attempt-availability.test.sql`;
- `docs/superpowers/plans/2026-08-09-autoridade-e-pendencias-desktop.md`.

A investigação deve provar se o problema está **somente na apresentação** ou se existe transformação incorreta em outra camada.

## 5. Metodologia obrigatória vigente

Antes desta retomada foi integrado o PR #389, que instituiu a aceitação humana outside-in.

Ler obrigatoriamente:

1. `AGENTS.md`;
2. `docs/reference/SYSTEM_CANONICAL_MODEL.md`;
3. `docs/reference/PRODUCT_SURFACE_CATALOG.md`;
4. `docs/CURRENT_STAGE.md`;
5. este handoff;
6. `docs/reference/ENGINEERING_METHOD.md`;
7. `docs/reference/FRONTEND_USER_VALIDATION_GATE.md`;
8. `docs/reference/TEST_GOVERNANCE.md`.

Princípio:

```text
tela renderizada
→ percepção humana
→ problema observado
→ mecanismo técnico
```

Não:

```text
implementação parece correta
→ portanto a tela deve estar boa
```

A correção só termina com:

```text
aprovação técnica
+
aprovação humana do resultado renderizado
=
tarefa concluída
```

## 6. PRIMEIRA TAREFA DO CODEX

Investigar **somente PROD-FUNC-09**.

Não misturar nesta rodada:

- PROD-UX-08 / clipping do drawer;
- UX-01 a UX-07;
- Fase D;
- redesign;
- refatoração geral de datas;
- mobile;
- outros fluxos.

### 6.1 Sanidade

Antes de editar:

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git status --short
git rev-parse HEAD
node --version
npm --version
```

Registrar o SHA real.

Se `main` tiver avançado, usar a documentação corrente do novo SHA. Não voltar para um SHA antigo apenas porque este handoff o menciona.

### 6.2 Rastrear o valor de ponta a ponta

Provar, para uma data civil conhecida como `2026-09-27`:

```text
valor persistido / payload remoto
→ valor lido pelo repository/state bridge
→ valor em pendency.tentativas
→ valor em view model/record
→ valor entregue a formatDate
→ texto renderizado
```

A pergunta central é:

> Em qual primeira fronteira `2026-09-27` deixa de representar o dia civil 27 e passa a produzir 26?

Não deduzir a resposta apenas pela presença de `new Date(value)`.

### 6.3 Usar provas já existentes antes de criar infraestrutura

Inspecionar primeiro:

- `tests/unit/pendency-availability-roundtrip.test.js`;
- `supabase/tests/database/pendency-attempt-availability.test.sql`;
- testes de `task-9-pendencias-page` ou de Pendências que já renderizem tentativas.

Se os testes existentes já provarem o armazenamento/round-trip, reutilizá-los como evidência e criar apenas a regressão mínima que falta.

### 6.4 Criar RED mínimo antes da correção

Criar ou adaptar um teste que demonstre explicitamente:

```text
entrada de negócio: 2026-09-27
saída visual esperada: 27/09/2026
saída visual defeituosa atual, se reproduzível no ambiente: 26/09/2026
```

O teste deve falhar pelo motivo observado, não por timezone artificial sem relação com o runtime.

Quando necessário, executar com timezone que reproduza a situação de Production, preferencialmente `America/Sao_Paulo`, sem alterar o timezone global do produto.

### 6.5 Só então classificar a causa

Classificar uma destas possibilidades ou outra comprovada:

- apresentação pura de date-only;
- state bridge/adaptação;
- serialização/persistência;
- payload legado;
- timezone do runtime;
- combinação de mais de uma camada.

Registrar contraprova:

- uma data com hora real continua sendo instante técnico e deve respeitar timezone;
- uma data civil deve preservar o mesmo dia civil informado.

### 6.6 Correção

**Não corrigir até a causa estar comprovada.**

Se a causa for exclusivamente formatação de date-only:

- aplicar a menor correção coerente;
- não mudar persistência;
- não converter todas as datas indiscriminadamente;
- preservar o tratamento de timestamps reais;
- evitar helper paralelo se já houver autoridade adequada de formatação civil.

Se a causa atingir bridge/persistência, parar antes de migration/RPC e relatar a evidência, porque o escopo e o risco mudaram.

## 7. Provas técnicas esperadas depois da correção

No mínimo:

1. RED reproduz o problema antes;
2. GREEN depois;
3. teste de round-trip de `dataDisponibilizacao` continua verde;
4. timestamps com hora continuam formatados corretamente;
5. cenário de Pendências afetado continua verde;
6. nenhum teste/golden é alterado apenas para aceitar a correção.

Executar suíte proporcional, não a suíte inteira por reflexo.

## 8. Validação humana outside-in obrigatória

Depois da correção técnica, abrir a tela renderizada em estado representativo.

Sem justificar pela implementação, registrar:

- onde o usuário está;
- qual tentativa está sendo visualizada;
- qual data ele entende como data de disponibilização;
- se essa data é consistente com o envio e com a linha do tempo;
- se existe qualquer nova ambiguidade visual criada pela correção.

Critério humano específico:

> uma pessoa que informou 27/09/2026 deve ver 27/09/2026 quando a interface estiver apresentando a **data de disponibilização**, sem precisar conhecer UTC, timezone ou implementação.

A correção reprova se o teste técnico passar mas a tela ainda exibir dia diferente, formato técnico inadequado ou conflito semântico entre superfícies.

## 9. Production

Não escrever em Production nesta investigação sem nova autorização explícita.

A Production pode ser usada em modo leitura, se a sessão estiver autenticada, para observar o registro sintético e comparar apresentação.

Não alterar o registro de teste para criar outra tentativa apenas para reproduzir.

Se a correção for implementada em branch/Preview, validar ali com fixture/data sintética adequada. A publicação em Production será decisão posterior.

## 10. Checkpoint obrigatório

Criar evidência versionada, por exemplo:

`docs/evidence/2026-09-28-prod-func-09-date-business/README.md`

Registrar:

- SHA baseline;
- SHA candidato;
- causa comprovada;
- RED;
- mudança aplicada, se houver;
- testes/gates;
- leitura humana outside-in;
- screenshots/capturas relevantes;
- limitações;
- próximo passo.

Se a cota estiver próxima do fim, parar novas execuções e priorizar o checkpoint.

## 11. Critérios de parada

Parar **sem corrigir** e devolver evidência se:

- o Supabase armazenar dia diferente do informado;
- bridge/adaptação modificar a data;
- houver divergência entre payload legado e coluna canônica;
- a reprodução depender de comportamento não determinístico;
- corrigir exigir migration/RPC/schema;
- surgir regressão em timestamps reais;
- o bug não reproduzir fora de Production e não houver mecanismo causal comprovado;
- a investigação revelar que PROD-FUNC-09 e outro problema compartilham causa maior.

Nesses casos, não ampliar escopo automaticamente.

## 12. Formato obrigatório da entrega

```text
SHA BASELINE:
SHA CANDIDATO:
AMBIENTE:

PROD-FUNC-09
Reprodução: PASSOU / NÃO REPRODUZIU / INCONCLUSIVA

RASTREAMENTO
Persistência:
State bridge:
Domínio:
View model:
Valor recebido pelo formatter:
Texto renderizado:

CAUSA
- fato comprovado:
- primeira camada onde ocorre a divergência:
- contraprova:
- confiança:

RED
- teste:
- resultado:

CORREÇÃO
- aplicada?:
- arquivos:
- por que é a menor correção coerente:

GREEN / REGRESSÃO
- testes:
- resultados:

ACEITAÇÃO HUMANA OUTSIDE-IN
- onde o usuário está:
- data que ele entende como disponibilização:
- coerência com contexto/timeline:
- problema visual ou semântico remanescente:

PRODUCTION
- somente leitura?:
- houve escrita?:
- autorização, se aplicável:

LIMITES
- ...

PRÓXIMO PASSO
- ...
```

## 13. Depois de PROD-FUNC-09

Não iniciar automaticamente.

O próximo achado já conhecido é:

**PROD-UX-08 — clipping do drawer global em desktop.**

Ele deve receber investigação própria porque a hipótese atual envolve composição entre `task-9-pendencias.css` e `layout-responsive-2026.css`, e será o caso ideal para aplicar o gate outside-in completo.

Primeiro encerrar PROD-FUNC-09. Depois reavaliar configuração/modelo/esforço.
