# RADAR PDDE — Contratos compartilhados de design

Este documento orienta a evolução visual de `/dashboard`, `/carteira`, `/competencias`, `/pendencias`, `/inventario`, `/auditoria`, `/guia` e `/escolas/:id`. Complementa `docs/reference/FRONTEND_USER_VALIDATION_GATE.md`; não altera suas regras de aceite.

## Autonomia com responsabilidade

- Toda correção visual deve investigar **componentes equivalentes** em outras superfícies, mas só alterar as que compartilham a mesma causa e cuja regressão possa ser validada.
- Preferir resolver a regra em seu **proprietário CSS** e remover concorrentes; não acrescentar overrides indiscriminados, `!important` ou novas folhas sem necessidade.
- Proteger comportamento, dados e permissões existentes. Uma mudança de layout pode afetar navegação, foco e estados, mesmo sem alterar o banco.
- Não considerar um teste verde equivalente à aprovação estética. Homologação visual e aprovação do responsável são gates independentes.

## Contratos visuais

1. **Profundidade e sobreposição:** distinguir modal (bloqueia interação ao fundo, confina foco e usa `aria-modal`) de painel complementar (não bloqueia nem confina foco). Os tokens `--radar-modal-filter`, `--radar-modal-backdrop`, `--radar-context-filter` e `--radar-context-backdrop`, definidos em `styles.css`, permitem variantes claras/escuro. O drawer de Pendências é complementar em desktop e modal em mobile. Desfoque não implica, por si, mudança semântica ou bloqueio de interação.
2. **Tipografia e leitura:** aplicar `--font-heading`, `--font-body`, `--text-main` e `--text-muted` segundo a hierarquia real: título da página, título da seção, ação requerida, campos, metadados. Usar `font-variant-numeric: tabular-nums` em números e datas tabulares, sem impor tamanho fixo a toda a aplicação.
3. **Cor e ações:** usar tokens `--primary`, `--success`, `--warning`, `--danger`, `--info` e variantes de superfície, com contraste verificado nos temas claro e escuro. Botões primários indicam a ação prioritária; secundários não disputam atenção com ela; destrutivos permanecem identificáveis.
4. **Espaçamento, tabelas e responsividade:** definir densidade e colunas na feature que possui a tabela. Folhas de layout geral cuidam da geometria da página. Se o conteúdo ultrapassar a largura disponível, oferecer rolagem horizontal acessível, sem partidas de palavras letra a letra. Nenhuma coluna pode depender de percentuais concorrentes distribuídos em múltiplas folhas.
5. **Iconografia:** manter família, peso, dimensão, baseline e tratamento do estado ativo coerentes; quando um ícone existente for ruim, ajustar a fonte comum, não substituir arbitrariamente todos os ícones.

## Autoridade do CSS

- `styles.css`: tokens, tipografia-base e padrões realmente compartilhados;
- `src/styles/task-9-pendencias.css`: composição da lista, colunas e gaveta específicas de Pendências;
- `src/styles/layout-responsive-2026.css`: geometria do app, sidebar e breakpoints gerais — sem redefinir larguras das nove colunas;
- `src/styles/desktop-basic-monitors.css`: ajustes de densidade gerais, sem impor dimensões de tabelas de uma feature;
- `src/styles/global-visual-polish.css`: acabamentos compartilhados comprovados, não depósito de sobrescritas de features.

## Gate de implementação

Na homologação, utilizar **1440 × 900** como baseline canônica e acrescentar **1280 × 900, 1920 × 900 e 390 × 900**, conforme este projeto. Capturar telas **com dados preenchidos**, inclusive textos longos e estados diferentes; testar drawers, modais, botões, rolagem e foco, em tema claro e escuro. Comparar antes/depois e inspecionar as capturas — não apenas seus nomes e os resultados do CI.

Publicar em Preview isolado, verificar o SHA real do deployment e solicitar aprovação visual expressa antes de integrar à `main`.
