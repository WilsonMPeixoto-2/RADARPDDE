# Ciclo B3 — Interações compartilhadas e desativação segura de controladora

## Objetivo

Iniciar a consolidação dos contratos transversais de interação do RADAR por um fluxo crítico e real: desativar uma controladora que ainda possui escolas. O pacote substitui a confirmação nativa e a reatribuição automática por um diálogo acessível no qual a Assistente de Verbas Federais escolhe explicitamente quem receberá a carteira.

O pacote é uma fatia vertical de `BL-UX-01`. Ele cria uma fundação reutilizável para feedback não bloqueante e confirmações críticas, mas não declara resolvidos todos os `alert()` e `confirm()` legados.

## Estado atual comprovado antes da alteração

- `removerControlador` usava `window.confirm`;
- quando havia escolas, a interface selecionava automaticamente a primeira outra pessoa ativa;
- `DirectoryService.deactivateController` já recebia `fallbackControllerId` e executava desativação, transferência e auditoria na mesma unidade de trabalho;
- a infraestrutura `modal-accessibility.js` já fornecia foco, `Escape`, armadilha de foco e retorno ao acionador para modais;
- o cadastro inicial e estados locais antigos podiam exibir `Érica`, embora a identificação correta aprovada seja `Érika Reis`;
- a carteira inicial de Alzira de Souza possui 13 escolas.

Portanto, o defeito não estava na transação de dados. Estava na decisão silenciosa da interface e no uso de uma confirmação nativa sem contexto, seleção, tratamento de erro ou padrão visual do produto.

## Decisão material aprovada

Foram avaliadas três alternativas:

1. manter a escolha automática da primeira pessoa ativa;
2. impedir a desativação até que a carteira fosse redistribuída em outra tela;
3. solicitar no próprio diálogo quem receberá as escolas.

O usuário aprovou a alternativa 3. A Assistente deve escolher manualmente a destinatária; nenhuma pessoa pode ser preselecionada. O nome aprovado é **Érika Reis**.

## Matriz de preservação

| Elemento | Conduta |
|---|---|
| transação do `DirectoryService` | preservar integralmente |
| desativação lógica, sem apagar histórico | preservar |
| reatribuição de todas as escolas vinculadas | preservar, agora com destinatária explícita |
| registro de auditoria | preservar |
| equivalência local/Supabase preparada no PR 22 | preservar; nenhuma mudança de repositório |
| regra que impede remover a única pessoa ativa | preservar com mensagem não bloqueante |
| identidade visual atual | reutilizar tokens, botões, modal e formulários existentes |
| mobile | não redesenhar neste pacote, conforme decisão do usuário |
| produção e Supabase remoto | não alterar |

## Fluxo aprovado

1. A Assistente aciona **Remover controlador** no cartão de Alzira de Souza.
2. Um `alertdialog` apresenta o nome da pessoa, a consequência e a quantidade de escolas.
3. O foco inicial vai para **Cancelar**.
4. O seletor **Nova responsável** começa vazio e lista somente pessoas ativas diferentes de Alzira.
5. A ação destrutiva permanece desabilitada até uma escolha válida.
6. Ao confirmar, seletor e ações ficam indisponíveis e o texto comunica a operação em andamento.
7. A aplicação chama a operação transacional existente com o identificador escolhido.
8. Em sucesso, o diálogo fecha, a equipe é renderizada novamente, o foco vai para o título da página e uma região `role=status` informa pessoa e quantidade transferida.
9. Em falha, o diálogo permanece aberto, a escolha é preservada, o erro aparece no contexto e o foco retorna à confirmação.
10. `Escape`, fechar ou cancelar não alteram dados e devolvem o foco ao acionador.

Se não houver escolas vinculadas, o diálogo não exige destinatária. Se não existir outra pessoa ativa para receber uma carteira, a operação é recusada com orientação funcional.

## Arquitetura

`src/integration/shared-interactions.js` expõe:

- funções puras para construir e validar o modelo da desativação;
- normalização compatível do nome legado de Érika Reis;
- mensagem de sucesso derivada do resultado real;
- diálogo crítico criado sob demanda;
- região compartilhada de feedback não bloqueante.

O módulo não persiste dados e não replica regra transacional. A interface coleta a decisão; `DirectoryService` continua sendo a autoridade da operação.

`modal-accessibility.js` passa a preservar `role=alertdialog` quando esse papel já foi definido, mantendo os demais modais como `role=dialog`.

## Evidência visual

- referência aprovada: `docs/evidence/shared-interactions/approved-reference.png`;
- implementação no mesmo viewport e estado: `docs/evidence/shared-interactions/implementation.png`;
- comparação integral: `docs/evidence/shared-interactions/full-comparison.png`;
- comparação focada no diálogo: `docs/evidence/shared-interactions/dialog-comparison.png`.

A evidência usa viewport `1906 × 825`, perfil Assistente de Verbas Federais, tela Gestão de Equipe, desativação de Alzira de Souza e Érika Reis selecionada.

## Fora do escopo

- substituir todos os diálogos nativos em um único PR;
- alterar cadastros de programas, notas, inventário ou Configurações SME;
- criar uma biblioteca visual genérica ou instalar framework de componentes;
- redesenhar a versão mobile;
- modificar schema, migrations, Auth, RLS ou conexão Supabase;
- publicar em produção;
- reescrever dados históricos além da compatibilidade nominal de Érika Reis.

## Critérios de aceite

- nenhuma destinatária preselecionada;
- alvo e pessoas inativas ausentes das opções;
- rótulo destrutivo informa a quantidade real;
- cancelamento e `Escape` preservam os dados e restauram o foco;
- sucesso transfere exatamente as 13 escolas no cenário inicial;
- Alzira torna-se inativa, sem exclusão de histórico;
- auditoria registra a destinatária escolhida;
- falha mantém diálogo, escolha e contexto;
- nenhum `window.confirm` é usado nesse fluxo;
- estados locais legados `Érica`/`Erica` passam a exibir `Érika Reis` sem resetar os demais dados;
- referência e implementação comparadas no mesmo viewport e estado;
- testes unitários, E2E desktop e gates gerais aprovados;
- branch salvo no GitHub em PR rascunho;
- nenhuma mudança de produção.

## Resultado esperado

A desativação deixa de tomar uma decisão administrativa silenciosa. A Assistente entende a consequência, escolhe a pessoa correta, recebe feedback específico e consegue recuperar-se de falhas sem perder contexto. O projeto ganha uma primeira fundação compartilhada de interação, validada por um fluxo crítico, sem reescrever a arquitetura ou empobrecer as regras existentes.
