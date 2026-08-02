# Auditoria da Rodada 2 — Busca, elementos flutuantes e transições

**Data de execução:** 1º de agosto de 2026  
**Branch:** `feat/rodada-2-busca-flutuantes-transicoes-20260801`  
**PR:** #123

## Escopo executado

A Rodada 2 incorporou três melhorias de experiência:

1. busca aproximada no campo existente do cabeçalho;
2. posicionamento responsivo dos menus de alertas, perfil e resultados;
3. transições progressivas nas navegações principais iniciadas pelo usuário.

A central de comandos e o atalho `Ctrl + K` foram excluídos conforme orientação expressa. Há teste automatizado confirmando que esse atalho não foi criado.

## Dependências e integração efetiva

### Fuse.js 7.5.0

O Fuse.js foi integrado ao índice de busca do RADAR PDDE. A busca considera:

- escolas autorizadas ao perfil;
- módulos visíveis na navegação;
- programas vinculados às escolas acessíveis;
- competências existentes;
- pendências disponíveis para consulta.

O motor tolera acentos, diferenças de caixa, fragmentos e erros moderados de digitação. Os resultados não executam alterações de dados: apenas abrem destinos canônicos de consulta.

O bundle local `vendor/fuse.js` é carregado somente quando o usuário inicia uma consulta útil. Caso o arquivo não possa ser carregado, permanece disponível uma busca textual simples.

### Floating UI DOM 1.8.0

O Floating UI foi aplicado aos menus de alertas, perfil e resultados da busca. Foram integrados:

- cálculo de posição;
- afastamento da âncora;
- inversão quando não há espaço;
- deslocamento para dentro da viewport;
- limitação de largura e altura;
- atualização automática somente enquanto o elemento estiver aberto.

O bundle local `vendor/floating-ui.js` é carregado somente na primeira abertura de um elemento flutuante. Existe posicionamento fixo de contingência se a biblioteca não puder ser carregada.

### View Transitions API

A API nativa foi integrada de forma progressiva:

- navegadores sem suporte continuam com navegação imediata;
- `prefers-reduced-motion` desativa animações;
- a montagem inicial não é animada;
- histórico, restauração de rota, filtros, abas e chamadas internas permanecem síncronos;
- somente navegações principais iniciadas por clique ou teclado podem gerar transição;
- transições simultâneas não são iniciadas;
- cancelamentos esperados da API são tratados sem produzir erros não capturados.

## Desempenho e correções durante a rodada

A primeira implementação carregava os dois bundles na abertura e aplicava transição durante a montagem inicial. O Lighthouse detectou aumento de JavaScript inicial e deslocamento visual relevante. Os critérios não foram reduzidos.

A arquitetura foi corrigida para:

1. carregar Fuse.js somente na primeira pesquisa;
2. carregar Floating UI somente na primeira abertura de menu;
3. retirar os vendors da carga inicial do HTML;
4. impedir transições na montagem inicial;
5. ativar transições apenas depois da primeira rota estabilizada;
6. restringir animações a intenções reais de navegação do usuário.

Após essas correções, o Lighthouse voltou a aprovar os pisos existentes sem qualquer relaxamento de orçamento.

## TDD e testes incorporados

O ciclo inicial comprovou que os testes detectavam a ausência da implementação: 439 testes anteriores passaram e cinco novos contratos falharam antes da criação dos módulos.

Foram adicionados testes para:

- versões e bundles locais das dependências;
- reprodução byte a byte dos bundles;
- catálogo de busca e filtragem por autorização;
- teclado, `Enter`, `Escape` e ausência de `Ctrl + K`;
- somente destinos de consulta;
- middleware e limpeza do `autoUpdate`;
- menus dentro da viewport;
- carregamento sob demanda dos vendors;
- fallback sem vendor;
- suporte e fallback da View Transitions API;
- redução de movimento;
- estabilização da rota inicial;
- distinção entre navegação do usuário e chamadas programáticas.

A suíte unitária alcançou 455 testes aprovados antes do ajuste final de intenção de navegação; o contrato adicional passou a proteger também a execução síncrona de rotas, abas, histórico e rotinas internas.

## Gates aplicáveis

A integração é condicionada à aprovação, no mesmo `HEAD` final, de:

- sintaxe, lint e auditoria funcional;
- testes unitários e de integração;
- reprodução dos bundles locais;
- saúde das dependências, SBOM e inventário;
- Lighthouse;
- Playwright E2E completo;
- cinco perfis em desktop, Android e iPhone;
- Supabase local, migrations, Auth e RLS;
- backup e restauração descartáveis;
- homologação do Excel SME;
- snapshot canônico.

O PR somente deve ser integrado após todos esses gates concluírem sem falhas.

## Escopo protegido

Não houve alteração de:

- migrations;
- schema ou dados;
- RLS;
- Auth;
- Edge Functions;
- Supabase Production;
- Vercel Production;
- regras de negócio;
- ExcelJS ou geração do Excel SME.

As bibliotecas são servidas localmente; não há dependência de CDN em runtime.
