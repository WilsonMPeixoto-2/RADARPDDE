# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 18 de agosto de 2026  
**Classe documental:** Canônico — estado corrente e retomada futura  
**Situação:** ciclo de desenvolvimento e preparação para uso real concluído por enquanto

## 1. Fonte de verdade

Para determinar o estado implementado, usar nesta ordem:

1. código-fonte remoto da `main` ou do SHA explicitamente analisado;
2. schema, migrations, Auth, RLS, RPCs, Edge Functions e dados efetivos do Supabase;
3. deployment efetivamente publicado na Vercel e seu manifesto;
4. decisões de negócio vigentes;
5. testes que representam o contrato atual;
6. documentação canônica;
7. auditorias, planos e handoffs históricos.

Nenhum documento ou teste antigo prevalece sobre código e ambiente atuais.

O snapshot detalhado de encerramento está em [`handoff/2026-08-18-encerramento-operacional.md`](handoff/2026-08-18-encerramento-operacional.md).

## 2. Baseline de encerramento

```text
Baseline funcional homologado: dc77e29d9b364092361623ce185c8d1a55dde983
PR de hardening final: #188
Vercel Production no fechamento funcional: READY
Deployment funcional de referência: dpl_8tBN6PfaVgu3e2qjhsoep42NpVpZ
Alias oficial: radarpdde-fix.vercel.app
Supabase Production: scnryinorqeucbfkioxo
Migrations canônicas no fechamento: 35
Edge Function team-account-management no fechamento: versão 135
```

O SHA acima é o **baseline funcional homologado**, anterior à consolidação documental de encerramento. Commits exclusivamente documentais podem avançar a `main` sem alterar o produto. Em qualquer retomada futura, consultar a `main` e o deployment ao vivo antes de atuar.

## 3. Estado executivo

O RADAR PDDE está **apto para uso real** e sem bloqueador funcional conhecido neste encerramento.

O ciclo terminou com:

- Supabase Production como backend institucional canônico;
- Vercel Production publicada e alinhada ao baseline funcional no momento da homologação;
- autenticação, perfis, escopos e RLS ativos;
- operações críticas protegidas e auditadas;
- dados de teste removidos do estado operacional;
- bundle público de Production sem seed legado de escolas/controladores;
- Production em modo fail-closed;
- fluxos centrais homologados em browser e banco;
- backup/restauração, CodeQL, dependências, Excel e gates operacionais validados.

## 4. Decisões mais importantes para retomada

### Competência global

`RadarCompetenceContext` permanece fonte canônica do mês.

A competência continua visível e persistente entre as superfícies.

### Exceção: Pendências Operacionais

Pendências são passivo transversal e **não são filtradas automaticamente pela competência global**.

A página abre em **Todas as competências**. O filtro local de competência é opcional.

Ativas priorizam as mais antigas; resolvidas/canceladas priorizam os acontecimentos mais recentes.

Documento: [`decisions/ADR-044-pendencias-passivo-transversal.md`](decisions/ADR-044-pendencias-passivo-transversal.md).

### Production fail-closed

Production não pode cair silenciosamente para LocalStorage/seed quando o Supabase falhar ou estiver mal configurado.

Fixtures e persistência local permanecem apenas para desenvolvimento/teste explicitamente configurado.

Documento: [`decisions/ADR-045-production-fail-closed.md`](decisions/ADR-045-production-fail-closed.md).

### Desativação de Controlador

Transferir todas as escolas primeiro. Somente com carteira zerada é permitido desativar. Desativação não redistribui escolas e preserva histórico.

### Avaliação mensal

- competência futura: visível, porém não editável;
- documento correto entregue após prazo consolidado: `Correto (Atrasado)`, não `Correto`;
- bonificação, análise técnica e pendência permanecem dimensões distintas;
- análise/pendência usam operações coerentes e atômicas quando aplicável.

### Despesas

`A identificar` é classificação provisória válida para saída bancária sem documentação suficiente. Não inventar NF, natureza, bem ou Assessoria antes da identificação.

### Nota Fiscal de serviço

A consulta/análise da Assessoria é individual por NF. Resumos mensais são derivados e não substituem a análise de cada nota.

## 5. Baseline de dependências

Consultar sempre `package.json` ao vivo. No snapshot de encerramento:

```text
Node 24.x
Supabase JS 2.112.3
Supabase CLI 2.114.0
Playwright 1.62.1
Axe 4.13.0
ESLint 10.8.0
TypeScript 7.0.2
esbuild 0.28.1
Lighthouse 13.4.1
Ajv 8.20.0
Floating UI 1.8.0
Fuse.js 7.5.0
ExcelJS 4.4.0
Prettier 3.9.6
Knip 6.29.0
```

Atualizações futuras são intencionais e validadas, não atualizações em massa apenas por número de versão.

## 6. Validação de fechamento

O hardening final validou, entre outras camadas:

- Playwright E2E em Desktop Chrome, Android/Chromium e iPhone/WebKit;
- Supabase readiness;
- Auth e RLS;
- 284 testes pgTAP;
- migrations em PostgreSQL limpo;
- backup/restauração descartáveis;
- CodeQL;
- saúde das dependências;
- Excel SME / OOXML;
- gate remoto de perfis e viewports;
- Gestão de Equipe em Production;
- bundles e artefatos gerados.

## 7. Ressalvas não bloqueadoras

### Mobile

A prioridade final de polimento foi notebook 14–15" e monitor 21–24".

Última referência Lighthouse:

```text
Desktop: Performance 79%, Acessibilidade 100%, Boas Práticas 100%, LCP ~3,09 s
Mobile: Performance 59%, Acessibilidade 94%, Boas Práticas 100%, LCP ~15,69 s
Orçamento mobile de LCP: 15 s
```

O limite não foi elevado. Otimização estrutural mobile permanece melhoria futura e não bloqueador atual.

### GitHub main

No encerramento funcional a `main` ainda estava sem branch protection/required status checks. Os gates existem, mas essa política de governança não foi ativada neste ciclo.

Se a proteção for tratada futuramente, confirmar primeiro quais checks permanecem estáveis e então exigir PR + checks pertinentes.

## 8. Gatilhos para nova frente

Não existe fila abstrata de “testes faltantes”. Retomar desenvolvimento quando houver:

1. defeito observado por usuário;
2. nova funcionalidade;
3. mudança de regra de negócio;
4. alteração material de Supabase/Auth/RLS/schema;
5. atualização tecnológica relevante;
6. problema de desempenho com impacto real;
7. auditoria/release expressamente solicitados.

## 9. Ordem de leitura numa retomada

1. `AGENTS.md`;
2. `docs/CURRENT_STAGE.md`;
3. `docs/handoff/2026-08-18-encerramento-operacional.md`;
4. `docs/decisions/ADR-044-pendencias-passivo-transversal.md`;
5. `docs/decisions/ADR-045-production-fail-closed.md`;
6. `docs/reference/TEST_GOVERNANCE.md`;
7. `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`;
8. `docs/PROJECT_CONTEXT.md`;
9. `docs/DECISION_LOG.md`;
10. arquitetura ou runbook específico da tarefa.

## 10. Regra de retomada

Antes de alterar código:

- confirmar SHA atual da `main`;
- confirmar manifesto/deployment de Production;
- conferir Supabase Production e migrations;
- verificar se alguma decisão deste snapshot foi substituída posteriormente;
- trabalhar em branch isolada;
- testar proporcionalmente ao risco;
- não modificar produto apenas para satisfazer teste histórico superado.
