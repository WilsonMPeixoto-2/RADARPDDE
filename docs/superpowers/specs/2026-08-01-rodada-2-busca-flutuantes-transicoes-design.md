# Rodada 2 — Busca inteligente, elementos flutuantes e transições

**Status:** aprovado para implementação em 1º de agosto de 2026.

## Objetivo

Melhorar a encontrabilidade e a fluidez do RADAR PDDE sem alterar regras de negócio, persistência, banco de dados ou permissões. A rodada substitui a busca simples atual por busca aproximada, corrige o posicionamento dos menus flutuantes mais relevantes e adiciona transições progressivas entre telas.

## Escopo aprovado

1. Busca inteligente integrada ao campo existente no cabeçalho.
2. Posicionamento responsivo dos menus de alertas e troca de perfil.
3. Transições suaves nas trocas de tela e restaurações de histórico.
4. Testes de acessibilidade, teclado, perfis e viewports.

## Exclusão expressa

Não será criada central de comandos, paleta global, atalho `Ctrl + K` ou catálogo de ações operacionais. A busca continuará visível no cabeçalho e servirá para localizar e navegar, não para executar mutações.

## Arquitetura

### Dependências

- `fuse.js` 7.5.0 para busca aproximada e tolerância a erros de digitação.
- `@floating-ui/dom` 1.8.0 para posicionamento, inversão e ajuste de menus conforme o espaço disponível.
- View Transitions API nativa, com fallback imediato quando indisponível ou quando o usuário solicitar redução de movimento.

As bibliotecas serão empacotadas localmente em `vendor/` por esbuild. O navegador não dependerá de CDN.

### Busca inteligente

O campo `#global-search` existente será transformado em combobox acessível. Um módulo próprio montará um índice com:

- unidades escolares autorizadas ao perfil;
- módulos visíveis na navegação lateral;
- programas vinculados às escolas disponíveis;
- competências existentes no exercício ativo;
- pendências acessíveis, apresentadas apenas como destinos de consulta.

Cada entrada terá um destino de navegação canônico. Resultados que não estejam disponíveis ao perfil conectado não serão indexados. A seleção poderá ser feita por clique, `Enter`, setas para cima/baixo e `Escape`.

A busca não modificará registros. Ao selecionar:

- escola: abre o prontuário da unidade;
- módulo: abre a tela correspondente;
- programa: abre a carteira com o contexto de pesquisa preservado quando aplicável;
- competência: abre competências e aplica o contexto compatível;
- pendência: abre pendências, filtrando pela escola quando houver vínculo.

Consultas vazias não exibem painel. Consultas sem resultado exibem mensagem clara sem bloquear a interface.

### Elementos flutuantes

O módulo de Floating UI controlará os menus:

- `#alerts-dropdown`, ancorado ao botão de alertas;
- `#profile-dropdown`, ancorado ao botão de perfil;
- painel de resultados da busca, ancorado ao campo de busca.

Serão usados `computePosition`, `offset`, `flip`, `shift`, `size` e `autoUpdate`. O acompanhamento automático só ficará ativo enquanto o elemento estiver aberto e será encerrado ao fechar, evitando listeners permanentes.

Os menus continuarão respeitando o fechamento por clique externo e `Escape`. Atributos `aria-expanded`, `aria-controls` e papéis de menu/combobox serão sincronizados.

### Transições

A função de troca de tela será envolvida por um módulo de transição. Quando `document.startViewTransition` existir e `prefers-reduced-motion` não estiver ativo, a atualização do conteúdo ocorrerá dentro da transição. Caso contrário, a navegação seguirá imediatamente pelo caminho atual.

O módulo cobrirá:

- `switchView`;
- aplicação de rota pelo histórico;
- navegação por links canônicos;
- retorno e avanço do navegador.

A transição será curta e discreta, aplicada ao container principal, sem animações em modais ou ações de gravação.

## Limites e segurança

- Nenhuma migration, RLS, Auth, Edge Function ou dado será alterado.
- Nenhuma opção de busca poderá ultrapassar as permissões já aplicadas à interface.
- Nenhuma dependência será carregada de serviço externo em runtime.
- A aplicação continuará funcional sem View Transitions e, em caso de falha de carregamento das bibliotecas, manterá a busca simples e os menus existentes.
- Não haverá deploy automático em Production nesta rodada.

## Testes e critérios de aceitação

1. Busca encontra escola por nome, designação, fragmento e erro de digitação moderado.
2. Busca não oferece módulos ocultos ao perfil.
3. Teclado percorre resultados e abre o destino correto.
4. `Escape` fecha busca e menus e devolve foco ao controle de origem.
5. Menus permanecem dentro do viewport em desktop, Pixel 7 e iPhone 15.
6. `autoUpdate` é ativado apenas durante a abertura e limpo ao fechar.
7. Navegação funciona com e sem `startViewTransition`.
8. `prefers-reduced-motion` desativa animações sem alterar navegação.
9. Todos os gates existentes — unitários, integração, E2E, perfis/viewports, Supabase, backup, Excel e Lighthouse — permanecem aprovados.

## Resultado esperado

O usuário localizará escolas e áreas com menos tentativas, os menus deixarão de ser cortados ou deslocados em telas menores e a navegação parecerá mais contínua, sem mudança de regras operacionais.