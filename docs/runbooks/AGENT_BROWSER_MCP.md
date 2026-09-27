# Navegador Playwright MCP para agentes

**Classe:** Runbook técnico  
**Versão homologada:** `@playwright/mcp@0.0.82`

## Objetivo

Dar aos agentes um navegador real sem adicionar Playwright MCP ao runtime ou às dependências da aplicação.

O arquivo portátil `.mcp.json` oferece dois servidores:

- `playwright`: navegador isolado, preferido para reprodução determinística;
- `playwright-session`: modo `--extension`, reservado a fluxos que dependem da sessão já autenticada do navegador, SSO, 2FA ou extensões instaladas.

## Pré-requisitos

- Node.js 24;
- cliente compatível com MCP;
- para `playwright-session`, extensão oficial Playwright MCP instalada no Chrome/Edge e perfil autenticado apropriado.

## Codex

Quando o cliente não consumir automaticamente `.mcp.json`, configure explicitamente:

```bash
codex mcp add playwright -- npx -y @playwright/mcp@0.0.82
codex mcp add playwright-session -- npx -y @playwright/mcp@0.0.82 --extension
codex mcp list
```

## Regra de uso

1. reproduzir primeiro em navegador isolado;
2. escalar para `playwright-session` apenas quando autenticação/SSO for parte material da prova;
3. usar snapshots de acessibilidade para interação e screenshots para julgamento visual;
4. não executar escrita institucional em Production sem autorização explícita;
5. registrar URL, viewport, perfil, SHA e ambiente nas evidências de homologação.
