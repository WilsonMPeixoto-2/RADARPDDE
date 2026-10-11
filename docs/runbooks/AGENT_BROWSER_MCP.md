# Navegador Playwright MCP para agentes

**Classe:** Runbook técnico  
**Versão homologada:** `@playwright/mcp@0.0.82`

## Objetivo

Dar aos agentes um navegador real sem adicionar Playwright MCP ao runtime ou às dependências da aplicação.

Os arquivos portáteis `.mcp.json` e `.codex/config.toml` oferecem os mesmos dois servidores:

- `playwright`: navegador isolado, preferido para reprodução determinística;
- `playwright-session`: modo `--extension`, reservado a fluxos que dependem da sessão já autenticada do navegador, SSO, 2FA ou extensões instaladas.

## Pré-requisitos

- Node.js 24;
- cliente compatível com MCP;
- para `playwright-session`, extensão oficial Playwright MCP instalada no Chrome/Edge e perfil autenticado apropriado.

## Codex

O Codex pode carregar `.codex/config.toml` do repositório quando o projeto é
confiável. Os comandos abaixo são alternativa para clientes que não carreguem
esse arquivo, não uma etapa adicional obrigatória:

```bash
codex mcp add playwright -- npx -y @playwright/mcp@0.0.82
codex mcp add playwright-session -- npx -y @playwright/mcp@0.0.82 --extension
codex mcp list
```

Documentação de configuração por projeto:
https://developers.openai.com/codex/config-basic

A extensão oficial fica em:
https://chromewebstore.google.com/detail/playwright-extension/mmlmfjhmonkocbjadbfplnigmagldckm
Seu funcionamento está documentado em:
https://github.com/microsoft/playwright/tree/main/packages/extension#readme

Instalar a extensão ou registrar o servidor não comprova acesso ao navegador.
`playwright-session` deve executar no computador que possui o Chrome pessoal.
Na primeira chamada, o responsável aprova a conexão e seleciona a aba. O agente
confirma o acesso por snapshot e screenshot examinado da interface autenticada.
Não solicitar senha, cookies, JWT, storageState nem token da extensão pelo chat.

Configurar MCP em um executor cloud não configura o Codex Desktop de outra
máquina nem injeta ferramentas retroativamente no turno aberto. Quando a missão
exigir observar a sessão real, aguardar esse acesso; fixtures são preparação
auxiliar e não substituem a jornada solicitada.

## Regra de uso

1. escolher o navegador conforme a prova: isolado para reprodução determinística;
2. usar `playwright-session` quando a sessão existente/autenticação/SSO for parte material da prova;
3. usar snapshots de acessibilidade para interação e screenshots para julgamento visual;
4. não executar escrita institucional em Production sem autorização explícita;
5. registrar URL, viewport, perfil, SHA e ambiente nas evidências de homologação.
