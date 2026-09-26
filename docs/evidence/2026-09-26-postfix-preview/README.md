# Checkpoint 2 — Preview pós-correções, inspeção live

Inspeção em 26/09/2026 no deployment Vercel `dpl_37XBGX5i9LfcVqdZEpu9yQwY6x94`, branch de Preview `23ccba404aed028f2847ebbff55362c9beb0f99c`, produto `f5e35f8f4a7519cefcd883bb6b8999542ba77a48`. Apenas `vercel.json` temporário distingue a branch de Preview do produto. A aplicação abriu autenticada por acesso temporário oficial da Vercel; nenhuma chave de compartilhamento é registrada nesta evidência. Runtime local isolado, sem Supabase institucional. Viewport `innerWidth=1440`, `innerHeight=900` CSS px.

## Jornada executada

- Escola Municipal Ary Barroso (04.31.001), Maio/2026, PDDE Básico: despesa sintética provisória “Débito de material — teste visual do Preview corrigido”, R$ 73,40; primeiro documento `NF-VISUAL-2609`, tipo Material de Consumo; Aguardando reanálise; decisão “Documento correto” pela fila geral; estado Resolvida e tentativa/histórico preservados após recarregar a página.
- Escola Municipal David Perez (04.31.002), mesma competência e programa: despesa sintética provisória “Débito manutenção — teste de fila transversal”, R$ 41,25, aberta. A fila global exibiu 2 registros em 2 escolas: uma pendência ativa e uma resolvida, com seletor de escola “Todas” e competência “Todas as competências”.
- NAV-01: filtro por escola, abrir/fechar detalhe e alternar abas Abertas/Resolvidas/Aguardando preservaram URL, seletor, banner e contagem. A ação “Limpar filtro de unidade” apresentou defeito: só a URL foi limpa; seletor, banner e recorte persistiram após troca de aba. Selecionar “Todas” manualmente limpou o recorte. A correção está no #375 (`0d2fe5c6`) e aguarda nova verificação visual.
- NAV-01: na fila de Pendências, “Abrir no Prontuário” exibia o prontuário da escola, porém mantinha a URL `/pendencias`; ao recarregar, a interface voltava à fila. O defeito foi corrigido no PR #375 pelo commit `d591b231` e aguarda verificação em novo Preview combinado.

## Inspeção visual

- `01-identificacao-topo.png`: o primeiro envio abriu com Escola, Competência, Programa e Documento visíveis, foco no título do contexto e rolagem zero. Corrige o defeito observado no Preview anterior.
- `02-aguardando-reanalise.png`: controles separados e estado acionável.
- `03-reanalise-hierarquia.png`: documento, tentativa, contexto e decisão visualmente distintos. Achado adicional reproduzido: a orientação inicial começa sob o cabeçalho fixo; `scrollTop=29,09` e primeiro parágrafo com topo em `y=76,1`, acima da base do cabeçalho em `y=77,6`. A correção localizada foi publicada em `aeeb0b02`; esta captura é anterior a esse commit.
- `04-pendencias-filtradas.png` e `05-detalhe-filtrado.png`: fila escolar e detalhe; estado e tentativa preservados.
- `06-limpeza-url-filtro-persistente.png`: imediatamente após limpar o filtro, URL global e interface ainda filtrada. Observação confirmada novamente após troca de aba.
- `07-resolvida-historico.png`: resolução e linha do tempo da mesma pendência.
- `08-feedback-drawer-corrigido.png`: confirmação totalmente legível à esquerda do drawer aberto, corrigindo a sobreposição anterior.
- `09-fila-transversal-duas-escolas.png` e `10-fila-global-escola-ativa.png`: visão global com dois registros/escolas e estados ativo/histórico. No desktop 1440×900, o rótulo do botão “Registrar envio / identificação da despesa” transborda a célula de ações: caixa `x=1279..1394`, texto renderizado `x=1221..1451`, além do viewport (`1440`). A correção localizada está no #376 (`6d04624e`) e aguarda nova verificação visual.
- `11-prontuario-com-url-pendencias.png`: o Prontuário aparece após “Abrir no Prontuário”, mas a barra de endereço ainda indica `/pendencias`; o recarregamento retorna à fila. Captura anterior à correção `d591b231` do PR #375.

Todas as gravações acima ocorreram somente no Preview Vercel em modo de dados local. Essas capturas comprovam o deployment `23ccba4`/produto `f5e35f8`, não os commits posteriores `aeeb0b02`, `0d2fe5c6`, `d591b231` e `6d04624e`, ainda pendentes de inspeção visual combinada. Não fazer merge nem publicar Production com base neste checkpoint.
