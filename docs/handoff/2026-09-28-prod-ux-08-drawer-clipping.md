# Handoff histórico — PROD-UX-08: composição do drawer global

> **Reclassificação (08/10):** demanda visual antiga ainda não reproduzida
> no estado atual. Conferir desktop largo e estreito, com conteúdo suficiente.
> Este checkpoint não é handoff corrente; não restaurar WIP anterior às cegas.


**Estado original:** investigação visual ainda não iniciada; verificação atual pendente.
**Data:** 28 de setembro de 2026.
**Frente anterior:** PROD-FUNC-09 encerrado pelo PR #392.
**Fase D:** adiada.

## 1. Ponto de partida confirmado

O PR #392 foi integrado em `8284a02faf3d9381ad42e66b6d93677d396e8515` e publicado no deployment Production `dpl_F8BVw5Js5v1HCcykq3NwBXa6SHzK`. O manifesto do alias oficial e o smoke com SHA esperado confirmaram a publicação. A tentativa original exibiu **Disponibilização 27/09/2026** e **Registro 27/09/2026, 23:12**, sem nova escrita.

A [evidência da frente encerrada](../evidence/2026-09-28-prod-func-09-date-business/README.md) inclui captura legível na largura de 880 px e captura desktop com clipping/sobreposição. A correção de data está encerrada; não reabrir persistência, timezone ou RPC sem evidência nova.

## 2. Objetivo humano e escopo

Na fila global de Pendências, abrir um registro deve permitir ler contexto, erros, tentativas, contatos e linha do tempo, mantendo clara a ação principal. Hoje, em desktop, o drawer estreito conserva uma composição em colunas que corta e sobrepõe conteúdo; elementos da fila também aparecem através/por cima de partes do painel.

Investigar a interação entre `task-9-pendencias.css`, `layout-responsive-2026.css` e as classes aplicadas pelo drawer antes de propor a menor correção coerente. Essa interação é uma **hipótese**, não uma causa já demonstrada.

O escopo é a composição do drawer e os estados diretamente afetados. Não alterar regras de negócio, persistência, RPCs, dados, classificação de despesas ou semântica dos estados. Não instalar bibliotecas ou iniciar redesign amplo nesta frente.

## 3. Leitura obrigatória

Seguir a ordem de `AGENTS.md`, incluindo:

- `docs/reference/SYSTEM_CANONICAL_MODEL.md`;
- `docs/reference/PRODUCT_SURFACE_CATALOG.md`;
- `docs/CURRENT_STAGE.md`;
- este handoff;
- `docs/reference/ENGINEERING_METHOD.md`;
- `docs/reference/FRONTEND_USER_VALIDATION_GATE.md`;
- `docs/reference/STATUS_DOCUMENTOS.md` e contratos da área.

## 4. Reprodução de referência

Production autenticada, somente observação:

1. Abrir Pendências Operacionais.
2. Filtrar Escola Municipal Cardeal Câmara (04.31.017).
3. Abrir **Ver detalhes** do registro `TESTE CONTROLADO UX 27-09-2026 23:08 — material de consumo sintético`.
4. Ler o conjunto do drawer e rolar até **Tentativas de envio**.
5. Comparar desktop principal e largura restrita, reabrindo o drawer após mudar o breakpoint.

Pendência: `pend-699702ea-480f-4703-bd98-9de990237f35`; invoice: `nota-82b17b35-971e-49d9-85a5-d4e0e2c55065`. Há uma tentativa, analisada, e o registro permanece Aberta/Escola. Não criar nova tentativa nem alterar o registro para reproduzir layout.

Há um WIP local histórico preservado em stash com descrição `WIP PROD-UX-08 drawer layout regression (failing test)`. Não tratá-lo como solução aprovada nem aplicá-lo sem inspeção; o teste não convergia antes da investigação isolada da data. O diagnóstico deve partir da main remota atual.

## 5. Método e critérios de conclusão

1. Revalidar SHA remoto, artefato publicado, instruções e superfície atual.
2. Observar o resultado renderizado e registrar os problemas antes de usar DOM/CSS para explicá-los.
3. Reproduzir localmente em estado populado; construir regressão que falhe pelo efeito observável de clipping/sobreposição, sem congelar detalhes incidentais do CSS.
4. Demonstrar a primeira regra/camada de composição responsável e a contraprova.
5. Aplicar a menor alteração coerente; rodar testes direcionados, relacionados e gates exigidos pelo contrato.
6. Comparar capturas abertas, incluindo contexto, conteúdo longo, ações, scroll, desktop e largura restrita. Testar a transição entre larguras.
7. Confirmar a leitura outside-in e a continuidade com Prontuário/Pendências Ativas quando material.
8. Publicar checkpoints online por etapa. Após revisão e publicação autorizadas, verificar o SHA e observar o resultado em Production sem nova escrita.

Testes verdes sem legibilidade humana não encerram esta frente. Problemas adjacentes não causados pela correção devem ser registrados e roteados explicitamente.

## 6. Sucessão documental e frente visual futura

Depois de encerrar PROD-UX-08, reconciliar os refinamentos imediatos que continuarem válidos. Antes de iniciar qualquer frente ampla de layout/design, ler obrigatoriamente:

`docs/evidence/2026-09-27-pr378-tooling/DESIGN_TOOLING.md`

É uma avaliação técnica datada: revalidar versões, compatibilidade, disponibilidade e custo/benefício antes de adoção. Preservar o debate sobre Figma/direção de arte, design system, tokens, componentização, Storybook/galeria de estados, Lucide, Fontsource, Sharp/SVGO, Style Dictionary, Superdesign e Playwright MCP.

Quando a fila corretiva terminar, atualizar `CURRENT_STAGE.md` e apontar um único handoff corrente para a evolução visual, com essa leitura obrigatória e decisão explícita sobre a Fase D. A metodologia permanece **ferramental/arquitetura visual moderna + aceitação humana outside-in**, com piloto em uma superfície completa antes de expansão.
