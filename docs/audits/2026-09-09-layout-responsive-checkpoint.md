# Checkpoint — responsividade desktop e 4K

Branch: `fix/layout-desktop-responsive-2026-09-09`
Baseline: `b124dda7f1c6032cec1e83aeeb6e41fd1691d55d`

## Escopo aprovado

- corrigir corte/overflow do cabeçalho no perfil Assistente de Verbas Federais;
- corrigir a tabela real de Pendências com 9 colunas;
- impedir que o drawer de Pendências reduza a largura do `#main-container`;
- garantir adaptação automática em notebooks e monitores de escritório;
- validar 1366×768, 1440×900, 1536×864, 1920×1080 e 4K;
- aplicar refinamento visual high-DPI/4K e tema escuro com contraste mais profundo, sem alterar regras de negócio.

## Evidências já confirmadas

1. `task-9-pendencias.css` declara 9 colunas e percentuais que somam 108%.
2. `task-9-cross-view.css` reduz explicitamente `#main-container` quando o drawer desktop abre.
3. A auditoria autenticada mostra corte do rótulo do Assistente e compressão/sobreposição em Pendências.

## Regra de implementação

Testes de geometria e responsividade devem ser escritos antes das alterações de produção e precisam cobrir o comportamento antes/depois da abertura do drawer.
