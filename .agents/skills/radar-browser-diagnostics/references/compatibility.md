# Compatibilidade e interpretação da evidência

Base: `chrome-devtools-mcp@1.12.0`. Os sete guias oficiais permanecem sem
alteração; estas notas especializam seu uso no RADAR.

## Ferramentas e sessão

- O projeto habilita `memoryDebugging` e `categoryPwa`, em conexão por pipe,
  para disponibilizar os recursos opcionais descritos nos guias. Confirmar o
  catálogo ativo; ter uma ferramenta listada não prova sua execução funcional.
- `set_logpoints` não pertence ao catálogo 1.12.0 verificado. Não copiá-lo de
  documentação posterior como se estivesse disponível nesta versão.
- `list_network_requests.resourceTypes` usa nomes minúsculos, como `image` e
  `font`; não usar `Image` ou `Font`.
- `emulate` substitui a configuração anterior, exceto `extraHttpHeaders`.
  Enviar conjuntamente as condições desejadas; limpar os headers explicitamente
  ao encerrar uma inspeção que os tenha configurado.
- `chrome-devtools` e Playwright têm sessões diferentes. Um login no Playwright
  não autentica automaticamente o Chrome DevTools. Para reproduzir uma falha
  ativa, preservar a aba e o estado pertinentes; para consentimento, usar
  `new_page` com um `isolatedContext` exclusivo.

## Acessibilidade

- Ausência de issues no console não comprova contraste adequado. Usar Lighthouse
  ou medição apropriada. O snippet oficial de contraste é aproximado: não resolve
  corretamente todos os fundos herdados, transparências, imagens e gradientes.
  Inspeção visual ajuda a detectar problemas, mas não fornece razão exata.
- No texto padrão do Lighthouse, scores de categoria usam 0–100. No JSON do
  relatório, os scores usam 0–1. Extrair falhas do caminho realmente retornado e
  separar itens manuais, não aplicáveis e não verificados.
- A recomendação de área de toque de 48×48 pixels não é o mínimo universal de
  conformidade: WCAG 2.2, critério 2.5.8 (AA), usa 24×24 pixels CSS com exceções,
  inclusive espaçamento; 2.5.5 (AAA) usa 44×44, também com exceções.
- Snapshot, Lighthouse e scripts são provas parciais. Testar teclado/foco e
  inspecionar a tela quando pertinentes; não emitir certificação integral de
  acessibilidade por uma nota automatizada.

## LCP e desempenho

- LCP até 2,5 s é o limiar de bom desempenho; a avaliação de campo considera o
  percentil 75, separado entre mobile e desktop. Um trace local não certifica o
  comportamento dos usuários reais nem a performance autenticada do RADAR.
- As proporções 40/10/40/10 das subpartes são orientações de diagnóstico, não
  quotas rígidas nem critérios universais de aprovação. Investigar o gargalo real.
- Comparar o mesmo fluxo, dados e condições; definir amostras antes da medição.
  Não repetir até selecionar um resultado favorável nem alterar o produto apenas
  para melhorar uma nota de ferramenta.

## Cookies e autenticação

- `cookieStore` e `document.cookie` não veem cookies `HttpOnly`. Headers sensíveis
  são mascarados por padrão nesta configuração: um header mascarado não está
  ausente. Não desativar esse cuidado globalmente para obter valores de sessão.
- Em diagnóstico autorizado, conferir presença, atributos e razões de rejeição
  sem publicar senhas, cookies, tokens, JWT ou dumps de storage. Leitura via
  JavaScript também não enumera todos os atributos de segurança de um cookie.
- Isolamento, ausência de rastreadores e revogação são evidências técnicas
  delimitadas; não equivalem a conclusão jurídica de conformidade com a LGPD.

## Memória e PWA

- Repetir dez ciclos ajuda a amplificar retenção; crescimento isolado não prova
  vazamento. Capturar baseline, target e retorno ao estado inicial, investigar
  retentores e fechar cada snapshot carregado com `close_heapsnapshot`.
- Não eliminar caches intencionais sem compreender seus consumidores e o
  contrato de recuperação. Heap de uma tela não representa toda a aplicação.
- Ferramentas PWA exigem `categoryPwa` e conexão por pipe. Testar instalação
  apenas numa instância isolada e numa aplicação pertinente ao objetivo; não
  instalar o RADAR no computador do usuário como consequência implícita do setup.
- Instalação PWA não demonstra funcionamento offline, atualização segura,
  integridade dos dados ou conformidade de acessibilidade; essas são provas
  separadas quando fizerem parte do requisito.

## Diagnóstico da configuração

- No Codex, conferir `.codex/config.toml` e a configuração do usuário quando
  acessível; `startup_timeout_sec` é medido em segundos nesta configuração.
- Logs verbosos usam `NODE_DEBUG`, não `DEBUG`. Gerar logs só quando necessários
  e revisar seu conteúdo antes de compartilhar.
- As issues upstream [#3006](https://github.com/ChromeDevTools/chrome-devtools-mcp/issues/3006),
  [#2910](https://github.com/ChromeDevTools/chrome-devtools-mcp/issues/2910) e
  [#2911](https://github.com/ChromeDevTools/chrome-devtools-mcp/issues/2911)
  foram encerradas e as orientações corrigidas já estão nos guias 1.12.0.
  Não tratá-las como três defeitos atuais do RADAR ou desta instalação.

Fontes dos critérios:
[WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
[WCAG 2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html),
[LCP](https://web.dev/articles/lcp) e
[guias oficiais da versão](https://github.com/ChromeDevTools/chrome-devtools-mcp/tree/af2834411a564d366f9cab63efb046d9084f4dba/skills).
