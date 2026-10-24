# F06 — Nota Fiscal: foco e rodapé do modal com zoom/reflow

**Objeto:** jornada do Controlador para cadastrar Nota Fiscal / Despesa; validação obrigatória, Tab, foco, rolagem e fechamento em zoom elevado. **Escopo:** correção CSS do modal existente e teste E2E; sem mudança em regras financeiras, estado, SQL, Auth, RLS, dados ou Vercel.

## Evidência original da falha (RED)

A sessão Work de 23/10/2026 abriu o modal de NF com **zoom nativo do Chrome em 200%**, verificado por ferramenta do navegador. A viewport física de `1440 × 812` pixels correspondeu a uma área útil de aproximadamente `720 × 406` pixels CSS. A navegação com **Tab** transferiu corretamente o foco aos controles `#nota-tipo` e `#nota-valor`, mas os campos ficaram parcial ou totalmente cobertos pelo rodapé de ações. As imagens originais foram fornecidas na conversa de retomada.

O Axe não apontou violação nesse recorte. Isso **não** invalida o problema: o foco sem campo integralmente visível é uma falha de navegação que exige inspeção visual/geométrica. Uma primeira asserção de fechamento de modal por `Playwright.toBeHidden()` também era inadequada, porque o modal fechado mantém dimensões, porém tem opacidade zero, `pointer-events: none` e `inert`. Essa falsa falha de teste foi descartada; não é um defeito a corrigir.

## Causa técnica localizada

- `index.html`: a classe `.modal-footer` fica **dentro** de `#form-dados-nota`, que está dentro da `.modal-body` rolável.
- `src/styles/global-visual-polish.css`: regras globais dão ao rodapé `position: sticky; bottom: -24px; z-index: 5;` e margens negativas. A prioridade de pintura mantém as ações visíveis, mas o navegador pode rolar um controle focado para a região **atrás** desse rodapé.
- `styles.css` e regras globais já garantem `overflow-y: auto` e `min-height: 0` na área de formulário. A solução não precisa reestruturar o modal nem remover a ação de salvar.

## Patch de escopo limitado

- `#modal-dados-nota .modal-body { scroll-padding-block-end: 112px; }`: informa à rolagem automática a zona inferior reservada para as ações sticky.
- `#modal-dados-nota #form-dados-nota .form-control` usa `scroll-margin-block-start: 36px;` para deixar rótulo visível e `scroll-margin-block-end: 112px;` para não estacionar o campo atrás do rodapé.
- Os seletores são específicos da NF; o rodapé continua sticky. A viewport desktop a 100% deve permanecer sem regressões.

## Contraprova geométrica local de implementação (controle reduzido)

Antes de abrir o PR, foi executado **um HTML estático mínimo** com a estrutura e regras relevantes no Chromium headless local, viewport `720 × 406`. Ele **não** substitui o sistema real nem o teste com Supabase:

| Foco via Tab | Campo: posição inferior antes | Rodapé: início | Campo: posição inferior com patch |
| --- | ---: | ---: | ---: |
| Tipo de Gasto | 392 px | 340 px | 205 px |
| Valor do Gasto | 370 px | 340 px | 318 px |

A sobreposição por pintura reproduziu-se antes, e ambas as posições ficaram acima do rodapé no mock após as regras novas. A verificação do RADAR **de verdade**, com campos, validação e fluxo do Controlador, cabe ao teste de integração abaixo.

## Regressão E2E proposta

`tests/e2e/invoice-focus-clearance.spec.js` utiliza a navegação do produto (`switchView('prontuario', school)` e clique real em **Adicionar Nota**), não um modal montado manualmente, com dados de teste do modo local, sem salvar NF:

1. `720 × 406` CSS: mesma área de reflow encontrada no Chrome a 200% (equivalência geométrica; **não declarar que o CI aplicou zoom nativo de 200%**). Submete sem preencher os campos obrigatórios, confirma validação nativa e modal aberto.
2. Percorre `#nota-tipo`, `#nota-numero` e `#nota-valor` por **Tab** e exige foco real, rótulo visível, campo integralmente acima do topo do rodapé e sem intersecção de retângulos.
3. Captura JSON de geometria e PNG; depois fecha por Escape, conferindo `inert`, opacidade zero, bloqueio de pointer events e retorno do foco ao acionador original (sem usar `toBeHidden` para modal invisível de dimensões conservadas).
4. `1440 × 900` CSS: preservação da geometria, campos, botões e percurso por teclado na largura desktop normal.

**Gates:** executar lint de E2E, Playwright Chromium desktop, homologação, regressões de produto e inspeção dos PNG/JSON do **HEAD aprovado**. Se aparecer defeito inesperado, diagnosticar a geometria antes de aumentar tolerâncias ou repetir testes. O usuário já possui captura de zoom nativo do Chrome no RED; a homologação CI em viewport equivalente não é prova autônoma de zoom nativo após o patch.

## Estado

Correção e prova propostas na branch `fix/f06-nf-modal-keyboard-clearance-20261023`. **O merge e o status de CI/Production não são presumidos.** A etapa só pode ser declarada corrigida em código versionado após inspecionar o workflow e, idealmente, os artefatos geométricos. Não alargar F06 para mobile ou a auditoria horizontal das 26 dependências.
