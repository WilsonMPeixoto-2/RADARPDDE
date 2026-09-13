# UAT operacional — checkpoint pós-correção do primeiro cenário remoto

**Data:** 13 de setembro de 2026  
**Classe documental:** Handoff corrente / atualização incremental  
**PR ativo:** #301 — UAT operacional Supabase e observabilidade pós-refatoração  
**HEAD observado da UAT:** `4a7a41dc29ab87eb5b4f56f4d26558706409af50`

> Leia antes o relatório consolidado [`2026-09-13-relatorio-tecnico-consolidado-pos-pr300-uat.md`](2026-09-13-relatorio-tecnico-consolidado-pos-pr300-uat.md). Este arquivo não o substitui historicamente; registra somente o que avançou depois daquele checkpoint e é o handoff corrente enquanto `docs/CURRENT_STAGE.md` o apontar.

## 1. Baseline de Production

A `main` foi atualizada pelo PR #302 apenas para reconciliar documentação e roteamento.

**`main` atual no checkpoint:** `a2e961a4822e929bc9b5ee01fbfc2e081785e227`  
**Último baseline funcional de aplicação integrado:** `1a149174ed4a14d2fc9f92aff57d1957e8538e89`  
**Natureza de `a2e961a4...`:** merge exclusivamente documental sobre o baseline funcional anterior.

Vercel publicou o merge documental em Production:

- deployment `dpl_B4L9RmEDRWn4ALif9ffPho34SWZt`;
- target `production`;
- estado `READY`;
- SHA `a2e961a4822e929bc9b5ee01fbfc2e081785e227`.

Como o merge é documental, o código de runtime funcional permanece equivalente ao baseline do PR #300. Revalidar deployment/logs ao vivo em retomadas futuras.

## 2. Avanço do PR #301 após o relatório consolidado

Depois do checkpoint `920c7230...`, a branch avançou três commits:

### `7a01f40fd7b2dfc7ebe9c1add9be78dffcc484d1`

`test: alinhar estado visual selecionado no UAT`

A asserção incorreta `/is-selected/` foi substituída por `/active-sim/`, que corresponde ao contrato visual real do botão de bonificação. A correção foi aplicada tanto à confirmação imediata quanto à verificação pós-reload.

### `6e6fcf8fee317268fcaa03796563223f44e2c432`

`fix: resolver assets do logo a partir da raiz`

`src/integration/mobile-navigation.js` passou a resolver os arquivos do logo original com caminhos absolutos a partir da raiz (`/src/assets/...`) em vez de caminhos relativos. Esta é uma **alteração funcional real** dentro do PR #301 e deve ser preservada e validada nos gates. Ela não fazia parte do relatório anterior, que dizia que o PR continha somente testes/workflow/documentação.

### `4a7a41dc29ab87eb5b4f56f4d26558706409af50`

`test: aguardar convergência remota da avaliação`

O UAT passou a usar uma leitura remota reutilizável da linha `verifications` e `expect.poll(...)` por até 10 segundos para aguardar a convergência Supabase antes da asserção final. Isso evita confundir persistência assíncrona válida com falha instantânea de teste.

## 3. Resultado atualizado do UAT operacional

No HEAD `4a7a41dc...`, o workflow **Ciclos funcionais reais com Supabase** run `34772406774` concluiu com **success**.

Isso significa que os dois cenários novos de `tests/e2e/supabase-operational-uat.spec.js` chegaram ao fim com sucesso junto aos cenários remotos já existentes.

### Cenário 1 — login → dashboard → Registros Internos

Continua comprovado:

- autenticação real pelo frontend;
- dashboard chega ao estado utilizável;
- `administrative_logs` não participa do bootstrap;
- não foi detectado GET operacional sem filtro contextual nesse fluxo;
- `administrative_logs` é solicitado ao abrir Registros Internos;
- leitura limitada/ordenada;
- ausência de erro material de console/página.

### Cenário 2 — avaliação → Supabase → ausência de base local concorrente → reload

Agora passou integralmente, portanto há evidência automatizada de que, no cenário `ESC-LOCAL / 2026-05 / PDDE Básico / Extrato Conta Corrente`:

- o usuário marca `Sim` e `Correto` pela interface real;
- a UI assume o estado visual correto;
- a alteração converge para a linha de `verifications` no Supabase descartável autenticado;
- `row_version` é válido;
- as coleções operacionais verificadas não são gravadas no `localStorage` como banco paralelo;
- após reload, a interface reencontra `Sim` e `Correto` a partir do estado remoto.

