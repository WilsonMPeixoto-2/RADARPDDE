---
name: radar-browser-diagnostics
description: Use ao diagnosticar ou validar o RADAR PDDE pelo navegador com Chrome DevTools MCP, incluindo console, rede, CSS, acessibilidade, LCP, cookies, memória ou PWA. Roteia os sete guias oficiais para a versão instalada e preserva as regras de ambiente, persistência e validação humana do projeto.
---

# Diagnóstico do RADAR pelo navegador

1. Leia o `AGENTS.md` da raiz e sua rota canônica. Defina a pergunta a verificar,
   ambiente, URL, SHA, perfil e superfície antes de executar uma auditoria.
2. Leia `docs/runbooks/AGENT_BROWSER_MCP.md` a partir da raiz do repositório para
   confirmar instalação, flags, diretório de trabalho e limites da sessão.
3. Escolha o guia oficial pertinente na tabela abaixo; não carregue todos por
   rotina. Os caminhos são relativos a esta pasta.
4. Antes de executar seus exemplos, aplique
   [references/compatibility.md](references/compatibility.md). O catálogo de
   ferramentas e o `--help` da versão ativa prevalecem sobre exemplos de `main`.
5. Reproduza a jornada com controles reais. Use snapshot para localizar elementos
   e screenshot efetivamente inspecionado para validar a composição visual.
   Quando houver interface alterada, cumpra também a leitura outside-in do gate
   de frontend; DOM e CSS não substituem a percepção da tela.
6. Registre evidências em `artifacts/tooling/chrome-devtools/` ou na pasta temporária
   retornada pela ferramenta. Filtre relatórios grandes antes de lê-los no chat.
7. Entregue resultado, evidência, alcance e lacunas. Separe teste local, Preview,
   Production, sessão autenticada e dados sintéticos.

| Necessidade                              | Guia oficial                                               |
| ---------------------------------------- | ---------------------------------------------------------- |
| MCP, navegação, elementos e CSS          | [chrome-devtools](../chrome-devtools/SKILL.md)             |
| Terminal e automação CLI                 | [chrome-devtools-cli](../chrome-devtools-cli/SKILL.md)     |
| Semântica, teclado e contraste           | [a11y-debugging](../a11y-debugging/SKILL.md)               |
| Gargalo de carregamento/LCP              | [debug-optimize-lcp](../debug-optimize-lcp/SKILL.md)       |
| Cookies, autenticação e consentimento    | [cookie-debugging](../cookie-debugging/SKILL.md)           |
| Retenção e comparação de heap            | [memory-leak-debugging](../memory-leak-debugging/SKILL.md) |
| Falhas de conexão e ferramentas ausentes | [troubleshooting](../troubleshooting/SKILL.md)             |

Esta skill coordena diagnóstico. Não redefine regras fiscais, autorização,
persistência, tolerâncias de testes ou prioridades do produto.
