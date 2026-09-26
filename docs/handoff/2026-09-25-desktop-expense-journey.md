# Handoff corrente — jornada desktop de Despesa a identificar

**Atualizado:** 26/09/2026  
**Estado:** correções visuais pós-auditoria implementadas; CI final verde; Preview pós-correções READY; falta somente validação humana final e integração ordenada.  
**Baseline:** main/Production `bb7246438b8c6b72ef068b21bb40d492a7049af2` → #375 `3b369122acca81b1d07668e8c88fc64c55b06121` → #376 runtime `f5e35f8f4a7519cefcd883bb6b8999542ba77a48`.

## 0. Retomada em 30 segundos

Não reinicie a auditoria.

O produto candidato já contém:

- NAV-01 e UX-04 no #375;
- UX-01/02/03/05/06 no #376;
- separação entre **Aguardando reanálise** e **Visualizar pendência**;
- confirmação fora do drawer;
- identificação abrindo pelo contexto inicial;
- reanálise com hierarquia documento → tentativa → contexto → decisão;
- correção WCAG do contraste de **Editar análise**.

O E2E final do runtime atual passou com **181 passed, 54 skipped, 0 failed**.

O próximo trabalho é **inspeção humana do Preview pós-correções**, não nova implementação.

## 1. Estado remoto

### main / Production

- SHA: `bb7246438b8c6b72ef068b21bb40d492a7049af2`
- deployment Production: `dpl_BztNyEgnHjFxAKJvkPcQGeV6GGWm`
- nenhum commit de #375/#376 publicado.

### PR #375

- branch: `fix/pendency-context-mobile-preview-2026-09-25`
- head: `3b369122acca81b1d07668e8c88fc64c55b06121`
- base: `main`
- draft / mergeable
- escopo: NAV-01 + UX-04
- E2E: **181 passed, 54 skipped**

### PR #376

- branch: `fix/desktop-expense-journey-2026-09-25`
- base: branch do #375
- runtime/UI validado: `f5e35f8f4a7519cefcd883bb6b8999542ba77a48`
- commits posteriores podem ser apenas documentação de checkpoint
- draft / mergeable
- sem mudança de domínio, persistência, banco ou contratos canônicos.

## 2. Checkpoint visual anterior do Codex

Checkpoint original:
`docs/evidence/2026-09-26-final-preview/`

Naquele Preview foram executados pela UI:

- duas despesas provisórias distintas;
- edição preservando identidade;
- identificação do primeiro documento;
- estado **Aguardando reanálise**;
- primeira reanálise devolvendo documento à escola;
- Pendências Ativas da unidade.

O Codex reproduziu três problemas:

1. **P2:** confirmação ficava atrás do drawer.
2. **P2:** identificação abria rolada, ocultando contexto.
3. **UX-06:** reanálise ainda misturava tentativa/contexto visualmente.

Essas capturas são **antes das correções**.

## 3. Ciclo de correção

### RED

Commit:
`a7d044c94ad245ed5bd190944eea7c079c6e1afc`

E2E run:
`36219671877`

Resultado:
- 179 passed
- 54 skipped
- 1 failed
- falha-alvo: feedback tinha z-index **980** e drawer **1500**.

Os novos testes também codificaram:

- `scrollTop <= 2` no modal de identificação;
- contexto inicial dentro da viewport;
- presença das zonas de tentativa, contexto e decisão na reanálise.

### GREEN final

Runtime:
`f5e35f8f4a7519cefcd883bb6b8999542ba77a48`

E2E:
- run `36228321339`
- **181 passed, 54 skipped, 0 failed**
- artifact `10901976187` — `playwright-report-desktop`

Demais gates verdes:
- Validar RADAR PDDE `36228321338`
- snapshot canônico `36228321326`
- retificação auditável `36228321321`
- Lighthouse `36228321380`
- Supabase readiness `36228321316`
- contratos-fonte Excel SME `36228321323`

## 4. Correção 1 — confirmação fora do drawer

Causa-raiz:

- drawer: z-index 1500;
- polimento global rebaixava `.pendency-notice` para 980.

Solução final:

- body recebe `pendency-drawer-open` apenas enquanto drawer estiver aberto;
- toast sobe para z-index 1700 nesse estado;
- em desktop fica deslocado para a esquerda do drawer;
- breakpoints evitam cálculo CSS inválido;
- transição não anima `right`, então o feedback nasce na posição correta;
- E2E mede camada e separação geométrica.

Screenshot final no artifact mostra a confirmação verde totalmente legível à esquerda do drawer, sem cobertura.

## 5. Correção 2 — identificação abre pelo contexto

Causa-raiz:

`openRegistrarNovoEnvioModal()` colocava foco diretamente na data de disponibilização. Como o campo fica abaixo do contexto e do bloco de identificação, o navegador rolava o modal.

