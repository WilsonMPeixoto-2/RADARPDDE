# Task 9 — Pendências visíveis, pesquisáveis e navegáveis

## Status e fontes

Especificação consolidada em 12/07/2026 para execução na branch `feature/ciclo-a-task-9-pendencias-navegaveis`.

Precedência aplicada:

1. `RADAR_PDDE_Dossie_Contexto_Regras_Decisoes_v1_0.docx`;
2. `RADAR_PDDE_Plano_Lote_2_APROVADO_v2_0.docx`;
3. `2026-07-11-ciclo-a-pendencias-reanalise-implementation-plan.md`;
4. código atual da `main` após a Task 8 e o PR 16.

Decisões consolidadas não são reabertas. Esta Task prioriza encontrabilidade, navegação, hierarquia visual e uso operacional das informações já existentes.

## Objetivo

Transformar a página global de Pendências em uma fila operacional clara, pesquisável e navegável, preservando o modelo canônico já implementado e permitindo localizar o mesmo `pendencyId` a partir da lista, do Prontuário e de mensagens de duplicidade.

## Escopo funcional

### Abas canônicas

A página terá quatro abas:

- `Abertas`: pendências que aguardam providência da escola;
- `Aguardando reanálise`: novo envio registrado e ainda sem conferência positiva do Controlador;
- `Resolvidas`: pendências encerradas por reanálise positiva;
- `Canceladas`: lançamentos indevidos cancelados com justificativa.

`Aberta` e `Aguardando reanálise` permanecem pendências ativas. A aba `Canceladas` é apenas consultiva nesta Task. Cancelar e reabrir continuam fora do escopo e serão tratados na Task 11.

### Busca global

A pesquisa atua simultaneamente nas quatro abas e considera:

- nome da unidade;
- designação;
- competência;
- programa;
- documento;
- erros atuais ou motivo legado;
- observação;
- responsável atual;
- Controlador.

A normalização ignora diferenças de caixa, acentos e pontuação simples. Cada aba exibe a quantidade encontrada. A busca não troca automaticamente a aba ativa enquanto o usuário digita.

### Filtros

Filtros estruturados:

- unidade escolar;
- competência;
- programa;
- documento;
- motivo/erro;
- responsável pela providência;
- Controlador;
- antiguidade.

Filtros ativos permanecem visíveis como etiquetas removíveis. Há ação `Limpar filtros` apenas quando existir busca ou filtro aplicado.

### Ordenação

- `Abertas`: mais antigas primeiro; desempate por R.A. e designação;
- `Aguardando reanálise`: maior tempo desde o último envio aguardando análise primeiro; desempate por R.A. e designação;
- `Resolvidas`: resolução mais recente primeiro;
- `Canceladas`: cancelamento mais recente primeiro.

A própria separação por abas evita misturar prioridades entre estados.

## Informação exibida

### Desktop

A tabela apresenta:

1. unidade escolar;
2. competência;
3. programa e documento;
4. erros atuais;
5. situação;
6. próxima ação;
7. última movimentação;
8. tentativas;
9. ações.

Erros são resumidos em até dois itens, com indicador `+N` quando houver mais. O texto completo permanece disponível no painel de detalhes.

### Mobile

A tabela é substituída por cartões com:

- escola e designação;
- status;
- competência;
- programa;
- documento;
- erro principal;
- próxima ação;
- tempo aguardando;
- quantidade de tentativas;
- ação principal;
- `Ver detalhes`.

Não haverá rolagem horizontal global.

## Painel lateral de detalhes

### Desktop

O detalhe abre em um drawer lateral não modal:

- lista e filtros permanecem visíveis;
- o registro selecionado fica destacado;
- selecionar outra pendência atualiza o drawer sem fechar a página;
- fechar o drawer preserva aba, filtros e posição de rolagem.

### Mobile

O mesmo componente ocupa a tela inteira e funciona como diálogo acessível:

