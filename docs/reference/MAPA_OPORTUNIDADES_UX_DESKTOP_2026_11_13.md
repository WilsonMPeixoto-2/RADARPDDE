# Mapa de Oportunidades UX/UI Desktop RADAR PDDE (2026-11-13)

## 1. Painel (`/dashboard`) e Carteira (`/carteira`)
- **Disposição de KPIs & Indicadores Topo:** Em `src/styles/cycle-b-dashboard.css` e `app.js` (`renderDashboardView`), a grade de KPIs em telas 1440x900 acumula cartões de métricas sem reagrupamento visual por domínio. Oportunidade: agrupamento lógico de KPIs (Status Global, Saldos/Repasses, Pendências Críticas) com hierarquia tipográfica diferenciada.
- **Abas de Região Administrativa (R.A.):** Em `app.js`, o seletor de R.A. utiliza filtros horizontais por texto/pills com overflow lateral sem paginação clara. Oportunidade: seletor de R.A. com contadores integrados de escolas por R.A. e visualização em grade responsiva.
- **Badges de Programas por Escola (PDDE Básico, Conectada, PROEC, Escola das Adolescências):** Renderizados como badges coloridas simples em linhas de tabela (`renderCarteiraTable`). Oportunidade: iconografia padronizada e tooltip rico mostrando saldo individual por programa e situação de prestação de contas.
- **Botões de Ação na Tabela:** Botões `Ver Prontuário`, `Registrar Ação` agrupados com pouca separação e tamanho reduzido em telas Desktop. Oportunidade: padronização de ações principais com botões primários/secundários e suporte a acionamento rápido por teclado.

## 2. Competências Mensais (`/competencias`)
- **Disposição dos 8 Filtros Simultâneos:** Os filtros (E.E./R.A., Tipo de Pendência, Situação Prestação, Mês/Exercício, Programa, Termo de Compromisso, Status de Envio, Status de Homologação) ocupam grande espaço vertical no topo da página. Oportunidade: reorganização em gaveta/barra sanfonada ("Filtros Avançados") mantendo visíveis apenas os 3 filtros mais frequentes com indicador numérico de filtros ativos.
- **Contadores de Resultado ("163 de 163 escolas exibidas", "20 com pendências ativas"):** Apresentados em texto corrido pequeno em cima da tabela. Oportunidade: destaque em banner estético de sumário operacional com barra de progresso de conformidade mensal.
- **Leitura das Colunas na Tabela Desktop:** Em 1440x900, colunas de meses (Jan..Dez) e valores financeiros causam truncamento de texto ou rolagem horizontal excessiva (`src/styles/desktop-basic-monitors.css`). Oportunidade: congelamento da coluna da escola (Sticky Left Column) e alinhamento numérico à direita com separadores visuais zebrados suaves.

## 3. Pendências Operacionais (`/pendencias`)
- **Renderização de `renderErrors()` na Coluna "ERROS ATUAIS":** Renderiza marcadores de lista (bolinha `<ul>`/`<li>`) dentro de caixas rosa (`.error-box`). Em telas desktop, gera ruído visual e desalinhamento vertical. Oportunidade: substituição das bolinhas por tags de erros categorizados (e.g. `[Capital]`, `[Consumo]`, `[Saldo]`) com badges expansíveis e contraste adequado conforme `src/styles/pendency-passive-queue.css`.
- **Abas de Status (Abertas, Aguardando reanálise, Resolvidas, Canceladas):** Falta badge contadora dinâmica em tempo real para cada status na própria aba. Oportunidade: abas com números dinâmicos e destaque visual no estado ativo.
- **Filtros e Botões de Ação:** Ações como `Solicitar Reanálise` e `Resolver Pendência` possuem estilo similar a botões neutros. Oportunidade: separação de ações destrutivas (Cancelar/Resolver) e de consulta (Ver Histórico), além de filtros por gravidade (Crítica, Média, Baixa).

## 4. Prontuário da Unidade Escolar (`/escolas/04.10.001` e `/escolas/04.11.809`)
- **Densidade de Botões no Cabeçalho:** O cabeçalho agrupa 5 botões de ação (`Editar Dados`, `Exibir dados da unidade`, `Próxima unidade`, `Gerar comunicação`, `Registrar contato`) competindo com o título da escola. Oportunidade: agrupamento em barra de ferramentas ("Toolbar") com botões principais (`Registrar Contato`, `Gerar Comunicação`) e menu dropdown `Mais Ações`.
- **Novo Card `Saídas sem ação definida`:** O card de alerta de saídas financeiras pendentes carece de atalho direto para resolução. Oportunidade: botão de ação direta "Vincular Categoria / Inventário" integrado ao card.
- **Régua de Meses (`Jan..Dez`) e Matriz de Preenchimento:** A régua de prestação mensal (`Sim / Não / N/A`, e em `Encaminhado para Inventariação` sem `N/A`, com botão `Consolidada`) gera sobrecarga em telas menores de 1440px. Oportunidade: matriz de status gráfica interativa em formato de mapa de calor (Heatmap de Conformidade) com clique único para preenchimento/transição de estado.
- **Sub-abas (`Pendências Ativas`, `Histórico de Contatos`, `Registro de Capital`, `Registros`):** Visualmente planas em `src/styles/prontuario-operational-ux.css`. Oportunidade: abas com indicadores de completude e contagem de registros por aba.

## 5. Capital e Inventário (`/inventario`) e Registros Internos (`/auditoria`)
- **Fila de Inventariação Patrimonial (`/inventario`):** Os campos de número de processo, status patrimonial e nota de empenho aparecem em formulários extensos. Oportunidade: edição inline (Inline Editing) na própria tabela e atalhos para preenchimento em lote (Bulk Actions).
- **Tabela de Logs de Auditoria (`/auditoria`):** Os payloads JSON e detalhes técnicos de auditoria são exibidos em formato string plana truncada. Oportunidade: modal de visualização de diff/JSON formatado com realce de sintaxe (Syntax Highlighting) e busca por termo dentro do log.
