# Relatório de Auditoria de Produção — RADAR PDDE

## Metadados da Auditoria
- **Data:** 10/11/2026
- **Ambiente:** Produção Autenticado e Anônimo
- **Modo:** Somente Leitura / Read-Only
- **Base:** commit e16ef7b / PR #513

---

## Seção 1: Superfície Inicial, Guarda de Autenticação e HTML Global
- **Redirecionamento e Proteção de Sessão:** Redirecionamento automático para `/dashboard` com guarda e proteção de sessão implementada em `src/auth/session-service.js`.
- **Acessibilidade e Atributos Globais:** Atributo `lang="pt-BR"` devidamente configurado no HTML global e suporte a navegação por tabulação por teclado com `:focus-visible`.
- **Achados em `index.html`:**
  1. Ausência da tag `<meta name="description">`.
  2. Título "Acesso institucional" estruturado como `<h2>` sem a presença prévia de um elemento `<h1>`.

---

## Seção 2: Dashboard (`/dashboard`)
- **Itens Aprovados:**
  - KPIs: 25 escolas no escopo, 24 com bonificação não lançada em Outubro/2026, e 4 com pendências abertas.
  - Alinhamento numérico com `tabular-nums` nos códigos INEP.
  - Contraste adequado da barra lateral (sidebar) com cor `#1E0F45`.
  - Ausência de rolagem/estouro horizontal (`overflow-x`).
- **Desvios Críticos:**
  - Sobreposição do banner flutuante "Sincronização em tempo real temporariamente indisponível..." cobrindo textos e tabelas da página.
  - Campo "Buscar escola..." invadindo a label "COMPETÊNCIA" localizada no cabeçalho superior.

---

## Seção 3: Carteira (`/carteira`) e Pendências Operacionais (`/pendencias`)
- **Itens Aprovados (Carteira):**
  - Filtros operacionais completos e funcionais.
  - Contador exibindo corretamente "163 de 163 escolas exibidas".
  - Presença do botão "Limpar filtros".
- **Desvios Críticos (Pendências):**
  - Quebra vertical caractere por caractere no cabeçalho da coluna "TENTATIVAS".
  - Quebra inadequada na exibição de meses na coluna "COMPETÊNCIA" (ex.: "Jane iro/2 026").
  - Hifenização forçada/quebrada na coluna "ERROS ATUAIS" (ex.: "Do cu me nto ile- gí- vel").
  - Compressão excessiva de texto nos botões de ação ("Registrar novo envio", "Abrir no Prontuário" e "Cancelar pendência").

---

## Seção 4: Prontuário da Unidade Escolar (`/escolas/04.31.802 - EDI Professor Carlos Falseth`)
- Abertura em formato slide-over mantendo rota dedicada (`/escolas/04.31.802 - EDI Professor Carlos Falseth`).
- Retorno limpo e sem erros via botão "← Voltar para Carteira", mantendo sincronização de rota.
- Histórico devidamente agrupado por competências (Outubro/2026, Setembro/2026, Agosto/2026).
- Botões de ação visíveis e funcionais.

---

## Seção 5: Demais Superfícies e Modal Compartilhado
- **Superfícies Auditadas:** `/competencias`, `/inventario`, `/auditoria`, `/guia`, `/equipe`.
- **Modal Compartilhado ("Registrar novo envio para conferência"):**
  - Largura aproximada de ~670px e centralização adequada conforme especificação em `design-qa.md`.
  - Fechamento funcional via tecla `Escape`.
  - Oclusão parcial dos botões do rodapé ("Cancelar" e "Registrar e enviar para reanálise") causada pelo banner flutuante de sincronização.
- **Observação de Navegação:** A rota `/equipe` não possui atalho direto na barra lateral para o perfil testado.

---

## Seção 6: Plano de Correção Recomendado (CSS e HTML)
1. **HTML/Acessibilidade (index.html):** Inclusão da tag `<meta name="description">` e ajuste da hierarquia do título de login ("Acesso institucional") de `<h2>` para `<h1>`.
2. **Toast/Banner Flutuante:** Ajuste no posicionamento/z-index ou adição de botão de fechar (dismiss) no toast de sincronização em tempo real para evitar oclusão de elementos de interface e modais.
3. **Tabela de Pendências (`/pendencias`):** Aplicação de `white-space: nowrap` e definição de `min-width` adequado nas colunas "Tentativas", "Competência", "Ações" e "Erros Atuais" para evitar quebras de linha e compressão de botões.
4. **Cabeçalho Superior:** Ajuste de gap/margin no leiaute do cabeçalho para evitar sobreposição entre o campo "Buscar escola..." e a label "COMPETÊNCIA".