- botão de fechamento explícito;
- fechamento por `Escape`;
- foco contido;
- devolução de foco ao acionador;
- respeito às safe areas.

### Conteúdo

O drawer reúne:

1. escola e designação;
2. status e próxima ação;
3. competência, programa e documento;
4. erros atuais;
5. observação de abertura;
6. responsável atual;
7. tentativas numeradas;
8. reanálises;
9. contatos vinculados à pendência;
10. timeline completa;
11. dados de resolução ou cancelamento;
12. ações permitidas pelo estado atual.

## Ações por estado

### Aberta

- principal: `Registrar novo envio`;
- secundárias: `Registrar contato`, `Abrir no Prontuário`.

### Aguardando reanálise

- principal: `Reanalisar no Prontuário`;
- secundárias: `Ver arquivo`, quando houver link válido, e `Registrar contato`.

### Resolvida

- `Ver histórico`;
- `Abrir no Prontuário`.

### Cancelada

- `Ver histórico`;
- `Abrir no Prontuário`.

Esta Task não cria botões de cancelar ou reabrir.

## Navegação contextual

Ao abrir o Prontuário a partir de uma pendência, o sistema transporta:

- escola;
- competência;
- programa;
- documento;
- `pendencyId`;
- tela de origem;
- aba ativa;
- busca e filtros;
- posição de rolagem.

O destino deve localizar e destacar o documento exato. O retorno deve usar o texto `Voltar às Pendências` e restaurar o contexto da página.

Quando o destino exato não estiver disponível, o sistema abre o primeiro programa aplicável e informa a limitação sem perder o contexto de retorno.

## Timeline

A timeline combina, em ordem visual da movimentação mais recente para a mais antiga:

- abertura;
- contatos;
- novos envios;
- substituições;
- reanálises;
- resolução;
- cancelamento.

Cada evento mostra data/hora, tipo, usuário ou responsável, descrição, tentativa relacionada e erros associados quando houver. A ordenação visual não altera a persistência.

## Sistema visual

- roxo: estrutura, seleção e ação principal;
- azul: `Aguardando reanálise` e informação;
- âmbar: providência necessária;
- verde: resolução positiva;
- cinza: cancelamento;
- vermelho: erro específico ou ação destrutiva.

Cores nunca substituem texto. Cartões, campos e botões operacionais respeitam raio máximo de 8 px, bordas discretas, escala de espaçamento 4/8/12/16/24/32 e alvos de toque mínimos de 44 × 44 px.

## Acessibilidade

- abas com `role="tablist"`, `role="tab"`, `aria-selected` e painéis associados;
- navegação por setas entre abas;
- foco visível;
- botão de fechamento nomeado;
- anúncio de quantidade encontrada e alterações relevantes por `aria-live`;
- todas as ações disponíveis por teclado;
- suporte a zoom de 200%;
- ausência de conteúdo essencial dependente apenas de hover;
- contraste funcional nos temas claro e escuro;
- respeito a `prefers-reduced-motion`.

## Arquitetura técnica

### Novo módulo de domínio de apresentação

Criar `src/domain/pendencias-view-model.js`, sem dependência de DOM, responsável por:

- normalização de texto para busca;
- composição de registros com escola, programa, documento, Controlador e contatos;
- filtros;
- separação por status;
- ordenação;
- cálculo de antiguidade;
- última movimentação;
- próxima ação;
- timeline combinada;
- contagens por aba.

O módulo recebe coleções e funções auxiliares; não lê variáveis globais nem `localStorage`.

### Integração em `app.js`

`app.js` permanece orquestrador e integra:

- estado da página de Pendências;
- renderização desktop e mobile;
- drawer;
- ações existentes;
- navegação contextual;
- restauração de foco e rolagem.

Não haverá refatoração geral do aplicativo.

### Estilos

Adicionar estilos específicos em `styles.css`, preservando a identidade já aprovada e as extensões mobile existentes.

