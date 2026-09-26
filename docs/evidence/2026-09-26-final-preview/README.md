# Validação visual incremental — 26/09/2026

Checkpoint 1. Candidato de produto `eb6c0405`, runtime `f183e4b1`, Preview `49db38ee` / deployment `dpl_E1fnvbtjQduaPmFUJjABZYFgKSjQ`. Ambiente confirmado pelo arquivo efetivamente carregado `config.runtime.js`: preview, local, Supabase desativado, URL/chave vazias, ativação Production false. Vercel confirma READY e SHA esperado.

Viewport principal: 1440×900 CSS px, confirmado por `innerWidth/innerHeight`. Foi necessário compensar escala 1,1 do Chrome na capacidade de viewport. A captura inicial `02-drawer-criacao.png` é exploratória em 1309×818; demais capturas identificadas como 1440 e seguintes usam o viewport correto.

## Etapas executadas

- Unidade Ary Barroso 04.31.001, Maio/2026, PDDE Básico, dados somente locais deste Preview.
- Duas despesas criadas pelos controles visíveis: papelaria e manutenção, com descrições distinguíveis na lista.
- Papelaria retificada de 123,45 para 129,45; referência PREVIEW-A-2609 e descrição alteradas no editor que explicita preservação de vínculo/histórico.
- IDs observados no DOM: A `nota-2649d10b-9c4b-443d-952f-4d6b657939d8`; B `nota-3430bc33-4657-4575-8686-68f9244e1b41`.
- Primeiro envio de A identificado como consumo, NF-PREVIEW-A-2609, mesmo ID; estado Aguardando reanálise.
- Controles Aguardando reanálise/Visualizar pendência sem colisão: separação horizontal observada ~12 px.
- Reanálise de A retornou à escola como Documento ilegível. B permanece provisória aberta.
- Aba Pendências Ativas desta unidade (2) comunica explicitamente o recorte escolar.

## Achados concretos antes de correção

1. **P2 visual — confirmação atrás do drawer.** Reproduzido na criação de A e B. Aviso com texto de sucesso e hidden=false, z-index 980, drawer z-index 1500. A mensagem fica parcialmente encoberta. Evidência `02-drawer-criacao-1440.png`. Esperado: confirmação legível no contexto da criação. Causa: ordem de camadas CSS. Correção ainda não aplicada.
2. **P2 visual/navegação — identificação abre rolada, escondendo contexto.** Ao abrir pelo drawer, escola/mês/programa ficam acima da área visível e seletor aparece parcialmente sob cabeçalho fixo. Rolar manualmente para cima recupera o contexto. Evidências `05-identificacao.png` e `05b-identificacao-contexto.png`. Causa provável: foco inicial provoca rolagem antes do foco específico com preventScroll. Diagnóstico pendente; corrigir somente apresentação/foco.
3. **Observação visual de UX-06.** Identidade da despesa está destacada; os campos da tentativa/contexto aparecem como lista vertical sem agrupamento ou diferenciação entre rótulo e valor (`07-reanalise-abertura.png`). Avaliar ajuste CSS localizado para cumprir a separação solicitada entre documento, tentativa e decisão. Não é falha de domínio.

## Próximo ponto de retomada

Navegador parado em `/escolas/04.31.001/pendencias`, A retornada para escola e B aberta. Concluir novo envio/resolução de A pelo caminho Pendências Operacionais; validar NAV-01 com detalhe, fechamento, abas e limpar filtro; confirmar releitura local. Depois diagnosticar/corrigir apenas os defeitos visuais acima na branch do #376, testes direcionados e nova inspeção. Não alterar Production, não mergear, não promover Preview.

Capturas desta pasta são evidência do candidato original. Não devem ser reapresentadas como prova de correções futuras.