Essa prova é importante porque une, no mesmo teste, **clique real + Auth/RLS + Supabase + projeção da UI + reload**.

## 4. Gates do HEAD `4a7a41dc...`

Concluíram com sucesso:

- CodeQL — `34772406953`;
- Supabase readiness — `34772406893`;
- Confiabilidade funcional com Supabase real — `34772406897`;
- Validar RADAR PDDE — `34772406711`;
- Saúde das dependências — `34772406872`;
- Retificação auditável direcionada — `34772406707`;
- Ciclos funcionais reais com Supabase — `34772406774`;
- Gate remoto de perfis e viewports — `34772406787`;
- Testes E2E Playwright — `34772406758`.

O Lighthouse isolado `34772406786` continuou sujeito à oscilação já conhecida. Não classificar essa oscilação, isoladamente, como regressão funcional.

## 5. Homologação pré-production: falha de infraestrutura, não do produto

A homologação integral run `34772406809` terminou `failure`, mas a inspeção dos jobs é essencial:

Passaram:

- dependências e segurança;
- prontidão completa;
- Excel SME/OOXML/rota pública;
- migrations em PostgreSQL limpo;
- Playwright completo;
- Lighthouse móvel e desktop;
- backup/restauração descartáveis.

O job `Supabase local, Auth, RLS e pgTAP` chegou a concluir com sucesso:

- todas as migrations;
- preflight/post-apply;
- **30 arquivos pgTAP / 426 testes — todos aprovados**;
- lint do schema — sem erros.

A falha ocorreu na etapa seguinte, `Regenerar e conferir artefatos`, especificamente durante `supabase gen types`, quando Docker tentou baixar:

`public.ecr.aws/supabase/postgres-meta:v0.97.0`

e o registry respondeu:

`toomanyrequests: Rate exceeded`

com exit 125.

Classificação: **limitação/rate limit do registry externo na infraestrutura do CI**. Não é evidência de falha do schema, Auth, RLS, pgTAP, aplicação ou Supabase Production.

Não corrigir produto para essa falha. Em nova execução, diferenciar recorrência estrutural de indisponibilidade transitória externa.

## 6. Estado correto da frente agora

A tarefa imediata **não é mais corrigir `is-selected`**. Isso já foi feito e a jornada passou.

O PR #301 permanece Draft porque a UAT ainda cobre apenas uma fração do sistema real.

Próximas prioridades:

1. ampliar a avaliação mensal para Sim/Não/N/A, análise técnica, atrasado, consolidação e derivados;
2. NF/despesa de consumo pela interface + Supabase + reload;
3. serviço e Consulta Assessoria individualizada;
4. permanente e reflexos em Capital/Inventário/encaminhamento;
5. Boleto de Internet em Educação Conectada;
6. `a_identificar` com abertura atômica de Pendência, novo envio e identificação posterior;
7. ciclo completo de Pendência, tentativas, contatos, reanálise resolutiva/não resolutiva, cancelamento/reabertura autorizados;
8. retificações/edições recentes e preservação de identidade/histórico;
9. mensagens de sucesso, erro, bloqueio e sincronização;
10. testes de falha remota e falha de projeção local pós-commit;
11. efeitos cruzados entre Prontuário, Pendências, Inventário, Dashboard/Carteira e Registros Internos;
12. baseline de capacidade e monitor de regressão via `pg_stat_statements`.

## 7. Guardrails para continuidade

- não reintroduzir `localStorage` como banco operacional remoto;
- não proibir cache/memória local útil;
- não reintroduzir consultas globais acumulativas no bootstrap;
- preservar a correção de caminhos do logo enquanto ela for validada pelos gates;
- não confundir rate limit do registry com bug do produto;
- não alterar produto correto para satisfazer asserção obsoleta de teste;
- manter PR #301 em Draft até completar as jornadas críticas;
- preservar o rollback do PR #299;
- separar atualização de dependências da UAT funcional.

## 8. Ponto de retomada

1. revalidar `main`, PR #301 e ambientes ao vivo;
2. ler o relatório consolidado predecessor;
3. usar este arquivo como delta corrente;
4. continuar expandindo `supabase-operational-uat.spec.js` e/ou jornadas remotas especializadas, sem duplicar autoridades existentes;
5. para cada fluxo, provar:

```text
ação real do usuário
→ confirmação remota
→ projeção correta na UI
→ efeitos transversais
→ reload
→ mesma verdade
```