## Correções associadas

1. substituir a aba única `Ativas` pelas filas `Abertas` e `Aguardando reanálise`;
2. corrigir a cor de `Aguardando reanálise` para azul;
3. corrigir ordenação de pendências ativas, hoje mais recentes primeiro;
4. usar `errosAtuais`, tentativas e histórico em vez de depender apenas de `motivo` e `responsavel`;
5. transformar `openPendencyDetail()` em abertura real do drawer;
6. corrigir o passivo anterior para considerar todos os estados ativos;
7. substituir o rótulo enganoso `Abertas` por contagem contextual de pendências ativas na tela de Competências;
8. preservar a jornada de duplicidade, abrindo o mesmo registro no drawer.

## Estados vazios

- Abertas: `Nenhuma pendência depende de providência da escola.`
- Aguardando: `Nenhum novo envio aguarda conferência.`
- Resolvidas: `Nenhuma pendência resolvida foi encontrada.`
- Canceladas: `Nenhum lançamento cancelado foi encontrado.`
- Busca sem resultado: `Nenhuma pendência corresponde à busca e aos filtros aplicados.`

A busca sem resultado oferece `Limpar filtros`.

## Tratamento de erros

- registro referenciado inexistente: fechar o drawer, manter a lista e anunciar a indisponibilidade;
- data inválida: exibir `Data não informada`, sem quebrar a lista;
- link inválido: não renderizar ação `Ver arquivo`;
- contexto documental incompleto: exibir rótulo `Contexto legado incompleto` e permitir histórico, sem inventar programa ou documento;
- falha ao restaurar contexto: abrir a página de Pendências com a mesma busca e aba sempre que possível.

## Testes obrigatórios

### Unitários

Cobrir:

- busca sem acentos e sem distinção de caixa;
- filtros combinados;
- quatro grupos de status;
- ordenação de cada aba;
- antiguidade de aberta e aguardando;
- próxima ação e responsável derivados;
- última movimentação;
- timeline combinada;
- contexto legado incompleto;
- contagens filtradas e totais.

### E2E desktop

Cobrir:

- quatro abas e contagens;
- busca global;
- filtros e etiquetas removíveis;
- abertura e troca de registro no drawer;
- preservação de busca, aba e rolagem;
- duplicidade abrindo o drawer do mesmo `pendencyId`;
- navegação ao documento exato no Prontuário e retorno;
- ações contextuais por estado;
- teclado, foco e `Escape`.

### E2E mobile

Cobrir:

- cartões em vez de tabela;
- ausência de overflow global;
- drawer em tela inteira;
- fechamento e restauração de foco;
- abas e filtros por toque;
- ação principal acessível.

### Regressão

Executar:

- todos os testes unitários;
- fluxo completo de pendência e reanálise;
- testes da Task 8;
- testes de Excel;
- Playwright desktop, Android e iPhone.

## Fora de escopo

- Supabase;
- alterações de perfis ou autorização definitiva;
- mudanças no Excel;
- cancelamento ou reabertura;
- cobranças automáticas;
- integração automática com Drive;
- redesenho integral de Dashboard, Carteira ou Prontuário;
- novas dependências npm;
- alteração de `INITIAL_DATA_VERSION`.

## Critérios de aceite

1. as quatro abas exibem apenas os estados correspondentes;
2. `Aberta` e `Aguardando reanálise` continuam contadas como ativas;
3. busca e filtros localizam registros nas quatro abas;
4. o detalhe completo é acessível pelo mesmo `pendencyId`;
5. filtros, aba, seleção e rolagem sobrevivem ao drawer e ao retorno do Prontuário;
6. a lista usa o modelo canônico e preserva registros legados;
7. ações contextuais não permitem resolução direta;
8. desktop e mobile permanecem funcionais;
9. acessibilidade por teclado e foco é comprovada;
10. bonificação, Supabase, perfis e Excel não são alterados.
