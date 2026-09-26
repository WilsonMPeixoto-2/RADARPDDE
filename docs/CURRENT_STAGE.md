# RADAR PDDE — estado atual e retomada

**Classe documental:** Canônico — estado mutável  
**Atualizado em:** 26 de setembro de 2026

## 1. Baseline confirmada

- `main`: `bb7246438b8c6b72ef068b21bb40d492a7049af2` — merge do PR #374.
- Production: mesmo SHA `bb7246438b8c6b72ef068b21bb40d492a7049af2`.
- Deployment Production: `dpl_BztNyEgnHjFxAKJvkPcQGeV6GGWm`, `READY`.
- PRs #375/#376 continuam fora de `main` e Production.
- Nenhuma mudança desta frente altera schema, migrations, RPCs, RLS, serviços de domínio ou persistência canônica.

## 2. Frente ativa

### PR #375 — filtro escolar + drawer mobile

- URL: https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/375
- branch: `fix/pendency-context-mobile-preview-2026-09-25`
- head: `3b369122acca81b1d07668e8c88fc64c55b06121`
- base: `main`
- estado: aberto, draft, mergeable
- NAV-01 e UX-04 implementados.
- E2E do head: **181 passed, 54 skipped, 0 failed**.

### PR #376 — jornada desktop de Despesa a identificar

- URL: https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/376
- branch: `fix/desktop-expense-journey-2026-09-25`
- base: branch do #375
- head funcional atual: `f5e35f8f4a7519cefcd883bb6b8999542ba77a48`
- estado: aberto, draft, mergeable
- escopo original UX-01/02/03/05/06 e D-01 permanece.
- validação visual de 26/09 encontrou três defeitos reais e localizados, já corrigidos no mesmo PR:
  1. confirmação de criação ficava atrás do drawer;
  2. identificação abria rolada e escondia o contexto inicial;
  3. reanálise misturava documento, tentativa, contexto e decisão na mesma hierarquia.
- a varredura final de acessibilidade encontrou contraste insuficiente em **Editar análise**; correção localizada aplicada no head atual.

## 3. Estado das correções visuais de 26/09

### Feedback + drawer

- o body recebe marcador apenas enquanto o drawer está aberto;
- em desktop, o aviso de sucesso fica acima da camada do drawer e deslocado para a área útil à esquerda;
- o movimento horizontal foi removido da transição para o aviso já nascer na posição final;
- E2E mede z-index e ausência de sobreposição geométrica.

### Identificação da despesa

- o primeiro documento de `a_identificar` abre o modal pelo topo;
- o foco inicial vai para **Contexto da pendência**, elemento estático com `tabindex="-1"`;
- o `scrollTop` do corpo do modal permanece no início;
- novo envio comum preserva o foco anterior no campo de data.

### Reanálise

A leitura agora é separada em quatro blocos:

1. **Documento em reanálise**
2. **Tentativa recebida**
3. **Contexto da Pendência**
4. **Decisão técnica**

Não houve alteração dos dados, estados ou serviços usados pela reanálise.

### Contraste

- a ação **Editar análise** falhava no axe com razão 4,13:1;
- o texto foi escurecido de forma localizada;
- o novo head passou a suíte desktop completa, incluindo a auditoria axe;
- WCAG AA para texto normal exige pelo menos 4,5:1.

## 4. Verificação final do head #376

Head validado: `f5e35f8f4a7519cefcd883bb6b8999542ba77a48`.

- E2E Playwright: run `36228321339` — **success**
- resultado: **181 passed, 54 skipped, 0 failed**
- artifact: `10901976187` — `playwright-report-desktop`
- `Validar RADAR PDDE`: `36228321338` — success
- snapshot canônico: `36228321326` — success
- retificação auditável: `36228321321` — success
- Lighthouse: `36228321380` — success
- Supabase readiness: `36228321316` — success
- contratos-fonte Excel SME: `36228321323` — success

O commit RED `a7d044c94ad245ed5bd190944eea7c079c6e1afc` falhou no E2E especificamente porque o feedback tinha z-index 980 contra drawer 1500. Isso registra o ciclo de regressão antes/depois.

## 5. Preview final pós-correções

Branch descartável:
`preview/final-visual-fixes-2026-09-26`

- base de produto: `f5e35f8f4a7519cefcd883bb6b8999542ba77a48`
- commit da branch Preview: `23ccba404aed028f2847ebbff55362c9beb0f99c`
- deployment: `dpl_37XBGX5i9LfcVqdZEpu9yQwY6x94`
- estado: `READY`
- URL: `https://radarpdde-4yobdz9ea-wilson-m-peixotos-projects.vercel.app`
- share temporário gerado em 26/09: `?_vercel_share=4j6ov8kocHUTEFJUYTBVJG3GbDGmuxw2`

A branch Preview difere do produto apenas em `vercel.json` para permitir o deploy e omitir o teste unitário que rejeita, por contrato, branches habilitadas na Vercel. Essa exceção é **somente do Preview** e nunca deve ser integrada ao PR #376.

A captura live do Preview em 1440×900 retornou o RADAR completo. A automação interativa Firecrawl não concluiu dentro do timeout; não tratá-la como evidência de aprovação. A evidência confiável pós-correção é o E2E final + screenshots do artifact `10901976187`.

## 6. Evidência visual inspecionada

No artifact final do Playwright foram conferidas capturas 1440×900 que mostram:

- confirmação verde totalmente visível à esquerda do drawer aberto;
- modal **Registrar envio e identificar despesa** começando no topo, com Escola, Competência, Programa e Documento visíveis;
- modal **Reanalisar pendência documental** com os quatro níveis de informação claramente separados.

As capturas do checkpoint anterior em `docs/evidence/2026-09-26-final-preview/` representam o candidato anterior e não devem ser reutilizadas como prova das correções posteriores.

## 7. O que NÃO está pendente

Não reimplementar nem reaudiar do zero:

- NAV-01;
- UX-01/02/03/04/05/06;
- feedback vs drawer;
- foco/scroll do primeiro documento;
- hierarquia da reanálise;
- contraste de `Editar análise`.

Não alterar nesta frente:

- Supabase/RLS/RPC/migrations;
- `InvoiceService`, `PendencyService`, `DataService`;
- identidade da despesa/Pendência e histórico;
- Boleto de Internet, Assessoria ou patrimônio;
- mobile geral;
- Production.

## 8. Próxima ação

A próxima sessão deve usar o Preview pós-correções para a **validação humana final**, sem reconstruir a investigação.

Se o responsável aprovar visualmente:

1. integrar #375 primeiro;
2. retarget/rebase #376 para `main`;
3. conferir o diff residual;
4. rerodar gates porque o SHA mudará;
5. gerar Preview final do novo SHA se necessário;
6. integrar #376 somente após nova confirmação;
7. Production apenas mediante autorização explícita separada.

## 9. Rota de retomada

1. `AGENTS.md`
2. `docs/reference/SYSTEM_CANONICAL_MODEL.md`
3. `docs/reference/PRODUCT_SURFACE_CATALOG.md`
4. este arquivo
5. `docs/handoff/2026-09-25-desktop-expense-journey.md`
6. `docs/reference/FRONTEND_USER_VALIDATION_GATE.md`
7. `docs/reference/STATUS_DOCUMENTOS.md`
