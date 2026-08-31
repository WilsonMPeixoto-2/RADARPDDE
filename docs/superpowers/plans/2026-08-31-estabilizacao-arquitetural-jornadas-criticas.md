# Plano de estabilização arquitetural das jornadas críticas

**Data:** 31 de agosto de 2026  
**Baseline:** `79e20734802f2240c794af992d0192d8dd428526`  
**Objetivo:** reduzir recorrência de regressões causadas por regras duplicadas, contexto reconstruído em múltiplas camadas e composição implícita de wrappers/extensões.

## 1. Motivação

A homologação autenticada do hotfix de individualização encontrou dois defeitos que os testes por camada não capturaram:

1. `row_version` correto no banco era reintroduzido como `payload.rowVersion` na composição canônico → legado → adapter;
2. a reanálise individual da Consulta Assessoria era bloqueada pelo frontend porque o preflight reconstruía o contexto sem `registeredInvoiceId`, embora domínio, serviço, extensão e RPC já operassem individualmente.

Os dois defeitos têm a mesma característica estrutural: a invariante correta existia em parte do sistema, mas outra camada podia reconstruí-la de forma diferente.

## 2. Princípios

A estabilização não será uma reescrita total nem uma sequência de hotfixes oportunistas.

Cada fase deve:

- preservar comportamento já validado;
- reduzir a quantidade de autoridades concorrentes;
- substituir reconstrução manual por APIs canônicas;
- criar regressão executável antes de remover compatibilidade;
- usar PR separado e reversível;
- manter Supabase Production como fonte de verdade para persistência;
- não antecipar o hardening da ADR-051 sem decisão específica.

## 3. Fase A — contexto canônico de Pendências

### Problema

`escola + competência + programa + documento + registeredInvoiceId` era reconstruído manualmente em UI, serviços e integrações.

### Decisão

Criar uma única fábrica:

`RadarPendencias.buildPendencyLookupContext()`

Ela normaliza aliases e preserva opcionalmente:

- `escolaId`;
- `competencia` / `competenciaOrigem`;
- `programaId`;
- `documentoKey`;
- `registeredInvoiceId`;
- `item`;
- `documentoNome`.

### Gate

Nenhum arquivo crítico pode chamar `findActivePendency()` com objeto literal de contexto construído diretamente.

### Estado

Em implementação nesta branch.

## 4. Fase B — API de aplicação por jornada

Criar comandos explícitos de aplicação para as jornadas P0/P1, de forma que a UI não reconstrua regras de negócio.

Alvos iniciais:

- abrir Pendência individual de NF;
- abrir Pendência individual de Assessoria;
- registrar novo envio;
- reanalisar;
- consultar estado/ação disponível da Pendência.

A UI deve enviar intenção + identidade mínima e receber um resultado canônico.

## 5. Fase C — retirar preflights de negócio do app.js

O `app.js` não deve decidir:

- como identificar Pendência ativa;
- qual tentativa é a correta;
- se uma análise agregada ou individual é autoridade;
- como sincronizar resumo técnico;
- como validar histórico da NF.

Essas decisões devem ficar em domínio/serviço.

O frontend pode validar campos de formulário e permissões visuais, mas não repetir invariantes de negócio.

## 6. Fase D — reduzir monkey patches e wrappers

Inventariar handlers substituídos por extensões.

Cadeias atualmente conhecidas incluem:

```text
closeModal
app.js
→ atomic-analysis-pendency
→ service-advisory-pendency

registerAttempt
PendencyService
→ service-advisory-corrective-submission

renderProntuario
app.js
→ unidentified-expense-ux
→ prontuario-operational-ux
→ operational-write-performance
→ prontuario-conditional-reconciler
```

Objetivo:

- manter wrappers apenas para preocupação transversal real;
- mover regra funcional para serviços explícitos;
- reduzir dependência de ordem de carregamento;
- preservar marcadores/guards até a migração completa.

## 7. Fase E — teste de composição por jornada

Para cada jornada crítica:

```text
ação da UI
→ handler efetivo
→ serviço
→ adapter/snapshot
→ RPC
→ banco
→ reload
→ mesma informação renderizada
```

No mínimo:

- NF → Incorreto → Pendência;
- Assessoria → Incorreto → Pendência;
- novo envio;
- reanálise correta;
- reanálise incorreta;
- duas NFs simultâneas;
- `a_identificar` → identificação;
- permanente → bem;
- proteção histórica.

## 8. Fase F — fixture permanente de homologação

Criar um conjunto controlado de dados de teste ou ambiente de homologação que permita executar as jornadas sem improvisar registros a cada PR.

Enquanto Production continuar necessária para confirmar infraestrutura real:

- usar registros previamente classificados;
- marcar claramente homologação;
- preservar histórico;
- evitar DELETE direto;
- registrar checkpoint antes e depois.

## 9. Fase G — gate de fechamento

Um fluxo crítico só pode ser classificado como **consolidado** quando possuir:

1. autoridade de código identificável;
2. nenhuma rota paralela contraditória conhecida;
3. testes unitários do domínio/serviço;
4. teste da composição;
5. RPC/pgTAP quando houver persistência;
6. releitura após persistência;
7. homologação autenticada da jornada afetada.

## 10. Ordem de execução

1. concluir Fase A;
2. selecionar a primeira jornada para Fase B/C: **reanálise de Pendência individual**;
3. migrar novo envio;
4. migrar abertura;
5. consolidar renderização/consulta;
6. reduzir wrappers somente após as APIs de aplicação estarem estáveis;
7. expandir o padrão para `a_identificar`, patrimônio e demais jornadas.

## 11. Não objetivos desta frente inicial

- redesenhar layout;
- alterar regras de PDDE;
- mudar schema do Supabase sem necessidade funcional;
- substituir todo o `app.js` de uma vez;
- implementar ADR-051 antecipadamente;
- adicionar novas funcionalidades antes da estabilização das jornadas já existentes.