Solução:

- `Contexto da pendência` recebeu `tabindex="-1"`;
- quando o envio também identifica `a_identificar`, esse título estático vira foco inicial;
- modal body é posicionado no topo antes/depois da abertura;
- novo envio comum continua focando a data.

A solução segue o padrão de acessibilidade para diálogos longos: quando focar o primeiro controle tira o começo do conteúdo da viewport, focar um elemento estático inicial.

Screenshot final do artifact mostra, já na abertura:
- Escola
- Competência
- Programa
- Documento
- início do formulário de identificação.

## 6. Correção 3 — hierarquia da reanálise

O modal agora separa:

### Documento em reanálise
Descrição + tipo + valor.

### Tentativa recebida
- disponibilização no Drive;
- observação do envio;
- link do arquivo quando existir.

### Contexto da Pendência
- estado;
- próximo ator;
- erros atuais;
- escola;
- competência;
- programa/documento.

### Decisão técnica
- resultado;
- observação;
- erros documentais quando aplicável.

Implementação é apenas apresentação/estrutura de DOM. Dados e regras não mudaram.

Screenshot final no artifact mostra as quatro zonas claramente distinguíveis em 1440×900.

## 7. Achado adicional da suíte final — contraste

O primeiro E2E completo pós-correções encontrou uma falha axe fora dos três achados originais:

- controle: **Editar análise**
- contraste observado: **4,13:1**
- mínimo AA para texto normal: **4,5:1**.

Foi feita uma correção CSS de uma linha em:
`src/styles/evaluation-retification-ui.css`

Commit runtime final:
`f5e35f8f4a7519cefcd883bb6b8999542ba77a48`

A suíte completa depois passou sem violações bloqueantes.

## 8. Preview pós-correções

Branch descartável:
`preview/final-visual-fixes-2026-09-26`

Base:
`f5e35f8f4a7519cefcd883bb6b8999542ba77a48`

Commit temporário:
`23ccba404aed028f2847ebbff55362c9beb0f99c`

Deployment:
`dpl_37XBGX5i9LfcVqdZEpu9yQwY6x94`

URL:
`https://radarpdde-4yobdz9ea-wilson-m-peixotos-projects.vercel.app`

Share gerado:
`https://radarpdde-4yobdz9ea-wilson-m-peixotos-projects.vercel.app/?_vercel_share=4j6ov8kocHUTEFJUYTBVJG3GbDGmuxw2`

Estado Vercel:
`READY`

A branch temporária só altera `vercel.json` para:
- permitir deploy da branch Preview;
- retirar do build o teste unitário que rejeita por contrato qualquer branch Vercel além de main.

**Nunca mergear esse vercel.json.**

O primeiro build temporário `dpl_4SojXYZN6X7pRJ2M8JMgDmBVPJMt` falhou justamente porque ainda rodava esse teste autorreferente. O segundo deployment acima é o Preview válido.

## 9. Validação renderizada disponível

- Firecrawl abriu o Preview final em **1440×900** e confirmou renderização completa do RADAR.
- A tentativa de automação interativa Firecrawl excedeu o timeout e não é evidência de aprovação.
- TinyFish não iniciou porque a carteira do conector está sem saldo; também não é evidência.
- A evidência forte pós-correção é:
  - E2E final verde;
  - artifact Playwright `10901976187`;
  - screenshots finais inspecionadas manualmente.

## 10. Escopo do diff desde o checkpoint visual

De `a5e312f5` até o runtime `f5e35f8`, somente:

- `app.js`
- `index.html`
- `styles.css`
- `src/styles/global-visual-polish.css`
- `src/styles/evaluation-retification-ui.css`
- `tests/e2e/unidentified-expense-user-journey.spec.js`

Nenhum arquivo de banco, Supabase, domínio, service ou migration foi alterado.

## 11. Próxima ação exata

1. abrir o Preview pós-correções;
2. conferir visualmente, sem nova auditoria geral:
   - feedback ao lado do drawer;
   - identificação abrindo pelo topo;
   - reanálise com quatro zonas;
   - Aguardando reanálise + Visualizar pendência continuando separados;
   - NAV-01 básico se desejar reconfirmar o percurso;
3. se aprovado pelo responsável, integrar #375 primeiro;
4. retarget/rebase #376 para main;
5. rerodar gates do novo SHA e conferir diff residual;
6. integrar #376;
7. Production somente mediante autorização explícita posterior.

## 12. O que não fazer

- não reabrir arquitetura;
- não tocar em Supabase/RPC/RLS/migrations;
- não modificar regras de negócio;
- não revisar mobile em massa;
- não reimplementar os três defeitos já corrigidos;
- não usar o Preview antigo como candidato;
- não mergear a branch `preview/final-visual-fixes-2026-09-26`;
- não publicar em Production sem autorização.
