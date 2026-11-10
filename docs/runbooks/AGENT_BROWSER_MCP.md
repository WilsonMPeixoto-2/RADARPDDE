# Navegadores MCP para agentes

**Classe:** Runbook técnico  
**Versões fixadas:** `@playwright/mcp@0.0.82` e `chrome-devtools-mcp@1.12.0`

## Objetivo

Dar aos agentes navegação e diagnóstico num navegador real, com tooling separado
do runtime e das dependências da aplicação.

Os arquivos portáteis `.mcp.json` e `.codex/config.toml` oferecem os mesmos quatro servidores:

- `playwright`: navegador isolado, preferido para reprodução determinística;
- `playwright-session`: modo `--extension`, reservado a fluxos que dependem da sessão já autenticada do navegador, SSO, 2FA ou extensões instaladas.
- `chrome-devtools`: Chrome isolado/headless para console, rede, CSS,
  acessibilidade/Lighthouse, LCP/traces, memória e ferramentas PWA;
- `chrome-devtools-session`: conecta sob demanda a um Chrome já aberto com
  `--auto-connect`, para diagnosticar a sessão autenticada no sistema publicado.

O alvo de Production é **https://radarpdde-fix.vercel.app**. Ambos os servidores
Chrome DevTools podem inspecionar URLs publicadas. O modo isolado começa sem
login; o modo sessão depende do acesso efetivo ao navegador autenticado.

## Pré-requisitos

- Node.js 24;
- cliente compatível com MCP;
- Google Chrome estável ou Chrome for Testing para `chrome-devtools`;
- Chrome 144+ aberto no mesmo computador do servidor MCP para
  `chrome-devtools-session`, com depuração remota habilitada e conexão aceita;
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
codex mcp add chrome-devtools-session -- npx -y chrome-devtools-mcp@1.12.0 --auto-connect --memory-debugging --no-usage-statistics --no-performance-crux --redact-network-headers --workspace=.
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
2. usar `playwright-session` ou `chrome-devtools-session` quando a sessão existente/autenticação/SSO for parte material da prova;
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

O servidor `chrome-devtools` inicia sua própria instância por pipe; não exige
porta de depuração ou Chrome pessoal. As ferramentas PWA dependem desse modo.
O servidor separado `chrome-devtools-session` usa `--auto-connect` e não inclui
`--headless`, `--isolated` ou `--category-pwa`: ele inspeciona o navegador
existente, sem oferecer instalação PWA nessa conexão.

## Conectar a sessão do sistema real

1. No computador que executa o cliente e o servidor MCP, abrir Chrome estável
   144+ e acessar `chrome://inspect/#remote-debugging`. Habilitar a depuração
   remota nessa tela.
2. Abrir https://radarpdde-fix.vercel.app e entrar normalmente com a conta
   autorizada. Credenciais permanecem no navegador; não enviar senha, cookies,
   JWT ou storageState ao agente.
3. Carregar a configuração do projeto no cliente MCP. Chamar `list_pages` pelo
   servidor `chrome-devtools-session` e aceitar a solicitação de conexão que
   o Chrome apresentar.
4. Identificar e selecionar a aba do RADAR pelo `pageId` retornado. Confirmar a
   URL, a superfície visível e o papel efetivo; examinar snapshot e screenshot.
   Registrar separadamente conexão estabelecida e autenticação comprovada.

Essas etapas precisam ocorrer no computador do Chrome. Um servidor em executor
cloud não alcança o `localhost` do computador pessoal. A tag de um plugin ou
uma entrada MCP no arquivo também não prova acesso à aba: conferir as ferramentas
efetivamente disponíveis e o resultado da conexão antes de declarar prontidão.

Se `--auto-connect` não funcionar no ambiente, a alternativa é uma instância
dedicada do Chrome com `--remote-debugging-port=9222`,
`--remote-debugging-address=127.0.0.1` e `--user-data-dir` apontando para um
diretório novo, fora do Git. Entrar no RADAR nessa janela e substituir
**localmente** `--auto-connect` por `--browser-url=http://127.0.0.1:9222`.
Usar a porta apenas no loopback; não publicar o endpoint de depuração nem o
diretório do perfil. Não iniciar uma segunda cópia sobre o perfil já em uso.

## Roteiro de diagnóstico em Production

1. Executar `npm run check:production`. O comando consulta o manifesto, shell,
   assets, configuração pública e bloqueio de leitura anônima no Supabase por
   GET; retorna o SHA encontrado. Não exige login e não certifica áreas internas.
   Para comparar uma versão específica, usar:

   ```bash
   node scripts/check-production-system.mjs --base-url https://radarpdde-fix.vercel.app --expected-commit <SHA_COMPLETO>
   ```

   Em executor com proxy HTTP/HTTPS obrigatório, Node 24 pode exigir
   `NODE_USE_ENV_PROXY=1 npm run check:production`. Falha de conexão sem usar o
   proxy do executor não comprova indisponibilidade do site.

