# Acesso colaborativo dos Controladores — design

## Decisão funcional

A carteira de um Controlador representa responsabilidade principal, filtro inicial e organização do trabalho. Ela não é uma fronteira de sigilo ou autorização entre os cinco Controladores da 4ª CRE.

Todo usuário autenticado com o perfil `controller` e `cre_scope = '4ª CRE'` deve poder ler e executar operações funcionais em qualquer escola cujo campo `cre` corresponda ao seu `cre_scope`. A atuação de outro Controlador não transfere automaticamente a responsabilidade principal da escola; `schools.controller_id` continua identificando o responsável ordinário.

## Comportamento da interface

- O Dashboard abre no recorte `carteira` do Controlador autenticado.
- O usuário pode mudar para `todas` ou outro recorte disponibilizado pela interface.
- Busca, Carteira, Prontuário, Competências, Pendências e ações operacionais permanecem acessíveis para todas as escolas da mesma CRE.
- A autoria real da ação continua registrada pelo usuário autenticado.

## Autorização

### Leitura

`can_access_school(school_id)` autoriza:

- `technical_admin`, `sme_management` e `federal_assistant`, preservando o contrato atual;
- `controller` quando a escola pertence ao mesmo `cre_scope` do perfil ativo;
- qualquer perfil com exceção explícita em `user_school_scopes`;
- `inventory` conforme as regras patrimoniais existentes.

### Escrita

`can_write_school(school_id)` autoriza:

- `technical_admin` e `federal_assistant`, preservando o contrato atual;
- `controller` quando a escola pertence ao mesmo `cre_scope` do perfil ativo;
- exceções explícitas com `can_write = true`;
- os demais perfis somente conforme as regras já existentes.

### Falha segura

- Usuário anônimo permanece sem acesso.
- Controlador sem `cre_scope` não recebe acesso transversal automático.
- Escola de outra CRE permanece bloqueada, salvo escopo explícito.
- `controller_id` não participa mais da decisão de acesso; continua sendo usado para filtro inicial, atribuição e relatórios.

## Dados e migration

A migration `20260721090000_controller_collaborative_cre_access.sql` substitui somente `can_access_school(text)` e `can_write_school(text)`. O `cre_scope` ativo é consultado dentro das funções, sem criar nova interface pública, alterar tabelas ou regenerar tipos.

As funções preservam `SECURITY DEFINER`, `search_path` fixo, revogação de `public` e execução apenas por `authenticated`.

## Testes

- Smoke SQL: Controlador lê e escreve na escola de outro Controlador da mesma CRE; não acessa escola de outra CRE; exceção explícita continua válida.
- pgTAP: 16 migrations registradas.
- E2E remoto: Tuane e Alzira visualizam a massa HML completa da 4ª CRE e registram contato cruzado; autoria permanece vinculada à usuária executora.
- Readiness: a migration colaborativa é obrigatória e o histórico remoto reconhece 16 versões.
- Testes existentes do Dashboard preservam o recorte inicial de carteira.

## Fora do escopo

- ativar Supabase em Production;
- alterar layout ou navegação;
- redefinir permissões de Assistente, Inventário, SME ou Administrador técnico;
- remover dados da árvore ativa;
- tornar o repositório privado;
- reescrever o histórico Git.
