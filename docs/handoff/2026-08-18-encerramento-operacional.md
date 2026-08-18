# RADAR PDDE 2026 — Snapshot canônico de encerramento

**Data do snapshot:** 18 de agosto de 2026  
**Classe documental:** Canônico — handoff e retomada futura  
**Situação:** ciclo de desenvolvimento e preparação para uso real encerrado por enquanto

> Este documento existe para responder, numa retomada futura, às perguntas: “qual era o estado bom?”, “quais regras de negócio estavam valendo?”, “quais versões estavam homologadas?” e “o que ainda era melhoria, mas não bloqueador?”.

## 1. Fonte de verdade e precedência

A ordem obrigatória para verificar o estado do RADAR é:

1. código-fonte remoto da `main` ou do SHA explicitamente analisado;
2. Supabase efetivo: schema, migrations, Auth, RLS, RPCs, Edge Functions e dados reais;
3. deployment efetivamente publicado na Vercel e seu manifesto;
4. decisões de negócio vigentes;
5. testes que representam o contrato atual;
6. documentação canônica;
7. auditorias, handoffs e relatórios históricos.

Este snapshot é uma âncora de 18/08/2026. Valores mutáveis devem ser novamente consultados no remoto quando o projeto for retomado.

## 2. Baseline técnico de encerramento

```text
Repositório: WilsonMPeixoto-2/RADARPDDE
Branch canônica: main
SHA de encerramento funcional: dc77e29d9b364092361623ce185c8d1a55dde983
PR de hardening final: #188
Vercel Production: READY
Deployment de referência: dpl_8tBN6PfaVgu3e2qjhsoep42NpVpZ
Alias oficial: https://radarpdde-fix.vercel.app
Supabase Production: scnryinorqeucbfkioxo
Migrations canônicas no fechamento: 35
Edge Function team-account-management: versão 135
Supabase JS da Edge Function: 2.112.3
```

O deployment de referência aponta para o mesmo commit de fechamento funcional e opera em `production` + `supabase-production`.

## 3. Situação executiva

O RADAR PDDE está **apto para uso real** e sem bloqueador funcional conhecido no encerramento deste ciclo.

O sistema foi deixado com:

- Production conectada ao Supabase institucional;
- autenticação, perfis e RLS ativos;
- base operacional preparada para receber lançamentos reais;
- dados de teste usados durante o desenvolvimento removidos do estado operacional;
- frontend de Production sem carregar o seed legado de escolas/controladores;
- operações críticas protegidas por serviços, RPCs/Edge Functions, autorização e auditoria;
- fluxos principais homologados;
- monitoramento, backup/restauração, CodeQL e gates automatizados ativos.

Nenhum reset, migration remota adicional ou alteração de dados reais foi executado durante o hardening final do PR #188.

## 4. Regras de negócio vigentes

### 4.1 Competência mensal

`RadarCompetenceContext` continua sendo a fonte canônica da competência global.

A competência selecionada:

- permanece visível;
- persiste na navegação;
- acompanha Dashboard, Carteira, Competências, Prontuário, alertas, timeline e exportações conforme o contrato de cada superfície.

**Exceção deliberada: Pendências Operacionais.**

Na página de Pendências a competência global permanece visível como contexto, mas **não filtra automaticamente a fila**. A página abre em **Todas as competências** para impedir que pendências antigas desapareçam da visão operacional.

O filtro local de competência continua disponível e é opcional.

### 4.2 Pendências Operacionais

Estados canônicos:

- Aberta;
- Aguardando reanálise;
- Resolvida;
- Cancelada.

Regras de apresentação e prioridade:

- Abertas: mais antigas primeiro;
- Aguardando reanálise: quem espera há mais tempo primeiro;
- Resolvidas e Canceladas: acontecimentos mais recentes primeiro;
- toda a linha/cartão é navegável para abrir detalhes e histórico;
- ao entrar apenas no detalhe da Pendência, a competência global não é alterada;
- ao seguir da Pendência para o Prontuário, o sistema assume a competência de origem da pendência, porque naquele contexto o recorte mensal volta a ser necessário.

Novo envio não resolve automaticamente. Reanálise positiva resolve; negativa reabre; cancelamento preserva motivo e autoria.

### 4.3 Avaliação mensal e prazos

Identidade da avaliação:

```text
escola + competência + programa
```

Regras vigentes:

- competências futuras permanecem visíveis, porém não editáveis;
- após consolidação do prazo/bonificação, um documento entregue fora do período não pode receber `Correto` como se tivesse sido regular no prazo;
- nesses casos, quando tecnicamente correto, usa-se `Correto (Atrasado)`;
- análise e eventual abertura de pendência devem permanecer coerentes e atomicamente relacionadas quando a regra exigir pendência;
- bonificação, análise técnica e pendência são dimensões distintas e não devem ser condensadas em um único status artificial.

### 4.4 Despesas e “A identificar”

Uma saída observada em extrato pode ser registrada provisoriamente como `A identificar` quando a escola ainda não entregou documentação suficiente para classificar a natureza da despesa.

