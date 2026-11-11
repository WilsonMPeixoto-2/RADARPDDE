# Design System & Autonomia Proativa de UI/UX — RADAR PDDE

Este documento estabelece os **5 Contratos Visuais Sistêmicos** obrigatórios para todas as superfícies do RADAR PDDE (`/dashboard`, `/carteira`, `/competencias`, `/pendencias`, `/inventario`, `/auditoria`, `/guia`, `/escolas/:id`).

## Regra de Autonomia Proativa (Proibido Remendo Isolado)

1. A diretriz de "menor alteração possível" aplica-se exclusivamente à lógica de negócio, banco de dados (Supabase/RLS) e regras fiscais do PDDE.
2. Em tarefas de **UI/UX, CSS, tipografia, iconografia e layout**, é **proibido fazer remendos isolados em uma única aba**. Sempre que um desvio visual for identificado em uma superfície, o agente deve realizar uma varredura transversal e propagar a melhoria para todos os componentes equivalentes do sistema no mesmo lote de Preview.

## Os 5 Contratos Sistêmicos Globais

1. **Profundidade e Foco de Contexto (Gavetas Laterais e Modais):**
   - Sempre que uma gaveta lateral (*Prontuário* ou *Detalhes de Pendência*) ou modal estiver aberto, a página principal ao fundo deve receber atenuação e desfoque (`backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); background-color: rgba(15, 10, 30, 0.36);`), isolando o foco cognitivo na camada ativa.
2. **Hierarquia Tipográfica Semântica:**
   - Diferenciação estrita entre *kickers/tópicos* (`0.72rem`, `font-weight: 700`, `letter-spacing: 0.06em`, caixa alta, `--text-muted`), *títulos e nomes de unidades escolares* (`font-weight: 600` a `700`, `--text-main`), *valores monetários/códigos INEP/datas* (`font-variant-numeric: tabular-nums`, `font-weight: 500`) e *metadados secundários*.
3. **Relação Semântica de Cores para Tópicos, Status e Botões:**
   - Apenas 1 botão primário (`#7c3aed`) por zona funcional; botões secundários em superfície neutra com borda sutil (`1px solid`); ações destrutivas em vermelho semântico; badges de status diferenciados por matiz real (erro, pendência, regularizado, informativo).
4. **Respiro, Separação Visual e Tabelas Universais:**
   - Todas as tabelas operacionais devem ter `padding: 12px 16px`, `min-width` garantido por coluna (com soma exata de `100%` quando houver larguras percentuais) e contêiner com `overflow-x: auto` para evitar colisões em `1280px` com gaveta aberta.
5. **Iconografia Consistente e Equilíbrio Óptico:**
   - Ícones SVG padronizados com traço uniforme (`1.75px` a `2px`), `flex-shrink: 0`, compensação óptica por formato e alinhamento vertical centrado com o texto.
