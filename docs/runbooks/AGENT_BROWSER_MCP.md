# Navegadores MCP para agentes

**Classe:** Runbook técnico  
**Versões fixadas:** `@playwright/mcp@0.0.82` e `chrome-devtools-mcp@1.12.0`

## Objetivo

Dar aos agentes navegação e diagnóstico num navegador real, com tooling separado
do runtime e das dependências da aplicação.

Os arquivos portáteis `.mcp.json` e `.codex/config.toml` oferecem os mesmos três servidores:

- `playwright`: navegador isolado, preferido para reprodução determinística;
- `playwright-session`: modo `--extension`, reservado a fluxos que dependem da sessão já autenticada do navegador, SSO, 2FA ou extensões instaladas.
- `chrome-devtools`: Chrome isolado/headless para console, rede, CSS,
  acessibilidade/Lighthouse, LCP/traces, memória e ferramentas PWA.

## Pré-requisitos

- Node.js 24;
- cliente compatível com MCP;
- Google Chrome estável ou Chrome for Testing para `chrome-devtools`;
- para `playwright-session`, extensão oficial Playwright MCP instalada no Chrome/Edge e perfil autenticado apropriado.

Iniciar o cliente na raiz deste checkout. `--workspace=.` delimita os arquivos
que o Chrome DevTools pode ler/gravar ao diretório de trabalho do processo; não
usar uma pasta de outro projeto. Para Chrome fora do caminho padrão, acrescentar
localmente `--executable-path=/caminho/absoluto/do/chrome` à invocação do servidor.
Não versionar esse caminho específico da máquina, perfil pessoal ou credenciais.

## Codex

O Codex pode carregar `.codex/config.toml` do repositório quando o projeto é
confiável. Os comandos abaixo são alternativa para clientes que não carreguem
esse arquivo, não uma etapa adicional obrigatória:

```bash
codex mcp add playwright -- npx -y @playwright/mcp@0.0.82
codex mcp add playwright-session -- npx -y @playwright/mcp@0.0.82 --extension
codex mcp add chrome-devtools -- npx -y chrome-devtools-mcp@1.12.0 --headless --isolated --memory-debugging --category-pwa --no-usage-statistics --no-performance-crux --redact-network-headers --workspace=.
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

## Configuração do Chrome DevTools

- Versão fixada em `1.12.0`, sem `@latest` e sem dependência nova no bundle.
- `--headless --isolated`: perfil temporário, separado do navegador pessoal e
  das sessões Playwright. Não presumir autenticação compartilhada.
- `--memory-debugging --category-pwa`: expõem os recursos opcionais usados pelos
  guias; uso de heap e instalação PWA continuam sob demanda.
- `--no-usage-statistics --no-performance-crux`: desativam estatísticas de uso
  deste servidor e envio de URLs de traces ao CrUX. Esses flags não controlam
  toda comunicação de rede do navegador ou das páginas visitadas.
- `--redact-network-headers`: mascara headers sensíveis. Não confundir conteúdo
  mascarado com cookie ausente; não divulgar valores de sessão para diagnosticá-lo.
- `--workspace=.`: permite gravar os relatórios no checkout. Usar
  `artifacts/tooling/chrome-devtools/`, já ignorado pelo Git, ou os caminhos
  temporários retornados pelas ferramentas.
- No Codex, startup tem 45 s e chamadas têm até 180 s para auditorias sob demanda.
  Um timeout deve ser investigado, não contornado repetindo auditorias sem motivo.

Não é preciso abrir uma porta de depuração nem conectar o Chrome pessoal para
usar essa configuração: o servidor inicia sua própria instância por pipe.
As ferramentas PWA dependem desse modo de conexão. Não acrescentar `browserUrl`
ou `autoConnect` sem reavaliar essas capacidades e a finalidade da prova.

## Sete guias oficiais e adaptação do RADAR

O roteador [.agents/skills/radar-browser-diagnostics/SKILL.md](../../.agents/skills/radar-browser-diagnostics/SKILL.md)
carrega sob demanda os sete guias oficiais: `chrome-devtools`,
`chrome-devtools-cli`, `a11y-debugging`, `debug-optimize-lcp`,
`cookie-debugging`, `memory-leak-debugging` e `troubleshooting`.

Os arquivos oficiais e suas referências foram copiados sem alterações do pacote
`chrome-devtools-mcp@1.12.0`. Origem e licença estão em
[UPSTREAM.md](../../.agents/skills/chrome-devtools/UPSTREAM.md).
A [referência local de compatibilidade](../../.agents/skills/radar-browser-diagnostics/references/compatibility.md)
especializa critérios de acessibilidade, cookies, logs e interpretação de métricas.
Não aplicar automaticamente comandos de uma versão posterior de `main`.

Ao atualizar o servidor, conferir o changelog oficial, substituir os sete guias
pelo conteúdo do mesmo pacote, preservar licença/proveniência e validar catálogo
e conexão. Instalação/registro, conexão, exposição de ferramenta e execução
funcional são evidências distintas.

## Primeira validação no RADAR local

1. Executar `npm run dev` na raiz; o servidor canônico usa `127.0.0.1:4175` por
   padrão. Conferir a URL efetiva no terminal e o `config.runtime.js`; local e
   Production têm autoridades diferentes e não compartilham sessão por inferência.
2. No MCP, chamar `list_pages` e `new_page` com essa URL. Usar o `pageId` retornado.
3. Capturar `take_snapshot`, console e requisições; interagir com controles reais
   pertinentes ao objetivo e inspecionar um screenshot efetivamente aberto.
4. Só executar Lighthouse, trace, heap ou instalação PWA quando a investigação
   exigir. Filtrar arquivos grandes antes de levá-los ao contexto do agente.
5. Para uma jornada remota/autenticada, seguir o gate do projeto e obter o acesso
   autorizado ao ambiente correto. O smoke local não certifica esse fluxo.

## Alternativa por terminal

O pacote também fornece a CLI; ela pode ser usada sem instalação global:

```bash
npx -y --package=chrome-devtools-mcp@1.12.0 chrome-devtools start --headless --isolated --memory-debugging --category-pwa --no-usage-statistics --no-performance-crux --redact-network-headers --workspace=.
npx -y --package=chrome-devtools-mcp@1.12.0 chrome-devtools list_pages
```

`start` é preparação inicial ou reconfiguração, não etapa anterior a cada comando.
O daemon mantém a sessão entre chamadas. Em máquina com Chrome não padrão,
acrescentar `--executable-path` ao `start` inicial. Não reiniciar um daemon com
investigação em andamento sem preservar o contexto que ainda é necessário.

## Fontes oficiais

- [Chrome DevTools MCP 1.12.0](https://github.com/ChromeDevTools/chrome-devtools-mcp/tree/af2834411a564d366f9cab63efb046d9084f4dba).
- [Configuração MCP no Codex](https://developers.openai.com/codex/mcp/).
- [Playwright MCP](https://github.com/microsoft/playwright-mcp).
