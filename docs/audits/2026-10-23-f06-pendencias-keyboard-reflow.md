# F06 — Pendências: teclado, reflow e WCAG 2.2 na jornada de filtros

**Programa:** issue #481, Trilha B F06 do `docs/TECHNOLOGY_CAPABILITIES_TRACKER.md`.  
**Baseline:** `main@e913df2a4b114810f1fda0dfd67fd9d7f75a6a3d` (merge #488) em 23/10/2026.  
**Natureza:** contraprova de experiência **por navegador real**, sem correção funcional presumida. Desktop prioritário; não reaproveitar esta medição para declarar homologação mobile.

## Pergunta operacional

Um controlador consegue abrir **Pendências → Mais filtros**, encontrar e usar o filtro de Programa só por teclado e entender os controles sem exigir rolagem horizontal quando a área de conteúdo é reduzida a 683 CSS px (largura disponível em desktop de 1366 px a zoom aproximado de 200%)?

O [PR #474](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/474) já resolveu a divergência comprovada entre o nome acessível e o texto **Mais filtros**. Repetir essa correção não oferece benefício. O objetivo agora é examinar o **comportamento real** em condição de reflow, não alterar uma regra ARIA por suposição.

## Contraprova proposta

O cenário usa `tests/e2e/accessibility-scans.spec.js`, Playwright e Axe-core já instalados. No modo local de teste, o perfil Controlador abre Pendências e:
1. reduz a viewport para **683 × 768 CSS px**, abre os filtros com **Enter** no `summary`;
2. verifica a visibilidade e o nome do campo **Programa**, passa foco via **Tab** e retorna via **Shift+Tab**;
3. mede `scrollWidth` do documento, geometria de **seis campos avançados**, nome visível e foco efetivo; grava JSON e captura PNG do estado aberto;
4. avalia o painel com Axe nas tags WCAG 2.0/2.1/2.2 A/AA, rejeitando somente resultados **serious/critical comprovados**;
5. fecha o painel por **Space** sem perder o foco do `summary`.

O teste não usa `waitForTimeout`, não altera tolerância para fazê-lo passar, não modifica permissão, dados, CSS ou JS de produto. Métricas e screenshot são anexados **antes** de eventuais asserções de geometria, para que uma reprovação deixe evidência inspecionável.

## Limites de interpretação

- Alterar `viewport` para 683px **não equivale** a acionar fisicamente zoom 200% no menu do Chromium. É proxy de **área CSS para reflow**, uma parte do critério, e não prova completa de zoom nativo, texto ampliado, navegador com GPU ou todos os breakpoints.
- Axe automated **não certifica conformidade WCAG 2.2**; `incomplete` precisa de exame manual, não deve virar automaticamente bug nem ser ignorado sem identificação.
- Uma viewport estreita pode ativar estilos responsivos de mobile; isso é observável e interessa ao reflow, mas não transforma esta frente em auditoria geral do mobile.
- As ações `switchProfile('controlador')` são da **fixture local**, não demonstram Auth/RLS de Production. Preservar testes autenticados existentes como gate independente.
- Não criar uma classe CSS nova ou alargar componentes com base só em um pixel isolado: se houver falha, inspecionar o PNG, rects e hierarquia CSS para identificar **causa de produto** antes da correção. Se for deficiência do teste, documentar a reprodução e reparar somente a prova.

## Gate de conclusão

**PENDENTE:** resultado do CI no HEAD final da branch, JSON/PNG, eventuais falhas e análise visual. Encerramento possível como `sem defeito reproduzido nesta jornada`, `defeito localizado + correção/RED/verde` ou `limite de prova identificado`. Não extrapolar uma execução local para a qualidade integral do RADAR.

Não alterar Supabase, comandos fiscais, Auth, SQL/RLS, migrations, infraestrutura de Production ou qualquer pacote.
