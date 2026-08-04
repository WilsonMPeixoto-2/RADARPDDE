# Exportações Excel no Dashboard da Assistente — Design

## Objetivo

Disponibilizar, na página inicial do perfil **Assistente de Verbas Federais**, os dois relatórios Excel já existentes no RADAR PDDE:

1. **Relatório RADAR PDDE** — relatório institucional consolidado;
2. **Excel SME** — relatório mensal no modelo da SME.

A alteração não cria novos formatos nem modifica o conteúdo dos relatórios. Ela somente oferece um novo ponto de acesso aos pipelines existentes.

## Escopo funcional

- O grupo de exportação aparece somente quando o perfil efetivo é `assistente` e a tela atual é o dashboard inicial da Assistente.
- O grupo fica no cabeçalho da página, ao lado da ação **Redistribuir Escolas**.
- O grupo contém exatamente dois botões Excel; o CSV legado não é exibido nessa superfície.
- O botão **Relatório RADAR PDDE** chama o mesmo `exportXlsx()` usado pelas superfícies atuais.
- O botão **Excel SME** chama o mesmo `exportSmeXlsx()` e usa a competência global ativa.
- Se a competência global não for mensal, somente o botão Excel SME fica desabilitado, com mensagem explicativa no `title` e em `aria-disabled`.
- Durante a geração, cada botão impede cliques duplicados e expõe `aria-busy="true"`.
- Ao sair do dashboard ou trocar para outro perfil, o grupo é removido.

## Arquitetura

A implementação ficará em `src/integration/excel-export-integration.js`, que já observa mutações da interface e controla os dois pipelines de exportação.

Serão adicionadas funções pequenas e independentes:

- resolução do perfil efetivo;
- reconhecimento do dashboard da Assistente;
- criação do botão institucional;
- criação do grupo de ações;
- instalação, atualização e remoção do grupo conforme a tela atual.

O `app.js` não será alterado. O módulo de integração continuará reagindo às renderizações dinâmicas feitas pelo sistema.

## Identificação da superfície

A superfície será considerada válida somente quando as duas condições forem verdadeiras:

1. perfil normalizado igual a `assistente`;
2. cabeçalho dentro de `#main-container` com título `Painel do Assistente de Verbas Federais`.

Isso evita que os botões sejam inseridos em outros dashboards ou em modais que usem a classe `.page-header`.

## Layout e acessibilidade

O grupo receberá `data-radar-assistant-export-actions="true"`, `role="group"` e `aria-label="Exportações em Excel"`.

Os botões terão:

- `type="button"`;
- rótulos visíveis distintos;
- `aria-label` específico;
- estados `disabled`, `aria-disabled` e `aria-busy` coerentes;
- layout flexível com quebra de linha para telas estreitas.

## Tratamento de erros

Os erros continuarão sendo tratados pelos pipelines existentes:

- `exportXlsx()` mantém o comportamento atual do relatório institucional;
- `exportSmeXlsx()` mantém os códigos e mensagens específicos do Excel SME;
- a interface restaura o estado original do botão em bloco `finally`.

## Testes

### Unitários

- reconhece o dashboard da Assistente somente no perfil correto;
- cria exatamente dois botões e nenhum CSV;
- não duplica o grupo em novas mutações;
- remove o grupo ao trocar de perfil/tela;
- desabilita o Excel SME quando a competência é `TODAS`;
- habilita o Excel SME para competência mensal;
- bloqueia cliques duplicados;
- encaminha cada botão ao pipeline correto.

### E2E

- autentica como Assistente;
- confirma a presença dos dois botões no dashboard inicial;
- confirma ausência do botão CSV no grupo;
- verifica comportamento responsivo e acessível;
- executa as duas ações usando os mesmos contratos já cobertos pelas suítes de exportação.

## Restrições

- nenhuma alteração em Supabase, banco, Auth, RLS, migrations ou dados;
- nenhuma duplicação dos renderizadores ou modelos Excel;
- nenhuma mudança no relatório institucional ou no template Excel SME;
- nenhuma inclusão dos botões nos perfis Controlador, Gestão SME ou Inventário;
- nenhum merge automático.