Enquanto estiver `A identificar`:

- não se força NF inexistente;
- não se inventa natureza de consumo, permanente ou serviço;
- não se força bem patrimonial nem consulta à Assessoria;
- a classificação pode ser corrigida depois, com documentação adequada.

### 4.5 Notas Fiscais de serviço e Assessoria

Cada NF de serviço mantém análise individual.

O marcador de envio/consulta à Assessoria Contábil pertence à respectiva NF. O resumo mensal é derivado das NFs e não substitui a avaliação individual.

### 4.6 Gestão de Equipe

Perfis funcionais visíveis:

- Controlador;
- Assistente de Verbas Federais;
- Gestão SME;
- Equipe de Inventário.

`technical_admin` permanece papel autenticado técnico, não um quinto perfil funcional cotidiano.

A Assistente administra Controladores e integrantes do Inventário dentro do escopo autorizado.

**Desativação de Controlador:**

1. transferir previamente todas as escolas por alocação individual ou em lote;
2. confirmar carteira igual a zero;
3. somente então desativar o Controlador.

A desativação não redistribui escolas e não exige “nova responsável” quando a carteira já está zerada. O histórico permanece preservado.

### 4.7 Carteira de escolas

A carteira define responsabilidade principal e prioridade, não uma fronteira rígida de colaboração entre Controladores da mesma CRE.

A redistribuição de `schools.controller_id` é operação administrativa autorizada e auditada.

### 4.8 Gestão SME

A Gestão SME é predominantemente gerencial:

- consulta identificação e bonificação;
- não recebe análise técnica editável nas superfícies restritas;
- consulta Pendências sem executar mutações operacionais proibidas;
- preserva os recortes de autorização definidos por serviço e RLS.

Capacidades administrativas de programas que estejam implementadas devem ser verificadas no código antes de qualquer alteração futura; não inferir novas permissões a partir de memória de chat.

### 4.9 Excel SME

Contrato de fechamento:

- uma competência por arquivo;
- uma aba;
- 27 colunas A:AA;
- template-fonte de 30 colunas usado como base visual;
- remoção de K, R e Y na projeção pública;
- designação como texto;
- filtros, impressão, bordas, alinhamento e congelamento preservados;
- certificação OOXML e abertura no Excel desktop fazem parte da homologação.

## 5. Arquitetura e persistência

Fluxo geral:

```text
Frontend
→ serviços de aplicação / UnitOfWork
→ RepositoryContract
→ SupabaseRepository em Production
→ PostgREST / RPC / Edge Function
→ Auth / RLS / PostgreSQL
```

`LocalStorageRepository` permanece para desenvolvimento/testes controlados, mas **Production é fail-closed**.

Se a configuração real de Supabase estiver ausente, inválida ou não autorizada em Production, a aplicação deve falhar de forma segura/indisponível. Não pode cair silenciosamente para dados locais nem para seed institucional.

O artefato público de Production é sanitizado para não publicar os dados legados de escolas e controladores usados durante o desenvolvimento.

## 6. Segurança vigente

O fechamento consolidou:

- Supabase Auth com sessão real;
- autorização por perfil/escopo;
- RLS no banco;
- Edge Function `team-account-management` com JWT obrigatório;
- credenciais administrativas exclusivamente server-side;
- CORS restritivo;
- operações compostas com RPC/transação ou compensação;
- concorrência otimista por `row_version` onde aplicável;
- headers HTTP de segurança no deployment;
- CodeQL para JavaScript/TypeScript e GitHub Actions;
- ESLint de segurança com backlog controlado de sinks HTML;
- `allowScripts` do npm restrito ao esbuild homologado.

Não introduzir `service_role`, segredo administrativo ou credencial privilegiada no frontend.

## 7. Dependências homologadas no encerramento

Versões diretas registradas em `package.json` no SHA de fechamento:

| Recurso | Versão |
|---|---:|
| Node.js | `24.x` |
| `@supabase/supabase-js` | `2.112.3` |
| Supabase CLI | `2.114.0` |
| `@playwright/test` | `1.62.1` |
| `@axe-core/playwright` | `4.13.0` |
| ESLint | `10.8.0` |
| `@eslint/js` | `10.0.1` |
| `eslint-plugin-no-unsanitized` | `4.1.5` |
| `eslint-plugin-playwright` | `2.10.5` |
| TypeScript | `7.0.2` |
| esbuild | `0.28.1` |
| Lighthouse | `13.4.1` |
| Ajv | `8.20.0` |
| Floating UI DOM | `1.8.0` |
| Fuse.js | `7.5.0` |
| ExcelJS | `4.4.0` |
| Prettier | `3.9.6` |
| Knip | `6.29.0` |
| http-server | `14.1.1` |
| Acorn | `8.18.0` |
| acorn-walk | `8.3.5` |

Overrides de segurança/manutenção no fechamento:

```json
{
  "brace-expansion@5.0.8": "5.0.9",
  "fast-uri": ">=3.1.5"
}
```

