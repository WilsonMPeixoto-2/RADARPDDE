# Plano executado — bootstrap, readiness e pós-login desktop

**Design final:** `docs/superpowers/specs/2026-09-07-desktop-bootstrap-observability-design.md`

## Objetivo

Mapear causalmente o carregamento autenticado e corrigir, sem regressão funcional, os problemas confirmados de prontidão, autoridade de carregamento e espera desnecessária no pós-login desktop.

## Execução concluída na branch

### 1. Observabilidade antes da mudança

Foram criados observer test-side, workflow dedicado e E2E autenticado com Supabase descartável. A coleta separa timing, mapa de carga e coverage e publica somente JSON sanitizado.

A análise confirmou:

- múltiplos instaladores sondando dependências por polling;
- sobreposição de autoridade para `navigation-history.js`;
- Dashboard bloqueado até o bootstrap remoto integral, inclusive `administrativeLogs`;
- ausência de orçamento/medição causal do login até a tela utilizável.

### 2. Coordenador de readiness

Foi criado `RadarApplicationReadiness` para representar capacidades explícitas de autenticação, dados, serviços, runtime de UI, competência e navegação.

O `auth-gate`, a competência global, o histórico de navegação e a ponte operacional passaram a aguardar marcos determinísticos em vez de consultar repetidamente o ambiente por relógio.

### 3. Cadeia de carregamento

A segunda carga de `navigation-history.js` foi retirada do painel do Controlador. A cadeia canônica de navegação permanece no `auth-gate`.

Pendências e extensões que dependem do runtime base passaram a ser iniciadas em ordem determinística pelo carregador correspondente. Os instaladores finais de histórico de NF, observação de escrita e reconciliação de Prontuário também deixaram de criar intervalos de readiness.

### 4. Pós-login e Auditoria

`administrativeLogs` saiu do bootstrap remoto bloqueante. A entidade é hidratada depois, por patch incremental seguro e serializado com a fila de escritas remotas.

A tela Registros Internos ganhou dependência explícita `audit-data`: enquanto a leitura não termina, a tela informa carregamento; em falha, restringe apenas a própria tela e oferece retry.

Nenhuma outra entidade foi convertida em lazy loading. O `DataService` rejeita hidratação tardia de entidades ainda sem semântica incremental comprovada.

### 5. Regressões adicionadas

A suíte passou a exigir, entre outros pontos:

- ausência dos pollings de readiness corrigidos;
- instalação imediata quando dependências já existem;
- reação ao evento `radar:application-services-ready` quando necessário;
- Dashboard liberado antes de `administrativeLogs` em leitura atrasada;
- Auditoria aguardando seus dados em vez de renderizar histórico incompleto;
- hidratação tardia serializada com escritas;
- rejeição de lazy loading inseguro de outras entidades;
- ausência de autoridade duplicada de navegação;
- artefato de observabilidade sem segredos ou identificadores de fixtures.

## Evidência final da branch

No gate autenticado desktop com Supabase real descartável:

- mediana login → Dashboard utilizável: **492,1 ms** em três execuções;
- 23 combinações perfil/superfície visitadas pelo mapa de carga;
- nenhum intervalo de readiness de 10/20/25/50 ms permanece em execução;
- um único intervalo de 30 s permanece observado, compatível com o auto-refresh deliberado da sessão Supabase Auth.

O número de 492,1 ms é diagnóstico controlado local, não medição de usuário em Production.

## Gate de saída

Antes do merge são obrigatórios:

1. validação geral do repositório;
2. E2E completo;
3. perfis/viewports;
4. ciclos e confiabilidade com Supabase real;
5. readiness/Supabase;
6. CodeQL e saúde das dependências;
7. Lighthouse segundo a política vigente;
8. observabilidade autenticada;
9. homologação integral pré-Production;
10. revisão adversarial da composição final.

Após o merge, o SHA servido em Production, erros de runtime e `production_integrity_check()` devem ser revalidados antes de declarar esta frente concluída.

## Fila posterior

Esta frente não altera a classificação das duas correções funcionais seguintes já conhecidas: unificação semântica de Pendências e convergência autoritativa de salvar/excluir Nota Fiscal. Elas são trabalhos separados e não devem ser misturados ao fechamento deste bootstrap.