2. Abrir a URL publicada com `chrome-devtools`, obter snapshot e inspecionar
   screenshot da tela de login. Conferir console, respostas de rede, rotas
   diretas e layout desktop/mobile. A navegação deve apontar para o domínio real,
   não para `127.0.0.1`.
3. Com `chrome-devtools-session` conectado, percorrer uma jornada de leitura
   pertinente: Dashboard → Carteira → Prontuário → Pendências → reload. Usar
   controles reais, confirmar o contexto após cada transição e preservar a
   sessão ao terminar. Não disparar logout ou limpar storage para testar a sessão
   pessoal sem que isso faça parte do pedido.
4. Coletar console/rede e, quando a hipótese exigir, trace de desempenho,
   Lighthouse ou heap. O resultado é uma medição de laboratório no site real,
   nas condições registradas; não representa automaticamente todos os usuários.
   Guardar artefatos brutos em `artifacts/tooling/chrome-devtools/`, ignorado pelo
   Git. Headers mascarados não removem dados pessoais de screenshots, respostas,
   traces ou heap: compartilhar apenas evidência revisada e necessária.
5. Reproduzir achados confirmados em branch, implementar a menor correção
   coerente e validar a jornada afetada. Conferir o ambiente e SHA de cada prova;
   registrar como pendente qualquer parte inacessível por falta de sessão.

O protocolo padrão deste diagnóstico em Production é leitura: navegar, buscar,
filtrar e observar. Não salvar/excluir registros, alterar permissões, executar
RPCs de escrita ou simular falhas de escrita. Exportações também ficam fora
desse roteiro porque geram auditoria. Essa disciplina é operacional: as
ferramentas MCP não impõem por si mesmas bloqueio técnico de todas as mutações.
Uma operação de escrita exige escopo autorizado específico e validação dos seus
efeitos conforme o restante do projeto.

Em Local/Preview, conferir `radar-build-manifest.json`, runtime e projeto
Supabase de destino antes de testar gravação. O build de Preview usa dados locais
por padrão, mas configuração explícita pode mudar o backend. O nome Preview
não comprova banco descartável; CRUD completo só cabe em ambiente comprovadamente
isolado e no escopo do teste. `vercel.json` desativa deployments automáticos de
branches diferentes de `main`: um PR não garante Preview publicado.

### Testes existentes que complementam o MCP

```bash
npx playwright test --config=playwright.deployment.config.js
```

Essa suíte usa o domínio de Production por padrão, verifica login, RLS anônima,
runtime, erros e layout em desktop/mobile. Exige as dependências do projeto e os
navegadores Playwright instalados. Suas asserções são específicas de Production;
trocar `RADAR_DEPLOYMENT_URL` por um Preview não adapta o contrato automaticamente.

A suíte `playwright.production-authenticated-read.config.js` depende de arquivo
protegido com contas autorizadas. Para leitura, habilitar
`RADAR_E2E_PRODUCTION_AUTHENTICATED_READ=1`, informar
`RADAR_PRODUCTION_READ_ACCOUNTS_FILE` e fixar
`RADAR_PRODUCTION_WRITE_SMOKE_ENABLED=0` e
`RADAR_PRODUCTION_WRITE_SMOKE_REQUIRED=0`. Preferir a sessão conectada quando a
prova deve usar o navegador do responsável.

**Não disparar manualmente `production-authenticated-read.yml` como teste de
leitura:** o `workflow_dispatch` desse workflow habilita e exige CRUD fiscal
reversível em Production. O agendamento é somente leitura. Consultar o
[runbook Supabase](SUPABASE_CONNECTION.md#15-smoke-autenticado-real-de-production)
antes de operar essa automação.

### Pedido reutilizável para uma auditoria

> Use a skill `radar-browser-diagnostics` para diagnosticar o RADAR publicado em
> https://radarpdde-fix.vercel.app. Confirme URL, SHA, runtime e sessão. Examine
> navegação, layout, acessibilidade, console/rede e desempenho conforme os
> sintomas observados; percorra Dashboard, Carteira, Prontuário e Pendências
> quando houver sessão autorizada. Em Production, faça apenas leitura e
> diagnóstico, sem exportações ou alterações de dados. Registre evidências e
> limitações; reproduza os defeitos confirmados em branch, aplique correções
> proporcionais e valide os fluxos afetados antes de preparar o PR. Separe o que
> foi comprovado em Production, Preview e Local; não presuma publicação do PR.

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