Scripts de instalação permitidos explicitamente:

```json
{
  "esbuild@0.28.1": true
}
```

**Regra para atualização futura:** não atualizar versões em lote por estética. Ler changelog/advisories, atualizar em branch isolada, regenerar lockfile/bundles quando necessário e executar os gates proporcionais ao risco.

## 8. Gates e evidências de encerramento

No PR #188 foram validados, entre outros:

- Playwright E2E completo em Desktop Chrome, Android/Chromium e iPhone/WebKit;
- validação geral do RADAR;
- Supabase readiness;
- Supabase local, Auth, RLS e pgTAP;
- migrations em PostgreSQL limpo;
- backup/restauração descartáveis com equivalência;
- CodeQL;
- saúde das dependências;
- Excel SME / OOXML;
- snapshot canônico;
- gate remoto de perfis e viewports;
- preflight da Gestão de Equipe em Production;
- reprodutibilidade de bundles verificáveis.

A bateria do banco chegou a **284 testes pgTAP aprovados** no hardening final.

## 9. Layout e experiência do usuário

Prioridade operacional deliberada para a fase encerrada:

1. notebooks de 14–15 polegadas, especialmente 1366×768;
2. monitores básicos de 21–24 polegadas, normalmente Full HD;
3. mobile preserva capacidade, mas não foi o foco de polimento desta última rodada.

Ajustes de encerramento incluíram densidade de tabelas, Prontuário mais útil em 1366 px, manutenção da composição ampla em 1920×1080, contraste de estados e correções de mensagens contraditórias.

## 10. Ressalvas não bloqueadoras

### Performance mobile

Última referência do hardening:

```text
Desktop: Performance 79%, Acessibilidade 100%, Boas Práticas 100%
LCP desktop: ~3,09 s
CLS desktop: ~0,030

Mobile: Performance 59%, Acessibilidade 94%, Boas Práticas 100%
LCP mobile: ~15,69 s para orçamento de 15 s
```

O orçamento não foi elevado para mascarar a falha. A otimização estrutural mobile permanece melhoria futura, não bloqueador do uso operacional atual.

### Proteção da `main`

Em 18/08/2026 a API do GitHub ainda reportava a branch `main` como **não protegida** e sem required status checks. A esteira possui gates robustos, mas a proteção de branch não foi ativada neste ciclo.

Se isso for tratado futuramente, primeiro confirmar quais checks permanecem estáveis e então exigir PR + checks pertinentes, evitando bloquear o repositório com gates históricos ou flakey.

## 11. O que não fazer numa retomada futura

Não:

- restaurar seed antigo de escolas/controladores em Production;
- reintroduzir fallback silencioso local em Production;
- voltar a filtrar Pendências Operacionais automaticamente pela competência global;
- confundir `Correto` com `Correto (Atrasado)` após prazo consolidado;
- permitir edição de competência futura;
- desativar Controlador com escolas ainda vinculadas;
- tratar carteira como fronteira de segurança entre Controladores da mesma CRE;
- reintroduzir segredo no frontend;
- aplicar migration sem histórico, testes e rollback;
- alterar produto apenas para satisfazer teste antigo sem primeiro classificar a falha;
- declarar Preview como Production;
- presumir que este SHA ainda seja o HEAD numa retomada futura.

## 12. Checklist para retomar o projeto

Antes de qualquer nova implementação:

1. consultar `main` ao vivo e registrar o SHA;
2. abrir o manifesto de Production e confirmar alinhamento com a `main`;
3. conferir Supabase Production e histórico de migrations;
4. verificar versão/status da Edge Function de Gestão de Equipe;
5. ler este snapshot, `CURRENT_STAGE.md` e os ADRs vigentes;
6. classificar a nova demanda como correção, mudança de regra, melhoria ou nova capacidade;
7. verificar se a demanda altera alguma decisão registrada aqui;
8. trabalhar em branch isolada;
9. executar validação proporcional ao risco;
10. atualizar documentação somente nos contratos realmente afetados.

## 13. Referências principais

- [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md)
- [`../PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md)
- [`../DECISION_LOG.md`](../DECISION_LOG.md)
- [`../reference/TEST_GOVERNANCE.md`](../reference/TEST_GOVERNANCE.md)
- [`../reference/FUNCTIONAL_CONTRACT_MATRIX.md`](../reference/FUNCTIONAL_CONTRACT_MATRIX.md)
- [`../decisions/ADR-044-pendencias-transversais.md`](../decisions/ADR-044-pendencias-transversais.md)
- [`../decisions/ADR-045-production-fail-closed.md`](../decisions/ADR-045-production-fail-closed.md)
- PR #188 — endurecimento final, saneamento de Production e dependências

---

**Conclusão do ciclo:** no snapshot de 18/08/2026, o RADAR PDDE está operacionalmente pronto e publicado para uso real. Novas frentes devem nascer de necessidade concreta, defeito observado, alteração de regra, risco novo ou evolução deliberada — não de uma fila abstrata de “coisas para mexer”.
